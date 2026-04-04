import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { Badge, Spinner, EmptyState, ErrorState, ChatBtn } from '../components/ui/Ui'
import { getCat } from '../utils/categories'
import { timeAgo } from '../utils/time'
import { useAuth } from '../context/AuthContext'
import { getSocket } from '../lib/socket'
import api from '../lib/api'
import T from '../utils/toast'
import { ArrowLeft } from 'lucide-react'

export default function PostPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const { user }  = useAuth()

  const [post,    setPost]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [answer,  setAnswer]  = useState('')
  const [sending, setSending] = useState(false)
  const [sort,    setSort]    = useState('top')

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null)
      try {
        const { data } = await api.get(`/posts/${id}`)
        setPost(data.data.post)
      } catch (err) {
        setError(err.response?.data?.message || 'Post not found')
      }
      setLoading(false)
    }
    load()
  }, [id])

  // Real-time socket listeners
  useEffect(() => {
    const s = getSocket()
    s.emit('post:join', { postId: id })
    s.on('post:newAnswer', ({ postId, answer: ans }) => {
      if (postId !== id) return
      setPost(prev => prev ? { ...prev, answers:[...prev.answers, ans] } : prev)
    })
    s.on('post:answerAccepted', ({ postId, answerId }) => {
      if (postId !== id) return
      setPost(prev => prev ? {
        ...prev, solved:true,
        answers: prev.answers.map(a => ({ ...a, accepted:a._id===answerId }))
      } : prev)
    })
    return () => { s.off('post:newAnswer'); s.off('post:answerAccepted') }
  }, [id])

  const handleAnswer = async () => {
    if (!answer.trim()) { T.error('Write something first!'); return }
    if (!user) { T.error('Login to answer'); return }
    setSending(true)
    try {
      const { data } = await api.post(`/posts/${id}/answers`, { text:answer })
      setPost(prev => prev ? { ...prev, answers:[...prev.answers, data.data.answer] } : prev)
      setAnswer('')
      T.xp(20, 'Answer posted!')
    } catch (err) {
      T.error(err.response?.data?.message || 'Failed to post answer')
    }
    setSending(false)
  }

  const handleAccept = async (answerId, authorName) => {
    try {
      await api.post(`/posts/${id}/answers/${answerId}/accept`)
      setPost(prev => prev ? {
        ...prev, solved:true,
        answers: prev.answers.map(a => ({ ...a, accepted:a._id===answerId }))
      } : prev)
      T.success(`✅ ${authorName}'s answer accepted! XP awarded 🎉`)
    } catch (err) {
      T.error(err.response?.data?.message || 'Failed to accept')
    }
  }

  const handleUpvotePost = async () => {
    if (!user) { T.error('Login to upvote'); return }
    try {
      const { data } = await api.post(`/posts/${id}/upvote`)
      setPost(prev => prev ? { ...prev, votes:data.data.votes, upvoted:data.data.upvoted } : prev)
    } catch(_){}
  }

  if (loading) return <AppLayout><div className="flex justify-center py-20"><Spinner size={32}/></div></AppLayout>
  if (error)   return <AppLayout><div className="p-6 max-w-2xl mx-auto"><ErrorState message={error} onRetry={()=>window.location.reload()}/></div></AppLayout>
  if (!post)   return <AppLayout><EmptyState icon="😕" title="Post not found"/></AppLayout>

  const cat      = getCat(post.category)
  const myId     = user?.id || user?._id
  const isOwner  = myId && post.author?._id?.toString() === myId?.toString()
  const sorted   = [...(post.answers||[])].sort((a,b)=>{
    if (sort==='top') return (b.votes+(b.accepted?1000:0)) - (a.votes+(a.accepted?1000:0))
    return new Date(b.createdAt)-new Date(a.createdAt)
  })

  return (
    <AppLayout>
      <div className="p-4 md:p-5 max-w-2xl mx-auto">
        <button onClick={()=>navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold mb-4 hover:opacity-80 transition-opacity"
          style={{ color:'var(--muted)' }}>
          <ArrowLeft size={15}/> Back
        </button>

        {/* Post */}
        <div className="rounded-xl p-5 mb-4" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
          <div className="flex flex-wrap gap-2 mb-3">
            {cat && <span className="cpill" style={{ background:cat.color, color:cat.text, border:`1px solid ${cat.text}33` }}>{cat.icon} {cat.label}</span>}
            {post.live   && <Badge variant="live">● LIVE</Badge>}
            {post.solved && <Badge variant="solved">✓ SOLVED</Badge>}
            {post.urgency==='high' && <Badge variant="high">🔴 Urgent</Badge>}
            <span className="ml-auto text-xs font-black" style={{ color:post.solved?'var(--green)':'var(--gold)', fontFamily:'Space Mono' }}>+{post.xp} XP</span>
          </div>

          <h1 className="text-xl font-black leading-snug mb-3">{post.title}</h1>

          {post.tags?.length>0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {post.tags.map(t=><span key={t} className="cpill" style={{ background:'var(--bg3)', color:'var(--muted)', border:'1px solid var(--border)' }}>{t}</span>)}
            </div>
          )}

          <p className="text-sm leading-relaxed mb-4 whitespace-pre-line">{post.detail || post.description}</p>

          <div className="flex items-center gap-3 pt-3" style={{ borderTop:'1px solid var(--border)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
              style={{ background:post.anonymous?'var(--bg4)':post.author?.color||'var(--bg4)', color:'#fff' }}>
              {post.anonymous ? '?' : post.author?.initials}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold">{post.anonymous ? 'Anonymous' : post.author?.name}</span>
              <span className="text-xs ml-2" style={{ color:'var(--muted)' }}>{timeAgo(post.createdAt)}</span>
            </div>
            {user && !post.anonymous && post.author?._id && post.author._id !== myId && (
              <ChatBtn userId={post.author._id} handle={post.author.handle}/>
            )}
            <div className="flex items-center gap-3 text-xs" style={{ color:'var(--muted)', fontFamily:'Space Mono' }}>
              <span>💬 {post.answers?.length||0}</span>
              <button onClick={handleUpvotePost}
                className="flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition-all"
                style={{ color:post.upvoted?'var(--accent)':'var(--muted)', background:post.upvoted?'rgba(124,92,252,.1)':'transparent' }}>
                ▲ {post.votes}
              </button>
              <span>👁 {post.views}</span>
            </div>
          </div>
        </div>

        {/* Answers */}
        <div className="rounded-xl p-5 mb-4" style={{ background:'var(--bg3)', border:'1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black">{post.answers?.length||0} Answers</h2>
            <div className="flex gap-2">
              {['top','new'].map(s=>(
                <button key={s} onClick={()=>setSort(s)}
                  className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                  style={{ background:sort===s?'var(--accent)':'var(--bg2)', color:sort===s?'#fff':'var(--muted)', border:`1px solid ${sort===s?'var(--accent)':'var(--border)'}` }}>
                  {s==='top'?'⭐ Top':'🕒 New'}
                </button>
              ))}
            </div>
          </div>

          {sorted.length===0 ? <EmptyState icon="🤔" title="No answers yet" sub="Be the first to help!"/> :
          sorted.map(ans => (
            <AnswerCard key={ans._id} answer={ans} postId={id} isOwner={isOwner} isSolved={post.solved}
              currentUserId={myId} onAccept={()=>handleAccept(ans._id, ans.author?.name)}/>
          ))}
        </div>

        {/* Write answer */}
        <div className="rounded-xl p-5" style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
          <h3 className="font-black mb-3">💬 Your Answer</h3>
          {!user ? (
            <div className="text-center py-6 rounded-xl" style={{ background:'var(--bg3)', border:'1px solid var(--border)' }}>
              <p className="text-sm mb-3" style={{ color:'var(--muted)' }}>Login to post an answer and earn XP</p>
              <button onClick={()=>navigate('/login')}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-white"
                style={{ background:'linear-gradient(135deg,var(--accent),var(--accent2))' }}>
                Login / Sign Up
              </button>
            </div>
          ) : (
            <>
              <textarea className="w-full mb-3 q-in" style={{ minHeight:120, resize:'vertical' }}
                placeholder="Share your solution, experience, or advice. Be specific and helpful..."
                value={answer} onChange={e=>setAnswer(e.target.value)}/>
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color:'var(--muted)' }}>Be detailed — better answers earn more XP</p>
                <button onClick={handleAnswer} disabled={sending||!answer.trim()}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                  style={{ background:'linear-gradient(135deg,var(--accent),var(--accent2))', fontFamily:'Syne' }}>
                  {sending ? <><Spinner size={14}/> Posting...</> : '🚀 Post Answer'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

function AnswerCard({ answer, postId, isOwner, isSolved, currentUserId, onAccept }) {
  const [votes, setVotes] = useState(answer.votes||0)
  const [voted, setVoted] = useState(answer.upvoted||false)
  const showChat = currentUserId && answer.author?._id && answer.author._id !== currentUserId

  const vote = async () => {
    try {
      const { data } = await api.post(`/posts/${postId}/answers/${answer._id}/upvote`)
      setVotes(data.data.votes); setVoted(data.data.upvoted)
    } catch(_){}
  }

  return (
    <div className="rounded-xl p-4 mb-3 relative"
      style={{ background:answer.accepted?'rgba(0,230,118,.04)':'var(--bg2)', border:`1px solid ${answer.accepted?'var(--green)':'var(--border)'}` }}>
      {answer.accepted && (
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg"
          style={{ background:'rgba(0,230,118,.15)', border:'1px solid rgba(0,230,118,.4)' }}>
          <span className="text-xs font-black" style={{ color:'var(--green)', fontFamily:'Space Mono' }}>✓ ACCEPTED</span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
          style={{ background:answer.author?.color||'var(--bg4)', color:'#fff' }}>
          {answer.author?.initials||'?'}
        </div>
        <span className="text-xs font-bold">{answer.author?.name||'Unknown'}</span>
        <span className="text-xs" style={{ color:'var(--muted)', fontFamily:'Space Mono' }}>{timeAgo(answer.createdAt)}</span>
        {showChat && <ChatBtn userId={answer.author._id} handle={answer.author.handle}/>}
      </div>

      <p className="text-sm leading-relaxed mb-4 whitespace-pre-line">{answer.text}</p>

      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={vote}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={{ background:voted?'var(--accent)':'rgba(124,92,252,.1)', color:voted?'#fff':'var(--accent)', border:'1px solid rgba(124,92,252,.3)', fontFamily:'Space Mono' }}>
          ▲ {votes}
        </button>
        {isOwner && !answer.accepted && !isSolved && (
          <button onClick={onAccept}
            className="ml-auto px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-all"
            style={{ background:'rgba(0,230,118,.12)', color:'var(--green)', border:'1px solid rgba(0,230,118,.3)' }}>
            ✓ Accept this answer
          </button>
        )}
        {isOwner && isSolved && !answer.accepted && (
          <button onClick={onAccept}
            className="ml-auto px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background:'var(--bg3)', color:'var(--muted)', border:'1px solid var(--border)' }}>
            Mark as better
          </button>
        )}
      </div>
    </div>
  )
}
