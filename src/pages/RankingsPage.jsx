import { useState, useEffect } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { Spinner, EmptyState } from '../components/ui/Ui'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

export default function RankingsPage() {
  const { user }  = useAuth()
  const [leaders, setLeaders] = useState([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const load = async (p=1, reset=true) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/users/leaderboard?page=${p}&limit=20`)
      setLeaders(prev => reset ? (data.data||[]) : [...prev, ...(data.data||[])])
      setTotal(data.pagination?.total||0)
      setHasMore(data.pagination?.hasMore||false)
      setPage(p+1)
    } catch(_){}
    setLoading(false)
  }

  useEffect(()=>{ load(1,true) },[])

  const myEntry = leaders.find(u => u.handle===user?.handle)

  return (
    <AppLayout>
      <div className="p-4 md:p-5 max-w-2xl mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-black mb-1">🏆 Rankings</h1>
          <p className="text-sm" style={{ color:'var(--muted)' }}>{total} solvers ranked by XP</p>
        </div>

        {user && myEntry && (
          <div className="rounded-xl p-4 mb-5 flex items-center gap-4"
            style={{ background:'linear-gradient(135deg,rgba(124,92,252,.12),rgba(0,229,255,.06))', border:'1px solid rgba(124,92,252,.3)' }}>
            <div className="text-3xl font-black" style={{ fontFamily:'Space Mono', color:'var(--accent)' }}>#{myEntry.rank}</div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-black"
              style={{ background:myEntry.color||'linear-gradient(135deg,#7c5cfc,#e040fb)', color:'#fff' }}>{myEntry.initials}</div>
            <div className="flex-1">
              <div className="font-black">Your Ranking</div>
              <div className="text-sm" style={{ color:'var(--muted)' }}>{myEntry.xp?.toLocaleString()} XP · {myEntry.totalSolved} solved</div>
            </div>
          </div>
        )}

        <div className="rounded-xl overflow-hidden" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
          <div className="grid px-4 py-3 text-xs font-black uppercase tracking-wider"
            style={{ gridTemplateColumns:'44px 1fr 60px 80px', background:'var(--bg3)', color:'var(--muted)' }}>
            <div>#</div><div>Solver</div><div className="text-center">Solved</div><div className="text-right">XP</div>
          </div>
          {loading && leaders.length===0 ? <div className="flex justify-center py-8"><Spinner/></div> :
           leaders.length===0 ? <EmptyState icon="🏆" title="No rankings yet"/> :
           leaders.map(e => (
             <div key={e._id||e.id} className="grid px-4 py-3.5 items-center"
               style={{ gridTemplateColumns:'44px 1fr 60px 80px', borderBottom:'1px solid rgba(42,43,61,.4)', background:e.handle===user?.handle?'rgba(124,92,252,.05)':'transparent' }}>
               <div className="text-sm font-black" style={{ fontFamily:'Space Mono', color:e.rank===1?'var(--gold)':e.rank===2?'#b0bec5':e.rank===3?'#cd7f32':e.handle===user?.handle?'var(--accent)':'var(--muted)' }}>
                 {e.rank===1?'👑':e.rank===2?'🥈':e.rank===3?'🥉':`#${e.rank}`}
               </div>
               <div className="flex items-center gap-3 min-w-0">
                 <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                   style={{ background:e.color||'linear-gradient(135deg,#7c5cfc,#e040fb)', color:'#fff' }}>{e.initials}</div>
                 <div className="min-w-0">
                   <div className="text-sm font-bold truncate flex items-center gap-2">
                     {e.name}
                     {e.handle===user?.handle&&<span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background:'rgba(124,92,252,.2)',color:'var(--accent)',fontFamily:'Space Mono',fontSize:8 }}>YOU</span>}
                   </div>
                   <div className="text-xs truncate" style={{ color:'var(--muted)' }}>{e.handle}</div>
                 </div>
               </div>
               <div className="text-center text-sm font-bold" style={{ color:'var(--muted)', fontFamily:'Space Mono' }}>{e.totalSolved}</div>
               <div className="text-right text-sm font-black" style={{ color:'var(--gold)', fontFamily:'Space Mono' }}>{e.xp?.toLocaleString()}</div>
             </div>
           ))}
        </div>
        {hasMore && <button onClick={()=>load(page,false)} disabled={loading} className="w-full mt-3 py-2.5 rounded-xl text-sm font-bold" style={{ background:'var(--bg2)',border:'1px solid var(--border)',color:'var(--muted)' }}>
          {loading?<Spinner size={16} className="mx-auto"/>:'Load more'}
        </button>}
      </div>
    </AppLayout>
  )
}
