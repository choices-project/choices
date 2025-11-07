import { createJSONStorage } from 'zustand/middleware'

type StorageLike = {
  getItem: (name: string) => string | null
  setItem: (name: string, value: string) => void
  removeItem: (name: string) => void
}

const createMemoryStorage = (): StorageLike => {
  const store = new Map<string, string>()

  return {
    getItem: (name) => store.get(name) ?? null,
    setItem: (name, value) => {
      store.set(name, value)
    },
    removeItem: (name) => {
      store.delete(name)
    },
  }
}

const memoryStorage = createMemoryStorage()

export const createSafeStorage = () =>
  createJSONStorage(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
    return memoryStorage
  })

