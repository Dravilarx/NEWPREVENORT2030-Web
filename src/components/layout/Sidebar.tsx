'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ProjectTimer from './ProjectTimer'

const menuItems = [
  { name: 'Dashboard', path: '/' },
  { name: 'Admisión', path: '/admision' },
  { name: 'Evaluación', path: '/evaluacion' },
  { name: 'Remediación', path: '/remediacion' },
  { name: 'Certificados', path: '/certificados' },
  { name: 'Caja', path: '/caja' },
  { name: 'Portal Empresa', path: '/portal-empresa' },
  { name: 'Configuración', path: '/config' },
]

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

  if (pathname?.startsWith('/verificar')) return null

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-logo">PREVENORT</span>
        <span className="brand-tag">FAST-TRACK</span>
      </div>

      <nav className="sidebar-nav scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path))
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-btn ${isActive ? 'active' : ''}`}
            >
              <span className="nav-label">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <ProjectTimer />
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
        </button>
      </div>
    </aside>
  )
}
