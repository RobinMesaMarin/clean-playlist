<script setup lang="ts">
import { ref } from 'vue'
import AppModal from './AppModal.vue'

defineProps<{ open: boolean }>()
defineEmits<{ close: [] }>()

const tutorialTab = ref<'deezer' | 'youtube' | 'spotify'>('deezer')
</script>

<template>
  <AppModal :open="open" title="Comment obtenir l'URL d'une playlist ?" @close="$emit('close')">
    <template #tabs>
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
    </template>

    <!-- Deezer -->
    <div v-if="tutorialTab === 'deezer'" class="tuto-content">
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
    <div v-if="tutorialTab === 'youtube'" class="tuto-content">
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
    <div v-if="tutorialTab === 'spotify'" class="tuto-content">
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
  </AppModal>
</template>

<style scoped>
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

.tuto-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tuto-note {
  font-size: 0.85rem;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
  border-radius: 0.4rem;
  padding: 0.6rem 0.8rem;
  margin: 0;
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
</style>
