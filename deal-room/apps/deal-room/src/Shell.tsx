import { Outlet, NavLink } from 'react-router-dom'
import { useCurrentUser } from 'lemma-sdk/react'
import { ListTodo, PlusCircle, ClipboardCheck, Building2 } from 'lucide-react'
import { lemmaClient } from './lemma-client'

export function Shell() {
  const { user } = useCurrentUser({ client: lemmaClient })

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-item${isActive ? ' active' : ''}`

  const userName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email
    : 'User'

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Building2 size={22} />
          <span>Deal Room</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" className={linkClass} end>
            <ListTodo size={18} />
            Pipeline
          </NavLink>
          <NavLink to="/create" className={linkClass}>
            <PlusCircle size={18} />
            New Deal
          </NavLink>
          <NavLink to="/review" className={linkClass}>
            <ClipboardCheck size={18} />
            Review
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-user">{userName}</span>
        </div>
      </aside>
      <main className="main-area">
        <Outlet />
      </main>
    </div>
  )
}
