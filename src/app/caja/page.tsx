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
    const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false)
    const [pendingAttentions, setPendingAttentions] = useState<any[]>([])
    const [selectedCompanyId, setSelectedCompanyId] = useState('')
    const [selectedAttentions, setSelectedAttentions] = useState<Set<string>>(new Set())
    const [empresas, setEmpresas] = useState<any[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [payForm, setPayForm] = useState({
        monto: 0,
        forma_pago: 'transferencia',
        referencia: '',
        observaciones: '',
        fecha_abono: new Date().toISOString().split('T')[0],
        banco_destino: ''
    })
    const [folioReal, setFolioReal] = useState('')
    const [aptitudFilter, setAptitudFilter] = useState('todos')
    const [activeTab, setActiveTab] = useState('arqueo') // 'arqueo' | 'seguimiento'
    const [toasts, setToasts] = useState<Toast[]>([])
    const toastId = { current: 0 }

    const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        const id = ++toastId.current
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500)
    }, [])

    useEffect(() => {
        fetchFacturas()
        fetchInitialData()
    }, [])

    async function fetchInitialData() {
        const { data: emps } = await supabase.from('empresas').select('id, nombre').order('nombre')
        if (emps) setEmpresas(emps)
        fetchPendingAttentions()
    }

    async function fetchPendingAttentions() {
        const { data, error } = await supabase
            .from('atenciones')
            .select(`
                id,
                created_at,
                orden_compra,
                trabajadores(nombre_completo, rut),
                empresas(id, nombre),
                atencion_examenes(
                    prestaciones(id, nombre, codigo, costo)
                )
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching pending:', error)
            return
        }

        // Para filtrar atenciones que NO tienen factura, necesitamos saber cuáles ya están facturadas
        const { data: invoiced } = await supabase.from('facturas').select('atencion_id').not('atencion_id', 'is', null)
        const invoicedIds = new Set(invoiced?.map(i => i.atencion_id) || [])

        if (data) {
            const processed = (data as any[]).map(a => {
                const examenesArray = a.atencion_examenes || []
                const total = examenesArray.reduce((acc: number, item: any) => {
                    const costo = Number(item.prestaciones?.costo) || 0
                    return acc + costo
                }, 0)

                return {
                    id: a.id,
                    nombre_completo: a.trabajadores?.nombre_completo || 'Sin Nombre',
                    rut: a.trabajadores?.rut || 'S/R',
                    empresa_nombre: a.empresas?.nombre || 'Particular',
                    empresa_id: a.empresas?.id,
                    orden_compra: a.orden_compra,
                    aptitud: a.aptitud || 'pendiente', // Asumiendo que existe el campo aptitud
                    total_atencion: total,
                    examenes: examenesArray.map((item: any) => ({
                        id: item.prestaciones?.id,
                        nombre: item.prestaciones?.nombre,
                        codigo: item.prestaciones?.codigo,
                        costo: Number(item.prestaciones?.costo) || 0
                    }))
                }
            })
            setPendingAttentions(processed.filter(a => !invoicedIds.has(a.id)))
        }
    }

    const filteredPending = useMemo(() => {
        let list = pendingAttentions;
        if (selectedCompanyId) list = list.filter(a => a.empresa_id === selectedCompanyId);
        if (aptitudFilter !== 'todos') list = list.filter(a => a.aptitud === aptitudFilter);
        return list;
    }, [pendingAttentions, selectedCompanyId, aptitudFilter]);

    const handleSelectAll = (checked: boolean) => {
        const newSelected = new Set(selectedAttentions);
        filteredPending.forEach(a => {
            if (checked) newSelected.add(a.id);
            else newSelected.delete(a.id);
        });
        setSelectedAttentions(newSelected);
    };

    async function generateInvoice() {
        if (!selectedCompanyId || selectedAttentions.size === 0) {
            showToast('Seleccione una empresa y al menos una atención', 'warning')
            return
        }
        if (!folioReal) {
            showToast('Debe ingresar el número de factura (Folio SII)', 'warning')
            return
        }
        setIsGenerating(true)

        const selected = pendingAttentions.filter(a => selectedAttentions.has(a.id))
        const totalFactura = selected.reduce((s, a) => s + (Number(a.total_atencion) || 0), 0)

        // Verificamos si el folio ya existe para evitar duplicados
        const { data: existing } = await supabase.from('facturas').select('id').eq('numero_factura', folioReal).single()
        if (existing) {
            showToast(`El Folio ${folioReal} ya existe en el sistema`, 'error')
            setIsGenerating(false)
            return
        }

        try {
            // Creamos la factura
            const { data: inv, error: invErr } = await supabase.from('facturas').insert({
                numero_factura: folioReal, // Usamos el Folio real del SII
                empresa_id: selectedCompanyId,
                trabajador_nombre: selected.length === 1 ? selected[0].nombre_completo : `Consolidado: ${selected.length} Trabajadores`,
                trabajador_rut: selected.length === 1 ? selected[0].rut : 'MULTIPLE',
                monto_total: totalFactura,
                monto_pagado: 0,
                estado: 'pendiente',
                fecha_emision: new Date().toISOString(),
                observaciones: `Factura consolidada para empresa ${selected[0]?.empresa_nombre}`
            }).select().single()

            if (invErr) throw invErr

            // Insertamos los ítems desglosados
            for (const atencion of selected) {
                if (atencion.examenes && atencion.examenes.length > 0) {
                    const items = atencion.examenes.map((ex: any) => ({
                        factura_id: inv.id,
                        prestacion_id: ex.id,
                        prestacion_nombre: ex.nombre,
                        prestacion_codigo: ex.codigo,
                        precio_unitario: ex.costo,
                        subtotal: ex.costo,
                        cantidad: 1
                    }))
                    const { error: itemErr } = await supabase.from('factura_items').insert(items)
                    if (itemErr) console.error('Error insertando ítems:', itemErr)
                }

                // Vinculamos la atención a la factura si es una sola atención
                if (selected.length === 1) {
                    await supabase.from('facturas').update({ atencion_id: atencion.id }).eq('id', inv.id)
                }
            }

            showToast(`Factura ${folioReal} generada por ${fmt(totalFactura)}`, 'success')
            setShowInvoiceGenerator(false)
            setSelectedAttentions(new Set())
            setFolioReal('')
            fetchFacturas()
            fetchPendingAttentions()
        } catch (err: any) {
            showToast('Error generando factura: ' + err.message, 'error')
        } finally {
            setIsGenerating(false)
        }
    }

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
    const filteredFacturas = useMemo(() => {
        let list = [...facturas]
        if (activeTab === 'arqueo') {
            // En arqueo mostramos todo lo que se ha registrado hoy o no tiene folio legal aún
            const today = new Date().toISOString().split('T')[0]
            list = list.filter(f => f.fecha_emision?.startsWith(today) || !f.numero_factura?.startsWith('FAC'))
        } else {
            // En seguimiento mostramos las facturas legales (Folios) que están pendientes o conciliadas
            list = list.filter(f => f.numero_factura?.length > 0)
        }

        if (search.trim()) { // Assuming 'search' is still a separate state for now, will need to adjust if it becomes part of a 'filter' object
            const s = search.toLowerCase()
            list = list.filter(f =>
                (f.numero_factura || '').toLowerCase().includes(s) ||
                (f.trabajador_nombre || '').toLowerCase().includes(s) ||
                (f.trabajador_rut || '').toLowerCase().includes(s) ||
                (f.empresas?.nombre || '').toLowerCase().includes(s) ||
                (f.orden_compra || '').toLowerCase().includes(s)
            )
        }
        if (filterEstado) list = list.filter(f => f.estado === filterEstado) // Assuming 'filterEstado' is still a separate state
        if (filterForma) list = list.filter(f => f.forma_pago === filterForma) // Assuming 'filterForma' is still a separate state

        list.sort((a, b) => {
            let va: string | number, vb: string | number
            if (sortCol === 'monto_total') { va = a.monto_total; vb = b.monto_total }
            if (va < vb) return sortDir === 'asc' ? -1 : 1
            if (va > vb) return sortDir === 'asc' ? 1 : -1
            return 0
        })
        return list
    }, [facturas, search, filterEstado, filterForma, sortCol, sortDir, activeTab])

    const handleSort = (col: typeof sortCol) => {
        if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortCol(col); setSortDir('asc') }
    }

    // ── Register Payment ────────────────────────────────────
    async function registerPayment() {
        if (!selectedFactura || payForm.monto <= 0) { showToast('Monto inválido', 'warning'); return }
        const saldo = selectedFactura.monto_total - selectedFactura.monto_pagado
        if (payForm.monto > (saldo + 1)) { showToast('El monto excede el saldo pendiente', 'warning'); return }

        const { error: payErr } = await supabase.from('pagos').insert([{
            factura_id: selectedFactura.id,
            monto: payForm.monto,
            forma_pago: payForm.forma_pago,
            referencia: payForm.referencia || null,
            observaciones: payForm.observaciones || null,
            fecha_pago: payForm.fecha_abono, // Fecha real de conciliación bancaria
            banco_destino: payForm.banco_destino || null
        }])
        if (payErr) { showToast('Error registrando pago: ' + payErr.message, 'error'); return }

        const newPagado = selectedFactura.monto_pagado + payForm.monto
        const newEstado = newPagado >= (selectedFactura.monto_total - 1) ? 'pagada' : 'parcial'

        await supabase.from('facturas').update({
            monto_pagado: newPagado,
            estado: newEstado,
            forma_pago: payForm.forma_pago,
            fecha_pago: newEstado === 'pagada' ? payForm.fecha_abono : null,
        }).eq('id', selectedFactura.id)

        showToast(`Pago de ${fmt(payForm.monto)} conciliado ✓`, 'success')
        setShowPayPanel(false)
        setPayForm({ monto: 0, forma_pago: 'transferencia', referencia: '', observaciones: '', fecha_abono: new Date().toISOString().split('T')[0], banco_destino: '' })
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
        setPayForm({
            monto: f.monto_total - f.monto_pagado,
            forma_pago: f.forma_pago || 'transferencia',
            referencia: '',
            observaciones: '',
            fecha_abono: new Date().toISOString().split('T')[0],
            banco_destino: ''
        })
        setShowPayPanel(true)
    }

    // ── Render ───────────────────────────────────────────────
    return (
        <div className="caja-page animate-fade">
            {/* Contenido Principal */}
            <div className={`caja-main-content ${(selectedFactura || showPayPanel || showClosePanel || showInvoiceGenerator) ? 'is-blurred' : ''}`}>
                <header className="caja-header">
                    <div>
                        <h1>💰 Gestión Financiera</h1>
                        <p>Control de ingresos diarios y seguimiento de facturación legal</p>
                    </div>
                    <div className="header-actions">
                        {activeTab === 'arqueo' && (
                            <button className="btn btn-primary" onClick={() => setShowInvoiceGenerator(true)}>📝 Emitir Factura Empresa</button>
                        )}
                        <button className="btn btn-outline" onClick={() => setShowClosePanel(true)}>📊 Cierre de Caja</button>
                    </div>
                </header>

                {/* Tabs de Navegación */}
                <div className="caja-tabs">
                    <button className={`tab-link ${activeTab === 'arqueo' ? 'active' : ''}`} onClick={() => setActiveTab('arqueo')}>
                        🔎 Arqueo de Admisión (Pre-Factura)
                    </button>
                    <button className={`tab-link ${activeTab === 'seguimiento' ? 'active' : ''}`} onClick={() => setActiveTab('seguimiento')}>
                        🧾 Seguimiento de Facturas (SII / Banco)
                    </button>
                </div>

                {/* KPIs Dinámicos */}
                <section className="kpi-row">
                    {activeTab === 'arqueo' ? (
                        <>
                            <div className="kpi"><span className="kpi-label">Ingresos del Día</span><span className="kpi-val">{fmt(kpis.total)}</span></div>
                            <div className="kpi kpi-success"><span className="kpi-label">Efectivo/TRF Caja</span><span className="kpi-val">{fmt(kpis.cobrado)}</span></div>
                            <div className="kpi kpi-warning"><span className="kpi-label">Por Facturar</span><span className="kpi-val">{fmt(kpis.pendiente)}</span></div>
                        </>
                    ) : (
                        <>
                            <div className="kpi"><span className="kpi-label">Total Facturado SII</span><span className="kpi-val">{fmt(kpis.total)}</span></div>
                            <div className="kpi kpi-success"><span className="kpi-label">Recaudado (Banco)</span><span className="kpi-val">{fmt(kpis.cobrado)}</span></div>
                            <div className="kpi kpi-danger"><span className="kpi-label">Cartera Pendiente</span><span className="kpi-val">{fmt(kpis.pendiente)}</span></div>
                        </>
                    )}
                    <div className="kpi"><span className="kpi-label">Items/Doc</span><span className="kpi-val">{kpis.count}</span></div>
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
                                    <th className="sortable" onClick={() => handleSort('numero_factura')}>N° Factura {sortCol === 'numero_factura' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                                    <th>Paciente</th>
                                    <th>Empresa</th>
                                    <th className="sortable text-right" onClick={() => handleSort('monto_total')}>Monto</th>
                                    <th className="text-right">Pagado</th>
                                    <th className="text-right">Saldo</th>
                                    <th>Estado</th>
                                    <th className="sortable" onClick={() => handleSort('fecha_emision')}>Fecha</th>
                                    <th>Forma</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFacturas.length === 0 ? (
                                    <tr><td colSpan={10} className="empty-row">No se encontraron facturas</td></tr>
                                ) : filteredFacturas.map(f => {
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
            </div>

            {/* Modales (Fuera del blur) */}
            {selectedFactura && !showPayPanel && (
                <div className="overlay" onClick={() => setSelectedFactura(null)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="panel-header">
                            <h3>📋 Detalle de Factura: {selectedFactura.numero_factura}</h3>
                            <button className="btn-close" onClick={() => setSelectedFactura(null)}>✕</button>
                        </div>

                        <div className="detail-grid">
                            <div><span className="dl">Paciente</span><span className="dv">{selectedFactura.trabajador_nombre}</span></div>
                            <div><span className="dl">RUT</span><span className="dv">{selectedFactura.trabajador_rut}</span></div>
                            <div><span className="dl">Empresa</span><span className="dv">{selectedFactura.empresas?.nombre}</span></div>
                            <div><span className="dl">OC</span><span className="dv">{selectedFactura.orden_compra || '—'}</span></div>
                            <div><span className="dl">Vencimiento</span><span className="dv">{selectedFactura.fecha_vencimiento ? fmtDate(selectedFactura.fecha_vencimiento) : '—'}</span></div>
                            <div><span className="dl">Total Factura</span><span className="dv mono text-brand">{fmt((selectedFactura.factura_items || []).reduce((s, it) => s + Number(it.subtotal), 0))}</span></div>
                        </div>

                        <div className="modal-scroll-area scrollbar">
                            {(selectedFactura.factura_items || []).length > 0 && (
                                <div className="detail-section">
                                    <div className="items-header">
                                        <h4>Desglose de Prestaciones</h4>
                                    </div>
                                    <table className="mini-table">
                                        <thead><tr><th>Código</th><th>Examen</th><th>P. Unit.</th><th>Subtotal</th></tr></thead>
                                        <tbody>
                                            {(selectedFactura.factura_items || []).map(it => (
                                                <tr key={it.id}><td className="mono">{it.prestacion_codigo}</td><td>{it.prestacion_nombre}</td><td className="mono">{fmt(Number(it.precio_unitario))}</td><td className="mono">{fmt(Number(it.subtotal))}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {(selectedFactura.pagos || []).length > 0 && (
                                <div className="detail-section">
                                    <h4>Historial de Pagos</h4>
                                    <table className="mini-table">
                                        <thead><tr><th>Fecha</th><th>Monto</th><th>Forma</th><th>Ref.</th></tr></thead>
                                        <tbody>
                                            {(selectedFactura.pagos || []).map(p => (
                                                <tr key={p.id}><td>{fmtDate(p.fecha_pago)}</td><td className="mono text-success">{fmt(p.monto)}</td><td>{formaLabels[p.forma_pago] || p.forma_pago}</td><td className="mono">{p.referencia || '—'}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-outline" onClick={() => setSelectedFactura(null)}>Cerrar</button>
                            {(selectedFactura.estado === 'pendiente' || selectedFactura.estado === 'parcial') && (
                                <button className="btn btn-primary" onClick={() => openPay(selectedFactura)}>Registrar Pago</button>
                            )}
                        </div>
                    </div>
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
                            <div className="form-group grid-2">
                                <div>
                                    <label>Forma de Pago</label>
                                    <select value={payForm.forma_pago} onChange={e => setPayForm({ ...payForm, forma_pago: e.target.value })}>
                                        <option value="efectivo">Efectivo</option>
                                        <option value="transferencia">Transferencia Bancaria</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="orden_compra">Orden de Compra / Crédito</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Fecha de Abono (Banco)</label>
                                    <input type="date" value={payForm.fecha_abono} onChange={e => setPayForm({ ...payForm, fecha_abono: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group grid-2">
                                <div>
                                    <label>Referencia / N° Transacción</label>
                                    <input type="text" placeholder="Ej: TX-998822" value={payForm.referencia} onChange={e => setPayForm({ ...payForm, referencia: e.target.value })} />
                                </div>
                                <div>
                                    <label>Banco / Cuenta Destino</label>
                                    <select value={payForm.banco_destino} onChange={e => setPayForm({ ...payForm, banco_destino: e.target.value })}>
                                        <option value="">Seleccione Cuenta...</option>
                                        <option value="BCI_CTE_1234">BCI Cuenta Corriente (...1234)</option>
                                        <option value="SANTANDER_VISTA">Santander Vista (...5566)</option>
                                        <option value="CAJA_CHICA">Caja Chica Local</option>
                                    </select>
                                </div>
                            </div>
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

            {/* Invoice Generator Modal */}
            {showInvoiceGenerator && (
                <div className="overlay" onClick={() => setShowInvoiceGenerator(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="panel-header">
                            <h3>📝 Generador de Facturas Consolidadas</h3>
                            <button className="btn-close" onClick={() => setShowInvoiceGenerator(false)}>✕</button>
                        </div>
                        <p className="modal-sub">Seleccione los trabajadores y atenciones para generar una factura consolidada.</p>

                        <div className="generator-layout">
                            <div className="generator-controls">
                                <div className="form-row">
                                    <div className="form-group flex-1">
                                        <label>Seleccionar Empresa</label>
                                        <select className="dark-select" value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}>
                                            <option value="">Todas las Empresas...</option>
                                            {Array.from(new Set(pendingAttentions.map(a => a.empresa_id))).map(id => {
                                                const emp = pendingAttentions.find(a => a.empresa_id === id)
                                                return <option key={id} value={id}>{emp?.empresa_nombre}</option>
                                            })}
                                        </select>
                                    </div>
                                    <div className="form-group flex-1">
                                        <label>Folio SII (Legal)</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: 15442"
                                            className="dark-input"
                                            value={folioReal}
                                            onChange={e => setFolioReal(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="filter-tabs">
                                    <button className={`tab-btn ${aptitudFilter === 'todos' ? 'active' : ''}`} onClick={() => setAptitudFilter('todos')}>Todos</button>
                                    <button className={`tab-btn ${aptitudFilter === 'apto' ? 'active' : ''}`} onClick={() => setAptitudFilter('apto')}>Solo Aptos</button>
                                    <button className={`tab-btn ${aptitudFilter === 'no_apto' ? 'active' : ''}`} onClick={() => setAptitudFilter('no_apto')}>No Aptos</button>
                                    <button className={`tab-btn ${aptitudFilter === 'remediacion' ? 'active' : ''}`} onClick={() => setAptitudFilter('remediacion')}>En Remediación</button>
                                </div>
                            </div>

                            <div className="pending-list-container scrollbar">
                                <table className="mini-table selectable">
                                    <thead>
                                        <tr>
                                            <th><input type="checkbox" onChange={e => handleSelectAll(e.target.checked)} /></th>
                                            <th>TRABAJADOR</th>
                                            <th>EMPRESA</th>
                                            <th>APTITUD</th>
                                            <th className="text-right">TOTAL EXÁMENES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPending.map(a => (
                                            <tr key={a.id} className={selectedAttentions.has(a.id) ? 'row-selected' : ''} onClick={() => {
                                                const newSet = new Set(selectedAttentions)
                                                if (newSet.has(a.id)) newSet.delete(a.id)
                                                else newSet.add(a.id)
                                                setSelectedAttentions(newSet)
                                            }}>
                                                <td><input type="checkbox" checked={selectedAttentions.has(a.id)} readOnly /></td>
                                                <td>
                                                    <div className="worker-info">
                                                        <span className="w-name">{a.nombre_completo}</span>
                                                        <span className="w-rut">{a.rut}</span>
                                                    </div>
                                                </td>
                                                <td>{a.empresa_nombre}</td>
                                                <td>
                                                    <span className={`badge badge-${a.aptitud || 'pendiente'}`}>
                                                        {a.aptitud === 'apto' ? '✅ Apto' : a.aptitud === 'no_apto' ? '❌ No Apto' : '⏳ Pendiente'}
                                                    </span>
                                                </td>
                                                <td className="text-right mono">{fmt(a.total_atencion)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredPending.length === 0 && <div className="empty-state">No hay atenciones pendientes para estos filtros.</div>}
                            </div>
                        </div>

                        <div className="generator-footer">
                            <div className="selection-info">
                                <span>Seleccionados: <b>{selectedAttentions.size} items</b></span>
                                <span>Total a Facturar: <b className="text-success">{fmt(pendingAttentions.filter(a => selectedAttentions.has(a.id)).reduce((s, a) => s + Number(a.total_atencion), 0))}</b></span>
                            </div>
                            <button className="btn btn-primary btn-lg" onClick={generateInvoice} disabled={isGenerating || selectedAttentions.size === 0}>
                                {isGenerating ? 'Generando...' : 'Emitir Factura Consolidada'}
                            </button>
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
                /* Tabs UI */
                .caja-tabs { display: flex; gap: 2rem; margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
                .tab-link { background: transparent; border: none; padding: 1rem 0.5rem; color: #888; font-weight: 600; cursor: pointer; position: relative; transition: 0.3s; }
                .tab-link:hover { color: #fff; }
                .tab-link.active { color: var(--brand-primary); }
                .tab-link.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 3px; background: var(--brand-primary); border-radius: 10px 10px 0 0; }

                /* Dashboard Styles Updated */
                .dark-select, .dark-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.8rem; border-radius: 8px; width: 100%; outline: none; transition: 0.2s; }
                .dark-select:focus, .dark-input:focus { border-color: var(--brand-primary); background: rgba(255,255,255,0.08); }
                
                .form-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
                .flex-1 { flex: 1; }
                
                .filter-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; }
                .tab-btn { background: transparent; border: none; color: #888; padding: 0.5rem 1rem; cursor: pointer; border-radius: 6px; font-weight: 500; transition: 0.2s; }
                .tab-btn:hover { color: #fff; background: rgba(255,255,255,0.1); }
                .tab-btn.active { color: #fff; background: var(--brand-primary); }

                .pending-list-container { max-height: 45vh; overflow-y: auto; border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; background: rgba(0,0,0,0.2); }
                .mini-table.selectable tbody tr { cursor: pointer; }
                .mini-table.selectable tbody tr:hover { background: rgba(255,255,255,0.03); }
                
                .badge { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
                .badge-apto { background: rgba(0,255,0,0.1); color: #00ff00; }
                .badge-no_apto { background: rgba(255,0,0,0.1); color: #ff0000; }
                .badge-pendiente { background: rgba(255,255,0,0.1); color: #ffff00; }
                .badge-remediacion { background: rgba(0,183,255,0.1); color: #00b7ff; }

                .empty-state { padding: 3rem; text-align: center; color: #666; font-style: italic; }
                .text-right { text-align: right; }
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

                /* Global Blur */
                .caja-main-content { transition: filter 0.3s ease, transform 0.3s ease; height: 100%; width: 100%; }
                .is-blurred { filter: blur(8px) grayscale(20%); transform: scale(0.99); pointer-events: none; }

                /* Detail Panel as Modal */
                .modal-scroll-area { max-height: 50vh; overflow-y: auto; margin: 1rem 0; padding-right: 0.5rem; }
                .detail-section { margin-bottom: 2rem; }
                .text-brand { color: var(--brand-primary); font-size: 1.2rem; }
                
                .detail-panel { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.5rem; }
                .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .panel-header h3 { font-size: 1.1rem; }
                .btn-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-card); cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; }
                .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.8rem; margin-bottom: 1.25rem; }
                .dl { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; display: block; }
                .dv { font-size: 0.95rem; font-weight: 600; }
                .items-header { display: flex; justify-content: space-between; align-items: center; margin: 1rem 0 0.5rem; }
                .items-summary { font-size: 0.85rem; color: var(--text-main); background: rgba(255,255,255,0.05); padding: 0.3rem 0.7rem; border-radius: 4px; }
                .detail-panel h4 { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
                .alert-info { background: rgba(245,158,11,0.1); border: 1px solid var(--warning); color: var(--warning); padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.8rem; margin-top: 1rem; line-height: 1.4; }
                .mini-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
                .mini-table th { text-align: left; padding: 0.5rem 0.75rem; font-size: 0.7rem; color: var(--text-muted); border-bottom: 1px solid var(--border-color); text-transform: uppercase; }
                .mini-table td { padding: 0.5rem 0.75rem; font-size: 0.82rem; border-bottom: 1px solid var(--border-dim); }

                /* Modal / Overlay */
                .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 2rem; width: 100%; max-width: 520px; box-shadow: var(--shadow-lg); transition: all 0.3s ease; }
                .modal-lg { max-width: 800px; width: 90%; }
                .modal h3 { font-size: 1.3rem; margin-bottom: 0.25rem; }
                .modal-sub { color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.25rem; }
                
                /* Generator */
                .generator-layout { display: flex; flex-direction: column; gap: 1.25rem; }
                .company-filter { display: flex; flex-direction: column; gap: 0.4rem; }
                .company-filter label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
                .pending-list { max-height: 400px; overflow-y: auto; background: var(--bg-app); border: 1px solid var(--border-color); border-radius: 8px; }
                .row-selected { background: rgba(var(--brand-primary-rgb), 0.1) !important; }
                .generator-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 1.5rem; border-top: 1px solid var(--border-color); }
                .selection-info { display: flex; flex-direction: column; gap: 0.2rem; }
                .selection-info span { font-size: 0.9rem; color: var(--text-muted); }
                .selection-info b { font-size: 1.1rem; color: var(--text-main); }
                .scrollbar::-webkit-scrollbar { width: 6px; }
                .scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

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
