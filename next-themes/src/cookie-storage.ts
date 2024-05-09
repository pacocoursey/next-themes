export function getCookieStorage(): Storage {
  const getItem = (key: string): string => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${key}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
    return null
  }
  const setItem = (key: string, value: string): void => {
    document.cookie = `${key}=${value}; path=/`
  }
  const removeItem = (key: string): void => {
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`
  }
  const clear = (): void => {
    document.cookie.split(';').forEach(cookie => {
      document.cookie = cookie
        .replace(/^ +/, '')
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`)
    })
  }
  const key = (index: number): string => {
    const cookie = document.cookie.split(';')[index]
    if (!cookie) return null
    return cookie.split('=')[0]
  }

  return {
    getItem,
    setItem,
    removeItem,
    clear,
    key,
    length: document.cookie.split(';').length
  }
}
