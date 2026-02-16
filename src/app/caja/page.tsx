"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// ── Types ───────────────────────────────────────────────────
interface Factura {
    id: string; numero_factura: string; atencion_id?: string; empresa_id?: string;
    trabajador_nombre?: string; trabajador_rut?: string; monto_total: number;
    monto_pagado: number; estado: string; forma_pago?: string; orden_compra?: string;
    fecha_emision: string; fecha_vencimiento?: string; fecha_pago?: string;
    observaciones?: string; empresas?: { nombre: string };
    factura_items?: FacturaItem[]; pagos?: Pago[];
}
interface FacturaItem {
    id: string; prestacion_nombre: string; prestacion_codigo?: string;
    cantidad: number; precio_unitario: number; subtotal: number;
}
interface Pago {
    id: string; monto: number; forma_pago: string; referencia?: string;
    recibido_por?: string; fecha_pago: string; observaciones?: string;
}
interface Toast { id: number; message: string; type: 'success' | 'error' | 'warning' | 'info' }

// ── Helpers ─────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const estadoBadge: Record<string, { label: string; cls: string }> = {
    pendiente: { label: 'Pendiente', cls: 'badge-pending' },
    parcial: { label: 'Parcial', cls: 'badge-partial' },
    pagada: { label: 'Pagada', cls: 'badge-paid' },
    anulada: { label: 'Anulada', cls: 'badge-voided' },
    vencida: { label: 'Vencida', cls: 'badge-overdue' },
}
const formaLabels: Record<string, string> = {
    efectivo: '💵 Efectivo', transferencia: '🏦 Transferencia',
    cheque: '📝 Cheque', credito: '💳 Crédito', orden_compra: '📋 Orden de Compra',
}

