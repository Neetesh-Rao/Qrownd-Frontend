import { createContext, useContext, useEffect, useState } from 'react'
import { getSocket } from '../lib/socket'
import { useAuth } from './AuthContext'
import T from '../utils/toast'

const Ctx = createContext(null)

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState([])

  useEffect(() => {
    if (!user) return
    const s = getSocket()

    s.on('presence:list',    ({ onlineIds }) => setOnlineUsers(onlineIds))
    s.on('presence:online',  ({ userId })    => setOnlineUsers(p => [...new Set([...p, userId])]))
    s.on('presence:offline', ({ userId })    => setOnlineUsers(p => p.filter(id => id !== userId)))

    const onOnline  = () => T.success('Back online 🟢', { duration:2000 })
    const onOffline = () => T.info('You are offline — Firebase notifications active', '📵', { duration:3500 })
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      s.off('presence:list'); s.off('presence:online'); s.off('presence:offline')
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [user])

  return <Ctx.Provider value={{ onlineUsers }}>{children}</Ctx.Provider>
}

export const useSocket = () => useContext(Ctx)
