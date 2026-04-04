import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner } from './Ui'
import { fmt } from '../../utils/time'
import api from '../../lib/api'

export default function RightPanel() {
  const navigate  = useNavigate()
  const [leaders, setLeaders] = useState([])
  const [rooms,   setRooms]   = useState([])
  const [timer,   setTimer]   = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [lb, ar] = await Promise.all([
          api.get('/users/leaderboard?limit=5'),
          api.get('/arena/rooms'),
        ])
        setLeaders(lb.data.data || [])
        const rs = ar.data.data?.rooms || []
        setRooms(rs)
        const live = rs.find(r=>r.status==='live')
        if (live?.challenge?.timeLimit) setTimer(live.challenge.timeLimit)
      } catch(_){}
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (timer<=0) return
    const id = setInterval(()=>setTimer(t=>t>0?t-1:0),1000)
    return () => clearInterval(id)
  }, [timer])

  const liveRoom = rooms.find(r=>r.status==='live') || rooms[0]

  return (
    <div className="p-4 flex flex-col gap-5">
      {/* Arena widget */}
      {liveRoom && (
        <div className="rounded-xl p-4" style={{ background:'linear-gradient(135deg,rgba(124,92,252,.1),rgba(0,229,255,.06))', border:'1px solid rgba(124,92,252,.25)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-black" style={{ color:'var(--accent3)' }}>⚔️ Live Challenge</span>
            <span className="w-2 h-2 rounded-full a-pulse" style={{ background:'var(--green)' }}/>
          </div>
          <div className="rounded-lg p-3 mb-3" style={{ background:'var(--bg3)', border:'1px solid var(--border)' }}>
            <p className="text-xs font-bold leading-snug">{liveRoom.challenge?.title || 'Arena challenge'}</p>
          </div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-black" style={{ fontFamily:'Space Mono', fontSize:28, color:timer<30?'var(--red)':'var(--accent)' }}>{fmt(timer)}</div>
              <div className="text-xs" style={{ color:'var(--muted)' }}>remaining</div>
            </div>
            <button onClick={()=>navigate('/arena')}
              className="px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90"
              style={{ background:'rgba(124,92,252,.15)', border:'1px solid rgba(124,92,252,.4)', color:'var(--accent)' }}>
              Join →
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {liveRoom.players?.slice(0,3).map((p,i) => (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background:'var(--bg3)', border:'1px solid var(--border)' }}>
                <span className="w-1.5 h-1.5 rounded-full a-pulse" style={{ background:'var(--green)' }}/>{p.initials}
              </div>
            ))}
            {(liveRoom.players?.length||0)>3 && <span className="text-xs" style={{ color:'var(--muted)' }}>+{liveRoom.players.length-3} more</span>}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div>
        <div className="text-xs font-black uppercase tracking-widest pb-2.5 mb-1" style={{ color:'var(--muted)', borderBottom:'1px solid var(--border)' }}>🏆 Top Solvers</div>
        {loading ? <div className="flex justify-center py-4"><Spinner/></div> :
        leaders.map(u => (
          <div key={u._id||u.id} className="flex items-center gap-3 py-2.5" style={{ borderBottom:'1px solid rgba(42,43,61,.35)' }}>
            <span className="text-sm font-black w-6 text-center" style={{ fontFamily:'Space Mono', color:u.rank===1?'var(--gold)':u.rank===2?'#b0bec5':u.rank===3?'#cd7f32':'var(--muted)' }}>
              {u.rank===1?'👑':u.rank===2?'🥈':u.rank===3?'🥉':`#${u.rank}`}
            </span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black" style={{ background:u.color||'linear-gradient(135deg,#7c5cfc,#e040fb)', color:'#fff' }}>{u.initials}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate">{u.name}</div>
              <div className="text-xs" style={{ color:'var(--muted)' }}>{u.totalSolved} solved</div>
            </div>
            <div className="text-xs font-black" style={{ color:'var(--gold)', fontFamily:'Space Mono' }}>{u.xp?.toLocaleString()}</div>
          </div>
        ))}
        <button onClick={()=>navigate('/rankings')} className="w-full mt-2 py-2 rounded-lg text-xs font-bold" style={{ background:'var(--bg3)', color:'var(--muted)', border:'1px solid var(--border)' }}>
          Full Rankings →
        </button>
      </div>

      {/* Active categories */}
      <div>
        <div className="text-xs font-black uppercase tracking-widest pb-2.5 mb-2" style={{ color:'var(--muted)', borderBottom:'1px solid var(--border)' }}>🔥 Categories</div>
        {[{icon:'💻',label:'Tech',count:14},{icon:'📚',label:'Study',count:9},{icon:'🌱',label:'Life',count:22},{icon:'💼',label:'Career',count:7}].map(({ icon,label,count })=>(
          <div key={label} className="flex items-center justify-between py-2" style={{ borderBottom:'1px solid rgba(42,43,61,.3)' }}>
            <span className="text-xs font-bold">{icon} {label}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background:'var(--bg3)', color:'var(--muted)', fontFamily:'Space Mono' }}>{count} active</span>
          </div>
        ))}
      </div>
    </div>
  )
}
