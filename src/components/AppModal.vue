<script setup lang="ts">
defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="modal-backdrop"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        @click.self="emit('close')"
        @keydown.escape="emit('close')"
      >
        <div class="modal">
          <div class="modal__header">
            <h2 class="modal__title">{{ title }}</h2>
            <button class="modal__close" aria-label="Fermer" @click="emit('close')">×</button>
          </div>
          <slot name="tabs" />
          <div class="modal__body">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.6rem;
  width: 100%;
  max-width: 540px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.2rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.modal__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.modal__close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.4rem;
  cursor: pointer;
  line-height: 1;
  padding: 0.1rem 0.3rem;
  min-width: 2.75rem;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.2rem;

  &:hover {
    color: var(--text);
  }
}

.modal__body {
  padding: 1.2rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;

  .modal {
    transition: transform 0.2s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal {
    transform: scale(0.95) translateY(8px);
  }
}
</style>
