// categories.js
export const CATEGORIES = [
  { id:'tech',     label:'Tech & Code',    icon:'💻', color:'rgba(124,92,252,.18)', text:'#7c5cfc' },
  { id:'study',    label:'Study & Exams',  icon:'📚', color:'rgba(0,229,255,.18)',  text:'#00e5ff' },
  { id:'life',     label:'Life Problems',  icon:'🌱', color:'rgba(0,230,118,.18)',  text:'#00e676' },
  { id:'career',   label:'Career & Jobs',  icon:'💼', color:'rgba(255,215,64,.18)', text:'#ffd740' },
  { id:'health',   label:'Health & Mind',  icon:'🧘', color:'rgba(224,64,251,.18)', text:'#e040fb' },
  { id:'creative', label:'Creative',       icon:'🎨', color:'rgba(255,82,82,.18)',  text:'#ff5252' },
  { id:'finance',  label:'Finance',        icon:'💰', color:'rgba(0,230,118,.14)',  text:'#00e676' },
  { id:'relation', label:'Relationships',  icon:'💞', color:'rgba(255,82,82,.14)',  text:'#ff5252' },
]
export const getCat = id => CATEGORIES.find(c => c.id === id)
