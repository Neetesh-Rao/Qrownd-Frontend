// AppLayout.jsx
import Navbar    from './Navbar'
import Sidebar   from './Sidebar'
import MobileNav from './MobileNav'

export default function AppLayout({ children, sidebar=true, right=null }) {
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg1)' }}>
      <Navbar/>
      <div className="flex" style={{ minHeight:'calc(100vh - 56px)' }}>
        {sidebar && <Sidebar/>}
        <main className="main-scroll flex-1 min-w-0">{children}</main>
        {right && <div className="right-panel">{right}</div>}
      </div>
      <MobileNav/>
    </div>
  )
}
