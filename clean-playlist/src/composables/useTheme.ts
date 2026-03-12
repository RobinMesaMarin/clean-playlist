import { ref, watch } from 'vue';

const isDark = ref(localStorage.getItem('theme') !== 'light');

function apply() {
  document.documentElement.classList.toggle('light', !isDark.value);
}

apply();

watch(isDark, (val) => {
  localStorage.setItem('theme', val ? 'dark' : 'light');
  apply();
});

export function useTheme() {
  return { isDark, toggle: () => (isDark.value = !isDark.value) };
}