export default function CajaPage() {
    const [facturas, setFacturas] = useState<Factura[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterEstado, setFilterEstado] = useState('')
    const [filterForma, setFilterForma] = useState('')
    const [sortCol, setSortCol] = useState<'fecha_emision' | 'monto_total' | 'numero_factura' | 'estado'>('fecha_emision')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
    const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null)
    const [showPayPanel, setShowPayPanel] = useState(false)
    const [showClosePanel, setShowClosePanel] = useState(false)
    const [payForm, setPayForm] = useState({ monto: 0, forma_pago: 'efectivo', referencia: '', observaciones: '' })
    const [toasts, setToasts] = useState<Toast[]>([])
    const toastId = { current: 0 }

    const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        const id = ++toastId.current
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500)
    }, [])

    useEffect(() => { fetchFacturas() }, [])

    async function fetchFacturas() {
        setLoading(true)
        const { data, error } = await supabase
            .from('facturas')
            .select('*, empresas(nombre), factura_items(*), pagos(*)')
            .order('fecha_emision', { ascending: false })
        if (error) { showToast('Error cargando facturas: ' + error.message, 'error'); setLoading(false); return }
        if (data) setFacturas(data)
        setLoading(false)
    }

    // ── KPIs ────────────────────────────────────────────────
    const kpis = useMemo(() => {
        const total = facturas.reduce((s, f) => s + (f.monto_total || 0), 0)
        const cobrado = facturas.reduce((s, f) => s + (f.monto_pagado || 0), 0)
        const pendiente = total - cobrado
        const pagadas = facturas.filter(f => f.estado === 'pagada').length
        const porCobrar = facturas.filter(f => f.estado === 'pendiente' || f.estado === 'parcial').length
        return { total, cobrado, pendiente, pagadas, porCobrar, count: facturas.length }
    }, [facturas])

    // ── Filtered + Sorted ───────────────────────────────────
    const filtered = useMemo(() => {
        let data = [...facturas]
        if (search.trim()) {
            const q = search.toLowerCase()
            data = data.filter(f =>
                (f.numero_factura || '').toLowerCase().includes(q) ||
                (f.trabajador_nombre || '').toLowerCase().includes(q) ||
                (f.trabajador_rut || '').toLowerCase().includes(q) ||
                (f.empresas?.nombre || '').toLowerCase().includes(q) ||
                (f.orden_compra || '').toLowerCase().includes(q)
            )
        }
        if (filterEstado) data = data.filter(f => f.estado === filterEstado)
        if (filterForma) data = data.filter(f => f.forma_pago === filterForma)
        data.sort((a, b) => {
            let va: string | number, vb: string | number
            if (sortCol === 'monto_total') { va = a.monto_total; vb = b.monto_total }
            else { va = (a[sortCol] || '').toString(); vb = (b[sortCol] || '').toString() }
            if (va < vb) return sortDir === 'asc' ? -1 : 1
            if (va > vb) return sortDir === 'asc' ? 1 : -1
            return 0
        })
        return data
    }, [facturas, search, filterEstado, filterForma, sortCol, sortDir])

    const toggleSort = (col: typeof sortCol) => {
        if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortCol(col); setSortDir('asc') }
    }

    // ── Register Payment ────────────────────────────────────
    async function registerPayment() {
        if (!selectedFactura || payForm.monto <= 0) { showToast('Monto inválido', 'warning'); return }
        const saldo = selectedFactura.monto_total - selectedFactura.monto_pagado
        if (payForm.monto > saldo) { showToast('El monto excede el saldo pendiente', 'warning'); return }

        const { error: payErr } = await supabase.from('pagos').insert([{
            factura_id: selectedFactura.id,
            monto: payForm.monto,
            forma_pago: payForm.forma_pago,
            referencia: payForm.referencia || null,
            observaciones: payForm.observaciones || null,
        }])
        if (payErr) { showToast('Error registrando pago: ' + payErr.message, 'error'); return }

        const newPagado = selectedFactura.monto_pagado + payForm.monto
        const newEstado = newPagado >= selectedFactura.monto_total ? 'pagada' : 'parcial'
        await supabase.from('facturas').update({
            monto_pagado: newPagado,
            estado: newEstado,
            forma_pago: payForm.forma_pago,
            fecha_pago: newEstado === 'pagada' ? new Date().toISOString() : null,
        }).eq('id', selectedFactura.id)

        showToast(`Pago de ${fmt(payForm.monto)} registrado ✓`, 'success')
        setShowPayPanel(false)
        setPayForm({ monto: 0, forma_pago: 'efectivo', referencia: '', observaciones: '' })
        setSelectedFactura(null)
        fetchFacturas()
    }

    // ── Daily Close ─────────────────────────────────────────
    async function closeDailyCash() {
        const today = new Date().toISOString().split('T')[0]
        const todayFacturas = facturas.filter(f => f.fecha_emision?.startsWith(today))
        const totals = { efectivo: 0, transferencia: 0, cheque: 0, credito: 0, orden_compra: 0 }
        for (const f of todayFacturas) {
            for (const p of (f.pagos || [])) {
                const key = p.forma_pago as keyof typeof totals
                if (key in totals) totals[key] += p.monto
            }
        }
        const general = Object.values(totals).reduce((s, v) => s + v, 0)
        const { error } = await supabase.from('cierres_caja').upsert([{
            fecha: today,
            total_efectivo: totals.efectivo,
            total_transferencia: totals.transferencia,
            total_cheque: totals.cheque,
            total_credito: totals.credito,
            total_orden_compra: totals.orden_compra,
            total_general: general,
            facturas_emitidas: todayFacturas.length,
            facturas_pagadas: todayFacturas.filter(f => f.estado === 'pagada').length,
        }], { onConflict: 'fecha' })
        if (error) { showToast('Error en cierre: ' + error.message, 'error'); return }
        showToast(`Cierre de caja realizado: ${fmt(general)}`, 'success')
        setShowClosePanel(false)
    }

    // ── Void Invoice ────────────────────────────────────────
    async function voidInvoice(f: Factura) {
        if (f.estado === 'pagada') { showToast('No se puede anular una factura pagada', 'warning'); return }
        const { error } = await supabase.from('facturas').update({ estado: 'anulada' }).eq('id', f.id)
        if (error) { showToast('Error: ' + error.message, 'error'); return }
        showToast('Factura anulada', 'info')
        fetchFacturas()
    }

    const openPay = (f: Factura) => {
        setSelectedFactura(f)
        setPayForm({ monto: f.monto_total - f.monto_pagado, forma_pago: f.forma_pago || 'efectivo', referencia: '', observaciones: '' })
        setShowPayPanel(true)
    }

    // ── Render ───────────────────────────────────────────────
    return (
        <div className="caja-page animate-fade">
            <header className="caja-header">
                <div>
                    <h1>💰 Caja — Conciliación de Pagos</h1>
                    <p>Gestión de facturas, cobros y cierre de caja diario</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-outline" onClick={() => setShowClosePanel(true)}>📊 Cierre de Caja</button>
                </div>
            </header>

            {/* KPIs */}
            <section className="kpi-row">
                <div className="kpi"><span className="kpi-label">Total Facturado</span><span className="kpi-val">{fmt(kpis.total)}</span></div>
                <div className="kpi kpi-success"><span className="kpi-label">Cobrado</span><span className="kpi-val">{fmt(kpis.cobrado)}</span></div>
                <div className="kpi kpi-warning"><span className="kpi-label">Por Cobrar</span><span className="kpi-val">{fmt(kpis.pendiente)}</span></div>
                <div className="kpi"><span className="kpi-label">Facturas</span><span className="kpi-val">{kpis.count}</span></div>
                <div className="kpi kpi-info"><span className="kpi-label">Pagadas</span><span className="kpi-val">{kpis.pagadas}</span></div>
                <div className="kpi kpi-danger"><span className="kpi-label">Pendientes</span><span className="kpi-val">{kpis.porCobrar}</span></div>
            </section>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <span>🔍</span>
                    <input type="text" placeholder="Buscar factura, paciente, empresa, OC..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}>
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="parcial">Parcial</option>
                    <option value="pagada">Pagada</option>
                    <option value="anulada">Anulada</option>
                    <option value="vencida">Vencida</option>
                </select>
                <select value={filterForma} onChange={e => setFilterForma(e.target.value)}>
                    <option value="">Forma de pago</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="cheque">Cheque</option>
                    <option value="credito">Crédito</option>
                    <option value="orden_compra">Orden de Compra</option>
                </select>
                {(search || filterEstado || filterForma) && (
                    <button className="btn-clear" onClick={() => { setSearch(''); setFilterEstado(''); setFilterForma('') }}>✕ Limpiar</button>
                )}
            </div>

            {/* Table */}
            <div className="table-container">
                {loading ? <div className="loading-state">Cargando facturas...</div> : (
                    <table className="caja-table">
                        <thead>
                            <tr>
                                <th onClick={() => toggleSort('numero_factura')} className="sortable">N° Factura {sortCol === 'numero_factura' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                                <th>Paciente</th>
                                <th>Empresa</th>
                                <th onClick={() => toggleSort('monto_total')} className="sortable">Monto {sortCol === 'monto_total' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                                <th>Pagado</th>
                                <th>Saldo</th>
                                <th onClick={() => toggleSort('estado')} className="sortable">Estado {sortCol === 'estado' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                                <th onClick={() => toggleSort('fecha_emision')} className="sortable">Fecha {sortCol === 'fecha_emision' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                                <th>Forma</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={10} className="empty-row">No se encontraron facturas</td></tr>
                            ) : filtered.map(f => {
                                const saldo = f.monto_total - f.monto_pagado
                                const badge = estadoBadge[f.estado] || estadoBadge.pendiente
                                return (
                                    <tr key={f.id} className={f.estado === 'anulada' ? 'row-voided' : ''}>
                                        <td className="mono">{f.numero_factura}</td>
                                        <td>
                                            <div className="cell-name">{f.trabajador_nombre || '—'}</div>
                                            <div className="cell-sub">{f.trabajador_rut || ''}</div>
                                        </td>
                                        <td>{f.empresas?.nombre || '—'}</td>
                                        <td className="mono">{fmt(f.monto_total)}</td>
                                        <td className="mono text-success">{fmt(f.monto_pagado)}</td>
                                        <td className={`mono ${saldo > 0 ? 'text-danger' : ''}`}>{fmt(saldo)}</td>
                                        <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                                        <td>{fmtDate(f.fecha_emision)}</td>
                                        <td className="cell-sub">{f.forma_pago ? formaLabels[f.forma_pago] || f.forma_pago : '—'}</td>
                                        <td>
                                            <div className="action-btns">
                                                {(f.estado === 'pendiente' || f.estado === 'parcial') && (
                                                    <button className="btn-sm btn-pay" onClick={() => openPay(f)} title="Registrar Pago">💰</button>
                                                )}
                                                <button className="btn-sm btn-view" onClick={() => setSelectedFactura(selectedFactura?.id === f.id ? null : f)} title="Ver Detalle">📋</button>
                                                {f.estado !== 'pagada' && f.estado !== 'anulada' && (
                                                    <button className="btn-sm btn-void" onClick={() => voidInvoice(f)} title="Anular">🚫</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Detail Panel */}
            {selectedFactura && !showPayPanel && (
                <div className="detail-panel">
                    <div className="panel-header">
                        <h3>Detalle: {selectedFactura.numero_factura}</h3>
                        <button className="btn-close" onClick={() => setSelectedFactura(null)}>✕</button>
                    </div>
                    <div className="detail-grid">
                        <div><span className="dl">Paciente</span><span className="dv">{selectedFactura.trabajador_nombre}</span></div>
                        <div><span className="dl">RUT</span><span className="dv">{selectedFactura.trabajador_rut}</span></div>
                        <div><span className="dl">Empresa</span><span className="dv">{selectedFactura.empresas?.nombre}</span></div>
                        <div><span className="dl">OC</span><span className="dv">{selectedFactura.orden_compra || '—'}</span></div>
                        <div><span className="dl">Vencimiento</span><span className="dv">{selectedFactura.fecha_vencimiento ? fmtDate(selectedFactura.fecha_vencimiento) : '—'}</span></div>
                        <div><span className="dl">Total</span><span className="dv mono">{fmt(selectedFactura.monto_total)}</span></div>
                    </div>
                    {(selectedFactura.factura_items || []).length > 0 && (
                        <>
                            <h4>Prestaciones</h4>
                            <table className="mini-table">
                                <thead><tr><th>Código</th><th>Examen</th><th>P. Unit.</th><th>Subtotal</th></tr></thead>
                                <tbody>
                                    {(selectedFactura.factura_items || []).map(it => (
                                        <tr key={it.id}><td className="mono">{it.prestacion_codigo}</td><td>{it.prestacion_nombre}</td><td className="mono">{fmt(it.precio_unitario)}</td><td className="mono">{fmt(it.subtotal)}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                    {(selectedFactura.pagos || []).length > 0 && (
                        <>
                            <h4>Historial de Pagos</h4>
                            <table className="mini-table">
                                <thead><tr><th>Fecha</th><th>Monto</th><th>Forma</th><th>Ref.</th></tr></thead>
                                <tbody>
                                    {(selectedFactura.pagos || []).map(p => (
                                        <tr key={p.id}><td>{fmtDate(p.fecha_pago)}</td><td className="mono text-success">{fmt(p.monto)}</td><td>{formaLabels[p.forma_pago] || p.forma_pago}</td><td className="mono">{p.referencia || '—'}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            )}

            {/* Payment Panel */}
            {showPayPanel && selectedFactura && (
                <div className="overlay" onClick={() => setShowPayPanel(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>💰 Registrar Pago</h3>
                        <p className="modal-sub">{selectedFactura.numero_factura} — {selectedFactura.trabajador_nombre}</p>
                        <div className="modal-info">
                            <span>Total: <b>{fmt(selectedFactura.monto_total)}</b></span>
                            <span>Pagado: <b className="text-success">{fmt(selectedFactura.monto_pagado)}</b></span>
                            <span>Saldo: <b className="text-danger">{fmt(selectedFactura.monto_total - selectedFactura.monto_pagado)}</b></span>
                        </div>
                        <div className="form-fields">
                            <label>Monto a Pagar
                                <input type="number" value={payForm.monto} onChange={e => setPayForm({ ...payForm, monto: Number(e.target.value) })} />
                            </label>
                            <label>Forma de Pago
                                <select value={payForm.forma_pago} onChange={e => setPayForm({ ...payForm, forma_pago: e.target.value })}>
                                    <option value="efectivo">Efectivo</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="credito">Crédito</option>
                                    <option value="orden_compra">Orden de Compra</option>
                                </select>
                            </label>
                            <label>Referencia / N° Comprobante
                                <input type="text" value={payForm.referencia} onChange={e => setPayForm({ ...payForm, referencia: e.target.value })} placeholder="Ej: TRF-123456" />
                            </label>
                            <label>Observaciones
                                <input type="text" value={payForm.observaciones} onChange={e => setPayForm({ ...payForm, observaciones: e.target.value })} />
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-outline" onClick={() => setShowPayPanel(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={registerPayment}>Confirmar Pago</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Close Cash Panel */}
            {showClosePanel && (
                <div className="overlay" onClick={() => setShowClosePanel(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>📊 Cierre de Caja del Día</h3>
                        <p className="modal-sub">Resumen consolidado de cobros del día {new Date().toLocaleDateString('es-CL')}</p>
                        <div className="close-summary">
                            {(['efectivo', 'transferencia', 'cheque', 'credito', 'orden_compra'] as const).map(fp => {
                                const today = new Date().toISOString().split('T')[0]
                                const total = facturas
                                    .filter(f => f.fecha_emision?.startsWith(today))
                                    .flatMap(f => f.pagos || [])
                                    .filter(p => p.forma_pago === fp)
                                    .reduce((s, p) => s + p.monto, 0)
                                return (
                                    <div key={fp} className="close-row">
                                        <span>{formaLabels[fp]}</span>
                                        <span className="mono">{fmt(total)}</span>
                                    </div>
                                )
                            })}
                            <div className="close-row close-total">
                                <span><b>TOTAL DEL DÍA</b></span>
                                <span className="mono"><b>{fmt(
                                    facturas
                                        .filter(f => f.fecha_emision?.startsWith(new Date().toISOString().split('T')[0]))
                                        .flatMap(f => f.pagos || [])
                                        .reduce((s, p) => s + p.monto, 0)
                                )}</b></span>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-outline" onClick={() => setShowClosePanel(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={closeDailyCash}>Confirmar Cierre</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toasts */}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
                ))}
            </div>

            <style jsx>{`
                .caja-page { display: flex; flex-direction: column; gap: 1.5rem; }
                .caja-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
                .caja-header h1 { font-size: 1.8rem; }
                .caja-header p { color: var(--text-muted); font-size: 0.9rem; }
                .header-actions { display: flex; gap: 0.75rem; }

                /* KPIs */
                .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; }
                .kpi { background: var(--bg-card); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 0.3rem; box-shadow: var(--shadow-sm); }
                .kpi-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
                .kpi-val { font-size: 1.6rem; font-weight: 800; font-family: 'Outfit', sans-serif; }
                .kpi-success .kpi-val { color: var(--success); }
                .kpi-warning .kpi-val { color: var(--warning); }
                .kpi-danger .kpi-val { color: var(--danger); }
                .kpi-info .kpi-val { color: var(--info); }

                /* Filters */
                .filters-bar { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
                .search-box { display: flex; align-items: center; gap: 0.5rem; background: #000; border: 1px solid rgba(255,255,255,0.15); border-radius: var(--radius-sm); padding: 0 1rem; flex: 1; min-width: 260px; }
                .search-box input { background: transparent; border: none; color: #fff; padding: 0.75rem 0; width: 100%; font-size: 0.9rem; outline: none; }
                .search-box input::placeholder { color: rgba(255,255,255,0.35); }
                .filters-bar select { background: #000; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: var(--radius-sm); padding: 0.75rem 1rem; font-size: 0.85rem; appearance: none; cursor: pointer; min-width: 160px; }
                .btn-clear { background: rgba(239,68,68,0.15); color: var(--danger); border: none; padding: 0.6rem 1rem; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 600; cursor: pointer; }

                /* Table */
                .table-container { background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color); overflow-x: auto; }
                .caja-table { width: 100%; border-collapse: collapse; }
                .caja-table th { text-align: left; padding: 0.9rem 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); border-bottom: 2px solid var(--border-color); font-weight: 700; white-space: nowrap; }
                .caja-table th.sortable { cursor: pointer; }
                .caja-table th.sortable:hover { color: var(--brand-primary); }
                .caja-table td { padding: 0.8rem 1rem; border-bottom: 1px solid var(--border-dim); font-size: 0.88rem; vertical-align: middle; }
                .caja-table tbody tr:hover { background: var(--brand-primary-light); }
                .row-voided { opacity: 0.45; text-decoration: line-through; }
                .cell-name { font-weight: 600; font-size: 0.88rem; }
                .cell-sub { font-size: 0.75rem; color: var(--text-muted); }
                .mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.85rem; }
                .text-success { color: var(--success); }
                .text-danger { color: var(--danger); }
                .empty-row { text-align: center; padding: 3rem 1rem !important; color: var(--text-muted); }
                .loading-state { text-align: center; padding: 3rem; color: var(--text-muted); }

                /* Badges */
                .badge { padding: 0.25rem 0.65rem; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; white-space: nowrap; }
                .badge-paid { background: rgba(16,185,129,0.15); color: var(--success); }
                .badge-pending { background: rgba(245,158,11,0.12); color: var(--warning); }
                .badge-partial { background: rgba(59,130,246,0.12); color: var(--info); }
                .badge-overdue { background: rgba(239,68,68,0.12); color: var(--danger); }
                .badge-voided { background: rgba(100,116,139,0.12); color: var(--text-muted); }

                /* Action Buttons */
                .action-btns { display: flex; gap: 0.4rem; }
                .btn-sm { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.85rem; background: var(--bg-card); transition: var(--transition); }
                .btn-sm:hover { transform: scale(1.1); }
                .btn-pay:hover { background: rgba(16,185,129,0.15); border-color: var(--success); }
                .btn-view:hover { background: rgba(59,130,246,0.1); border-color: var(--info); }
                .btn-void:hover { background: rgba(239,68,68,0.1); border-color: var(--danger); }

                .btn-outline { background: transparent; border: 1px solid var(--border-color); color: var(--text-main); padding: 0.65rem 1.2rem; border-radius: var(--radius-sm); font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: var(--transition); }
                .btn-outline:hover { border-color: var(--brand-primary); color: var(--brand-primary); }

                /* Detail Panel */
                .detail-panel { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.5rem; }
                .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .panel-header h3 { font-size: 1.1rem; }
                .btn-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-card); cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; }
                .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.8rem; margin-bottom: 1.25rem; }
                .dl { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; display: block; }
                .dv { font-size: 0.95rem; font-weight: 600; }
                .detail-panel h4 { font-size: 0.85rem; margin: 1rem 0 0.5rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
                .mini-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
                .mini-table th { text-align: left; padding: 0.5rem 0.75rem; font-size: 0.7rem; color: var(--text-muted); border-bottom: 1px solid var(--border-color); text-transform: uppercase; }
                .mini-table td { padding: 0.5rem 0.75rem; font-size: 0.82rem; border-bottom: 1px solid var(--border-dim); }

                /* Modal / Overlay */
                .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 2rem; width: 100%; max-width: 520px; box-shadow: var(--shadow-lg); }
                .modal h3 { font-size: 1.3rem; margin-bottom: 0.25rem; }
                .modal-sub { color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.25rem; }
                .modal-info { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; padding: 1rem; background: var(--bg-app); border-radius: var(--radius-sm); flex-wrap: wrap; }
                .modal-info span { font-size: 0.85rem; color: var(--text-muted); }
                .form-fields { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
                .form-fields label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
                .form-fields input, .form-fields select { padding: 0.7rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-main); font-size: 0.9rem; }
                .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }

                /* Close Cash Summary */
                .close-summary { display: flex; flex-direction: column; gap: 0.5rem; margin: 1.5rem 0; }
                .close-row { display: flex; justify-content: space-between; padding: 0.65rem 1rem; background: var(--bg-app); border-radius: var(--radius-sm); }
                .close-total { background: var(--brand-primary-light); border: 1px solid var(--brand-primary); margin-top: 0.5rem; }

                /* Toast */
                .toast-container { position: fixed; top: 1.5rem; right: 1.5rem; z-index: 9999; display: flex; flex-direction: column; gap: 0.5rem; }
                .toast { padding: 0.85rem 1.25rem; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 600; animation: fadeIn 0.3s ease-out; box-shadow: var(--shadow-md); }
                .toast-success { background: rgba(16,185,129,0.15); color: var(--success); border: 1px solid var(--success); }
                .toast-error { background: rgba(239,68,68,0.15); color: var(--danger); border: 1px solid var(--danger); }
                .toast-warning { background: rgba(245,158,11,0.15); color: var(--warning); border: 1px solid var(--warning); }
                .toast-info { background: rgba(59,130,246,0.12); color: var(--info); border: 1px solid var(--info); }

                @media (max-width: 768px) {
                    .kpi-row { grid-template-columns: repeat(2, 1fr); }
                    .filters-bar { flex-direction: column; }
                    .caja-header { flex-direction: column; align-items: flex-start; }
                }
            `}</style>
        </div>
    )
}
