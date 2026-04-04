import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'
import { connectSocket, disconnectSocket } from '../lib/socket'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('qrownd_user')
    const token = localStorage.getItem('qrownd_access')
    if (saved && token) { setUser(JSON.parse(saved)); connectSocket(token) }
    setLoading(false)
  }, [])

  const _persist = (u, token) => {
    setUser(u)
    localStorage.setItem('qrownd_user',   JSON.stringify(u))
    localStorage.setItem('qrownd_access', token)
    connectSocket(token)
  }

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    _persist(data.data.user, data.data.accessToken)
    return data.data.user
  }

  const login = async (email, password, fcmToken) => {
    const { data } = await api.post('/auth/login', { email, password, fcmToken })
    _persist(data.data.user, data.data.accessToken)
    return data.data.user
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch(_){}
    setUser(null)
    localStorage.removeItem('qrownd_user')
    localStorage.removeItem('qrownd_access')
    disconnectSocket()
  }

  const setCurrentUser = u => { setUser(u); localStorage.setItem('qrownd_user', JSON.stringify(u)) }

  return <Ctx.Provider value={{ user, loading, login, register, logout, setCurrentUser }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
