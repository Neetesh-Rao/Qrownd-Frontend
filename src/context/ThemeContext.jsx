import { createContext, useContext, useState, useEffect } from 'react'
const Ctx = createContext(null)
export const THEMES = [
  { id:'dark',  label:'Dark',  icon:'🌙', desc:'Easy on eyes'   },
  { id:'light', label:'Light', icon:'☀️', desc:'Clean & bright' },
  { id:'game',  label:'Game',  icon:'🎮', desc:'Neon vibes'     },
]
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('qrownd_theme') || 'dark')
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('qrownd_theme', theme) }, [theme])
  return <Ctx.Provider value={{ theme, setTheme, themes:THEMES }}>{children}</Ctx.Provider>
}
export const useTheme = () => useContext(Ctx)
