// src/pages/ArenaPage.jsx
import { useState, useEffect, useRef } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { Badge, Spinner, EmptyState } from '../components/ui/Ui'
import { useAuth } from '../context/AuthContext'
import { getSocket } from '../lib/socket'
import { getCat, CATEGORIES } from '../utils/categories'
import { fmt } from '../utils/time'
import api from '../lib/api'
import T from '../utils/toast'

const DCOL = { easy:'var(--green)', medium:'var(--gold)', hard:'var(--red)' }

export default function ArenaPage() {
  const { user }          = useAuth()
  const [view, setView]   = useState('lobby')
  const [rooms, setRooms] = useState([])
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeRoom, setActiveRoom] = useState(null)
  const [players, setPlayers]   = useState([])
  const [status,  setStatus]    = useState('waiting')
  const [timer,   setTimer]     = useState(0)
  const [countdown, setCountdown] = useState(3)
  const [answer,  setAnswer]    = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [winner,  setWinner]    = useState(null)
  const [createModal, setCreateModal] = useState(false)
  const [selCh, setSelCh]       = useState('')
  const timerRef = useRef(null)
  const socket   = getSocket()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [r,c] = await Promise.all([api.get('/arena/rooms'), api.get('/arena/challenges')])
        setRooms(r.data.data?.rooms||[])
        const ch = c.data.data||[]
        setChallenges(ch)
        if (ch.length) setSelCh(ch[0]._id)
      } catch(_){}
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    socket.on('arena:roomCreated', ({ room }) => setRooms(prev=>[room,...prev]))
    socket.on('room:playerJoined', ({ user:u }) => setPlayers(prev=>[...prev,{...u,status:'waiting'}]))
    socket.on('room:playerLeft',   ({ userId }) => setPlayers(prev=>prev.filter(p=>(p.user||p._id)!==userId)))
    socket.on('room:starting',     ({ challenge, players:ps }) => { setActiveRoom(r=>r?{...r,challenge}:r); setPlayers(ps) })
    socket.on('room:countdown',    ({ remaining }) => { setStatus('countdown'); setCountdown(remaining) })
    socket.on('room:live',         ({ startedAt }) => {
      setStatus('live')
      const tl = activeRoom?.challenge?.timeLimit || 300
      setTimer(tl)
      timerRef.current = setInterval(()=>setTimer(t=>{if(t<=1){clearInterval(timerRef.current);setStatus('finished');return 0}return t-1}),1000)
    })
    socket.on('room:tick',       ({ remaining }) => setTimer(remaining))
    socket.on('room:playerDone', ({ userId, name }) => setPlayers(prev=>prev.map(p=>(p.user||p._id)===userId?{...p,status:'done'}:p)))
    socket.on('room:winner',     ({ winner:w, xpAwarded }) => {
      clearInterval(timerRef.current); setWinner(w); setStatus('finished')
      const me = user?.id||user?._id
      if ((w.id||w._id)===me) T.xp(xpAwarded,'You won the arena! 🏆')
    })
    socket.on('room:expired',    () => { clearInterval(timerRef.current); setStatus('finished') })
    socket.on('arena:error',     ({ message }) => T.error(message))
    return () => {
      ['arena:roomCreated','room:playerJoined','room:playerLeft','room:starting','room:countdown','room:live','room:tick','room:playerDone','room:winner','room:expired','arena:error']
        .forEach(e=>socket.off(e))
    }
  }, [user, activeRoom])

  useEffect(()=>()=>clearInterval(timerRef.current),[])

  const joinRoom = async roomId => {
    if (!user) { T.error('Login to join arena'); return }
    try {
      const { data } = await api.post(`/arena/rooms/${roomId}/join`)
      const room = data.data.room
      setActiveRoom(room); setPlayers(room.players||[])
      setStatus('waiting'); setSubmitted(false); setWinner(null); setAnswer('')
      socket.emit('arena:joinRoom', { roomId })
      setView('game')
      T.info('Joined! Waiting to start...','🎮')
    } catch(err) { T.error(err.response?.data?.message||'Could not join') }
  }

  const createRoom = async () => {
    if (!user) { T.error('Login to create a room'); return }
    if (!selCh) { T.error('Select a challenge'); return }
    try {
      const { data } = await api.post('/arena/rooms',{ challengeId:selCh, maxPlayers:8 })
      setCreateModal(false)
      await joinRoom(data.data.room._id)
    } catch(err) { T.error(err.response?.data?.message||'Could not create room') }
  }

  const startMatch = () => {
    if (!activeRoom) return
    socket.emit('arena:start', { roomId:activeRoom._id })
  }

  const handleSubmit = () => {
    if (!answer.trim()) { T.error('Write your answer first!'); return }
    if (!activeRoom) return
    socket.emit('arena:submit', { roomId:activeRoom._id, answer })
    setSubmitted(true)
    T.info('Answer submitted! Checking...','⚡')
  }

  const leaveRoom = () => {
    if (activeRoom) { socket.emit('arena:leaveRoom',{ roomId:activeRoom._id }); clearInterval(timerRef.current) }
    setView('lobby'); setActiveRoom(null); setStatus('waiting')
  }

  const ch    = activeRoom?.challenge
  const cat   = ch?.category ? getCat(ch.category) : null
  const myId  = user?.id||user?._id
  const isHost= activeRoom && (activeRoom.host?.toString()===myId?.toString())

  return (
    <AppLayout>
      {view==='lobby' ? (
        <div className="p-4 md:p-5 max-w-3xl mx-auto">
          <div className="mb-5">
            <h1 className="text-2xl font-black g-text mb-1">⚔️ Arena</h1>
            <p className="text-sm" style={{ color:'var(--muted)' }}>Race the crowd. Answer fastest. Win XP.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[['🟢',`${rooms.filter(r=>r.status==='live').length} live`],['⚔️',`${rooms.length} rooms`],['🏆','Beat the crowd']].map(([icon,v])=>(
              <div key={v} className="rounded-xl p-3 text-center" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xs font-bold" style={{ color:'var(--muted)' }}>{v}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black">🏟️ Open Rooms</h2>
            <button onClick={()=>setCreateModal(true)}
              className="px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90"
              style={{ background:'linear-gradient(135deg,var(--accent),var(--accent2))', color:'#fff' }}>
              + Create Room
            </button>
          </div>
          {loading ? <div className="flex justify-center py-12"><Spinner size={32}/></div> :
           rooms.length===0 ? <EmptyState icon="🏟️" title="No open rooms" sub="Create one to get started!"/> :
           <div className="grid gap-4 md:grid-cols-2">
             {rooms.map(room=>{
               const rc = room.challenge?.category ? getCat(room.challenge.category) : null
               const ap = room.players?.filter(p=>p.status!=='left').length||0
               return (
                 <div key={room._id} className="card p-5">
                   <div className="flex items-center justify-between mb-3">
                     <h3 className="font-black text-sm">{room.name}</h3>
                     <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                       style={{ background:room.status==='live'?'rgba(0,230,118,.15)':room.status==='countdown'?'rgba(255,215,64,.15)':'rgba(124,92,252,.15)', color:room.status==='live'?'var(--green)':room.status==='countdown'?'var(--gold)':'var(--accent)' }}>
                       {room.status==='live'?'● LIVE':room.status==='countdown'?'⏳ STARTING':'⏸ WAITING'}
                     </span>
                   </div>
                   <div className="rounded-lg p-3 mb-3" style={{ background:'var(--bg3)', border:'1px solid var(--border)' }}>
                     {rc&&<span className="cpill mb-1 inline-block" style={{ background:rc.color,color:rc.text,border:`1px solid ${rc.text}33` }}>{rc.icon}</span>}
                     <div className="text-xs font-bold mt-1">{room.challenge?.title||'Challenge'}</div>
                     <div className="text-xs mt-0.5" style={{ color:DCOL[room.challenge?.difficulty]||'var(--muted)' }}>● {room.challenge?.difficulty?.toUpperCase()||'?'} · +{room.challenge?.xp||0} XP</div>
                   </div>
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-xs" style={{ color:'var(--muted)' }}>
                       <span>👥 {ap}/{room.maxPlayers||8}</span>
                       <div className="flex gap-0.5">{Array.from({length:room.maxPlayers||8}).map((_,k)=><div key={k} className="w-2 h-2 rounded-full" style={{ background:k<ap?'var(--accent)':'var(--bg4)' }}/>)}</div>
                     </div>
                     <button onClick={()=>joinRoom(room._id)} disabled={ap>=(room.maxPlayers||8)}
                       className="px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-40"
                       style={{ background:'linear-gradient(135deg,var(--accent),var(--accent2))', color:'#fff' }}>
                       {ap>=(room.maxPlayers||8)?'Full':'Join →'}
                     </button>
                   </div>
                 </div>
               )
             })}
           </div>}
          {createModal && (
            <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setCreateModal(false)}>
              <div className="w-full max-w-md rounded-2xl p-6 a-pop" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
                <h2 className="font-black text-base mb-4">⚔️ Create Room</h2>
                <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color:'var(--muted)' }}>Select Challenge</label>
                <select className="q-in mb-4" value={selCh} onChange={e=>setSelCh(e.target.value)}>
                  {challenges.length===0 ? <option>No challenges — ask admin to add some</option> :
                   challenges.map(c=><option key={c._id} value={c._id}>[{c.difficulty?.toUpperCase()}] {c.title}</option>)}
                </select>
                <div className="flex gap-3">
                  <button onClick={()=>setCreateModal(false)} className="flex-1 py-2.5 rounded-xl font-bold text-sm" style={{ background:'var(--bg3)',color:'var(--muted)',border:'1px solid var(--border)',fontFamily:'Syne' }}>Cancel</button>
                  <button onClick={createRoom} disabled={!selCh||challenges.length===0}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90 disabled:opacity-50"
                    style={{ background:'linear-gradient(135deg,var(--accent),var(--accent2))',fontFamily:'Syne' }}>
                    Create Room
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 md:p-5 max-w-3xl mx-auto">
          <button onClick={leaveRoom} className="flex items-center gap-2 text-sm font-bold mb-4 hover:opacity-80" style={{ color:'var(--muted)' }}>← Leave Room</button>
          <div className="rounded-xl p-5 mb-4 text-center" style={{ background:'linear-gradient(135deg,rgba(124,92,252,.08),rgba(0,229,255,.04))', border:'1px solid rgba(124,92,252,.25)' }}>
            <div className="text-xl font-black g-text mb-1">⚔️ {activeRoom?.name}</div>
            <div className="text-sm" style={{ color:'var(--muted)' }}>
              {status==='waiting'&&'⏳ Waiting to start...'}
              {status==='countdown'&&<span className="font-black" style={{ color:'var(--accent3)' }}>🚀 Starting in {countdown}...</span>}
              {status==='live'&&<span style={{ color:'var(--green)' }}>● LIVE</span>}
              {status==='finished'&&(winner?'🏆 Game Over!':'⏱️ Time\'s Up!')}
            </div>
            {(status==='live'||status==='finished')&&<div className="text-6xl font-black my-2" style={{ fontFamily:'Space Mono',color:timer<30?'var(--red)':timer<60?'var(--gold)':'var(--accent)',letterSpacing:-2 }}>{fmt(timer)}</div>}
            {status==='countdown'&&<div className="text-8xl font-black my-3 g-text" style={{ fontFamily:'Space Mono' }}>{countdown}</div>}
            <div className="flex justify-center gap-2 mt-3 flex-wrap">
              {players.map((p,k)=>(
                <div key={k} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background:'var(--bg2)', border:`1px solid ${p.status==='done'?'var(--green)':(p.user||p._id)===myId?'var(--accent)':'var(--border)'}` }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black" style={{ background:p.color||'var(--bg3)',color:'#fff' }}>{p.initials||'?'}</div>
                  {(p.user||p._id)===myId?'You':p.name}
                  <span style={{ color:p.status==='done'?'var(--green)':'var(--muted)' }}>{p.status==='done'?'✓':'⌨️'}</span>
                </div>
              ))}
            </div>
          </div>
          {ch&&(
            <div className="rounded-xl p-5 mb-4" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
              <div className="flex flex-wrap gap-2 mb-2">
                {cat&&<span className="cpill" style={{ background:cat.color,color:cat.text,border:`1px solid ${cat.text}33` }}>{cat.icon} {cat.label}</span>}
                <Badge variant={ch.difficulty}>{ch.difficulty?.toUpperCase()}</Badge>
                <span className="cpill ml-auto" style={{ background:'rgba(255,215,64,.1)',color:'var(--gold)',border:'1px solid rgba(255,215,64,.3)' }}>+{ch.xp} XP</span>
              </div>
              <h2 className="text-base font-black">{ch.title}</h2>
              {ch.description&&<p className="text-sm mt-2" style={{ color:'var(--muted)' }}>{ch.description}</p>}
            </div>
          )}
          <div className="rounded-xl overflow-hidden mb-4" style={{ border:'1px solid var(--border)' }}>
            <div className="flex items-center gap-3 px-4 py-2.5" style={{ background:'var(--bg3)',borderBottom:'1px solid var(--border)' }}>
              <div className="flex gap-1.5">{['#ff5f57','#ffbd2e','#28ca42'].map(c=><div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background:c }}/>)}</div>
              <span className="text-xs font-bold" style={{ color:'var(--muted)',fontFamily:'Space Mono' }}>answer.txt</span>
            </div>
            <textarea className="w-full p-4 outline-none resize-none"
              style={{ background:'#0d0d14',color:'#a9b1d6',fontFamily:'Space Mono',fontSize:13,lineHeight:1.7,minHeight:180,border:'none' }}
              placeholder="Write your answer here..." value={answer} onChange={e=>setAnswer(e.target.value)}
              disabled={status==='finished'||submitted}/>
          </div>
          {status==='waiting'&&isHost&&<button onClick={startMatch} className="w-full py-3 rounded-xl font-black text-sm text-white hover:opacity-90" style={{ background:'linear-gradient(135deg,var(--accent),var(--accent2))',fontFamily:'Syne' }}>🚀 Start Match</button>}
          {status==='waiting'&&!isHost&&<div className="text-center py-3 text-sm" style={{ color:'var(--muted)' }}>⏳ Waiting for host to start...</div>}
          {status==='live'&&!submitted&&<button onClick={handleSubmit} className="w-full py-3 rounded-xl font-black text-base hover:opacity-90" style={{ background:'linear-gradient(135deg,var(--green),#00b248)',color:'#000',fontFamily:'Syne' }}>⚡ SUBMIT ANSWER</button>}
          {status==='finished'&&(
            <div className="rounded-xl p-6 text-center" style={{ background:winner?'rgba(0,230,118,.06)':'rgba(255,82,82,.06)', border:`1px solid ${winner?'var(--green)':'var(--red)'}` }}>
              <div className="text-4xl mb-2">{winner?'🏆':'⏱️'}</div>
              <div className="text-xl font-black mb-1">{winner?(winner.id||winner._id)===myId?'You Won!':'Match Over!':"Time's Up!"}</div>
              {winner&&<div className="text-sm mb-3" style={{ color:'var(--muted)' }}>{winner.name} solved it first!</div>}
              <button onClick={leaveRoom} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90" style={{ background:'linear-gradient(135deg,var(--accent),var(--accent2))' }}>Back to Lobby</button>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  )
}
