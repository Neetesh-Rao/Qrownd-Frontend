import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import PostCard  from '../components/ui/PostCard'
import { Spinner, EmptyState } from '../components/ui/Ui'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES } from '../utils/categories'
import api from '../lib/api'
import T from '../utils/toast'

const ACT = [1,0,1,2,0,1,1,0,2,1,0,1,0,0,1,2,0,1,1,0,2,1,0,0,1,1,0,1]

export default function ProfilePage() {
  const { user, setCurrentUser } = useAuth()
  const [tab,   setTab]   = useState('Overview')
  const [posts, setPosts] = useState([])
  const [loadP, setLoadP] = useState(false)

  if (!user) return <Navigate to="/login" replace/>

  const xp  = user.xp || 0
  const pct = Math.min(100, Math.round((xp % 500) / 500 * 100))

  useEffect(() => {
    if (tab !== 'Posts') return
    setLoadP(true)
    api.get(`/users/${user.handle}/posts`).then(({ data }) => setPosts(data.data||[])).catch(()=>{}).finally(()=>setLoadP(false))
  }, [tab])

  const handleAvatar = async e => {
    const file = e.target.files?.[0]; if (!file) return
    const fd   = new FormData(); fd.append('avatar', file)
    const tid  = T.loading('Uploading avatar...')
    try {
      const { data } = await api.post('/users/me/avatar', fd, { headers:{'Content-Type':'multipart/form-data'} })
      setCurrentUser(data.data.user)
      T.success('Avatar updated!')
    } catch (err) {
      T.error(err.response?.data?.message||'Upload failed')
    } finally { import('react-hot-toast').then(({default:toast})=>toast.dismiss(tid)) }
  }

  const TABS = ['Overview','Posts','Answers','Bookmarks','Stats']

  return (
    <AppLayout>
      <div className="p-4 md:p-5 max-w-2xl mx-auto">
        {/* Hero */}
        <div className="rounded-2xl p-6 mb-5 text-center"
          style={{ background:'linear-gradient(135deg,rgba(124,92,252,.12),rgba(0,229,255,.06))', border:'1px solid rgba(124,92,252,.2)' }}>
          <label className="cursor-pointer block w-20 h-20 mx-auto mb-4 relative group">
            {user.avatar
              ? <img src={user.avatar} alt="avatar" className="w-20 h-20 rounded-full object-cover border-4" style={{ borderColor:'var(--accent)' }}/>
              : <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black border-4" style={{ background:user.color||'linear-gradient(135deg,var(--accent),var(--accent2))', color:'#fff', borderColor:'var(--accent)' }}>{user.initials}</div>}
            <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background:'rgba(0,0,0,.5)', fontSize:20 }}>✏️</div>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatar}/>
          </label>

          <h1 className="text-2xl font-black mb-1">{user.name}</h1>
          <p className="text-sm mb-4" style={{ color:'var(--muted)' }}>{user.handle}</p>

          {user.badges?.length>0 && (
            <div className="flex justify-center flex-wrap gap-2 mb-5">
              {user.badges.map(b=><span key={b} className="px-3 py-1 rounded-full text-xs font-bold" style={{ background:'rgba(124,92,252,.15)', color:'var(--accent)', border:'1px solid rgba(124,92,252,.3)', fontFamily:'Space Mono' }}>{b}</span>)}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { v:xp.toLocaleString(), l:'Total XP',  c:'var(--gold)'    },
              { v:`#${user.rank||'—'}`, l:'Rank',     c:'var(--accent)'  },
              { v:`${user.streak||0}d`, l:'Streak 🔥',c:'var(--green)'   },
              { v:user.totalSolved||0,  l:'Solved',   c:'var(--accent3)' },
              { v:user.totalPosted||0,  l:'Posted',   c:'var(--accent2)' },
              { v:user.totalAnswers||0, l:'Answers',  c:'var(--accent)'  },
            ].map(s=>(
              <div key={s.l} className="rounded-xl p-3" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
                <div className="text-xl font-black" style={{ color:s.c, fontFamily:'Space Mono' }}>{s.v}</div>
                <div className="text-xs mt-0.5" style={{ color:'var(--muted)' }}>{s.l}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color:'var(--muted)' }}>Level {user.level||1}</span>
              <span style={{ color:'var(--muted)', fontFamily:'Space Mono' }}>{xp % 500} / 500 XP</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background:'var(--bg4)' }}>
              <div className="h-full xp-fill rounded-full" style={{ width:`${pct}%` }}/>
            </div>
          </div>
        </div>

        {/* Interests */}
        {(user.interests?.length>0||user.skills?.length>0) && (
          <div className="rounded-xl p-4 mb-5" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
            <h3 className="text-sm font-black mb-3">🎯 Interests</h3>
            <div className="flex flex-wrap gap-2">
              {(user.interests||[]).map(id=>{const cat=CATEGORIES.find(c=>c.id===id);return cat?<span key={id} className="cpill" style={{ background:cat.color,color:cat.text,border:`1px solid ${cat.text}33` }}>{cat.icon} {cat.label}</span>:null})}
              {(user.skills||[]).map(s=><span key={s} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background:'rgba(124,92,252,.1)',border:'1px solid rgba(124,92,252,.2)',color:'var(--accent)' }}>{s}</span>)}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0"
              style={{ background:tab===t?'var(--accent)':'var(--bg2)', color:tab===t?'#fff':'var(--muted)', border:`1px solid ${tab===t?'var(--accent)':'var(--border)'}` }}>
              {t}
            </button>
          ))}
        </div>

        {tab==='Overview' && (
          <div className="rounded-xl p-5" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
            <h3 className="text-sm font-black mb-3">📅 Activity (28 days)</h3>
            <div className="grid gap-1" style={{ gridTemplateColumns:'repeat(14,1fr)' }}>
              {ACT.map((a,i)=><div key={i} className="aspect-square rounded-sm" style={{ background:a===2?'var(--accent)':a===1?'rgba(124,92,252,.35)':'var(--bg3)' }}/>)}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs" style={{ color:'var(--muted)' }}>
              <span>Less</span>
              {['var(--bg3)','rgba(124,92,252,.2)','rgba(124,92,252,.5)','var(--accent)'].map((c,i)=><div key={i} className="w-3 h-3 rounded-sm" style={{ background:c }}/>)}
              <span>More</span>
            </div>
          </div>
        )}
        {tab==='Posts'     && (loadP?<div className="flex justify-center py-8"><Spinner/></div>:posts.length===0?<EmptyState icon="📝" title="No posts yet" sub="Post your first problem!"/>:posts.map(p=><PostCard key={p._id} post={p}/>))}
        {tab==='Answers'   && <EmptyState icon="💬" title="Your answers will appear here"/>}
        {tab==='Bookmarks' && <EmptyState icon="🔖" title="No bookmarks yet" sub="Save posts you want to revisit"/>}
        {tab==='Stats' && (
          <div className="grid grid-cols-2 gap-4">
            {[{l:'Arena Wins',v:user.arenaWins||0,i:'⚔️'},{l:'Total Solved',v:user.totalSolved||0,i:'✅'},{l:'Total Answers',v:user.totalAnswers||0,i:'💬'},{l:'Best Streak',v:`${user.streak||0}d`,i:'🔥'}].map(s=>(
              <div key={s.l} className="rounded-xl p-4 text-center" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
                <div className="text-2xl mb-2">{s.i}</div>
                <div className="text-2xl font-black" style={{ color:'var(--accent)', fontFamily:'Space Mono' }}>{s.v}</div>
                <div className="text-xs mt-1" style={{ color:'var(--muted)' }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
