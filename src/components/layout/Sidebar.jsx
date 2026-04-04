import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { CATEGORIES } from '../../utils/categories'

const MAIN = [
  { icon:'⚡', label:'Live Feed',    path:'/feed'               },
  { icon:'🔥', label:'Trending',     path:'/feed?filter=hot'    },
  { icon:'✨', label:'Latest',       path:'/feed'               },
  { icon:'✅', label:'Solved',       path:'/feed?filter=solved' },
]
const MY = [
  { icon:'📌', label:'My Posts',    path:'/profile?tab=posts'   },
  { icon:'💬', label:'My Answers',  path:'/profile?tab=answers' },
  { icon:'🔖', label:'Bookmarks',   path:'/profile?tab=saved'   },
]

function SI({ icon, label, path }) {
  const loc    = useLocation()
  const full   = loc.pathname + loc.search
  const active = full === path || (path === '/feed' && loc.pathname === '/feed' && !loc.search)
  return (
    <Link to={path}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold w-full transition-all"
      style={{ background:active?'rgba(124,92,252,.12)':'transparent', color:active?'var(--accent)':'var(--muted)', borderLeft:`2px solid ${active?'var(--accent)':'transparent'}` }}>
      <span className="text-sm w-5 text-center flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
    </Link>
  )
}

export default function Sidebar() {
  const { user } = useAuth()
  const xp  = user?.xp || 0
  const nxt = (user?.level || 1) * 500
  const pct = Math.min(100, Math.round((xp % 500) / 500 * 100))

  return (
    <aside className="sidebar flex flex-col">
      <div className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
        <div className="text-xs font-black px-3 pt-3 pb-1.5 uppercase tracking-widest" style={{ color:'var(--muted)' }}>Explore</div>
        {MAIN.map(i => <SI key={i.label} {...i}/>)}

        <div className="text-xs font-black px-3 pt-4 pb-1.5 uppercase tracking-widest" style={{ color:'var(--muted)' }}>Categories</div>
        {CATEGORIES.map(c => (
          <Link key={c.id} to={`/feed?cat=${c.id}`}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all"
            style={{ color:'var(--muted)' }}
            onMouseOver={e=>{e.currentTarget.style.color=c.text;e.currentTarget.style.background=c.color}}
            onMouseOut={e=>{e.currentTarget.style.color='var(--muted)';e.currentTarget.style.background='transparent'}}>
            <span className="text-sm">{c.icon}</span>{c.label}
          </Link>
        ))}

        {user && (
          <>
            <div className="text-xs font-black px-3 pt-4 pb-1.5 uppercase tracking-widest" style={{ color:'var(--muted)' }}>My Space</div>
            {MY.map(i => <SI key={i.label} {...i}/>)}
          </>
        )}
      </div>

      {user && (
        <div className="p-3" style={{ borderTop:'1px solid var(--border)' }}>
          <div className="rounded-xl p-3" style={{ background:'var(--bg3)', border:'1px solid var(--border)' }}>
            <div className="flex justify-between mb-1.5 text-xs">
              <span style={{ color:'var(--muted)' }}>Rank</span>
              <span style={{ color:'var(--gold)', fontFamily:'Space Mono', fontWeight:700 }}>#{user.rank || '—'}</span>
            </div>
            <div className="flex justify-between mb-1.5 text-xs">
              <span style={{ color:'var(--muted)' }}>Streak</span>
              <span style={{ color:'var(--gold)', fontFamily:'Space Mono', fontWeight:700 }}>🔥 {user.streak || 0}d</span>
            </div>
            <div className="flex justify-between mb-2 text-xs">
              <span style={{ color:'var(--muted)' }}>Level {user.level || 1}</span>
              <span style={{ color:'var(--gold)', fontFamily:'Space Mono', fontWeight:700 }}>{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'var(--bg4)' }}>
              <div className="h-full xp-fill rounded-full" style={{ width:`${pct}%` }}/>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
