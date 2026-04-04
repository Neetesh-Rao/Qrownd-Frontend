import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Badge, ChatBtn } from './Ui'
import { getCat } from '../../utils/categories'
import { timeAgo } from '../../utils/time'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import T from '../../utils/toast'

export default function PostCard({ post, onUpvote }) {
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const [votes,   setVotes]   = useState(post.votes || 0)
  const [upvoted, setUpvoted] = useState(post.upvoted || false)
  const [busy,    setBusy]    = useState(false)

  const cat = getCat(post.category)

  const handleUpvote = async (e) => {
    e.stopPropagation()
    if (!user) { T.error('Login to upvote'); return }
    if (busy) return
    setBusy(true)
    try {
      const { data } = await api.post(`/posts/${post._id}/upvote`)
      setVotes(data.data.votes)
      setUpvoted(data.data.upvoted)
      onUpvote?.(post._id, data.data)
      if (data.data.upvoted) T.info('Upvoted!', '▲', { duration:1200 })
    } catch (err) {
      T.error(err.response?.data?.message || 'Failed')
    }
    setBusy(false)
  }

  const showChat = user && post.author?._id && post.author._id.toString() !== (user.id||user._id)?.toString() && !post.anonymous

  return (
    <article
      className={`card p-4 mb-3 cursor-pointer ${post.live ? 'live' : ''}`}
      onClick={() => navigate(`/post/${post._id}`)}
    >
      {/* Category + status */}
      <div className="flex items-center gap-2 flex-wrap mb-2.5">
        {cat && <span className="cpill" style={{ background:cat.color, color:cat.text, border:`1px solid ${cat.text}33` }}>{cat.icon} {cat.label}</span>}
        {post.live   && <Badge variant="live">● LIVE</Badge>}
        {post.solved && <Badge variant="solved">✓ SOLVED</Badge>}
        {post.urgency==='high' && !post.solved && <Badge variant="high">🔴 Urgent</Badge>}
        <span className="ml-auto text-xs font-black flex-shrink-0"
          style={{ color:post.solved?'var(--green)':'var(--gold)', fontFamily:'Space Mono' }}>
          +{post.xp} XP
        </span>
      </div>

      <h3 className="text-sm font-black mb-1.5 leading-snug">{post.title}</h3>

      <p className="text-xs leading-relaxed mb-2.5 line-clamp-2" style={{ color:'var(--muted)' }}>
        {post.description}
      </p>

      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.slice(0,4).map(t => (
            <span key={t} className="cpill" style={{ background:'var(--bg3)', color:'var(--muted)', border:'1px solid var(--border)' }}>{t}</span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between" style={{ borderTop:'1px solid var(--border)', paddingTop:10 }}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
            style={{ background:post.anonymous?'var(--bg4)':post.author?.color||'var(--bg4)', color:'#fff' }}>
            {post.anonymous ? '?' : (post.author?.initials || '?')}
          </div>
          <span className="text-xs font-semibold truncate" style={{ color:'var(--muted)' }}>
            {post.anonymous ? 'Anonymous' : (post.author?.handle || '@unknown')}
          </span>
          <span className="text-xs flex-shrink-0" style={{ color:'var(--muted)' }}>{timeAgo(post.createdAt)}</span>
          {showChat && <ChatBtn userId={post.author._id} handle={post.author.handle}/>}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs" style={{ color:'var(--muted)', fontFamily:'Space Mono' }}>
            💬 {post.answerCount ?? post.answers?.length ?? 0}
          </span>
          <button onClick={handleUpvote} disabled={busy}
            className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg transition-all"
            style={{ color:upvoted?'var(--accent)':'var(--muted)', background:upvoted?'rgba(124,92,252,.1)':'transparent', fontFamily:'Space Mono' }}>
            ▲ {votes}
          </button>
          <span className="text-xs hidden sm:inline" style={{ color:'var(--muted)', fontFamily:'Space Mono' }}>
            👁 {post.views || 0}
          </span>
        </div>
      </div>
    </article>
  )
}
