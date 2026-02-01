'use client'

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react'

interface HeaderConfig {
  content: ReactNode | null
  actions: ReactNode | null
}

interface HeaderContextType {
  headerContent: ReactNode | null
  headerActions: ReactNode | null
  setHeaderConfig: (config: Partial<HeaderConfig>) => void
  resetHeader: () => void
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<HeaderConfig>({
    content: null,
    actions: null,
  })

  // Use ref to track if we need to update to avoid unnecessary re-renders
  const configRef = useRef(config)
  configRef.current = config

  const setHeaderConfig = useCallback((newConfig: Partial<HeaderConfig>) => {
    setConfig((prev) => {
      // Only update if there's an actual change
      const next = { ...prev, ...newConfig }
      if (prev.content === next.content && prev.actions === next.actions) {
        return prev
      }
      return next
    })
  }, [])

  const resetHeader = useCallback(() => {
    setConfig((prev) => {
      // Only reset if not already null
      if (prev.content === null && prev.actions === null) {
        return prev
      }
      return { content: null, actions: null }
    })
  }, [])

  return (
    <HeaderContext.Provider
      value={{
        headerContent: config.content,
        headerActions: config.actions,
        setHeaderConfig,
        resetHeader,
      }}
    >
      {children}
    </HeaderContext.Provider>
  )
}

export function useHeaderContext() {
  const context = useContext(HeaderContext)
  if (context === undefined) {
    throw new Error('useHeaderContext must be used within a HeaderProvider')
  }
  return context
}
