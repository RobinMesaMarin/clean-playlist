<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ loadingStep: string }>()

const stepIndex = computed(() => {
  if (props.loadingStep.startsWith('Vérification')) return 2
  if (props.loadingStep.startsWith('Récupération')) return 1
  return 0
})
</script>

<template>
  <div class="loader" role="status" :aria-label="loadingStep">
    <div class="loader__step" :class="{ active: stepIndex === 1, done: stepIndex > 1 }">
      <span class="loader__step-icon">
        <svg v-if="stepIndex > 1" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M3 8l4 4 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
        <span v-else-if="stepIndex === 1" class="loader__spinner" aria-hidden="true"></span>
        <span v-else class="loader__dot" aria-hidden="true"></span>
      </span>
      <span class="loader__step-label">
        Récupération de la playlist…<template v-if="stepIndex === 1 && loadingStep.includes('(')"> {{ loadingStep.match(/\(.*\)/)?.[0] }}</template>
      </span>
    </div>
    <div class="loader__step" :class="{ active: stepIndex === 2, done: stepIndex > 2 }">
      <span class="loader__step-icon">
        <svg v-if="stepIndex > 2" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M3 8l4 4 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
        <span v-else-if="stepIndex === 2" class="loader__spinner" aria-hidden="true"></span>
        <span v-else class="loader__dot" aria-hidden="true"></span>
      </span>
      <span class="loader__step-label">Vérification des artistes…</span>
    </div>
  </div>
</template>

<style scoped>
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
</style>
