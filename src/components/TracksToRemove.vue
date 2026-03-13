<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ tracks: string[] }>()

const copied = ref(false)

function copy(tracks: string[]) {
  navigator.clipboard.writeText(tracks.join('\n')).then(() => {
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  })
}
</script>

<template>
  <div class="tracks-to-remove">
    <div class="tracks-to-remove__header">
      <h2 class="tracks-to-remove__title">
        Pistes à supprimer ({{ tracks.length }})
      </h2>
      <button
        class="tracks-to-remove__copy"
        :aria-label="copied ? 'Liste copiée' : 'Copier la liste des pistes à supprimer'"
        @click="copy(tracks)"
      >
        {{ copied ? 'Copié !' : 'Copier la liste' }}
      </button>
    </div>
    <ul class="tracks-to-remove__list">
      <li v-for="(line, i) in tracks" :key="i" class="tracks-to-remove__item">
        {{ line }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
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
</style>
