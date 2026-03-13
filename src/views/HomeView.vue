<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ListItem from '@/components/ListItem.vue'
import AnalysisLoader from '@/components/AnalysisLoader.vue'
import CleanResult from '@/components/CleanResult.vue'
import TracksToRemove from '@/components/TracksToRemove.vue'
import TutorialModal from '@/components/TutorialModal.vue'
import SpotifyModal from '@/components/SpotifyModal.vue'

interface Artist {
  artistName: string
  artistDisplayName: string
  category: string[]
  reasons: string[]
  sources: { lang: string; url: string }[]
}

interface Track {
  title: string
  artist: string
}

interface PlaylistData {
  title: string
  tracks: Track[]
  artistNames: string[]
  trackCount: number
}

interface MatchedArtist {
  name: string
  artist: Artist
  tracks: Track[]
}

const urlInput = ref('')
const loadingStep = ref('')
const error = ref('')
const playlistTitle = ref('')
const totalArtists = ref(0)
const totalTracks = ref(0)
const matched = ref<MatchedArtist[]>([])
const analyzed = ref(false)
const tutorialOpen = ref(false)
const spotifyModalOpen = ref(false)

const loading = computed(() => loadingStep.value !== '')

watch(tutorialOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

const flaggedPct = computed(() =>
  totalArtists.value ? Math.round((matched.value.length / totalArtists.value) * 100) : 0,
)
const cleanPct = computed(() => 100 - flaggedPct.value)

const tracksToRemove = computed(() =>
  matched.value
    .flatMap((m) => m.tracks.map((t) => ({ artist: t.artist, title: t.title })))
    .sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title))
    .map((t) => `${t.artist} — ${t.title}`),
)

const normalize = (s: string) =>
  s.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/vevo$/i, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/^the\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()

function matches(playlistName: string, dbName: string): boolean {
  return normalize(playlistName) === normalize(dbName)
}

// ── Platform detection ────────────────────────────────────────────────────────

type Platform = 'deezer' | 'spotify' | 'youtube'

const detectedPlatform = computed<Platform | null>(() => {
  const v = urlInput.value.trim()
  if (v.includes('deezer.com') || /^\d+$/.test(v)) return 'deezer'
  if (v.includes('spotify.com')) return 'spotify'
  if (v.includes('youtube.com')) return 'youtube'
  return null
})

const platformLabel: Record<Platform, string> = {
  deezer: 'Deezer',
  spotify: 'Spotify',
  youtube: 'YouTube Music',
}

const platformColor: Record<Platform, string> = {
  deezer: '#a238ff',
  spotify: '#1db954',
  youtube: '#ff0000',
}

// ── Fetch functions ───────────────────────────────────────────────────────────

function extractDeezerId(input: string): string | null {
  if (/^\d+$/.test(input)) return input
  const m = input.match(/deezer\.com\/(?:[a-z-]+\/)?playlist\/(\d+)/)
  return m?.[1] ?? null
}

