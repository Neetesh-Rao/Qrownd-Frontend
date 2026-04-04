import { useEffect } from 'react'
import { getSocket } from '../lib/socket'
import { messaging, getToken, onMessage } from '../lib/firebase'
import T from '../utils/toast'
import api from '../lib/api'

const VAPID = import.meta.env.VITE_FIREBASE_VAPID_KEY || ''

const ICONS = {
  answer:'💬', upvote:'▲', accept:'✅', game_win:'🏆',
  message:'📩', game_start:'⚔️', rank_up:'📈', new_post:'✨', system:'🔔',
}

export function useNotifications(user) {
  // Firebase offline push setup
  useEffect(() => {
    if (!user || !messaging || !VAPID) return
    const setup = async () => {
      try {
        const perm = await Notification.requestPermission()
        if (perm !== 'granted') return
        const token = await getToken(messaging, { vapidKey: VAPID })
        console.log('FCM token:', token)
        if (token) api.post('/auth/fcm-token', { fcmToken: token }).catch(()=>{})
        return onMessage(messaging, payload => {
          T.notify(payload.notification?.body || 'New notification', '🔔')
        })
      } catch(e) { console.warn('[fcm]', e) }
    }
    setup()
  }, [user])

  // Socket in-app notifications
  useEffect(() => {
    if (!user) return
    const s = getSocket()

    s.on('notification', ({ type, message, link }) => {
      const icon = ICONS[type] || '🔔'
      // Different styling per type
      if (type === 'accept')   T.xp('', message)
      else if (type === 'rank_up') T.notify(message, '📈')
      else if (type === 'game_win') T.notify(message, '🏆', { duration:6000, style:{ border:'1px solid var(--gold)', color:'var(--gold)' } })
      else T.notify(message, icon)
    })

    return () => s.off('notification')
  }, [user])
}
