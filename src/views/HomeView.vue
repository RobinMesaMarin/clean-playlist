<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ListItem from '@/components/ListItem.vue'
import spotifyRaw from '@/assets/spotify.txt?raw'

const spotifyParagraphs = spotifyRaw.trim().split(/\n\n+/)

function renderPara(text: string): string {
  return text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  )
}
const spotifyModalOpen = ref(false)

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

const loading = computed(() => loadingStep.value !== '')

const loadingStepIndex = computed(() => {
  if (loadingStep.value.startsWith('Vérification')) return 2
  if (loadingStep.value.startsWith('Récupération')) return 1
  return 0
})

// ── Tutorial ──────────────────────────────────────────────────────────────────
const tutorialOpen = ref(false)
const tutorialTab = ref<'deezer' | 'youtube' | 'spotify'>('deezer')

watch(tutorialOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})
const copied = ref(false)
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

function copyTracks() {
  navigator.clipboard.writeText(tracksToRemove.value.join('\n')).then(() => {
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  })
}

const normalize = (s: string) =>
  s.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip accents
    .replace(/vevo$/i, '')              // strip VEVO suffix
    .replace(/[^a-z0-9\s]/g, '')       // strip punctuation (Jay-Z → jay z, P!nk → pnk)
    .replace(/^the\s+/, '')            // strip leading "the"
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

// ── Deezer ────────────────────────────────────────────────────────────────────

function extractDeezerId(input: string): string | null {
  if (/^\d+$/.test(input)) return input
  const m = input.match(/deezer\.com\/(?:[a-z-]+\/)?playlist\/(\d+)/)
  return m ? m[1] : null
}

