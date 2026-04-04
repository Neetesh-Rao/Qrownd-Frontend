import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Moon, Sun, Gamepad2, LogOut, User, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Avatar, Spinner } from '../ui/Ui'
import T from '../../utils/toast'
import api from '../../lib/api'

const NAV = [
  { to:'/feed',     label:'⚡ Feed'     },
  { to:'/arena',    label:'⚔️ Arena'    },
  { to:'/rankings', label:'🏆 Rankings' },
  { to:'/chat',     label:'💬 Chat'     },
  { to:'/profile',  label:'👤 Profile'  },
]

export default function Navbar() {
  const { user, logout }         = useAuth()
  const { theme, setTheme, themes } = useTheme()
  const loc      = useLocation()
  const navigate = useNavigate()
  const [drop, setDrop]     = useState(null)
  const [notifs, setNotifs] = useState([])
  const [unread, setUnread] = useState(0)
  const [loadN,  setLoadN]  = useState(false)

  const close  = () => setDrop(null)
  const toggle = key => { if (key==='notif' && drop!=='notif') loadNotifs(); setDrop(d=>d===key?null:key) }

  const loadNotifs = async () => {
    setLoadN(true)
    try {
      const { data } = await api.get('/notifications')
      setNotifs(data.notifications || [])
      setUnread(data.data?.unread || 0)
    } catch(_){}
    setLoadN(false)
  }

  const markAllRead = async () => {
    await api.put('/notifications/read-all').catch(()=>{})
    setNotifs(n => n.map(x=>({...x,read:true})))
    setUnread(0)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    T.info('Logged out. See you soon 👋', '🚪', { duration:2500 })
  }

  const TI = { dark:<Moon size={14}/>, light:<Sun size={14}/>, game:<Gamepad2 size={14}/> }
  const NOTIF_ICONS = { answer:'💬', upvote:'▲', accept:'✅', game_win:'🏆', message:'📩', game_start:'⚔️', rank_up:'📈', new_post:'✨', system:'🔔' }

  return (
    <>
      <nav className="top-nav px-3 md:px-5" style={{ justifyContent:'space-between' }}>
        {/* Logo */}
        <Link to="/feed" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xl">👑</span>
          <span className="text-xl font-black tracking-tight g-text hidden xs:block">Qrownd</span>
        </Link>

        {/* Desktop tabs */}
        <div className="hidden md:flex items-center gap-1 rounded-xl p-1" style={{ background:'var(--bg3)' }}>
          {NAV.map(({ to, label }) => (
            <Link key={to} to={to}
              className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background:loc.pathname===to?'var(--accent)':'transparent', color:loc.pathname===to?'#fff':'var(--muted)' }}>
              {label}
            </Link>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black"
              style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--gold)', fontFamily:'Space Mono' }}>
              ⚡ {user.xp?.toLocaleString?.() || 0}
            </div>
          )}

          {/* Theme */}
          <div className="relative">
            <button onClick={()=>toggle('theme')}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
              style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--muted)' }}>
              {TI[theme]}
            </button>
            {drop==='theme' && (
              <div className="absolute right-0 top-11 w-44 rounded-xl overflow-hidden shadow-2xl z-50 a-up" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
                {themes.map(t => (
                  <button key={t.id} onClick={()=>{setTheme(t.id);close()}}
                    className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                    style={{ background:theme===t.id?'rgba(124,92,252,.1)':'transparent', color:theme===t.id?'var(--accent)':'var(--text)', borderLeft:`3px solid ${theme===t.id?'var(--accent)':'transparent'}` }}>
                    <span>{t.icon}</span>
                    <div><div className="text-xs font-bold">{t.label}</div><div className="text-xs" style={{ color:'var(--muted)' }}>{t.desc}</div></div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          {user && (
            <div className="relative">
              <button onClick={()=>toggle('notif')}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl"
                style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--muted)' }}>
                <Bell size={15}/>
                {unread>0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full border-2" style={{ background:'var(--accent2)', borderColor:'var(--bg2)' }}/>}
              </button>
              {drop==='notif' && (
                <div className="absolute right-0 top-11 w-80 rounded-xl shadow-2xl z-50 a-up overflow-hidden" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom:'1px solid var(--border)' }}>
                    <span className="text-sm font-black">Notifications</span>
                    <button onClick={markAllRead} className="text-xs font-bold" style={{ color:'var(--accent)' }}>Mark all read</button>
                  </div>
                  <div style={{ maxHeight:360, overflowY:'auto' }}>
                    {loadN ? <div className="flex justify-center py-6"><Spinner/></div> :
                    notifs.length===0 ? <p className="text-center text-xs py-6" style={{ color:'var(--muted)' }}>No notifications yet 🔔</p> :
                    notifs.slice(0,10).map(n => (
                      <div key={n._id}
                        className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
                        style={{ borderBottom:'1px solid rgba(42,43,61,.3)', background:n.read?'transparent':'rgba(124,92,252,.04)' }}
                        onClick={()=>{ if(n.link){navigate(n.link);close()} }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background:'var(--bg3)' }}>
                          {NOTIF_ICONS[n.type]||'🔔'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs leading-relaxed">{n.message}</div>
                          <div className="text-xs mt-0.5" style={{ color:'var(--muted)', fontFamily:'Space Mono' }}>
                            {new Date(n.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                          </div>
                        </div>
                        {!n.read && <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background:'var(--accent2)' }}/>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User menu */}
          {user ? (
            <div className="relative">
              <button onClick={()=>toggle('user')}
                className="flex items-center gap-1.5 p-1 rounded-xl"
                style={{ background:'var(--bg3)', border:'1px solid var(--border)' }}>
                <Avatar initials={user.initials} color={user.color} src={user.avatar} size="sm"/>
                <ChevronDown size={11} style={{ color:'var(--muted)', marginRight:4 }}/>
              </button>
              {drop==='user' && (
                <div className="absolute right-0 top-11 w-48 rounded-xl shadow-2xl z-50 a-up overflow-hidden" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
                  <div className="px-4 py-3" style={{ borderBottom:'1px solid var(--border)' }}>
                    <div className="text-sm font-bold">{user.name}</div>
                    <div className="text-xs" style={{ color:'var(--muted)' }}>{user.handle}</div>
                  </div>
                  <Link to="/profile" onClick={close} className="flex items-center gap-3 px-4 py-3 text-sm w-full transition-colors" style={{ color:'var(--text)' }}>
                    <User size={13}/> Profile
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-sm w-full" style={{ color:'var(--red)' }}>
                    <LogOut size={13}/> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ color:'var(--muted)' }}>Login</Link>
              <Link to="/signup" className="text-xs font-bold px-3 py-1.5 rounded-xl text-white" style={{ background:'linear-gradient(135deg,var(--accent),var(--accent2))' }}>Sign Up</Link>
            </div>
          )}
        </div>
      </nav>
      {drop && <div className="fixed inset-0 z-30" onClick={close}/>}
    </>
  )
}
