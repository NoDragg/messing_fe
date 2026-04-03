<script setup>
defineProps({
  serverName: {
    type: String,
    default: 'Server',
  },
  channels: {
    type: Array,
    default: () => [],
  },
  currentChannelId: {
    type: [String, Number, null],
    default: null,
  },
  currentUser: {
    type: Object,
    default: () => ({ username: 'Guest' }),
  },
})

const emit = defineEmits(['select-channel', 'logout', 'invite-user'])
</script>

<template>
  <aside class="flex w-[240px] flex-col bg-gray-800">
    <header class="flex h-14 items-center justify-between border-b border-gray-700 px-3 shadow-sm">
      <h2 class="truncate pr-2 text-sm font-semibold text-white">{{ serverName }}</h2>
      <button
        type="button"
        class="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-indigo-500"
        title="Mời user vào server"
        @click="emit('invite-user')"
      >
        Mời
      </button>
    </header>

    <div class="flex-1 overflow-y-auto p-2">
      <button
        v-for="channel in channels"
        :key="channel.id"
        type="button"
        class="mb-1 flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-gray-100"
        :class="{
          'bg-gray-700 text-gray-100': currentChannelId === channel.id,
        }"
        @click="emit('select-channel', channel.id)"
      >
        <span class="mr-2 text-base text-gray-500">#</span>
        <span class="truncate">{{ channel.name }}</span>
      </button>
    </div>

    <footer class="flex items-center justify-between border-t border-gray-700 bg-gray-900/60 px-3 py-2">
      <div class="flex min-w-0 items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
          {{ (currentUser?.username || 'G').charAt(0).toUpperCase() }}
        </div>
        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-white">{{ currentUser?.username || 'Guest' }}</p>
        </div>
      </div>

      <button
        type="button"
        class="rounded bg-red-600 px-2 py-1 text-xs text-white transition hover:bg-red-500"
        title="Đăng xuất"
        @click="emit('logout')"
      >
        Logout
      </button>
    </footer>
  </aside>
</template>
