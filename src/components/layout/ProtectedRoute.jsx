import { Navigate } from 'react-router-dom'
import { useAuth }  from '../../context/AuthContext'
import { Spinner }  from '../ui/Ui'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'var(--bg1)' }}>
      <div className="flex flex-col items-center gap-3">
        <Spinner size={32}/>
        <p className="text-sm font-bold g-text">Loading Qrownd...</p>
      </div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace/>
}
