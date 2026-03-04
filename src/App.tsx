import { useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import type { ModuleType } from './types/config'

function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>('motion_analyzer')

  useKeyboardShortcuts()

  return (
    <AppShell
      activeModule={activeModule}
      onModuleChange={setActiveModule}
      sidebar={
        <div className="p-4">
          <p className="text-xs text-[var(--color-text-muted)]">
            Controls will appear here when a video is loaded.
          </p>
        </div>
      }
    />
  )
}

export default App
