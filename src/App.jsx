// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider }  from './context/ThemeContext'
import { AuthProvider }   from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { useAuth }        from './context/AuthContext'
import { useNotifications } from './hooks/useNotifications'

import LoginPage     from './pages/LoginPage'
import SignupPage    from './pages/SignupPage'
import FeedPage      from './pages/FeedPage'
import PostPage      from './pages/PostPage'
import ArenaPage     from './pages/ArenaPage'
import ChatPage      from './pages/ChatPage'
import RankingsPage  from './pages/RankingsPage'
import ProfilePage   from './pages/ProfilePage'
import ProtectedRoute from './components/layout/ProtectedRoute'

function Inner() {
  const { user } = useAuth()
  useNotifications(user)
  return (
    <Routes>
      <Route path="/login"    element={<LoginPage/>}/>
      <Route path="/signup"   element={<SignupPage/>}/>
      <Route path="/feed"     element={<FeedPage/>}/>
      <Route path="/post/:id" element={<PostPage/>}/>
      <Route path="/arena"    element={<ArenaPage/>}/>
      <Route path="/rankings" element={<RankingsPage/>}/>
      <Route path="/chat"     element={<ProtectedRoute><ChatPage/></ProtectedRoute>}/>
      <Route path="/profile"  element={<ProtectedRoute><ProfilePage/></ProtectedRoute>}/>
      <Route path="/"         element={<Navigate to="/feed" replace/>}/>
      <Route path="*"         element={<Navigate to="/feed" replace/>}/>
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Inner/>
          </BrowserRouter>
          <Toaster
            position="bottom-right"
            gutter={8}
            toastOptions={{
              duration: 3500,
              style: {
                background:   'var(--bg2)',
                color:        'var(--text)',
                border:       '1px solid var(--border)',
                fontFamily:   'Syne, sans-serif',
                fontSize:     '13px',
                fontWeight:   '600',
                borderRadius: '10px',
                padding:      '12px 16px',
                maxWidth:     '340px',
                boxShadow:    '0 8px 24px rgba(0,0,0,.35)',
              },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
