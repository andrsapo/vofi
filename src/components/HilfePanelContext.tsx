import { createContext, useContext, useState, type ReactNode } from 'react'

export interface HilfeTab {
  id: string
  kopfTitel: string
  h2: string
  videoSrc?: string
  schritte?: string[]
  freitext?: string
  eskalationsThema?: string
}

interface HilfePanelState {
  offen: boolean
  tabs: HilfeTab[]
  aktiverTabId: string | null
  oeffne: (tab: HilfeTab) => void
  schliesse: () => void
  schliesseTab: (tabId: string) => void
  setAktiverTab: (tabId: string) => void
}

const HilfePanelContext = createContext<HilfePanelState>({
  offen: false,
  tabs: [],
  aktiverTabId: null,
  oeffne: () => {},
  schliesse: () => {},
  schliesseTab: () => {},
  setAktiverTab: () => {},
})

export { HilfePanelContext }

export function useHilfePanel() {
  return useContext(HilfePanelContext)
}

export function HilfePanelProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<HilfeTab[]>([])
  const [aktiverTabId, setAktiverTabId] = useState<string | null>(null)

  function oeffne(tab: HilfeTab) {
    setTabs((prev) => {
      const existiert = prev.find((t) => t.id === tab.id)
      if (existiert) return prev
      return [...prev, tab]
    })
    setAktiverTabId(tab.id)
  }

  function schliesse() {
    setTabs([])
    setAktiverTabId(null)
  }

  function schliesseTab(tabId: string) {
    setTabs((prev) => {
      const neu = prev.filter((t) => t.id !== tabId)
      if (aktiverTabId === tabId) {
        setAktiverTabId(neu.length > 0 ? neu[neu.length - 1].id : null)
      }
      return neu
    })
  }

  return (
    <HilfePanelContext.Provider value={{
      offen: tabs.length > 0,
      tabs,
      aktiverTabId,
      oeffne,
      schliesse,
      schliesseTab,
      setAktiverTab: setAktiverTabId,
    }}>
      {children}
    </HilfePanelContext.Provider>
  )
}
