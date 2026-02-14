"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ProjectTimer() {
    const [stats, setStats] = useState({
        days: 0,
        hours: 0,
        loading: true,
        error: null as string | null
    })

    useEffect(() => {
        const load = async () => {
            try {
                // 1. Intentar obtener datos
                const { data, error } = await supabase
                    .from('project_metrics')
                    .select('*')
                    .eq('project_name', 'Prevenort')
                    .maybeSingle()

                if (error) throw error

                if (data) {
                    const start = new Date(data.start_date)
                    const now = new Date()
                    const diffTime = Math.max(0, now.getTime() - start.getTime())
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1

                    setStats({
                        days: diffDays,
                        hours: parseFloat(data.effective_hours) || 0,
                        loading: false,
                        error: null
                    })
                } else {
                    // Si no existe, mostrar valores por defecto o error
                    setStats(prev => ({ ...prev, loading: false, error: 'No data' }))
                }
            } catch (e: any) {
                console.error("Timer Fetch Error:", e)
                setStats(prev => ({ ...prev, loading: false, error: e.message }))
            }
        }

        load()

        // Auto-incremento cada minuto (local)
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                setStats(prev => {
                    const newHours = prev.hours + (1 / 60)
                    // Sincronizar silenciosamente
                    supabase
                        .from('project_metrics')
                        .update({ effective_hours: newHours, last_session_update: new Date() })
                        .eq('project_name', 'Prevenort')
                        .then()

                    return { ...prev, hours: newHours }
                })
            }
        }, 60000)

        return () => clearInterval(interval)
    }, [])

    if (stats.loading) return <div className="timer-loading">Cargando métricas...</div>

    return (
        <div className="project-timer">
            <div className="timer-header">
                <span className="dot pulse"></span>
                <span className="timer-title">ESFUERZO PROYECTO</span>
            </div>

            <div className="stats-grid">
                <div className="stat-item">
                    <span className="stat-value">{stats.days}</span>
                    <span className="stat-label">DÍAS CORRIDOS</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{stats.hours.toFixed(1)}</span>
                    <span className="stat-label">HORAS EFECTIVAS</span>
                </div>
            </div>

            {stats.error && <div className="error-note">Offline: {stats.error}</div>}

            <style jsx>{`
                .project-timer {
                    margin: 0.5rem 1rem 1.5rem 1rem;
                    padding: 1.25rem;
                    background: var(--bg-app);
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                    margin-top: auto;
                    backdrop-filter: blur(10px);
                }
                .timer-loading {
                    padding: 1rem;
                    font-size: 0.7rem;
                    color: var(--text-muted);
                    text-align: center;
                }
                .timer-header {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    margin-bottom: 0.8rem;
                }
                .timer-title {
                    font-size: 0.65rem;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    font-weight: 800;
                    color: var(--brand-primary);
                }
                .dot {
                    width: 7px;
                    height: 7px;
                    background: #10b981;
                    border-radius: 50%;
                }
                .pulse {
                    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.5rem;
                }
                .stat-item {
                    display: flex;
                    flex-direction: column;
                }
                .stat-value {
                    font-family: 'Outfit', sans-serif;
                    font-size: 1.4rem;
                    font-weight: 800;
                    color: var(--text-main);
                    line-height: 1;
                }
                .stat-label {
                    font-size: 0.55rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    margin-top: 0.2rem;
                    font-weight: 600;
                }
                .error-note {
                    font-size: 0.5rem;
                    color: var(--danger);
                    margin-top: 0.5rem;
                }
            `}</style>
        </div>
    )
}
