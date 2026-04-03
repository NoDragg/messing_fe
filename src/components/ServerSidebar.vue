<script setup>
defineProps({
  servers: {
    type: Array,
    default: () => [],
  },
  currentServerId: {
    type: [String, Number, null],
    default: null,
  },
  isCreatingServer: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select-server', 'create-server'])

const getServerInitial = (server) => {
  return (server?.name || 'S').charAt(0).toUpperCase()
}
</script>

<template>
  <aside class="w-[72px] bg-gray-900 p-3">
    <div class="flex h-full flex-col items-center gap-3 overflow-y-auto">
      <button
        v-for="server in servers"
        :key="server.id"
        type="button"
        :title="server.name"
        class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 text-sm font-bold text-gray-100 transition-all duration-200 hover:rounded-xl hover:bg-indigo-500"
        :class="{
          'bg-indigo-500 ring-2 ring-indigo-300': currentServerId === server.id,
        }"
        @click="emit('select-server', server.id)"
      >
        {{ getServerInitial(server) }}
      </button>

      <div class="my-1 h-px w-8 bg-gray-700"></div>

      <button
        type="button"
        class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-xl font-bold text-white transition-all duration-200 hover:rounded-xl hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isCreatingServer"
        title="Tạo server mới"
        @click="emit('create-server')"
      >
        <span v-if="!isCreatingServer">+</span>
        <span v-else class="text-sm">...</span>
      </button>
    </div>
  </aside>
</template>
