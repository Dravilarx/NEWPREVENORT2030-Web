---
name: Panel Lateral Premium (Drawer)
description: Implementación de paneles laterales deslizantes para formularios de creación y edición, optimizando el espacio y mejorando el flujo de usuario.
---

# Panel Lateral Premium (Drawer)

Este skill define el estándar para implementar paneles laterales (drawers) en la interfaz de Prevenort. Este patrón se utiliza para despejar la vista principal (tablas/listados) y permitir la gestión de datos sin perder el contexto.

## 1. Estructura de Estados (React)

Para implementar el panel, se requieren al menos tres estados básicos:

```tsx
const [showPanel, setShowPanel] = useState(false);
const [editingItem, setEditingItem] = useState<any | null>(null);
const [formData, setFormData] = useState({ ...initialFields });
```

### Funciones de Control
Es fundamental centralizar la lógica de apertura y cierre para manejar la limpieza del formulario.

```tsx
const openPanel = (item?: any) => {
    if (item) {
        setEditingItem(item);
        setFormData({ ...item }); // Cargar datos para edición
    } else {
        setEditingItem(null);
        setFormData({ ...initialFields }); // Limpiar para creación
    }
    setShowPanel(true);
};

const closePanel = () => {
    setShowPanel(false);
    setEditingItem(null);
    setFormData({ ...initialFields });
};
```

## 2. Estructura JSX

El panel debe colocarse fuera del flujo principal de scroll, idealmente al principio o final del contenedor de la vista.

```tsx
{/* Panel Lateral */}
<div className={`side-panel ${showPanel ? 'open' : ''}`}>
    {/* Backdrop con desenfoque */}
    <div className="side-panel-overlay" onClick={closePanel}></div>
    
    <div className="side-panel-content">
        <div className="side-panel-header">
            <h3>{editingItem ? '✏️ Editar Registro' : '✨ Nuevo Registro'}</h3>
            <button className="btn-close" onClick={closePanel}>&times;</button>
        </div>
        
        <p className="section-hint">Mensaje descriptivo del propósito del formulario.</p>
        
        <div className="add-form vertical mt-4">
            {/* Campos del Formulario */}
            <div className="form-group">
                <label>Nombre</label>
                <input 
                    type="text" 
                    value={formData.nombre} 
                    onChange={e => setFormData({...formData, nombre: e.target.value})} 
                />
            </div>
            
            {/* Acciones */}
            <button className="btn btn-primary mt-6 full-width" onClick={handleSave}>
                {editingItem ? 'Guardar Cambios' : 'Crear Registro'}
            </button>
            
            {editingItem && (
                <button className="btn-text mt-2 full-width" onClick={closePanel}>
                    Cancelar
                </button>
            )}
        </div>
    </div>
</div>
```

## 3. Estilos CSS (Premium)

Los estilos deben incluir animaciones de entrada/salida y el efecto de Glassmorphism en el fondo.

```css
/* Contenedor Principal */
.side-panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    z-index: 2000;
    visibility: hidden;
    transition: all 0.3s ease;
}

.side-panel.open {
    visibility: visible;
}

/* Backdrop / Fondo */
.side-panel-overlay {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.side-panel.open .side-panel-overlay {
    opacity: 1;
}

/* Contenido del Panel */
.side-panel-content {
    position: absolute;
    top: 0;
    right: -450px; /* Oculto inicialmente */
    width: 450px;
    height: 100%;
    background: #111; /* Profundidad */
    border-left: 1px solid var(--border-color);
    padding: 2.5rem 2rem;
    box-shadow: -10px 0 50px rgba(0, 0, 0, 0.6);
    transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
    z-index: 2001;
}

.side-panel.open .side-panel-content {
    right: 0;
}

/* Cabecera y Botones */
.side-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.btn-close {
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border-color);
    color: white;
    width: 32px; height: 32px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-close:hover {
    background: var(--brand-primary);
    border-color: var(--brand-primary);
}

/* Utilidades */
.full-width { width: 100%; }

/* Responsive */
@media (max-width: 500px) {
    .side-panel-content { width: 100%; right: -100%; }
}
```

## 4. Mejores Prácticas

1.  **Interactividad**: Implementar `onClick` en las filas de las tablas principales para disparar la apertura en modo edición.
2.  **Scroll Interno**: Si el formulario es largo, aplicar `overflow-y: auto` exclusivamente al div del formulario dentro del panel.
3.  **Prevención**: Detener la propagación del evento (`e.stopPropagation()`) en botones de borrado dentro de la tabla para evitar abrir el panel al eliminar un registro.
4.  **Enfoque**: Opcionalmente, usar un `autoFocus` en el primer campo del input al abrir el panel para agilizar el llenado.
