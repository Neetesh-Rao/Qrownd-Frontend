import { io } from 'socket.io-client'
const URL = import.meta.env.VITE_SOCKET_URL || 'https://qrownd-backend.onrender.com'
let socket = null
export const getSocket = () => {
  if (!socket) socket = io(URL, { autoConnect:false, reconnection:true, reconnectionAttempts:10, reconnectionDelay:1500 })
  return socket
}
export const connectSocket = (token) => {
  const s = getSocket(); s.auth = { token }
  if (!s.connected) s.connect()
  return s
}
export const disconnectSocket = () => { if (socket?.connected) socket.disconnect() }
export default getSocket
