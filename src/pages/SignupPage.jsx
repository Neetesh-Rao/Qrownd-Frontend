import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Input } from '../components/ui/Ui'
import { CATEGORIES } from '../utils/categories'
import { ArrowLeft } from 'lucide-react'
import T from '../utils/toast'

export default function SignupPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [step, setStep]       = useState(1)
  const [form, setForm]       = useState({ name:'', handle:'', email:'', password:'', confirm:'', interests:[] })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)

  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const toggleInt = id => set('interests', form.interests.includes(id) ? form.interests.filter(i=>i!==id) : [...form.interests,id])

  const validate1 = () => {
    const e = {}
    if (!form.name.trim())                         e.name     = 'Name required'
    if (!form.handle.match(/^@[a-z0-9_]{2,30}$/)) e.handle   = 'Handle: @username (lowercase, numbers, underscores)'
    if (!form.email.includes('@'))                 e.email    = 'Valid email required'
    if (form.password.length < 6)                  e.password = 'Min 6 characters'
    if (form.password !== form.confirm)            e.confirm  = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    setLoading(true)
    try {
      await register({ name:form.name, handle:form.handle, email:form.email, password:form.password, interests:form.interests })
      T.success('Welcome to Qrownd! 🎉')
      navigate('/feed')
    } catch (err) {
      T.error(err.response?.data?.message || 'Signup failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background:'var(--bg1)' }}>
      <div className="absolute top-[-15%] right-[-10%] w-80 h-80 rounded-full opacity-[.06] blur-3xl pointer-events-none" style={{ background:'var(--accent3)' }}/>
      <div className="absolute bottom-[-15%] left-[-10%] w-80 h-80 rounded-full opacity-[.06] blur-3xl pointer-events-none" style={{ background:'var(--accent)' }}/>

      <div className="w-full max-w-sm relative z-10">
        {/* Back button */}
        <button onClick={() => step===1 ? navigate(-1) : setStep(1)}
          className="flex items-center gap-2 text-sm font-bold mb-6 transition-colors hover:opacity-80"
          style={{ color:'var(--muted)' }}>
          <ArrowLeft size={16}/> {step===1 ? 'Back' : 'Back to account'}
        </button>

        <div className="text-center mb-8">
          <Link to="/feed" className="inline-flex items-center gap-2">
            <span className="text-4xl">👑</span>
            <span className="text-3xl font-black g-text tracking-tight">Qrownd</span>
          </Link>
          <p className="text-sm mt-2" style={{ color:'var(--muted)' }}>Join 10,000+ problem-solvers</p>
        </div>

        <div className="rounded-2xl p-7 shadow-2xl" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-5">
            {[1,2].map(s=>(
              <div key={s} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
                  style={{ background:step>=s?'var(--accent)':'var(--bg3)', color:step>=s?'#fff':'var(--muted)', border:`1px solid ${step>=s?'var(--accent)':'var(--border)'}` }}>
                  {step>s?'✓':s}
                </div>
                <span className="text-xs font-bold" style={{ color:step===s?'var(--text)':'var(--muted)' }}>{s===1?'Account':'Interests'}</span>
                {s<2&&<div className="w-6 h-px" style={{ background:step>s?'var(--accent)':'var(--border)' }}/>}
              </div>
            ))}
          </div>

          {step===1 ? (
            <div className="flex flex-col gap-3.5">
              <h1 className="text-xl font-black mb-1">Create account 🚀</h1>
              <Input label="Full Name" placeholder="Arjun Mehta" value={form.name} onChange={e=>set('name',e.target.value)} error={errors.name}/>
              <Input label="Handle" placeholder="@username" value={form.handle} onChange={e=>set('handle',e.target.value.toLowerCase())} error={errors.handle}/>
              <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={e=>set('email',e.target.value)} error={errors.email}/>
              <Input label="Password" type="password" placeholder="Min 6 characters" value={form.password} onChange={e=>set('password',e.target.value)} error={errors.password}/>
              <Input label="Confirm Password" type="password" placeholder="Re-enter" value={form.confirm} onChange={e=>set('confirm',e.target.value)} error={errors.confirm}/>
              <button onClick={()=>{ if(validate1()) setStep(2) }}
                className="w-full py-3 rounded-xl font-black text-sm text-white hover:opacity-90 mt-1"
                style={{ background:'linear-gradient(135deg,var(--accent),var(--accent2))', fontFamily:'Syne' }}>
                Continue →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <h2 className="font-black text-base">What brings you here? 🤔</h2>
              <p className="text-xs" style={{ color:'var(--muted)' }}>Pick areas you want help with (optional)</p>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(cat=>(
                  <button key={cat.id} onClick={()=>toggleInt(cat.id)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left"
                    style={{ background:form.interests.includes(cat.id)?cat.color:'var(--bg3)', color:form.interests.includes(cat.id)?cat.text:'var(--muted)', border:`1px solid ${form.interests.includes(cat.id)?cat.text+'55':'var(--border)'}` }}>
                    <span className="text-base">{cat.icon}</span>
                    <span style={{ fontSize:10, lineHeight:1.2 }}>{cat.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={submit} disabled={loading}
                className="w-full py-3 rounded-xl font-black text-sm text-white hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background:'linear-gradient(135deg,var(--accent),var(--accent2))', fontFamily:'Syne' }}>
                {loading
                  ? <><span className="inline-block w-4 h-4 rounded-full border-2 a-spin" style={{ borderColor:'rgba(255,255,255,.3)', borderTopColor:'#fff' }}/> Creating...</>
                  : '🎉 Join Qrownd'}
              </button>
            </div>
          )}

          <p className="text-center text-sm mt-5" style={{ color:'var(--muted)' }}>
            Already a member? <Link to="/login" className="font-bold" style={{ color:'var(--accent)' }}>Log in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
