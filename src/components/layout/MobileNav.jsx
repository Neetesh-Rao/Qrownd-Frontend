import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ITEMS = [
  { to:'/feed',     icon:'⚡', label:'Feed'    },
  { to:'/arena',    icon:'⚔️', label:'Arena'   },
  { to:'/rankings', icon:'🏆', label:'Ranks'   },
  { to:'/chat',     icon:'💬', label:'Chat'    },
  { to:'/profile',  icon:'👤', label:'Profile' },
]

export default function MobileNav() {
  const loc      = useLocation()
  const { user } = useAuth()
  if (['/login','/signup'].includes(loc.pathname)) return null

  return (
    <nav className="mob-nav">
      {ITEMS.map(({ to, icon, label }) => {
        const active = loc.pathname === to
        const dest   = (to==='/profile'||to==='/chat') && !user ? '/login' : to
        return (
          <Link key={to} to={dest}
            className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative transition-all"
            style={{ color:active?'var(--accent)':'var(--muted)' }}>
            <span style={{ fontSize:20, transform:active?'scale(1.2)':'scale(1)', transition:'transform .2s', filter:active?'drop-shadow(0 0 5px var(--accent))':'none' }}>
              {icon}
            </span>
            <span className="font-bold" style={{ fontSize:9, fontFamily:'Syne' }}>{label}</span>
            {active && <span className="absolute bottom-0 h-0.5 w-8 rounded-full" style={{ background:'var(--accent)' }}/>}
          </Link>
        )
      })}
    </nav>
  )
}
