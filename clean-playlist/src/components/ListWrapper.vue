<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useVirtualizer } from '@tanstack/vue-virtual';
import ListItem from './ListItem.vue';

const source = ref<any[]>([]);
onMounted(async () => {
  const res = await fetch('/data.json');
  source.value = await res.json();
});

const categoryCounts = computed(() => {
  const counts = new Map<string, number>();
  source.value.forEach(entry => entry.category?.forEach((c: string) => {
    if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
  }));
  return counts;
});

const allCategories = computed(() =>
  [...categoryCounts.value.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat)
);

const selectedCategories = ref<string[]>([]);
const dropdownOpen = ref(false);
const search = ref('');
const searchInput = ref<HTMLInputElement | null>(null);
const catMenu = ref<HTMLElement | null>(null);
const catToggle = ref<HTMLElement | null>(null);

function closeDropdown() {
  dropdownOpen.value = false;
  catToggle.value?.focus();
}

function onKeydown(e: KeyboardEvent) {
  // Close dropdown on Escape
  if (e.key === 'Escape') {
    if (dropdownOpen.value) {
      closeDropdown();
      return;
    }
    if (document.activeElement === searchInput.value) {
      searchInput.value?.blur();
      return;
    }
  }

  // Focus search on Ctrl+K
  if (e.key === 'k' && e.ctrlKey) {
    e.preventDefault();
    searchInput.value?.focus();
    return;
  }

  // Focus trap inside dropdown
  if (dropdownOpen.value && e.key === 'Tab' && catMenu.value) {
    const focusable = Array.from(
      catMenu.value.querySelectorAll<HTMLElement>('button, input, label')
    ).filter(el => !el.hasAttribute('disabled'));

    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));

const filteredSource = computed(() => {
  let result = source.value;

  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase();
    result = result.filter((entry: any) =>
      entry.artistDisplayName?.toLowerCase().includes(q)
    );
  }

  if (selectedCategories.value.length > 0) {
    result = result.filter((entry: any) =>
      selectedCategories.value.some(cat => entry.category?.includes(cat))
    );
  }

  return result;
});

function removeCategory(cat: string) {
  selectedCategories.value = selectedCategories.value.filter(c => c !== cat);
}

function clearAll() {
  selectedCategories.value = [];
}

function clearAllFilters() {
  selectedCategories.value = [];
  search.value = '';
}

const hasActiveFilters = computed(() => search.value.trim() !== '' || selectedCategories.value.length > 0);

const scrollParent = ref<HTMLElement | null>(null);

const virtualizer = useVirtualizer(computed(() => ({
  count: filteredSource.value.length,
  getScrollElement: () => scrollParent.value,
  estimateSize: () => 72,
  overscan: 5,
})));

const virtualItems = computed(() => virtualizer.value.getVirtualItems());
const totalSize = computed(() => virtualizer.value.getTotalSize());

function measureItem(el: Element | null, index: number) {
  if (el) virtualizer.value.measureElement(el);
}
</script>

