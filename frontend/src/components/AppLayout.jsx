import { useState } from 'react'
import Sidebar from '../components/Sidebar'

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main style={{
        marginLeft: collapsed ? '72px' : '260px',
        flex: 1,
        transition: 'margin-left 0.3s ease',
        background: 'var(--bg-dark)',
        minHeight: '100vh',
      }}>
        {children}
      </main>
    </div>
  )
}
