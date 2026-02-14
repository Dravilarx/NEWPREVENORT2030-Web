# Arquitecto de Filtros de Tablas Premium (Prevenort Style)

Este skill define el estándar visual y funcional para la implementación de barras de filtrado en todas las tablas del proyecto Prevenort 2030. El objetivo es mantener una estética premium, organizada y altamente funcional.

## Principios de Diseño Visual

1. **Bordes de Marca Permanentes**:
   - Todos los campos de entrada (`input`, `select`) deben tener un borde visible de **1.5px** utilizando el color primario de la marca (`var(--brand-primary)`).
   - No ocultar bordes en estado de reposo; la visibilidad permanente ayuda a encuadrar y organizar los datos.

2. **Estética Glassmorphism**:
   - Fondo de la barra de filtros: `rgba(255, 255, 255, 0.02)`.
   - Fondo de los inputs: `rgba(255, 255, 255, 0.03)`.
   - Desenfoque de fondo: `backdrop-filter: blur(10px)` (si el contenedor lo permite).

3. **Tipografía y Etiquetas**:
   - Etiquetas (`label`) en mayúsculas, tamaño reducido (`0.65rem`), peso fuente `700` y color de marca.
   - Espaciado entre letras (`letter-spacing: 0.05em`) para legibilidad.

4. **Interactividad (Focus State)**:
   - Al enfocar un campo, el fondo debe aclararse ligeramente: `rgba(255, 255, 255, 0.08)`.
   - Añadir un resplandor exterior (*glow*): `box-shadow: 0 0 0 3px rgba(255, 107, 44, 0.15)`.

## Estructura Técnica Sugerida (React/TSX)

```tsx
<div className="filters-bar">
    <div className="filter-group">
        <label>Etiqueta</label>
        <input type="text" placeholder="Buscar..." />
    </div>
    <div className="filter-group">
        <label>Categoría</label>
        <select>
            <option value="">Todos</option>
        </select>
    </div>
    {/* Botón de reinicio con icono de rotación */}
    <button className="btn-reset">🔄</button>
</div>
```

## Estándar de Estilos (CSS/JSX)

```css
.filters-bar {
    background: rgba(255, 255, 255, 0.02);
    padding: 1rem 1.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 1.2rem;
    align-items: flex-end;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.filter-group label {
    font-size: 0.65rem;
    text-transform: uppercase;
    font-weight: 700;
    color: var(--brand-primary);
}

.filter-group input, 
.filter-group select {
    background: rgba(255, 255, 255, 0.03);
    border: 1.5px solid var(--brand-primary);
    border-radius: 10px;
    padding: 0.6rem 0.8rem;
    font-size: 0.85rem;
    color: white;
    outline: none;
    transition: all 0.2s ease;
}

.filter-group input:focus, 
.filter-group select:select {
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 3px rgba(255, 107, 44, 0.15);
}
```

## Consideraciones Funcionales

- **Debounce**: Implementar un pequeño retraso en las búsquedas de texto para evitar saturar la base de datos.
- **Sincronización**: Usar `useCallback` para las funciones de búsqueda y asegurar que los filtros se mantengan al recibir actualizaciones en tiempo real.
- **Accesibilidad**: Asegurar que cada input tenga su `id` y `htmlFor` correspondiente en el label.
