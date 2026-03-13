<script setup lang="ts">
defineProps<{ playlistTitle: string; totalTracks: number; totalArtists: number }>()
</script>

<template>
  <div class="clean-result">
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
</template>

<style scoped>
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
</style>