<template>
  <div class="list-page">
    <div v-if="source.length === 0" class="loading">Chargement…</div>
    <template v-else>
    <h1>{{ filteredSource.length }} Artiste{{ filteredSource.length !== 1 ? 's' : '' }} trouvé{{ filteredSource.length !== 1 ? 's' : '' }}</h1>
    <div class="filter-bar">
      <input
        v-model="search"
        ref="searchInput"
        class="search-input"
        type="text"
        placeholder="Rechercher un artiste...  (Ctrl+K)"
        aria-label="Rechercher un artiste"
      />
      <div class="cat-dropdown" :class="{ open: dropdownOpen }">
        <button
          ref="catToggle"
          class="cat-toggle"
          @click="dropdownOpen = !dropdownOpen"
          :aria-expanded="dropdownOpen"
          aria-haspopup="listbox"
          aria-controls="cat-menu"
        >
          <span v-if="selectedCategories.length === 0">Filtrer par catégorie</span>
          <span v-else>{{ selectedCategories.length }} catégorie{{ selectedCategories.length > 1 ? 's' : '' }} sélectionnée{{ selectedCategories.length > 1 ? 's' : '' }}</span>
          <svg class="chevron" viewBox="0 0 24 24" width="16" height="16"><path d="M6 9l6 6 6-6"/></svg>
        </button>

        <div id="cat-menu" class="cat-menu" v-if="dropdownOpen" ref="catMenu" role="listbox" aria-multiselectable="true">
          <div class="cat-menu-header" v-if="selectedCategories.length > 0">
            <button class="clear-btn" @click="clearAll">Tout effacer</button>
          </div>
          <label
            v-for="cat in allCategories"
            :key="cat"
            class="cat-option"
            :class="{ selected: selectedCategories.includes(cat) }"
            role="option"
            :aria-selected="selectedCategories.includes(cat)"
          >
            <input type="checkbox" v-model="selectedCategories" :value="cat" />
            <span class="cat-option__name">{{ cat }}</span>
            <span class="cat-option__count">{{ categoryCounts.get(cat) }}</span>
          </label>
        </div>
      </div>

      <div class="filter-row" v-if="hasActiveFilters">
        <button class="clear-all-btn" @click="clearAllFilters">Effacer tous les filtres</button>
      </div>

      <div class="selected-tags" v-if="selectedCategories.length > 0">
        <button v-for="cat in selectedCategories" :key="cat" class="tag" @click="removeCategory(cat)" :aria-label="`Retirer ${cat}`">
          {{ cat }} <span class="tag-remove" aria-hidden="true">×</span>
        </button>
      </div>
    </div>

    <div v-if="filteredSource.length === 0" class="no-results">
      Aucun résultat pour votre recherche.
    </div>

    <div v-else class="list-scroll" ref="scrollParent">
      <div :style="{ height: `${totalSize}px`, position: 'relative' }">
        <div
          v-for="virtualItem in virtualItems"
          :key="filteredSource[virtualItem.index]?.artistDisplayName ?? virtualItem.index"
          :data-index="virtualItem.index"
          :ref="el => measureItem(el as Element, virtualItem.index)"
          :style="{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualItem.start}px)` }"
          class="list-item-wrap"
        >
          <ListItem v-if="filteredSource[virtualItem.index]" :item="filteredSource[virtualItem.index]" />
        </div>
      </div>
    </div>
    </template>
  </div>

  <div v-if="dropdownOpen" class="overlay" @click="dropdownOpen = false" />
</template>

<style scoped>
.list-page {
  max-width: 860px;
  margin: 0 auto;
  padding: 0 1rem 3rem;
}

h1 {
  text-align: center;
  font-size: 1.4rem;
  color: var(--text-muted);
  font-weight: 400;
  margin-bottom: 1.2rem;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.8rem;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 0.4rem;
  color: var(--text);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;

  &::placeholder {
    color: var(--text-muted);
  }

  &:focus {
    border-color: var(--accent);
  }
}

/* Filter bar */
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.2rem;
}

/* Dropdown */
.cat-dropdown {
  position: relative;
  width: fit-content;
}

.cat-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 0.4rem;
  color: var(--text-body);
  padding: 0.45rem 0.8rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover {
    border-color: var(--text-muted);
  }
}

.chevron {
  stroke: var(--text-muted);
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform 0.2s;
}

.cat-dropdown.open .chevron {
  transform: rotate(180deg);
}

.cat-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 100;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 0.4rem;
  min-width: 240px;
  max-height: 320px;
  overflow-y: auto;
  box-shadow: 0 8px 24px var(--shadow);
}

.cat-menu-header {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
}

.clear-btn {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
}

.cat-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.875rem;
  color: var(--text-body);
  cursor: pointer;
  transition: background 0.1s;

  input[type="checkbox"] {
    accent-color: var(--accent);
    width: 14px;
    height: 14px;
    cursor: pointer;
    flex-shrink: 0;
  }

  &:hover {
    background: var(--bg-card-hover);
  }

  &.selected {
    color: var(--text);
    background: var(--bg-card-selected);
  }
}

.cat-option__name {
  flex: 1;
}

.cat-option__count {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: var(--bg);
  border-radius: 999px;
  padding: 0.1rem 0.45rem;
  min-width: 1.5rem;
  text-align: center;
}

/* Tags */
.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 999px;
  color: var(--accent);
  font-size: 0.78rem;
  padding: 0.2rem 0.6rem;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--bg-card-hover);
  }
}

.tag-remove {
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1;
}

.filter-row {
  display: flex;
  justify-content: flex-end;
}

.clear-all-btn {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.82rem;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
}

.loading {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.95rem;
  padding: 3rem 0;
}

.no-results {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.95rem;
  padding: 3rem 0;
}

/* List */
.list-scroll {
  height: calc(100vh - 220px);
  overflow-y: auto;
}

.list-item-wrap {
  padding-bottom: 0.5rem;
}

/* Overlay */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
}
</style>
