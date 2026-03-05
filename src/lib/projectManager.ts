/**
 * Project state persistence via IndexedDB and JSON file export/import.
 */

const DB_NAME = 'swarmsight-web'
const DB_VERSION = 1
const STORE_NAME = 'projects'

export interface ProjectState {
  id: string
  name: string
  savedAt: string
  module: 'appendage_tracker' | 'motion_analyzer'
  sensor: Record<string, unknown>
  filters: Record<string, unknown>
  background: Record<string, unknown>
  exclusionZones: unknown[]
  treatmentSensor: Record<string, unknown>
  motionSettings: Record<string, unknown>
  motionData: unknown[]
  corrections: Record<string, unknown>
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveProject(state: ProjectState): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(state)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadProject(id: string): Promise<ProjectState | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(id)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function listProjects(): Promise<ProjectState[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export function exportProjectToFile(state: ProjectState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${state.name}_project.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importProjectFromFile(file: File): Promise<ProjectState> {
  const text = await file.text()
  return JSON.parse(text) as ProjectState
}
