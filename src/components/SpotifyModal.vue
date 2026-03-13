<script setup lang="ts">
import AppModal from './AppModal.vue'

defineProps<{ open: boolean }>()
defineEmits<{ close: [] }>()

const paragraphs = [
  "Spotify est une des plateformes qui rémunèrent le moins ses artistes. Elle met maintenant en avant de plus en plus de contenus créés via IA, les monétise et les inclut dans leurs playlists et radars régulièrement, ce qui pénalise les artistes.",
  "Son CEO, Daniel Ek, considère l'IA comme « une évolution de la création musicale ». Il avait également provoqué un tollé en déclarant que le coût de la création musicale était proche de zéro.",
  "Outre les 150 000 dollars offerts pour organiser la cérémonie d'investiture de Donald Trump (celle du salut nazi de Musk) et célébrer l'impact de ses podcasteurs conservateurs, le CEO de Spotify a investi cette année 600 millions d'euros dans Helsing, une entreprise fabriquant des drones et développant de l'IA à destination d'opérations militaires.",
  "Spotify héberge également des podcasts de recrutement pour l'ICE (Immigration and Customs Enforcement), l'agence fédérale américaine chargée du contrôle de l'immigration, régulièrement mise en cause pour ses conditions de détention inhumaines, ses séparations de familles et ses abus documentés envers les migrants.",
  "Plusieurs alternatives existent, moins problématiques même si imparfaites : [Deezer](https://www.deezer.com), [Tidal](https://tidal.com), [Qobuz](https://www.qobuz.com), [Apple Music](https://music.apple.com)...",
  "Des outils (gratuits et payants) existent pour migrer vos playlists tels que [TuneMyMusic](https://www.tunemymusic.com), [SongShift](https://songshift.com), [Soundiiz](https://soundiiz.com)...",
]

function renderPara(text: string): string {
  return text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  )
}
</script>

<template>
  <AppModal :open="open" title="Pourquoi quitter Spotify ?" @close="$emit('close')">
    <div class="spotify-content">
      <p v-for="(para, i) in paragraphs" :key="i" class="spotify-para" v-html="renderPara(para)" />
    </div>
  </AppModal>
</template>

<style scoped>
.spotify-content {
  display: flex;
  flex-direction: column;
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
</style>