async function fetchDeezer(id: string): Promise<PlaylistData> {
  const res = await fetch(`/api/deezer-playlist?id=${id}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ── Spotify ───────────────────────────────────────────────────────────────────

function extractSpotifyId(input: string): string | null {
  const m = input.match(/spotify\.com\/(?:[a-z-]+\/)?playlist\/([A-Za-z0-9]+)/)
  return m ? m[1] : null
}

async function fetchSpotify(id: string): Promise<PlaylistData> {
  const res = await fetch(`/api/spotify-playlist?id=${id}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ── YouTube Music ─────────────────────────────────────────────────────────────

function extractYoutubeId(input: string): string | null {
  const m = input.match(/[?&]list=([A-Za-z0-9_-]+)/)
  return m ? m[1] : null
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

      <div v-if="loading" class="loader" role="status" :aria-label="loadingStep">
        <div class="loader__step" :class="{ active: loadingStepIndex === 1, done: loadingStepIndex > 1 }">
          <span class="loader__step-icon">
            <svg v-if="loadingStepIndex > 1" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8l4 4 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
            <span v-else-if="loadingStepIndex === 1" class="loader__spinner" aria-hidden="true"></span>
            <span v-else class="loader__dot" aria-hidden="true"></span>
          </span>
          <span class="loader__step-label">Récupération de la playlist…<template v-if="loadingStepIndex === 1 && loadingStep.includes('(')"> {{ loadingStep.match(/\(.*\)/)?.[0] }}</template></span>
        </div>
        <div class="loader__step" :class="{ active: loadingStepIndex === 2, done: loadingStepIndex > 2 }">
          <span class="loader__step-icon">
            <svg v-if="loadingStepIndex > 2" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8l4 4 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
            <span v-else-if="loadingStepIndex === 2" class="loader__spinner" aria-hidden="true"></span>
            <span v-else class="loader__dot" aria-hidden="true"></span>
          </span>
          <span class="loader__step-label">Vérification des artistes…</span>
        </div>
      </div>
      <p v-else-if="error" class="error-msg" role="alert">{{ error }}</p>

      <div v-if="analyzed" class="results" aria-live="polite" aria-atomic="true">
        <!-- Clean result -->
        <div v-if="matched.length === 0" class="clean-result">
          <div class="clean-result__icon">
            <svg viewBox="0 0 52 52" class="clean-result__svg" aria-hidden="true">
              <circle class="clean-result__circle" cx="26" cy="26" r="24" />
              <path class="clean-result__check" d="M14 27 l8 8 l16 -16" />
            </svg>
          </div>
          <p class="clean-result__title">Playlist clean !</p>
          <p class="clean-result__sub">
            Aucun artiste de « {{ playlistTitle }} » n'est dans la liste
            ({{ totalTracks }} pistes, {{ totalArtists }} artistes uniques vérifiés).
          </p>
        </div>

        <!-- Flagged results -->
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

          <div class="tracks-to-remove">
            <div class="tracks-to-remove__header">
              <h2 class="tracks-to-remove__title">
                Pistes à supprimer ({{ tracksToRemove.length }})
              </h2>
              <button
                class="tracks-to-remove__copy"
                :aria-label="copied ? 'Liste copiée' : 'Copier la liste des pistes à supprimer'"
                @click="copyTracks"
              >
                {{ copied ? 'Copié !' : 'Copier la liste' }}
              </button>
            </div>
            <ul class="tracks-to-remove__list">
              <li v-for="(line, i) in tracksToRemove" :key="i" class="tracks-to-remove__item">
                {{ line }}
              </li>
            </ul>
          </div>
        </template>
      </div>

      <div class="hero__actions">
        <RouterLink to="/list" class="hero__cta">Parcourir la liste des artistes</RouterLink>
        <button class="hero__tutorial-btn" @click="tutorialOpen = true">
          Comment obtenir l'URL ?
        </button>
      </div>

      <!-- Tutorial modal -->
      <Teleport to="body">
        <Transition name="modal">
          <div
            v-if="tutorialOpen"
            class="modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Tutoriel — obtenir l'URL d'une playlist"
            @click.self="tutorialOpen = false"
            @keydown.escape="tutorialOpen = false"
          >
            <div class="modal">
              <div class="modal__header">
                <h2 class="modal__title">Comment obtenir l'URL d'une playlist ?</h2>
                <button class="modal__close" aria-label="Fermer" @click="tutorialOpen = false">×</button>
              </div>

              <div class="modal__tabs" role="tablist">
                <button
                  v-for="tab in (['deezer', 'youtube', 'spotify'] as const)"
                  :key="tab"
                  role="tab"
                  :aria-selected="tutorialTab === tab"
                  class="modal__tab"
                  :class="{ 'modal__tab--active': tutorialTab === tab }"
                  @click="tutorialTab = tab"
                >
                  {{ tab === 'youtube' ? 'YouTube Music' : tab.charAt(0).toUpperCase() + tab.slice(1) }}
                </button>
              </div>

              <div class="modal__body">
                <!-- Deezer -->
                <div v-if="tutorialTab === 'deezer'">
                  <div class="tuto-section">
                    <h3 class="tuto-section__title">Rendre une playlist publique</h3>
                    <div class="tuto-platform">
                      <span class="tuto-platform__label">Mobile</span>
                      <ol class="tuto-steps">
                        <li>Ouvrez votre playlist</li>
                        <li>Appuyez sur les trois points <strong>…</strong></li>
                        <li>Appuyez sur <strong>Modifier</strong></li>
                        <li>Activez <strong>Playlist publique</strong></li>
                        <li>Enregistrez</li>
                      </ol>
                    </div>
                    <div class="tuto-platform">
                      <span class="tuto-platform__label">Navigateur</span>
                      <ol class="tuto-steps">
                        <li>Ouvrez votre playlist</li>
                        <li>Cliquez sur les trois points <strong>…</strong></li>
                        <li>Cliquez sur <strong>Modifier la playlist</strong></li>
                        <li>Activez <strong>Playlist publique</strong></li>
                        <li>Enregistrez</li>
                      </ol>
                    </div>
                  </div>
                  <div class="tuto-section">
                    <h3 class="tuto-section__title">Obtenir le lien</h3>
                    <div class="tuto-platform">
                      <span class="tuto-platform__label">Mobile</span>
                      <ol class="tuto-steps">
                        <li>Ouvrez votre playlist</li>
                        <li>Appuyez sur les trois points <strong>…</strong></li>
                        <li>Appuyez sur <strong>Partager</strong></li>
                        <li>Copiez le lien</li>
                      </ol>
                    </div>
                    <div class="tuto-platform">
                      <span class="tuto-platform__label">Navigateur</span>
                      <ol class="tuto-steps">
                        <li>Ouvrez votre playlist</li>
                        <li>Cliquez sur les trois points <strong>…</strong></li>
                        <li>Cliquez sur <strong>Partager</strong></li>
                        <li>Copiez le lien</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <!-- YouTube Music -->
                <div v-if="tutorialTab === 'youtube'">
                  <p class="tuto-note">Les playlists générées automatiquement (Mix, Radio) ne sont pas supportées — uniquement les playlists créées manuellement.</p>
                  <div class="tuto-section">
                    <h3 class="tuto-section__title">Rendre une playlist publique</h3>
                    <div class="tuto-platform">
                      <span class="tuto-platform__label">Mobile</span>
                      <ol class="tuto-steps">
                        <li>Ouvrez votre playlist</li>
                        <li>Appuyez sur les trois points <strong>⋮</strong></li>
                        <li>Appuyez sur <strong>Modifier la playlist</strong></li>
                        <li>Changez la visibilité en <strong>Publique</strong> ou <strong>Non répertoriée</strong></li>
                        <li>Enregistrez</li>
                      </ol>
                    </div>
                    <div class="tuto-platform">
                      <span class="tuto-platform__label">Navigateur</span>
                      <ol class="tuto-steps">
                        <li>Ouvrez votre playlist</li>
                        <li>Cliquez sur les trois points <strong>⋮</strong> à côté du titre</li>
                        <li>Cliquez sur <strong>Modifier la playlist</strong></li>
                        <li>Changez la visibilité en <strong>Publique</strong> ou <strong>Non répertoriée</strong></li>
                        <li>Enregistrez</li>
                      </ol>
                    </div>
                  </div>
                  <div class="tuto-section">
                    <h3 class="tuto-section__title">Obtenir le lien</h3>
                    <div class="tuto-platform">
                      <span class="tuto-platform__label">Mobile</span>
                      <ol class="tuto-steps">
                        <li>Ouvrez votre playlist</li>
                        <li>Appuyez sur les trois points <strong>⋮</strong></li>
                        <li>Appuyez sur <strong>Partager</strong></li>
                        <li>Copiez le lien</li>
                      </ol>
                    </div>
                    <div class="tuto-platform">
                      <span class="tuto-platform__label">Navigateur</span>
                      <ol class="tuto-steps">
                        <li>Ouvrez votre playlist</li>
                        <li>Cliquez sur les trois points <strong>⋮</strong></li>
                        <li>Cliquez sur <strong>Partager</strong></li>
                        <li>Copiez le lien</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <!-- Spotify -->
                <div v-if="tutorialTab === 'spotify'">
                  <p class="tuto-note">L'analyse Spotify est temporairement indisponible.</p>
                  <div class="tuto-section">
                    <h3 class="tuto-section__title">Rendre une playlist publique</h3>
                    <div class="tuto-platform">
                      <span class="tuto-platform__label">Mobile</span>
                      <ol class="tuto-steps">
                        <li>Ouvrez votre playlist</li>
                        <li>Appuyez sur les trois points <strong>…</strong></li>
                        <li>Appuyez sur <strong>Rendre publique</strong></li>
                      </ol>
                    </div>
                    <div class="tuto-platform">
                      <span class="tuto-platform__label">Navigateur</span>
                      <ol class="tuto-steps">
                        <li>Faites un clic droit sur votre playlist dans la barre latérale</li>
                        <li>Cliquez sur <strong>Rendre publique</strong></li>
                      </ol>
                    </div>
                  </div>
                  <div class="tuto-section">
                    <h3 class="tuto-section__title">Obtenir le lien</h3>
                    <div class="tuto-platform">
                      <span class="tuto-platform__label">Mobile</span>
                      <ol class="tuto-steps">
                        <li>Ouvrez votre playlist</li>
                        <li>Appuyez sur les trois points <strong>…</strong></li>
                        <li>Appuyez sur <strong>Partager</strong></li>
                        <li>Appuyez sur <strong>Copier le lien</strong></li>
                      </ol>
                    </div>
                    <div class="tuto-platform">
                      <span class="tuto-platform__label">Navigateur</span>
                      <ol class="tuto-steps">
                        <li>Faites un clic droit sur votre playlist</li>
                        <li>Survolez <strong>Partager</strong></li>
                        <li>Cliquez sur <strong>Copier le lien de la playlist</strong></li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Spotify modal -->
      <Teleport to="body">
        <Transition name="modal">
          <div
            v-if="spotifyModalOpen"
            class="modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Pourquoi quitter Spotify ?"
            @click.self="spotifyModalOpen = false"
            @keydown.escape="spotifyModalOpen = false"
          >
            <div class="modal">
              <div class="modal__header">
                <h2 class="modal__title">Pourquoi quitter Spotify ?</h2>
                <button class="modal__close" aria-label="Fermer" @click="spotifyModalOpen = false">×</button>
              </div>
              <div class="modal__body spotify-modal-body">
                <p v-for="(para, i) in spotifyParagraphs" :key="i" class="spotify-para" v-html="renderPara(para)"></p>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
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

.spotify-modal-body {
  gap: 0;
}

.spotify-para {
  font-size: 0.9rem;
  color: var(--text-body);
  line-height: 1.65;
  margin: 0 0 1rem;

  &:last-child {
    margin-bottom: 0;
  }

  a {
    color: var(--link);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

/* Loader */
.loader {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
  max-width: 320px;
  padding: 1rem 1.2rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
}

.loader__step {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.88rem;
  color: var(--text-muted);
  transition: color 0.2s;

  &.active {
    color: var(--text);
  }

  &.done {
    color: #16a34a;
  }
}

.loader__step-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-light);
  display: block;
}

.loader__spinner {
  display: block;
  width: 14px;
  height: 14px;
  border: 2px solid color-mix(in srgb, var(--accent) 25%, transparent);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

.results__summary--clean {
  border-color: #16a34a44;
  color: #16a34a;
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

/* Clean result */
.clean-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 1.5rem 1rem;
  text-align: center;
  animation: fade-in 0.4s ease;
}

.clean-result__icon {
  width: 72px;
  height: 72px;
}

.clean-result__svg {
  width: 100%;
  height: 100%;
  display: block;
}

.clean-result__circle {
  fill: none;
  stroke: #16a34a;
  stroke-width: 3;
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  animation: draw-circle 0.5s ease forwards;
}

.clean-result__check {
  fill: none;
  stroke: #16a34a;
  stroke-width: 3.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 36;
  stroke-dashoffset: 36;
  animation: draw-check 0.35s ease 0.45s forwards;
}

.clean-result__title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #16a34a;
  margin: 0;
  opacity: 0;
  animation: fade-in 0.3s ease 0.7s forwards;
}

.clean-result__sub {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0;
  opacity: 0;
  animation: fade-in 0.3s ease 0.85s forwards;
}

@keyframes draw-circle {
  to { stroke-dashoffset: 0; }
}

@keyframes draw-check {
  to { stroke-dashoffset: 0; }
}

@keyframes fade-in {
  to { opacity: 1; }
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

/* Tracks to remove */
.tracks-to-remove {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.4rem;
  overflow: hidden;
}

.tracks-to-remove__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid var(--border);
}

.tracks-to-remove__title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0;
}

.tracks-to-remove__copy {
  font-size: 0.8rem;
  padding: 0.3rem 0.75rem;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 0.3rem;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.85;
  }
}

.tracks-to-remove__list {
  list-style: none;
  margin: 0;
  padding: 0.4rem 0;
  max-height: 220px;
  overflow-y: auto;
}

.tracks-to-remove__item {
  padding: 0.3rem 1rem;
  font-size: 0.85rem;
  color: var(--text-body);
  border-bottom: 1px solid var(--border);

  &:last-child {
    border-bottom: none;
  }
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

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.6rem;
  width: 100%;
  max-width: 540px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.2rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.modal__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.modal__close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.4rem;
  cursor: pointer;
  line-height: 1;
  padding: 0.1rem 0.3rem;
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

.modal__tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.modal__tab {
  flex: 1;
  padding: 0.65rem 0.5rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  margin-bottom: -1px;

  &:hover {
    color: var(--text);
  }
}

.modal__tab--active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.modal__body {
  padding: 1.2rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Tutorial content */
.tuto-note {
  font-size: 0.85rem;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
  border-radius: 0.4rem;
  padding: 0.6rem 0.8rem;
  margin: 0 0 0.3rem;
}

.modal__body > div {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tuto-section {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.tuto-section__title {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin: 0;
}

.tuto-platform {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 0.4rem;
  padding: 0.7rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.tuto-platform__label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tuto-steps {
  margin: 0;
  padding-left: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  li {
    font-size: 0.88rem;
    color: var(--text-body);
    line-height: 1.5;
  }
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;

  .modal {
    transition: transform 0.2s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal {
    transform: scale(0.95) translateY(8px);
  }
}
</style>
