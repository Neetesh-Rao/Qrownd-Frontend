import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppLayout  from '../components/layout/AppLayout'
import PostCard   from '../components/ui/PostCard'
import PostModal  from '../components/ui/PostModal'
import RightPanel from '../components/ui/RightPanel'
import { Spinner, EmptyState, ErrorState } from '../components/ui/Ui'
import { getCat, CATEGORIES } from '../utils/categories'
import { useAuth } from '../context/AuthContext'
import { getSocket } from '../lib/socket'
import api from '../lib/api'
import T from '../utils/toast'

const FILTERS = ['All','Unsolved','Hot 🔥','Urgent 🚨','Solved ✅']
const FMAP    = { 'All':null,'Unsolved':'unsolved','Hot 🔥':'hot','Urgent 🚨':'urgent','Solved ✅':'solved' }

export default function FeedPage() {
  const { user }  = useAuth()
  const [params]  = useSearchParams()
  const [posts,   setPosts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [page,    setPage]    = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [filter,  setFilter]  = useState('All')
  const [modal,   setModal]   = useState(false)

  const activeCat = params.get('cat')
  const cat       = activeCat ? getCat(activeCat) : null

  const load = useCallback(async (reset=false) => {
    setLoading(true); setError(null)
    try {
      const p = reset ? 1 : page
      const q = new URLSearchParams({ page:p, limit:20 })
      if (activeCat) q.set('category', activeCat)
      const fv = FMAP[filter]; if (fv) q.set('filter', fv)

      const { data } = await api.get(`/posts?${q}`)
      const newPosts = data.data || []
      setPosts(prev => reset ? newPosts : [...prev, ...newPosts])
      setHasMore(data.pagination?.hasMore || false)
      if (reset) setPage(2); else setPage(p+1)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load posts')
    }
    setLoading(false)
  }, [filter, activeCat, page])

  useEffect(() => { setPosts([]); setPage(1); load(true) }, [filter, activeCat])

  // Real-time: listen for new posts via socket
  useEffect(() => {
    const s = getSocket()
    s.on('post:new', ({ post }) => {
      // Only add if it matches current filter/category
      if (activeCat && post.category !== activeCat) return
      if (filter === 'Solved ✅' && !post.solved) return
      if (filter === 'Unsolved' && post.solved) return
      setPosts(prev => {
        if (prev.find(p => p._id === post._id)) return prev
        return [post, ...prev]
      })
      T.notify(`New post: "${post.title.slice(0,40)}"`, '✨', { duration:3000 })
    })
    return () => s.off('post:new')
  }, [activeCat, filter])

  const handleCreated = post => {
    if (!activeCat || post.category === activeCat) setPosts(prev => [post, ...prev])
  }

  const handlePostClick = () => {
    if (!user) { T.error('Login to post a problem'); return }
    setModal(true)
  }

  return (
    <AppLayout right={<RightPanel/>}>
      <div className="p-4 md:p-5 max-w-2xl mx-auto">
        {cat && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background:cat.color, border:`1px solid ${cat.text}33` }}>
            <span className="text-2xl">{cat.icon}</span>
            <div>
              <div className="font-black text-sm" style={{ color:cat.text }}>{cat.label}</div>
              <div className="text-xs" style={{ color:cat.text+'aa' }}>{posts.length} problems</div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h1 className="text-lg font-black">{cat ? `${cat.icon} ${cat.label}` : '⚡ Live Feed'}</h1>
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(f => (
              <button key={f} onClick={()=>setFilter(f)}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{ background:filter===f?'var(--accent)':'transparent', color:filter===f?'#fff':'var(--muted)', border:`1px solid ${filter===f?'var(--accent)':'var(--border)'}` }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Post button */}
        <button onClick={handlePostClick}
          className="w-full flex items-center gap-3 p-4 rounded-xl mb-4 text-left transition-all"
          style={{ background:'var(--bg2)', border:'1px dashed var(--border)' }}
          onMouseOver={e=>e.currentTarget.style.borderColor='var(--accent)'}
          onMouseOut={e=>e.currentTarget.style.borderColor='var(--border)'}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background:'rgba(124,92,252,.15)', color:'var(--accent)' }}>+</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold" style={{ color:'var(--muted)' }}>Got a problem? Ask the crowd...</div>
            <div className="text-xs" style={{ color:'var(--muted)', opacity:.7 }}>Tech, study, life, career — anything goes</div>
          </div>
          <span className="text-xs font-black flex-shrink-0" style={{ color:'var(--accent)', fontFamily:'Space Mono' }}>+XP</span>
        </button>

        {error ? <ErrorState message={error} onRetry={()=>load(true)}/> :
         loading && posts.length===0 ? <div className="flex justify-center py-16"><Spinner size={32}/></div> :
         posts.length===0 ? <EmptyState icon="🔍" title="No problems found" sub={filter!=='All'?'Try a different filter':'Be the first to post!'}/> : (
          <>
            {posts.map(p => <PostCard key={p._id} post={p}/>)}
            {hasMore && (
              <button onClick={()=>load()} disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold mt-2 transition-colors"
                style={{ background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--muted)' }}>
                {loading ? <Spinner size={16} className="mx-auto"/> : 'Load more'}
              </button>
            )}
          </>
        )}
      </div>

      <PostModal open={modal} onClose={()=>setModal(false)} onCreated={handleCreated}/>
    </AppLayout>
  )
}
