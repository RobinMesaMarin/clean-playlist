<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import 'bootstrap/dist/css/bootstrap.min.css'
</script>

<template>
  <AppHeader />
  <main>
    <RouterView />
  </main>
</template>
<style>
:root {
  --bg: #000;
  --bg-card: #1e1e1e;
  --bg-card-hover: #2a2a2a;
  --bg-card-selected: #252525;
  --border: #2e2e2e;
  --border-light: #3a3a3a;
  --text: #f0f0f0;
  --text-muted: #aaa;
  --text-body: #ccc;
  --accent: #dc2626;
  --link: #7aadff;
  --header-bg: #111;
  --shadow: rgba(0,0,0,0.4);
}

:root.light {
  --bg: #f5f5f5;
  --bg-card: #fff;
  --bg-card-hover: #f0f0f0;
  --bg-card-selected: #fafafa;
  --border: #ddd;
  --border-light: #ccc;
  --text: #111;
  --text-muted: #666;
  --text-body: #333;
  --accent: #b91c1c;
  --link: #1a5fb4;
  --header-bg: #fff;
  --shadow: rgba(0,0,0,0.1);
}

body {
  background: var(--bg);
  color: var(--text);
  height: 100vh;
  margin: 0;
  overflow: hidden;
}

#app {
  margin: 1rem;
  background: var(--bg);
  color: var(--text);
}</style>