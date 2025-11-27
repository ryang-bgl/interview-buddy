import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { RootStore } from './RootStore'

const rootStore = new RootStore()
const StoreContext = createContext(rootStore)

export function StoreProvider({ children }: { children: ReactNode }) {
  return <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>
}

export function useStores() {
  const store = useContext(StoreContext)
  if (!store) {
    throw new Error('useStores must be used within StoreProvider')
  }
  return store
}
