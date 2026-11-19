cat > PROMPT_AGENTE_DEMO.md << 'MARKER_END'
# Demo Mocking: Interfaz LLM para Análisis de Datos con Verificación, Steering y Task Decomposition

## 0. Objetivo

Construye un **demo mocking** (sin backend, sin APIs reales) de una interfaz de análisis de datos asistido por LLM, inspirada en ChatGPT/DeepSeek. Debe integrar de forma visible y probable los hallazgos de 5 papers:

1. **WoZ en HCI** (Yang et al., CHI'26): tipos de control, motivaciones, riesgos, rigor.
2. **Gu et al.** (CHI'24): workflows *procedure-oriented* vs *data-oriented*.
3. **Kazemitabaar et al.** (UIST'24): supuestos editables, plan de ejecución, side queries, branching.
4. **LightVA**: task flow, descomposición on-demand (AND/DOWN), insights estructurados, data lens.
5. **WaitGPT**: operation graph, table glyphs, edición granular, scrolltelling.

Reutiliza el **design system y layout del HTML adjunto** (originalmente "Redacción asistida"), pero reinterpreta el contenido como análisis de datos. Las "correcciones de texto" pasan a ser "operaciones a verificar".

## 1. Design system (mantener)

| Token | Valor |
|---|---|
| Fondo app | `#F4F6FA` |
| Texto principal | `#1B2433` |
| Texto secundario | `#3B4457`, `#5B6475` |
| Primario (teal) | `#0F766E` / `#0B5F58` |
| Bordes | `#E2E6EE`, `#D5DBE6`, `#C5CDDB` |
| Superficie | `#FFFFFF` / secundaria `#EEF1F6` |
| Rojo suave | `#FBEAEA` / `#A32B2B` / `#C23B3B` |
| Verde suave | `#E0F2EF` |
| Púrpura suave | `#EFE7FB` / `#5B34A6` |
| Amarillo suave | `#FFF1D6` |
| Tipografía | `Figtree`, system-ui |
| Pesos | 400, 500, 600, 700 |
| Radios | 10–16 px; pills 22 px |
| Layout fijo | 1440 × 900 |
| Alturas | header 64, footer 96, input 56, botones 44, pills 30 |

## 2. Layout
┌─────────────────────────────────────────────────────────────────┐
│ HEADER 64: menú · config · modos · "Sugerencias para este paso"│
├────────────────────────────────────────┬────────────────────────┤
│ MAIN (flex, contenido 800) │ ASIDE 420 │
│ ┌────────────────────────────────────┐ │ ┌────────────────────┐ │
│ │ StageBar 56 │ │ │ Tabs: │ │
│ ├────────────────────────────────────┤ │ │ Dataset | Código | │ │
│ │ Chat (scroll) │ │ │ Supuestos | Plan | │ │
│ │ · mensaje usuario │ │ │ Task Flow | Cambios│ │
│ │ · respuesta asistente │ │ ├────────────────────┤ │
│ │ · operation graph + glyphs │ │ │ contenido tab │ │
│ │ · tarjetas de operación │ │ │ │ │
│ │ · mini progreso │ │ │ │ │
│ │ · tarjeta descomposición │ │ ├────────────────────┤ │
│ ├────────────────────────────────────┤ │ │ Exportar resumen │ │
│ │ Input 56 + niveles de ayuda │ │ └────────────────────┘ │
│ └────────────────────────────────────┘ │ │
├────────────────────────────────────────┴────────────────────────┤
│ FOOTER 96: carrusel de sesiones recientes │
└─────────────────────────────────────────────────────────────────┘



## 3. Header

- Botones menú y configuración (igual).
- Modos: `Conversación` | `Lecciones y repaso` | **`Análisis asistido`** (activo) | `Dudas rápidas`.
- Botón "Sugerencias para este paso" → popover con:
  - "Motivación WoZ: rigor causal"
  - "Workflow recomendado: Procedure + Data"
  - "Riesgo actual: variabilidad del agente"
  - "Siguiente paso: inspeccionar tabla intermedia"
- Badge "Demo mocking".

## 4. StageBar

Reemplaza `Planificar → Borrador → Revisar → Cerrar` por:

`Planificar → Ejecutar → Verificar → Reportar`

- **Verificar** activo por defecto.
- A la derecha:
  - Toggle `[ Ver por procedimiento ] [ Ver por datos ]`
  - Botón `Editar plan`
  - Botón `Crear rama`
  - Botón `Deshacer`
  - Botón `Reproducir análisis` (scrolltelling)

## 5. Chat (columna central)

Orden de bloques:

1. **Mensaje usuario** (derecha, fondo `#1B2433`):
   > "¿Cuántos productos distintos comprados en noviembre fueron devueltos al vendedor? Por ahora solo dame pistas y déjame verificar."

2. **Respuesta asistente** (izquierda, blanco):
   - Etiqueta `TUTOR IA · ANÁLISIS`.
   - Texto: "Terminé el plan y ejecuté una primera versión. Detecté 3 puntos a verificar."
   - Chips: `Filtro de fecha: 1` · `Agregación: 1` · `Supuesto: 1`
   - Botón "Ver plan completo".

3. **Operation graph** (inspirado WaitGPT):
   - Nodos horizontales: `Load → Filter date → Filter status → Aggregate → Result`
   - Cada nodo: icono + título + badge de estado (`ok`/`warning`/`error`).
   - Debajo de cada nodo: **table glyph** (matriz 2D 4×3).
   - Hover en nodo → resalta bloque de código.
   - Click en nodo → panel de detalle.

4. **Tarjeta operación 1 — Filtro de fecha** (error plantado):
   - Badge `Filtro` rojo.
   - "Corrección 1 de 3".
   - Before: `df[df['order_date'].dt.month == 11]`
   - After: `df[(df['order_date'] >= '2022-11-01') & (df['order_date'] < '2022-12-01')]`
   - Por qué: "El filtro por mes incluye 2021 y 2022."
   - Botones: `Aceptar` · `Rechazar` · `No entiendo` · `Ver código` · `Inspeccionar datos` · `Preguntar` · `Ver regla y ejemplo`
   - Etiqueta WoZ: `Control: lógica` · `Riesgo: variabilidad`.

5. **Tarjeta operación 2 — Agregación** (error plantado):
   - Badge `Agregación` púrpura.
   - "Corrección 2 de 3 · nivel Pista".
   - Pista: "Mira `sum(quantity)`. ¿Contar unidades o productos distintos?"
   - Expandir: `df.groupby('sku')['quantity'].sum()` vs `df['sku'].nunique()`.

6. **Tarjeta operación 3 — Supuesto** (error plantado):
   - Badge `Supuesto` amarillo.
   - "La IA asumió que `order_status == 'Returned to Seller'` cubre todas las devoluciones."
   - Botones: `Editar supuesto` · `Aceptar` · `Rechazar`.

7. **Mini progreso** (como en HTML):
   - Barras de "cobertura de verificación" por operación.
   - Texto: "2 de 3 operaciones verificadas."
   - Botón `Ver progreso`.

8. **Tarjeta descomposición on-demand** (LightVA):
   - Aparece tras aceptar/rechazar la primera operación.
   - "Completitud 7/10. ¿Descomponer?"
   - Plan: `T1 Filtrar fecha (DOWN) → T2 Filtrar estado (DOWN) → T3 Contar SKU únicos (AND)`
   - Botones: `Aceptar` · `Ignorar` · `Editar plan`.

9. **Side query panel** (colapsable):
   - Input + ejemplos rápidos ("¿Cuántas filas quedan?", "Valores únicos de `order_status`").
   - Respuesta mock con mini-tabla + botón "Añadir a supuestos".

## 6. Aside (panel derecho)

Tabs: `Dataset` | `Código` | `Supuestos` | `Plan` | `Task Flow` | `Cambios (3)`

**Dataset**
- Sub-tabs: `Original` | `Intermedio 1` | `Intermedio 2` | `Resultado`.
- Tabla: `order_id`, `sku`, `order_date`, `quantity`, `order_status`.
- Orden, filtro, búsqueda, selección.
- Toggle `Data lens`: celdas coloreadas por frecuencia de inspección.
- Leyenda "Cobertura: 62%".
- Botón `Sugerir celdas no inspeccionadas`.

**Código**
- Bloque con resaltado + comentarios `#` + output.
- Botones: `Copiar` · `Editar` · `Re-ejecutar`.
- Hover línea ↔ resalta nodo del operation graph.

**Supuestos**
- Tarjetas por columna con input editable:
  - `order_date`: "Tipo fecha; rango 2021–2022; el usuario quiere nov 2022."
  - `order_status`: "Valores: Delivered / Returned to Seller; 'Returned' = devolución."
  - `quantity`: "Unidades por pedido; no es nº de productos."
  - `sku`: "ID único de producto."
- Botones `Guardar` / `Descartar`.
- Al guardar: modal "Se regenerará código y creará rama. ¿Continuar?" → `Crear rama y regenerar` / `Cancelar`.
- Botón `Añadir supuesto`.

**Plan**
- Pasos NL editables:
  1. Cargar dataset.
  2. Filtrar `order_date` = nov 2022.
  3. Filtrar `order_status` = devoluciones.
  4. Contar `sku` únicos.
  5. Mostrar tabla y resumen.
- Checkboxes de pasos opcionales.
- Botón `Regenerar código desde el plan`.

**Task Flow**
- Nodos: `Goal → T1 → T2 → T3 → T4`.
- Cada nodo: id, tipo, progreso (0–100%), badge estado.
- Click resalta en chat y código.
- Botón `Descomponer` en nodos no completados.
- Leyenda: `AND`=paralelo, `DOWN`=secuencial.

**Cambios (3)**
- Lista con estado `pendiente`/`aceptada`/`rechazada`.
- Cada una: tipo, descripción, before/after.
- Botón `Deshacer` por cambio.
- Botón `Exportar cambios`.

## 7. Footer

Carrusel de sesiones (mock):
- `Ventas: devoluciones de noviembre` (activa)
- `Vuelos: ciudad con más vuelos`
- `Películas: retorno de inversión`
- `Empleados: salario y remoto`
- `Superstore: descuentos y beneficio`

Cada tarjeta: título, dataset, fecha, badge `Demo`.

## 8. Componentes e interacciones clave

**OperationCard**
```ts
{
  id, kind: 'filter'|'aggregate'|'assumption'|'insight'|'decomposition',
  severity: 'error'|'warning'|'info',
  title, description, codeBefore?, codeAfter?, explanation?, hint?,
  status: 'pending'|'accepted'|'rejected',
  wozControlType?: 'communication'|'system-logic'|'embodied'|'pre-scripted'|'collaboration',
  wozRisk?: 'latency'|'variability'|'ecological-validity'|'deception'|'reproducibility'
}

Acciones: Aceptar, Rechazar, No entiendo, Ver código, Inspeccionar datos, Preguntar, Ver regla.

Operation graph + table glyphs

    Nodos tipo bloque: blanco, borde #D5DBE6, radio 10.

    Glyph: matriz 4×3 debajo del nodo.

    Animación al cargar/cambiar (150–250ms).

    Click nodo → panel detalle con:

        parámetros editables,

        Preguntar sobre esta operación,

        Re-ejecutar desde aquí.

Branching

    Modal al editar supuesto/plan.

    Ribbon arriba del chat: main | rama-1 | rama-2.

    Log en pestaña Cambios.

Niveles de ayuda (pills bajo input):

    Pista · Explicación · Código · Plan completo

    Cambian el detalle de las tarjetas.

Side queries

    3 modos: Ask Question · Generate Code · Run Side Query.

    Panel lateral con input, ejemplos, respuesta mock, botón "Añadir a supuestos"/"Insertar en código".

Exportar resumen

    Modal con JSON mock: consulta, supuestos aceptados/rechazados, operaciones, insights, ramas, logs, riesgos WoZ.

    Botón Copiar.

9. Datos mock

Dataset orders (25 filas): order_id, sku, order_date, quantity, order_status.

Debe incluir:

    5 filas nov 2022 devueltas

    2 filas nov 2021 devueltas (para error de fecha)

    3 filas dic devueltas

    Varias con quantity > 1 (para error de agregación)

    Al menos 1 con order_status distinto a Returned to Seller (para error de supuesto)

Errores plantados

    Filtro: df[df['order_date'].dt.month == 11] → incluye 2021 y 2022.

    Agregación: sum(quantity) en vez de nunique(sku).

    Supuesto: solo Returned to Seller, ignora Returned to Warehouse.

Insights

    Correcto: "5 productos distintos devueltos en nov 2022."

    Erróneo inicial: "12 unidades devueltas."

    Intermedio: "8 productos distintos, incluye nov 2021."

10. Flujos de demo

A — Verificación procedure-oriented: abrir sesión → "Ver por procedimiento" → leer código → detectar error fecha → "Inspeccionar datos" → confirmar → Aceptar → código regenerado.

B — Verificación data-oriented: "Ver por datos" → filtrar Dataset por order_status → observar filas 2021/2022 → volver al chat → aceptar corrección.

C — Steering con supuestos: tab Supuestos → editar order_status (añadir Returned to Warehouse) → "Crear rama y regenerar" → cambio visible en código y resultado.

D — Side query: click nodo Filter status → "Preguntar" → "¿Valores únicos de order_status?" → mini-tabla → "Añadir a supuestos".

E — Descomposición on-demand: aceptar corrección 1 → aparece tarjeta → "Aceptar descomposición" → Task Flow se actualiza → ejecutar subtareas.

F — Branching: editar plan → rama rama-1 → cambiar entre ramas sin perder cambios.
11. Requisitos técnicos

    React con estado local (useState/useReducer/Context).

    Sin backend, sin APIs reales. Todo mock en mockData.js.

    Sin llamadas a OpenAI/DeepSeek. setTimeout opcional para simular latencia.

    Estructura sugerida:

text

/src
  /components
    Header, StageBar, Chat, OperationCard, OperationGraph,
    TableGlyph, AssumptionsPanel, PlanPanel, CodePanel,
    DatasetPanel, TaskFlowPanel, ChangesPanel, SideQueryPanel,
    BranchRibbon, HelpLevelPills, ExportModal
  /data
    mockDataset, mockOperations, mockTasks, mockInsights
  /state
    demoReducer
  App.jsx, styles.css

    CSS plano con variables para los tokens. No Tailwind.

    Iconos: SVG inline del HTML base o Lucide React (trazo 2–2.4).

12. Criterios de aceptación

    Se ve y funciona a 1440×900 sin scroll global (solo interno).

    Respeta design system y layout del HTML base.

    El usuario puede:

        ver plan y supuestos,

        alternar procedure/data,

        inspeccionar tablas originales e intermedias,

        ver código y comentarios,

        detectar los 3 errores,

        aceptar/rechazar correcciones,

        editar supuestos y crear rama,

        hacer side query,

        descomponer tarea y ver Task Flow,

        exportar resumen.

    Operation graph y table glyphs visibles y reactivos.

    Task Flow muestra progreso y relaciones AND/DOWN.

    Data lens colorea celdas por frecuencia.

    Cada OperationCard muestra tipo de control WoZ y riesgo.

    "Sugerencias para este paso" muestra motivación, workflow, riesgo.

    Todo es mock (sin APIs).

    Código modular y comentado.

13. WoZ y ética

    El demo simula un agente LLM; no hay wizard humano real.

    Aun así:

        etiquetar cada operación con tipo de control WoZ,

        panel "Protocolo del wizard" (mock) con reglas, timing, logs, entrenamiento,

        badge "Riesgo WoZ" donde aplique,

        botón "Debriefing" explicando que la autonomía es simulada.

14. Entregables

    Proyecto React funcional (Vite o CDN).

    README.md con instrucciones.

    mockData.js completo.

    Lista de verificación de criterios.

15. Instrucción final

Construye el demo completo. Prioriza que los conceptos de los 5 papers sean visibles y probables. No optimices por belleza extrema; optimiza por claridad conceptual y fidelidad al design system. Si dudas entre añadir algo y mantener claridad, añádelo como panel colapsable.
