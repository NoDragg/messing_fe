import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

export const useServerStore = defineStore('server', () => {
  const servers = ref([])
  const activeServer = ref(null)
  const channels = ref([])
  const isLoadingServers = ref(false)
  const isLoadingChannels = ref(false)
  const isCreatingServer = ref(false)
  const isInvitingMember = ref(false)

  const activeServerId = computed(() => activeServer.value?.id || null)

  const fetchServers = async () => {
    try {
      isLoadingServers.value = true
      const response = await api.get('/api/servers')
      servers.value = response.data || []

      if (!activeServer.value && servers.value.length > 0) {
        activeServer.value = servers.value[0]
      }

      return servers.value
    } finally {
      isLoadingServers.value = false
    }
  }

  const createServer = async (payload) => {
    try {
      isCreatingServer.value = true
      const response = await api.post('/api/servers', payload)
      const created = response.data

      if (created) {
        servers.value.unshift(created)
        activeServer.value = created
      }

      return created
    } finally {
      isCreatingServer.value = false
    }
  }

  const createInviteLink = async (serverId) => {
    if (!serverId) return null

    try {
      isInvitingMember.value = true
      const response = await api.post(`/api/servers/${serverId}/invites`)
      return response.data
    } finally {
      isInvitingMember.value = false
    }
  }

  const inviteMember = async (serverId, email) => {
    try {
      isInvitingMember.value = true
      const response = await api.post(`/api/servers/${serverId}/invite`, { email })
      return response.data
    } finally {
      isInvitingMember.value = false
    }
  }

  const setActiveServer = (server) => {
    activeServer.value = server
  }

  const fetchChannelsByServer = async (serverId) => {
    if (!serverId) {
      channels.value = []
      return []
    }

    try {
      isLoadingChannels.value = true
      const response = await api.get(`/api/servers/${serverId}/channels`)
      channels.value = response.data || []
      return channels.value
    } finally {
      isLoadingChannels.value = false
    }
  }

  const acceptInvite = async (code) => {
    if (!code) return null

    const response = await api.post(`/api/servers/invites/${code}/accept`)

    await fetchServers()

    const joinedServerId = response.data?.serverId
    if (joinedServerId) {
      const joinedServer = servers.value.find((s) => s.id === joinedServerId)
      if (joinedServer) {
        activeServer.value = joinedServer
      }
    }

    return response.data
  }

  const reset = () => {
    servers.value = []
    activeServer.value = null
    channels.value = []
  }

  return {
    servers,
    activeServer,
    channels,
    isLoadingServers,
    isLoadingChannels,
    isCreatingServer,
    isInvitingMember,
    activeServerId,
    fetchServers,
    createServer,
    createInviteLink,
    inviteMember,
    acceptInvite,
    setActiveServer,
    fetchChannelsByServer,
    reset,
  }
})
