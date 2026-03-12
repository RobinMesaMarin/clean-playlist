<script setup lang="ts">
</script>

<template>
  <div class="home-page">
    <div class="hero">
      <h1 class="hero__title">Clean Playlist</h1>
      <p class="hero__subtitle">
        Vérifiez si des artistes de votre playlist ont fait l'objet de comportements problématiques documentés.
      </p>
      <div class="hero__coming-soon">
        <span>🔗</span>
        <p>La fonctionnalité d'analyse de playlist (Spotify, Deezer…) arrive bientôt.</p>
      </div>
      <RouterLink to="/list" class="hero__cta">Parcourir la liste des artistes</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 60px);
  padding: 2rem 1rem;
}

.hero {
  text-align: center;
  max-width: 560px;
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

.hero__coming-soon {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 0.8rem 1.2rem;
  width: 100%;

  span {
    font-size: 1.3rem;
    flex-shrink: 0;
  }

  p {
    margin: 0;
    font-size: 0.9rem;
    color: var(--text-muted);
    text-align: left;
  }
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
</style>
