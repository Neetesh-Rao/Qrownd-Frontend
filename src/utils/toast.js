// src/utils/toast.js
// Beautiful, consistent toasts — not generic "Success" messages
import toast from 'react-hot-toast'

const base = {
  style: {
    background: 'var(--bg2)',
    color:       'var(--text)',
    border:      '1px solid var(--border)',
    fontFamily:  'Syne, sans-serif',
    fontSize:    '13px',
    fontWeight:  '600',
    borderRadius:'10px',
    padding:     '12px 16px',
    maxWidth:    '340px',
    boxShadow:   '0 8px 24px rgba(0,0,0,.35)',
  },
}

export const T = {
  success: (msg, opts={}) => toast.success(msg, {
    ...base, duration:3000,
    style: { ...base.style, border:'1px solid var(--green)', ...opts.style },
    iconTheme: { primary:'var(--green)', secondary:'var(--bg2)' },
    ...opts,
  }),

  error: (msg, opts={}) => toast.error(msg, {
    ...base, duration:4000,
    style: { ...base.style, border:'1px solid var(--red)', ...opts.style },
    iconTheme: { primary:'var(--red)', secondary:'var(--bg2)' },
    ...opts,
  }),

  info: (msg, icon='💡', opts={}) => toast(msg, {
    ...base, duration:3000, icon,
    style: { ...base.style, border:'1px solid var(--accent)', ...opts.style },
    ...opts,
  }),

  notify: (msg, icon='🔔', opts={}) => toast(msg, {
    ...base, duration:4500, icon,
    style: { ...base.style, border:'1px solid rgba(124,92,252,.5)', ...opts.style },
    ...opts,
  }),

  xp: (amount, msg='XP earned!') => toast.success(`+${amount} XP  ${msg}`, {
    ...base, duration:3500, icon:'⚡',
    style: { ...base.style, border:'1px solid var(--gold)', color:'var(--gold)' },
    iconTheme: { primary:'var(--gold)', secondary:'var(--bg2)' },
  }),

  loading: (msg) => toast.loading(msg, {
    ...base,
    style: { ...base.style },
  }),

  promise: (promise, msgs) => toast.promise(promise, msgs, {
    ...base,
    style: { ...base.style },
    success: { style: { ...base.style, border:'1px solid var(--green)' }, iconTheme:{ primary:'var(--green)', secondary:'var(--bg2)' } },
    error:   { style: { ...base.style, border:'1px solid var(--red)'   }, iconTheme:{ primary:'var(--red)',   secondary:'var(--bg2)' } },
  }),
}

export default T
