import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Input } from '../components/ui/Ui'
import { ArrowLeft } from 'lucide-react'
import T from '../utils/toast'

export default function LoginPage() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]     = useState({ email:'', password:'' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.email.includes('@')) e.email    = 'Enter a valid email'
    if (form.password.length < 6)  e.password = 'Min 6 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async ev => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await login(form.email, form.password)
      T.success('Welcome back! ⚡')
      navigate('/feed')
    } catch (err) {
      T.error(err.response?.data?.message || 'Invalid email or password')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background:'var(--bg1)' }}>
      {/* Blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-80 h-80 rounded-full opacity-[.06] blur-3xl pointer-events-none" style={{ background:'var(--accent)' }}/>
      <div className="absolute bottom-[-15%] right-[-10%] w-80 h-80 rounded-full opacity-[.06] blur-3xl pointer-events-none" style={{ background:'var(--accent2)' }}/>

      <div className="w-full max-w-sm relative z-10">
        {/* Back button */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold mb-6 transition-colors hover:opacity-80"
          style={{ color:'var(--muted)' }}>
          <ArrowLeft size={16}/> Back
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/feed" className="inline-flex items-center gap-2">
            <span className="text-4xl">👑</span>
            <span className="text-3xl font-black g-text tracking-tight">Qrownd</span>
          </Link>
          <p className="text-sm mt-2" style={{ color:'var(--muted)' }}>Where crowds solve everything</p>
        </div>

        <div className="rounded-2xl p-7 shadow-2xl" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
          <h1 className="text-xl font-black mb-1">Welcome back 👋</h1>
          <p className="text-sm mb-5" style={{ color:'var(--muted)' }}>Log in to your account</p>

          <form onSubmit={submit} className="flex flex-col gap-3.5">
            <Input label="Email" type="email" placeholder="you@example.com"
              value={form.email} onChange={e=>setForm({...form,email:e.target.value})} error={errors.email} autoComplete="email"/>
            <Input label="Password" type="password" placeholder="••••••••"
              value={form.password} onChange={e=>setForm({...form,password:e.target.value})} error={errors.password} autoComplete="current-password"/>

            <div className="flex justify-end">
              <button type="button" className="text-xs font-bold" style={{ color:'var(--accent)' }}>Forgot password?</button>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 mt-1"
              style={{ background:'linear-gradient(135deg,var(--accent),var(--accent2))', fontFamily:'Syne' }}>
              {loading
                ? <><span className="inline-block w-4 h-4 rounded-full border-2 a-spin" style={{ borderColor:'rgba(255,255,255,.3)', borderTopColor:'#fff' }}/> Logging in...</>
                : '⚡ Login'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background:'var(--border)' }}/>
            <span className="text-xs" style={{ color:'var(--muted)' }}>or</span>
            <div className="flex-1 h-px" style={{ background:'var(--border)' }}/>
          </div>

          <button onClick={() => setForm({ email:'demo@qrownd.app', password:'demo1234' })}
            className="w-full py-2.5 rounded-xl text-sm font-bold transition-colors"
            style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--muted)' }}>
            🎮 Use Demo Account
          </button>

          <p className="text-center text-sm mt-5" style={{ color:'var(--muted)' }}>
            New here? <Link to="/signup" className="font-bold" style={{ color:'var(--accent)' }}>Sign up free →</Link>
          </p>
        </div>

        <div className="flex justify-center gap-8 mt-6">
          {[['10K+','Users'],['80K+','Solved'],['#1','Community']].map(([v,l])=>(
            <div key={l} className="text-center">
              <div className="text-lg font-black g-text">{v}</div>
              <div className="text-xs" style={{ color:'var(--muted)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