async function fetchDeezer(id: string): Promise<PlaylistData> {
  const res = await fetch(`/api/deezer-playlist?id=${id}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

function extractSpotifyId(input: string): string | null {
  const m = input.match(/spotify\.com\/(?:[a-z-]+\/)?playlist\/([A-Za-z0-9]+)/)
  return m?.[1] ?? null
}

async function fetchSpotify(id: string): Promise<PlaylistData> {
  const res = await fetch(`/api/spotify-playlist?id=${id}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

function extractYoutubeId(input: string): string | null {
  const m = input.match(/[?&]list=([A-Za-z0-9_-]+)/)
  return m?.[1] ?? null
}

async function fetchYoutube(id: string): Promise<PlaylistData> {
  const allTracks: Track[] = []
  let title = ''
  let pageToken: string | null = null

  do {
    const url = `/api/youtube-playlist?id=${id}${pageToken ? `&pageToken=${pageToken}` : ''}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()

    if (data.title) title = data.title
    allTracks.push(...data.tracks)
    pageToken = data.nextPageToken ?? null

    if (pageToken) {
      loadingStep.value = `Récupération de la playlist… (${allTracks.length} pistes)`
    }
  } while (pageToken)

  const artistNames = [...new Set(allTracks.map((t) => t.artist))]
  return { title, tracks: allTracks, artistNames, trackCount: allTracks.length }
}

// ── Analyze ───────────────────────────────────────────────────────────────────

function clear() {
  urlInput.value = ''
  analyzed.value = false
  error.value = ''
  matched.value = []
  localStorage.removeItem('lastAnalysis')
}

onMounted(() => {
  const saved = localStorage.getItem('lastAnalysis')
  if (!saved) return
  try {
    const data = JSON.parse(saved)
    urlInput.value = data.urlInput ?? ''
    playlistTitle.value = data.playlistTitle ?? ''
    totalTracks.value = data.totalTracks ?? 0
    totalArtists.value = data.totalArtists ?? 0
    matched.value = data.matched ?? []
    analyzed.value = true
  } catch {
    localStorage.removeItem('lastAnalysis')
  }
})

async function analyze() {
  const input = urlInput.value.trim()
  const platform = detectedPlatform.value

  if (!platform) {
    error.value = 'URL invalide. Collez un lien Deezer, Spotify ou YouTube Music.'
    return
  }

  loadingStep.value = 'Récupération de la playlist…'
  error.value = ''
  analyzed.value = false
  matched.value = []

  try {
    const fetchFn =
      platform === 'deezer'
        ? fetchDeezer(extractDeezerId(input)!)
        : platform === 'spotify'
          ? fetchSpotify(extractSpotifyId(input)!)
          : fetchYoutube(extractYoutubeId(input)!)

    const [{ title, tracks, artistNames, trackCount }, dbRes] = await Promise.all([
      fetchFn,
      fetch('/data.json'),
    ])

    loadingStep.value = 'Vérification des artistes…'
    const db: Artist[] = await dbRes.json()

    playlistTitle.value = title
    totalTracks.value = trackCount
    totalArtists.value = artistNames.length

    const results: MatchedArtist[] = []
    for (const name of artistNames) {
      const found = db.find(
        (a) => matches(name, a.artistName) || matches(name, a.artistDisplayName),
      )
      if (found) {
        const artistTracks = tracks.filter((t) => matches(t.artist, name))
        results.push({ name, artist: found, tracks: artistTracks })
      }
    }

    matched.value = results
    analyzed.value = true

    localStorage.setItem('lastAnalysis', JSON.stringify({
      urlInput: input,
      playlistTitle: title,
      totalTracks: trackCount,
      totalArtists: artistNames.length,
      matched: results,
    }))
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Une erreur est survenue.'
  } finally {
    loadingStep.value = ''
  }
}
</script>

<template>
  <div class="home-page">
    <div class="hero">
      <h1 class="hero__title">Clean Playlist</h1>
      <p class="hero__subtitle">
        Vérifiez si des artistes de votre playlist ont fait l'objet de comportements
        problématiques documentés. Supporte Deezer, Spotify et YouTube Music.
      </p>

      <div class="search-box">
        <div class="search-box__input-wrap">
          <input
            v-model="urlInput"
            type="text"
            class="search-box__input"
            :class="{ 'search-box__input--detected': detectedPlatform }"
            placeholder="Deezer, Spotify ou YouTube Music…"
            aria-label="URL de la playlist"
            @keydown.enter="analyze"
          />
          <span
            v-if="detectedPlatform"
            class="search-box__platform-badge"
            :style="{ background: platformColor[detectedPlatform] }"
            aria-hidden="true"
          >
            {{ platformLabel[detectedPlatform] }}
          </span>
          <button
            v-if="urlInput"
            class="search-box__clear"
            aria-label="Effacer"
            @click="clear"
          >×</button>
        </div>
        <button class="search-box__btn" :disabled="loading" :aria-busy="loading" @click="analyze">
          {{ loading ? 'Analyse en cours…' : 'Analyser' }}
        </button>
      </div>

      <button v-if="detectedPlatform === 'spotify'" class="quit-spotify-btn" @click="spotifyModalOpen = true">
        Quittez Spotify
      </button>

      <AnalysisLoader v-if="loading" :loading-step="loadingStep" />
      <p v-else-if="error" class="error-msg" role="alert">{{ error }}</p>

      <div v-if="analyzed" class="results" aria-live="polite" aria-atomic="true">
        <CleanResult
          v-if="matched.length === 0"
          :playlist-title="playlistTitle"
          :total-tracks="totalTracks"
          :total-artists="totalArtists"
        />

        <template v-else>
          <div class="results__summary">
            <strong>{{ matched.length }}</strong> artiste{{ matched.length > 1 ? 's' : '' }}
            sur {{ totalArtists }} {{ matched.length > 1 ? 'sont' : 'est' }} dans la liste
            — « {{ playlistTitle }} »
            <span class="results__track-count">({{ totalTracks }} pistes, {{ totalArtists }} artistes uniques)</span>
          </div>

          <div class="pct-bar" role="meter" :aria-valuenow="cleanPct" aria-valuemin="0" aria-valuemax="100" :aria-label="`${cleanPct}% d'artistes sans signalement`">
            <div class="pct-bar__clean" :style="{ width: cleanPct + '%' }">
              <span v-if="cleanPct > 15">{{ cleanPct }}% clean</span>
            </div>
            <div class="pct-bar__flagged" :style="{ width: flaggedPct + '%' }">
              <span v-if="flaggedPct > 15">{{ flaggedPct }}% signalés</span>
            </div>
          </div>

          <div class="results__list">
            <ListItem v-for="{ artist } in matched" :key="artist.artistName" :item="artist" />
          </div>

          <TracksToRemove :tracks="tracksToRemove" />
        </template>
      </div>

      <div class="hero__actions">
        <RouterLink to="/list" class="hero__cta">Parcourir la liste des artistes</RouterLink>
        <button class="hero__tutorial-btn" @click="tutorialOpen = true">
          Comment obtenir l'URL ?
        </button>
      </div>

      <TutorialModal :open="tutorialOpen" @close="tutorialOpen = false" />
      <SpotifyModal :open="spotifyModalOpen" @close="spotifyModalOpen = false" />
    </div>
  </div>
</template>

<style scoped>
.home-page {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  height: calc(100dvh - 60px);
  padding: 3rem 1rem 2rem;
  overflow-y: auto;
}

.hero {
  text-align: center;
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
}

.hero__title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text);
  margin: 0;
  letter-spacing: -0.02em;
}

.hero__subtitle {
  font-size: 1.05rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin: 0;
}

/* Search box */
.search-box {
  display: flex;
  width: 100%;
  gap: 0.5rem;
}

.search-box__input-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.search-box__input {
  width: 100%;
  padding: 0.65rem 2rem 0.65rem 1rem;
  border-radius: 0.4rem;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.15s, padding-top 0.15s;
  min-width: 0;

  &::placeholder {
    color: var(--text-muted);
  }

  &:focus {
    border-color: var(--accent);
  }
}

.search-box__input--detected {
  padding-top: 1.4rem;
}

.search-box__platform-badge {
  position: absolute;
  top: 0.3rem;
  left: 0.75rem;
  font-size: 0.65rem;
  font-weight: 700;
  color: #fff;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  letter-spacing: 0.03em;
  pointer-events: none;
  text-transform: uppercase;
}

.search-box__clear {
  position: absolute;
  right: 0.25rem;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.1rem;
  cursor: pointer;
  line-height: 1;
  padding: 0.2rem 0.3rem;
  min-width: 2.75rem;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.2rem;

  &:hover {
    color: var(--text);
  }
}

.search-box__btn {
  padding: 0.65rem 1.3rem;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 0.4rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;

  &:hover:not(:disabled) {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* Quit Spotify */
.quit-spotify-btn {
  background: none;
  border: 1px solid #1db954;
  color: #1db954;
  border-radius: 999px;
  padding: 0.35rem 1rem;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: #1db954;
    color: #fff;
  }
}

.error-msg {
  color: var(--accent);
  font-size: 0.9rem;
  margin: 0;
}

/* Results */
.results {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: left;
}

.results__summary {
  padding: 0.8rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.4rem;
  font-size: 0.95rem;
  color: var(--text-muted);
  text-align: center;

  strong {
    color: var(--accent);
  }
}

.results__track-count {
  display: block;
  font-size: 0.8rem;
  margin-top: 0.2rem;
  opacity: 0.7;
}

.results__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Percentage bar */
.pct-bar {
  display: flex;
  width: 100%;
  height: 2rem;
  border-radius: 0.4rem;
  overflow: hidden;
  font-size: 0.75rem;
  font-weight: 700;
}

.pct-bar__clean {
  background: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: width 0.6s ease;
  min-width: 0;
}

.pct-bar__flagged {
  background: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: width 0.6s ease;
  min-width: 0;
}

/* CTA + tutorial */
.hero__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
}

.hero__cta {
  display: inline-block;
  background: var(--accent);
  color: #fff;
  text-decoration: none;
  padding: 0.65rem 1.5rem;
  border-radius: 0.4rem;
  font-size: 0.95rem;
  font-weight: 600;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.85;
  }
}

.hero__tutorial-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;

  &:hover {
    color: var(--text);
  }
}
</style>
