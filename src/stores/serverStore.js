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
  const isCreatingChannel = ref(false)
  const isInvitingMember = ref(false)
  const lastTextChannelByServer = ref({})

  const activeServerId = computed(() => activeServer.value?.id || null)

  const loadLastTextChannelMap = () => {
    if (typeof window === 'undefined') return

    try {
      const raw = window.localStorage.getItem('messing:lastTextChannelByServer')
      lastTextChannelByServer.value = raw ? JSON.parse(raw) || {} : {}
    } catch {
      lastTextChannelByServer.value = {}
    }
  }

  const saveLastTextChannelMap = () => {
    if (typeof window === 'undefined') return

    window.localStorage.setItem(
      'messing:lastTextChannelByServer',
      JSON.stringify(lastTextChannelByServer.value),
    )
  }

  const setLastTextChannelForServer = (serverId, channelId) => {
    if (!serverId || !channelId) return

    lastTextChannelByServer.value = {
      ...lastTextChannelByServer.value,
      [serverId]: channelId,
    }
    saveLastTextChannelMap()
  }

  const getLastTextChannelForServer = (serverId) => {
    if (!serverId) return null
    return lastTextChannelByServer.value?.[serverId] || null
  }

  const getPreferredChannelId = (serverId, channelList = channels.value) => {
    const preferredId = getLastTextChannelForServer(serverId)
    const preferredChannel = channelList.find((channel) => channel.id === preferredId && channel.type !== 'VOICE')
    if (preferredChannel) return preferredChannel.id

    const firstTextChannel = channelList.find((channel) => channel.type !== 'VOICE')
    if (firstTextChannel) return firstTextChannel.id

    return channelList[0]?.id || null
  }

  const fetchServers = async () => {
    try {
      isLoadingServers.value = true
      const response = await api.get('/api/servers')
      servers.value = response.data || []

      if (!activeServer.value && servers.value.length > 0) {
        activeServer.value = servers.value[0]
      }

      loadLastTextChannelMap()

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

  const updateServer = async (serverId, payload) => {
    if (!serverId) return null

    try {
      isCreatingServer.value = true
      const response = await api.put(`/api/servers/${serverId}`, payload)
      const updated = response.data

      if (updated) {
        const index = servers.value.findIndex((server) => server.id === serverId)
        if (index !== -1) {
          servers.value[index] = {
            ...servers.value[index],
            ...updated,
          }
        }

        if (activeServer.value?.id === serverId) {
          activeServer.value = {
            ...activeServer.value,
            ...updated,
          }
        }
      }

      return updated
    } finally {
      isCreatingServer.value = false
    }
  }

  const updateServerAvatar = async (serverId, file) => {
    if (!serverId || !file) return null

    try {
      isCreatingServer.value = true

      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post(`/api/servers/${serverId}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const iconUrl = response.data?.iconUrl || response.data?.url || null
      if (iconUrl) {
        const index = servers.value.findIndex((server) => server.id === serverId)
        if (index !== -1) {
          servers.value[index] = {
            ...servers.value[index],
            iconUrl,
          }
        }

        if (activeServer.value?.id === serverId) {
          activeServer.value = {
            ...activeServer.value,
            iconUrl,
          }
        }
      }

      return iconUrl
    } finally {
      isCreatingServer.value = false
    }
  }

  const deleteServer = async (serverId) => {
    if (!serverId) return false

    try {
      isCreatingServer.value = true
      await api.delete(`/api/servers/${serverId}`)

      servers.value = servers.value.filter((s) => s.id !== serverId)

      if (activeServer.value?.id === serverId) {
        activeServer.value = servers.value.length > 0 ? servers.value[0] : null
        channels.value = []
      }

      return true
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

  const createChannel = async (serverId, payload) => {
    if (!serverId) return null

    try {
      isCreatingChannel.value = true
      const response = await api.post(`/api/servers/${serverId}/channels`, payload)
      const created = response.data

      if (created) {
        channels.value.push(created)
        if (created.type !== 'VOICE') {
          setLastTextChannelForServer(serverId, created.id)
        }
      }

      return created
    } finally {
      isCreatingChannel.value = false
    }
  }

  const renameChannel = async (serverId, channelId, payload) => {
    if (!serverId || !channelId) return null

    try {
      isCreatingChannel.value = true
      const response = await api.put(`/api/servers/${serverId}/channels/${channelId}`, payload)
      const updated = response.data

      if (updated) {
        const targetIndex = channels.value.findIndex((channel) => channel.id === channelId)
        if (targetIndex !== -1) {
          channels.value[targetIndex] = {
            ...channels.value[targetIndex],
            ...updated,
          }
        }
      }

      return updated
    } finally {
      isCreatingChannel.value = false
    }
  }

  const deleteChannel = async (serverId, channelId) => {
    if (!serverId || !channelId) return false

    try {
      isCreatingChannel.value = true
      await api.delete(`/api/servers/${serverId}/channels/${channelId}`)

      channels.value = channels.value.filter((channel) => channel.id !== channelId)

      if (getLastTextChannelForServer(serverId) === channelId) {
        const nextPreferred = getPreferredChannelId(serverId, channels.value)
        if (nextPreferred) {
          setLastTextChannelForServer(serverId, nextPreferred)
        }
      }

      return true
    } finally {
      isCreatingChannel.value = false
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
    isCreatingChannel,
    isInvitingMember,
    activeServerId,
    fetchServers,
    createServer,
    updateServer,
    updateServerAvatar,
    deleteServer,
    createChannel,
    renameChannel,
    deleteChannel,
    createInviteLink,
    inviteMember,
    acceptInvite,
    setActiveServer,
    fetchChannelsByServer,
    getPreferredChannelId,
    setLastTextChannelForServer,
    reset,
  }
})
