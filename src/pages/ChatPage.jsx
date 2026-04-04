import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { Spinner } from '../components/ui/Ui'
import { useAuth } from '../context/AuthContext'
import { getSocket } from '../lib/socket'
import { useSocket } from '../context/SocketContext'
import { timeAgo } from '../utils/time'
import { Send, ChevronLeft, Search } from 'lucide-react'
import api from '../lib/api'
import T from '../utils/toast'

export default function ChatPage() {
  const { user }        = useAuth()
  const { onlineUsers } = useSocket()
  const [sp]            = useSearchParams()
  const navigate        = useNavigate()

  const [inbox,      setInbox]      = useState([])
  const [messages,   setMessages]   = useState([])
  const [activeUser, setActiveUser] = useState(null)
  const [input,      setInput]      = useState('')
  const [typing,     setTyping]     = useState(false)
  const [showList,   setShowList]   = useState(true)
  const [search,     setSearch]     = useState('')
  const [loadInbox,  setLoadInbox]  = useState(true)
  const [loadMsgs,   setLoadMsgs]   = useState(false)
  const [hasMore,    setHasMore]    = useState(false)
  const [msgPage,    setMsgPage]    = useState(1)

  const endRef      = useRef(null)
  const typingTimer = useRef(null)
  const socket      = getSocket()
  const myId        = user?.id || user?._id

  // Load inbox
  useEffect(() => {
    if (!user) return
    api.get('/chat/inbox').then(({ data }) => {
      setInbox(data.data?.conversations || [])
    }).catch(()=>{}).finally(()=>setLoadInbox(false))
  }, [user])

  // Handle ?with= param (chat icon click from feed/post)
  useEffect(() => {
    const withId = sp.get('with')
    if (!withId || !user) return
    setActiveUser({ _id:withId, id:withId })
    loadConversation(withId, true)
    setShowList(false)
  }, [sp, user])

  const loadConversation = useCallback(async (userId, reset=true) => {
    if (!userId) return
    setLoadMsgs(true)
    try {
      const p = reset ? 1 : msgPage
      const { data } = await api.get(`/chat/${userId}?page=${p}&limit=50`)
      const msgs = data.data || []
      setMessages(prev => reset ? msgs : [...msgs, ...prev])
      setHasMore(data.pagination?.hasMore || false)
      if (!reset) setMsgPage(p+1)
      else setMsgPage(2)
    } catch(_){}
    setLoadMsgs(false)
  }, [msgPage])

  const openChat = convo => {
    const other = convo.from?._id===myId?.toString() ? convo.to : convo.from
    if (!other) return
    setActiveUser(other)
    setMessages([]); setMsgPage(1)
    loadConversation(other._id || other.id, true)
    setShowList(false)
    socket.emit('chat:markRead', { fromUserId: other._id || other.id })
    setInbox(prev => prev.map(c => {
      const o = c.from?._id===myId?.toString() ? c.to : c.from
      if ((o?._id||o?.id) === (other._id||other.id)) return {...c, unreadCount:0}
      return c
    }))
  }

  // Socket events
  useEffect(() => {
    if (!user) return
    const activeId = activeUser?._id || activeUser?.id

    socket.on('chat:message', msg => {
      const fromId = msg.from?._id || msg.from
      const toId   = msg.to?._id   || msg.to
      if (fromId===activeId || toId===activeId) {
        setMessages(prev => [...prev, msg])
        if (fromId !== myId?.toString()) {
          socket.emit('chat:markRead', { fromUserId:fromId })
        }
      }
      // Update inbox preview
      setInbox(prev => {
        const otherId = fromId===myId?.toString() ? toId : fromId
        const exists  = prev.some(c => {
          const o = c.from?._id===myId?.toString()?c.to:c.from
          return (o?._id||o?.id)===otherId
        })
        if (exists) {
          return prev.map(c => {
            const o = c.from?._id===myId?.toString()?c.to:c.from
            if ((o?._id||o?.id)===otherId) return {...msg, unreadCount:fromId===activeId?0:(c.unreadCount||0)+1}
            return c
          })
        }
        return [{...msg, unreadCount:1}, ...prev]
      })
    })

    socket.on('chat:typing', ({ fromUserId, isTyping }) => {
      if (fromUserId===activeId) setTyping(isTyping)
    })

    return () => { socket.off('chat:message'); socket.off('chat:typing') }
  }, [user, activeUser])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, typing])

  const send = () => {
    if (!input.trim() || !activeUser) return
    const toId = activeUser._id || activeUser.id
    socket.emit('chat:send', { toUserId:toId, text:input.trim() })
    // Optimistic
    setMessages(prev => [...prev, { _id:Date.now(), from:{ _id:myId }, to:{ _id:toId }, text:input.trim(), createdAt:new Date().toISOString(), optimistic:true }])
    setInput('')
    clearTimeout(typingTimer.current)
    socket.emit('chat:typing', { toUserId:toId, isTyping:false })
  }

  const onInputChange = e => {
    setInput(e.target.value)
    if (!activeUser) return
    const toId = activeUser._id || activeUser.id
    socket.emit('chat:typing', { toUserId:toId, isTyping:true })
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(()=>socket.emit('chat:typing',{toUserId:toId,isTyping:false}),1500)
  }

  const onKeyDown = e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()} }

  const activeId = activeUser?._id || activeUser?.id
  const isOnline = activeId ? onlineUsers.includes(activeId?.toString()) : false

  const filtInbox = inbox.filter(c => {
    const o = c.from?._id===myId?.toString() ? c.to : c.from
    return !search || o?.name?.toLowerCase().includes(search.toLowerCase()) || o?.handle?.includes(search)
  })

  const getOther = c => c.from?._id===myId?.toString() ? c.to : c.from

  return (
    <AppLayout sidebar={false}>
      <div className="flex overflow-hidden" style={{ height:'calc(100vh - 56px)' }}>

        {/* Inbox */}
        <div className={`flex-shrink-0 flex-col ${showList?'w-full md:w-72 flex':'hidden md:flex md:w-72'}`}
          style={{ background:'var(--bg2)', borderRight:'1px solid var(--border)' }}>
          <div className="p-4" style={{ borderBottom:'1px solid var(--border)' }}>
            <h2 className="text-base font-black mb-3">💬 Messages</h2>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background:'var(--bg3)', border:'1px solid var(--border)' }}>
              <Search size={13} style={{ color:'var(--muted)', flexShrink:0 }}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..."
                className="flex-1 text-xs outline-none" style={{ background:'transparent', color:'var(--text)', fontFamily:'Syne', minWidth:0 }}/>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadInbox ? <div className="flex justify-center py-6"><Spinner/></div> :
             filtInbox.length===0 ? (
               <div className="text-center py-12 px-4">
                 <div className="text-4xl mb-2 a-float inline-block">💬</div>
                 <p className="font-bold text-sm">No conversations yet</p>
                 <p className="text-xs mt-1" style={{ color:'var(--muted)' }}>Click the chat icon next to any user to start</p>
               </div>
             ) : filtInbox.map((c,i) => {
               const other   = getOther(c)
               const otherId = other?._id||other?.id
               const current = otherId===activeId
               const online  = otherId ? onlineUsers.includes(otherId?.toString()) : false
               return (
                 <button key={i} onClick={()=>openChat(c)}
                   className="w-full flex items-center gap-3 p-4 text-left transition-colors"
                   style={{ background:current?'rgba(124,92,252,.08)':'transparent', borderLeft:`3px solid ${current?'var(--accent)':'transparent'}`, borderBottom:'1px solid rgba(42,43,61,.25)' }}>
                   <div className="relative flex-shrink-0">
                     <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black"
                       style={{ background:other?.color||'linear-gradient(135deg,#7c5cfc,#e040fb)', color:'#fff' }}>
                       {other?.initials||'?'}
                     </div>
                     {online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2" style={{ background:'var(--green)', borderColor:'var(--bg2)' }}/>}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between gap-1">
                       <span className="text-sm font-bold truncate">{other?.name||'User'}</span>
                       <span className="text-xs flex-shrink-0" style={{ color:'var(--muted)', fontFamily:'Space Mono' }}>{c.createdAt?timeAgo(c.createdAt):''}</span>
                     </div>
                     <div className="flex items-center justify-between">
                       <div className="text-xs truncate" style={{ color:'var(--muted)' }}>{c.from?._id===myId?.toString()?'You: ':''}{c.text||''}</div>
                       {c.unreadCount>0 && <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background:'var(--accent)', color:'#fff', fontSize:9 }}>{c.unreadCount}</span>}
                     </div>
                   </div>
                 </button>
               )
             })}
          </div>
        </div>

        {/* Chat window */}
        <div className={`flex-1 flex flex-col min-w-0 ${showList?'hidden md:flex':'flex'}`}>
          {!activeUser ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-3 text-center p-8" style={{ background:'var(--bg1)' }}>
              <div className="text-6xl a-float inline-block">💬</div>
              <p className="font-black text-lg">Select a conversation</p>
              <p className="text-sm" style={{ color:'var(--muted)' }}>Or click the chat icon next to any user's name</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
                <button className="md:hidden p-1 rounded" style={{ color:'var(--muted)' }} onClick={()=>setShowList(true)}>
                  <ChevronLeft size={18}/>
                </button>
                <div className="relative">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ background:activeUser?.color||'linear-gradient(135deg,#7c5cfc,#e040fb)', color:'#fff' }}>
                    {activeUser?.initials||'?'}
                  </div>
                  {isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2" style={{ background:'var(--green)', borderColor:'var(--bg2)' }}/>}
                </div>
                <div>
                  <div className="text-sm font-black">{activeUser?.name||activeUser?.handle||'User'}</div>
                  <div className="text-xs" style={{ color:typing?'var(--accent)':isOnline?'var(--green)':'var(--muted)' }}>
                    {typing ? '✏️ typing...' : isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ background:'var(--bg1)' }}>
                {hasMore && <button onClick={()=>loadConversation(activeId,false)} disabled={loadMsgs} className="text-xs font-bold py-1 text-center" style={{ color:'var(--accent)' }}>
                  {loadMsgs?<Spinner size={14} className="mx-auto"/>:'Load older messages'}
                </button>}
                {loadMsgs&&messages.length===0 ? <div className="flex justify-center py-8"><Spinner/></div> :
                 messages.length===0 ? <div className="flex-1 flex items-center justify-center flex-col gap-2 text-center"><div className="text-4xl a-float inline-block">👋</div><p className="font-bold">Start the conversation!</p></div> :
                 messages.map((msg,i) => {
                   const isMe = (msg.from?._id||msg.from)?.toString() === myId?.toString()
                   return (
                     <div key={msg._id||i} className={`flex ${isMe?'justify-end':'justify-start'}`}>
                       {!isMe && <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black mr-2 flex-shrink-0 self-end"
                         style={{ background:activeUser?.color||'linear-gradient(135deg,#7c5cfc,#e040fb)', color:'#fff' }}>
                         {activeUser?.initials||'?'}
                       </div>}
                       <div className="max-w-[72%]">
                         <div className={`px-4 py-2.5 text-sm leading-relaxed ${isMe?'bub-me':'bub-ot'}`}
                           style={{ background:isMe?'var(--accent)':'var(--bg2)', color:isMe?'#fff':'var(--text)', border:isMe?'none':'1px solid var(--border)', borderRadius:16, opacity:msg.optimistic?.7:1 }}>
                           {msg.text}
                         </div>
                         <div className={`text-xs mt-1 ${isMe?'text-right':''}`} style={{ color:'var(--muted)', fontFamily:'Space Mono' }}>
                           {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : ''}
                         </div>
                       </div>
                     </div>
                   )
                 })}
                {typing && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black mr-2" style={{ background:activeUser?.color||'var(--bg3)', color:'#fff' }}>{activeUser?.initials||'?'}</div>
                    <div className="px-4 py-3 bub-ot flex items-center gap-1" style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16 }}>
                      {[0,1,2].map(k=><div key={k} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background:'var(--muted)', animationDelay:`${k*.15}s` }}/>)}
                    </div>
                  </div>
                )}
                <div ref={endRef}/>
              </div>

              <div className="flex items-end gap-2 p-3 flex-shrink-0" style={{ background:'var(--bg2)', borderTop:'1px solid var(--border)' }}>
                <textarea rows={1} value={input} onChange={onInputChange} onKeyDown={onKeyDown}
                  placeholder={`Message ${activeUser?.name||'user'}...`}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', fontFamily:'Syne', maxHeight:100 }}
                  onFocus={e=>e.target.style.borderColor='var(--accent)'}
                  onBlur={e=>e.target.style.borderColor='var(--border)'}/>
                <button onClick={send} disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 hover:opacity-90 disabled:opacity-40 cursor-pointer"
                  style={{ background:'var(--accent)' }}>
                  <Send size={15} color="#fff"/>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
