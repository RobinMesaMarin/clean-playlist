<script setup lang="ts">
import { CCollapse, CCard } from '@coreui/vue';
import { ref } from 'vue';
const visible = ref(false);

const props = defineProps(['item'])</script>

<template>
<CCard class="list-item">
  <div class="list-item__header" @click="visible = !visible" role="button" :aria-expanded="visible" tabindex="0" @keydown.enter="visible = !visible" @keydown.space.prevent="visible = !visible">
    <h2>{{ props.item.artistDisplayName }}</h2>
    <div class="list-item__badges">
      <span v-for="category in props.item.category" :key="category" class="list-item__badge">
        {{ category }}
      </span>
    </div>
  </div>
  <CCollapse :visible="visible">
    <div v-if="visible" class="list-item__collapse-content">
      <div v-for="reasons in props.item.reasons" :key="reasons">
        {{ reasons }}
      </div>
      <div class="list-item__sources">
        <h3 id="sources-label">Sources</h3>
        <ul class="list-item__source-list" aria-labelledby="sources-label">
          <li v-for="source in props.item.sources" :key="source.url">
            <img
              v-bind:src="'../src/assets/icons/' + source.lang + '.png'"
              v-bind:alt="source.lang === 'fr' ? 'Source en français' : source.lang === 'en' ? 'Source en anglais' : `Source en ${source.lang}`"
              width="16" height="16"
            />
            <a target="_blank" :href="source.url" :aria-label="`${source.url} (ouvre dans un nouvel onglet)`">{{ source.url }}</a>
          </li>
        </ul>
      </div>
    </div>
  </CCollapse>
</CCard>
</template>
<style scoped>
.list-item {
  background-color: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  overflow: hidden;

  .list-item__header {
    padding: 0.9rem 1.2rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    transition: background-color 0.15s ease;

    &:hover {
      background-color: var(--bg-card-hover);
    }

    h2 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text);
      margin: 0;
    }
  }

  .list-item__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .list-item__badge {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
    border-radius: 999px;
    padding: 0.15rem 0.55rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
}

.list-item__collapse-content {
  padding: 0.8rem 1.2rem 1rem;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  color: var(--text-body);
  font-size: 0.9rem;
  line-height: 1.6;
}

.list-item__sources {
  margin-top: 0.5rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--border);

  h3 {
    display: block;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin: 0 0 0.4rem;
    font-weight: 600;
  }
}

.list-item__source-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  li {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;

    a {
      color: var(--link);
      text-decoration: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>