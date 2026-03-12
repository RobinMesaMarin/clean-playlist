<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import ListWrapper from '@/components/ListWrapper.vue';

const showButton = ref(false);

function onScroll() {
  showButton.value = window.scrollY > 400;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(() => window.addEventListener('scroll', onScroll));
onUnmounted(() => window.removeEventListener('scroll', onScroll));
</script>

<template>
  <ListWrapper />
  <Transition name="fade">
    <button v-if="showButton" class="back-to-top" @click="scrollToTop" aria-label="Retour en haut">
      ↑
    </button>
  </Transition>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 200;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 1px solid var(--border-light);
  background: var(--bg-card);
  color: var(--text-body);
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: var(--bg-card-hover);
    border-color: var(--text-muted);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
