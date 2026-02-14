"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
    const pathname = usePathname()

    const links = [
        { name: 'Dashboard', href: '/', icon: '📊' },
        { name: 'Admisión', href: '/admision', icon: '📝' },
        { name: 'Evaluación', href: '/evaluacion', icon: '🩺' },
        { name: 'Remediación', href: '/remediacion', icon: '♻️' },
        { name: 'Certificados', href: '/certificados', icon: '📜' },
        { name: 'Configuración', href: '/config', icon: '⚙️' },
    ]

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <span className="logo-text">PREVENORT</span>
                <span className="logo-subtext">FAST-TRACK</span>
            </div>

            <nav className="sidebar-nav">
                {links.map((link) => {
                    const isActive = pathname === link.href
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{link.icon}</span>
                            <span className="nav-label">{link.name}</span>
                        </Link>
                    )
                })}
            </nav>

            <style jsx>{`
        .sidebar {
          width: 260px;
          height: 100vh;
          background: var(--brand-secondary);
          color: white;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
        }

        .sidebar-logo {
          padding: 2.5rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .logo-text {
          font-family: 'Outfit', sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--brand-primary);
        }

        .logo-subtext {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.3em;
          opacity: 0.7;
        }

        .sidebar-nav {
          flex: 1;
          padding: 0 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: var(--radius-sm);
          transition: var(--transition);
          text-decoration: none;
          color: rgba(255,255,255,0.7);
        }

        .nav-item:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }

        .nav-item.active {
          background: var(--brand-primary);
          color: white;
          font-weight: 600;
        }

        .nav-icon {
          font-size: 1.25rem;
        }

        .nav-label {
          font-size: 0.95rem;
        }
      `}</style>
        </aside>
    )
}
