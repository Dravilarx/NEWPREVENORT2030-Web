"use client"

import { useState, useEffect } from 'react' // Added useState and useEffect
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ProjectTimer from './ProjectTimer'

export default function Sidebar() {
  const pathname = usePathname()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  if (pathname.startsWith('/verificar')) return null

  const links = [
    { name: 'Dashboard', href: '/' },
    { name: 'Admisión', href: '/admision' },
    { name: 'Evaluación', href: '/evaluacion' },
    { name: 'Remediación', href: '/remediacion' },
    { name: 'Certificados', href: '/certificados' },
    { name: 'Portal Empresa', href: '/portal-empresa' },
    { name: 'Configuración', href: '/config' },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-text">PREVENORT</span>
        <span className="logo-subtext">FAST-TRACK</span>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href))

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-dot"></span>
              <span className="nav-label">{link.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={toggleTheme} title="Cambiar Tema">
          {theme === 'light' ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
        </button>
        <ProjectTimer />
      </div>

      <style jsx>{`
        .sidebar {
          width: 260px;
          height: 100vh;
          background: var(--sidebar-bg);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
          transition: var(--transition);
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
          font-weight: 600;
          letter-spacing: 0.3em;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .sidebar-nav {
          flex: 1;
          padding: 0 0.8rem;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .nav-item {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          padding: 0.8rem 1rem;
          border-radius: 12px;
          transition: all 0.2s ease;
          text-decoration: none !important;
          color: var(--sidebar-text) !important;
          font-weight: 500;
          gap: 0.8rem !important;
        }

        .nav-item:hover {
          background: var(--sidebar-active-bg);
          color: var(--brand-primary) !important;
        }

        .nav-item.active {
          background: var(--brand-primary);
          color: white !important;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(255, 102, 0, 0.2);
        }

        .nav-dot {
          width: 8px;
          height: 8px;
          background: var(--text-muted);
          border-radius: 50%;
          opacity: 0.5;
          transition: var(--transition);
          flex-shrink: 0;
          display: block;
        }

        .nav-item:hover .nav-dot,
        .nav-item.active .nav-dot {
          background: var(--brand-primary);
          opacity: 1;
          transform: scale(1.2);
        }

        .nav-item.active .nav-dot {
          background: white;
        }

        .nav-label {
          font-size: 0.95rem;
          white-space: nowrap;
        }

        .sidebar-footer {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .theme-toggle {
          background: var(--bg-app);
          border: 1px solid var(--border-color);
          padding: 0.6rem;
          border-radius: 10px;
          color: var(--text-main);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .theme-toggle:hover {
          border-color: var(--brand-primary);
          color: var(--brand-primary);
        }
      `}</style>
    </aside>
  )
}
