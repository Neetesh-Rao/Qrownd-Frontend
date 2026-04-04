import { useState } from 'react'
import { Modal, Input, Textarea, Select, Btn, Spinner } from './Ui'
import { CATEGORIES } from '../../utils/categories'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import T from '../../utils/toast'

export default function PostModal({ open, onClose, onCreated }) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ category:'tech', title:'', description:'', detail:'', tags:'', urgency:'medium', anonymous:false })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const validate1 = () => {
    const e = {}
    if (!form.category) e.category = 'Pick a category'
    if (form.title.trim().length < 10) e.title = 'Title must be at least 10 characters'
    if (form.description.trim().length < 20) e.description = 'Describe in at least 20 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!user) { T.error('Please login first'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/posts', {
        category:    form.category,
        title:       form.title.trim(),
        description: form.description.trim(),
        detail:      form.detail.trim(),
        tags:        form.tags.split(',').map(t=>t.trim()).filter(Boolean),
        urgency:     form.urgency,
        anonymous:   form.anonymous,
      })
      onCreated?.(data.data.post)
      T.success('Problem posted! The crowd will help you 🎉')
      onClose()
      setStep(1)
      setForm({ category:'tech', title:'', description:'', detail:'', tags:'', urgency:'medium', anonymous:false })
    } catch (err) {
      T.error(err.response?.data?.message || 'Failed to post')
    }
    setLoading(false)
  }

  const selCat = CATEGORIES.find(c => c.id === form.category)

  return (
    <Modal open={open} onClose={onClose} title="📝 Post a Problem" maxW={600}>
      {/* Steps */}
      <div className="flex items-center gap-3 mb-5">
        {[1,2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
              style={{ background:step>=s?'var(--accent)':'var(--bg3)', color:step>=s?'#fff':'var(--muted)', border:`1px solid ${step>=s?'var(--accent)':'var(--border)'}` }}>
              {step>s?'✓':s}
            </div>
            <span className="text-xs font-bold" style={{ color:step===s?'var(--text)':'var(--muted)' }}>
              {s===1?'Problem Details':'Extra Info'}
            </span>
            {s<2 && <div className="w-8 h-px" style={{ background:step>s?'var(--accent)':'var(--border)' }}/>}
          </div>
        ))}
      </div>

      {step===1 ? (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color:'var(--muted)' }}>Category *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={()=>set('category',cat.id)}
                  className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-bold transition-all"
                  style={{ background:form.category===cat.id?cat.color:'var(--bg3)', color:form.category===cat.id?cat.text:'var(--muted)', border:`1px solid ${form.category===cat.id?cat.text+'55':'var(--border)'}` }}>
                  <span className="text-xl">{cat.icon}</span>
                  <span style={{ fontSize:10, textAlign:'center', lineHeight:1.2 }}>{cat.label}</span>
                </button>
              ))}
            </div>
            {errors.category && <p className="text-xs mt-1" style={{ color:'var(--red)' }}>{errors.category}</p>}
          </div>

          <Input label="Problem Title *" placeholder="Describe your problem in one clear sentence..."
            value={form.title} onChange={e=>set('title',e.target.value)} error={errors.title}/>

          <Textarea label="Description *" rows={4}
            placeholder="What exactly is the problem? What have you tried? What outcome do you want?"
            value={form.description} onChange={e=>set('description',e.target.value)}/>
          {errors.description && <p className="text-xs -mt-2" style={{ color:'var(--red)' }}>{errors.description}</p>}

          <Select label="Urgency" value={form.urgency} onChange={e=>set('urgency',e.target.value)}
            options={[
              { value:'low',    label:'🟢 Low — Whenever' },
              { value:'medium', label:'🟡 Medium — This week' },
              { value:'high',   label:'🔴 High — Urgent!' },
            ]}/>

          <div className="flex gap-3 mt-1">
            <Btn variant="ghost" size="md" className="flex-1" onClick={onClose}>Cancel</Btn>
            <Btn variant="primary" size="md" className="flex-1" onClick={()=>{ if(validate1()) setStep(2) }}>Next →</Btn>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl p-3" style={{ background:'var(--bg3)', border:'1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-1">
              <span>{selCat?.icon}</span>
              <span className="text-xs font-bold" style={{ color:selCat?.text }}>{selCat?.label}</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background:'rgba(255,82,82,.1)', color:'var(--red)', fontFamily:'Space Mono' }}>{form.urgency.toUpperCase()}</span>
            </div>
            <p className="text-sm font-bold line-clamp-2">{form.title}</p>
          </div>

          <Textarea label="More Detail (optional)" rows={5}
            placeholder="Full story, links, error messages, what you've tried in detail..."
            value={form.detail} onChange={e=>set('detail',e.target.value)}/>

          <Input label="Tags (comma separated, optional)"
            placeholder={form.category==='tech'?'React, Node.js, Bug':'JEE, Math, Focus'}
            value={form.tags} onChange={e=>set('tags',e.target.value)}/>

          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={()=>set('anonymous',!form.anonymous)}
              className="w-10 h-5 rounded-full relative flex-shrink-0 transition-colors"
              style={{ background:form.anonymous?'var(--accent)':'var(--bg4)', cursor:'pointer' }}>
              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left:form.anonymous?'22px':'2px' }}/>
            </div>
            <div>
              <div className="text-sm font-bold">Post anonymously</div>
              <div className="text-xs" style={{ color:'var(--muted)' }}>Your name won't appear on this post</div>
            </div>
          </label>

          <div className="rounded-xl p-3 text-xs" style={{ background:'rgba(124,92,252,.07)', border:'1px solid rgba(124,92,252,.2)', color:'var(--muted)' }}>
            💡 More detail = better answers = faster solve. You & solver both earn XP when accepted!
          </div>

          <div className="flex gap-3">
            <Btn variant="ghost" size="md" className="flex-1" onClick={()=>setStep(1)}>← Back</Btn>
            <Btn variant="primary" size="md" className="flex-1" disabled={loading} onClick={handleSubmit}>
              {loading ? <span className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded-full border-2 a-spin" style={{ borderColor:'rgba(255,255,255,.3)', borderTopColor:'#fff' }}/> Posting...</span> : '🚀 Post Problem'}
            </Btn>
          </div>
        </div>
      )}
    </Modal>
  )
}
