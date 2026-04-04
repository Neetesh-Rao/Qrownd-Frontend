import { useNavigate } from 'react-router-dom'

/* ── Spinner ─────────────────────────────────────────────────── */
export function Spinner({ size=20, className='' }) {
  return <div className={`rounded-full border-2 a-spin ${className}`}
    style={{ width:size, height:size, borderColor:'var(--border)', borderTopColor:'var(--accent)' }}/>
}

/* ── Badge ───────────────────────────────────────────────────── */
export function Badge({ children, variant='tag', className='' }) {
  const v = {
    tag:    { background:'rgba(124,92,252,.1)',  color:'var(--accent)',  border:'1px solid rgba(124,92,252,.25)' },
    live:   { background:'rgba(0,230,118,.18)',  color:'var(--green)',   border:'1px solid var(--green)', animation:'blink .8s infinite' },
    solved: { background:'rgba(0,230,118,.12)',  color:'var(--green)',   border:'1px solid rgba(0,230,118,.3)' },
    easy:   { background:'rgba(0,230,118,.12)',  color:'var(--green)',   border:'1px solid rgba(0,230,118,.3)' },
    medium: { background:'rgba(255,215,64,.12)', color:'var(--gold)',    border:'1px solid rgba(255,215,64,.3)' },
    hard:   { background:'rgba(255,82,82,.12)',  color:'var(--red)',     border:'1px solid rgba(255,82,82,.3)' },
    high:   { background:'rgba(255,82,82,.1)',   color:'var(--red)',     border:'1px solid rgba(255,82,82,.3)' },
  }
  return <span className={`cpill ${className}`} style={v[variant]||v.tag}>{children}</span>
}

/* ── Button ──────────────────────────────────────────────────── */
export function Btn({ children, variant='primary', size='md', className='', disabled, ...p }) {
  const sz = { sm:'px-3 py-1.5 text-xs', md:'px-4 py-2.5 text-sm', lg:'px-6 py-3 text-sm', full:'w-full py-3 text-sm' }
  const v  = {
    primary: { background:'linear-gradient(135deg,var(--accent),var(--accent2))', color:'#fff' },
    success: { background:'linear-gradient(135deg,var(--green),#00b248)', color:'#000' },
    ghost:   { background:'transparent', color:'var(--muted)', border:'1px solid var(--border)' },
    danger:  { background:'rgba(255,82,82,.1)', color:'var(--red)', border:'1px solid rgba(255,82,82,.3)' },
    outline: { background:'transparent', color:'var(--accent)', border:'1px solid var(--accent)' },
  }
  return <button className={`rounded-xl font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${sz[size]} ${className}`}
    style={{ fontFamily:'Syne', ...v[variant] }} disabled={disabled} {...p}>{children}</button>
}

/* ── Input ───────────────────────────────────────────────────── */
export function Input({ label, error, className='', ...p }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--muted)' }}>{label}</label>}
      <input className="q-in" style={{ border:`1px solid ${error?'var(--red)':'var(--border)'}` }}
        onFocus={e=>!error&&(e.target.style.borderColor='var(--accent)')}
        onBlur={e=>e.target.style.borderColor=error?'var(--red)':'var(--border)'} {...p}/>
      {error && <span className="text-xs" style={{ color:'var(--red)' }}>{error}</span>}
    </div>
  )
}

/* ── Textarea ────────────────────────────────────────────────── */
export function Textarea({ label, rows=4, className='', ...p }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--muted)' }}>{label}</label>}
      <textarea rows={rows} className="q-in" style={{ resize:'vertical' }}
        onFocus={e=>e.target.style.borderColor='var(--accent)'}
        onBlur={e=>e.target.style.borderColor='var(--border)'} {...p}/>
    </div>
  )
}

/* ── Select ──────────────────────────────────────────────────── */
export function Select({ label, options=[], className='', ...p }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--muted)' }}>{label}</label>}
      <select className="q-in" style={{ cursor:'pointer' }} {...p}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

/* ── Modal ───────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, maxW=560 }) {
  if (!open) return null
  return (
    <div className="modal-bg" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="w-full a-pop rounded-2xl shadow-2xl overflow-hidden" style={{ maxWidth:maxW, background:'var(--bg2)', border:'1px solid var(--border)', maxHeight:'92vh', overflowY:'auto' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom:'1px solid var(--border)', position:'sticky', top:0, background:'var(--bg2)', zIndex:1 }}>
          <h2 className="font-black text-base">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold" style={{ background:'var(--bg3)', color:'var(--muted)' }}>✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

/* ── Avatar ──────────────────────────────────────────────────── */
export function Avatar({ initials, color, size='md', src, className='' }) {
  const sz = { xs:'w-6 h-6 text-xs', sm:'w-8 h-8 text-xs', md:'w-10 h-10 text-sm', lg:'w-14 h-14 text-lg', xl:'w-20 h-20 text-2xl' }
  if (src) return <img src={src} alt="avatar" className={`rounded-full object-cover flex-shrink-0 ${sz[size]} ${className}`}/>
  return <div className={`rounded-full flex items-center justify-center font-black flex-shrink-0 text-white ${sz[size]} ${className}`}
    style={{ background:color||'linear-gradient(135deg,var(--accent),var(--accent2))' }}>{initials}</div>
}

/* ── ChatBtn — opens 1:1 chat with a user ─────────────────────── */
export function ChatBtn({ userId, handle, className='' }) {
  const navigate = useNavigate()
  if (!userId) return null
  return (
    <button
      title={`Chat with ${handle || 'user'}`}
      onClick={e => { e.stopPropagation(); e.preventDefault(); navigate(`/chat?with=${userId}`) }}
      className={`flex items-center justify-center rounded-lg transition-all hover:scale-110 active:scale-95 ${className}`}
      style={{ width:24, height:24, background:'rgba(124,92,252,.15)', color:'var(--accent)', border:'1px solid rgba(124,92,252,.35)', flexShrink:0 }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    </button>
  )
}

/* ── Empty / Error states ────────────────────────────────────── */
export function EmptyState({ icon='🔍', title='Nothing here', sub='' }) {
  return (
    <div className="text-center py-14">
      <div className="text-5xl mb-3 a-float inline-block">{icon}</div>
      <p className="font-bold text-lg">{title}</p>
      {sub && <p className="text-sm mt-1" style={{ color:'var(--muted)' }}>{sub}</p>}
    </div>
  )
}

export function ErrorState({ message='Something went wrong', onRetry }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">😕</div>
      <p className="font-bold text-sm mb-2" style={{ color:'var(--muted)' }}>{message}</p>
      {onRetry && <button onClick={onRetry} className="text-xs font-bold" style={{ color:'var(--accent)' }}>Try again →</button>}
    </div>
  )
}
