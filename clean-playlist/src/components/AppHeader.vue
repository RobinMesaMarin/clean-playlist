<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';
import { useTheme } from '@/composables/useTheme';

const route = useRoute();
const { isDark, toggle } = useTheme();
</script>

<template>
  <header class="app-header" role="banner">
    <span class="app-title">Clean Playlist</span>
    <nav aria-label="Navigation principale">
      <RouterLink to="/" :class="{ active: route.name === 'home' }">Accueil</RouterLink>
      <RouterLink to="/list" :class="{ active: route.name === 'list' }">Liste</RouterLink>
      <RouterLink to="/about" :class="{ active: route.name === 'about' }">À propos</RouterLink>
    </nav>
    <button class="theme-toggle" @click="toggle" :aria-label="isDark ? 'Mode clair' : 'Mode sombre'">
      {{ isDark ? '☀️' : '🌙' }}
    </button>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--border);
  background: var(--header-bg);
  position: sticky;
  top: 0;
  z-index: 50;
}

.app-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

nav {
  display: flex;
  gap: 1.5rem;
}

nav a {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.15s;

  &:hover {
    color: var(--text);
  }

  &.active {
    color: var(--text);
    font-weight: 600;
  }
}

.theme-toggle {
  background: none;
  border: 1px solid var(--border-light);
  border-radius: 0.4rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  transition: border-color 0.15s;

  &:hover {
    border-color: var(--text-muted);
  }
}
</style>
