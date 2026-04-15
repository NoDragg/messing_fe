export async function loadRuntimeConfig() {
  const response = await fetch('/config.json', { cache: 'no-store' })

  if (!response.ok) {
    return {
      apiBaseUrl: '/',
      wsBaseUrl: '/',
    }
  }

  const config = await response.json()

  return {
    apiBaseUrl: config.API_BASE_URL || '/',
    wsBaseUrl: config.WS_BASE_URL || config.API_BASE_URL || '/',
  }
}
