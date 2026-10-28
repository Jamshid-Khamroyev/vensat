import { create } from 'zustand'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'vensat_theme'

const readInitialTheme = (): Theme => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {}
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#121312' : '#F3F5EA')
}

type ThemeStore = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeStore>()((set, get) => {
  const initial = readInitialTheme()
  applyTheme(initial)

  const setTheme = (theme: Theme) => {
    applyTheme(theme)
    try { localStorage.setItem(STORAGE_KEY, theme) } catch {}
    set({ theme })
  }

  return {
    theme: initial,
    setTheme,
    toggleTheme: () => setTheme(get().theme === 'dark' ? 'light' : 'dark'),
  }
})
