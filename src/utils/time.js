export const timeAgo = d => {
  const s = Math.floor((Date.now()-new Date(d))/1000)
  if (s<60)    return `${s}s ago`
  if (s<3600)  return `${Math.floor(s/60)}m ago`
  if (s<86400) return `${Math.floor(s/3600)}h ago`
  if (s<604800)return `${Math.floor(s/86400)}d ago`
  return new Date(d).toLocaleDateString()
}
export const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
