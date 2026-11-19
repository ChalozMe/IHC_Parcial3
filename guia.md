# Guía de Implementación - Interfaz Demo HCI

## Visión General
Proyecto de Interacción Humano-Computadora (HCI) - interfaz demo con mocking enfocado en UX y diseño visual. El trabajo se centra en la interfacez y diseño, no en funcionalidades backend.

---

## 1. Estructura del Proyecto

```
/home/chalo/projects/interfazIdioma/
├── index.html          # Página principal
├── css/style.css       # Estilos visuales
├── js/main.js          # Lógica de interacción
├── images/             # Recursos gráficos
└── guia.md             # Esta guía (para modificar)
```

---

## 2. Modos de Interfaz a Implementar

### Modo 1: Redacción Asistida (Correo Electrónico)
**Subtarea cubierta**: 5.1-5.4 (Planificar → Borrador → Revisar → Cerrar)

#### Componentes requeridos:
- [ ] **Selector de tareas** en pantalla principal
- [ ] Layout con-header, área principal y footer
- [ ] **Etapas visibles**: "Planificar → Borrador → Revisar → Cerrar"
- [ ] Formulario de planificación (destinatario, objetivo, tono, datos clave)
- [ ] Área de borrador con componentes:
    - Asunto
    - Cuerpo del mensaje
    - Cierre y firma
- [ ] **Características mocking**:
    - Botón "Generar esquema IA" - simula creación de borrador
    - Subrayado rojo: correcciones gramaticales (ej: "change" → "changed")
    - Subrayado azul: sugerencias de vocabulario (ej: "important" → "relevant")
    - Botón "Buscar sinónimos"
    - Vista "Control de cambios" - texto original vs corregido al lado, resaltado por color
- [ ] Indicador de progreso por etapa

#### Estados de la interfaz:
1. **Planificar**: Formulario de datos del correo
2. **Borrador**: Área de escritura con componentes separados
3. **Revisar**: Feedback mock de la IA con correcciones sugeridas
4. **Cerrar**: Botones de finalizar, revisar ortografía y enviar

---

### Modo 2: Simulación de Conversación
**Subtarea cubierta**: 5.1-5.4 (Preparar → Grabar → Analizar → Repetir)

#### Componentes requeridos:
- [ ] **Selector de escenario**: Entrevista, Café, Presentación (botones)
- [ ] **Panel de chat grande** (jerarquía central según sección 6.3)
- [ ] **Avatares**: IA vs Usuario
- [ ] **Botón de micrófono grande** para grabación
- [ ] **Caja de texto** para respuesta del usuario
- [ ] **Controles**:
    - Botón "Siguiente pregunta"
    - Indicador de progreso de minutos hablados
- [ ] **Panel lateral** con vocabulario/palabras clave del escenario

#### Flujo de trabajo:
1. Seleccionar escenario
2. Ver pregunta de la IA
3. Usuario escribe/responde en caja de texto
4. Presionar "Siguiente" para continuar
5. Grabar sesión (mock) con botón de micrófono
6. Ver progreso y minutos hablados
7. Analizar momentos de trabazón identificados

---

### Modo 3: Selector Principal (Pantalla Inicial)
**Basado en sección 6.1 del plan.md original**:

#### Layout según sección 6.3:
- [ ] **Superior Izquierdo**: Selector de tareas y modos de práctica
    - Cuadrícula/lista con 4 modos:
      - Modo conversación/práctica
      - Modo lecciones/repaso
      - Modo redacción asistida
      - Modo Preguntas casuales/dudas
- [ ] **Superior Derecho**: Pestaña pequeña de Preguntas Frecuentes/Recomendadas
- [ ] **Central Superior**: Chat principal (ocupa mayor espacio - jerarquía alta)
- [ ] **Central Inferior**: Carrusel de chats anteriores/recientes (izquierda-derecha)
- [ ] **Inferior**: Cuadro de diálogo para consultas

#### Visual design:
- [ ] **Paleta de colores** (sección 6.1):
  - Rojo: correcciones gramaticales
  - Azul: sugerencias de vocabulario  
  - Verde: progreso/aprendizaje
  - Gris: contenido neutral
- [ ] **Tipografía**: Inter family, legible para sesiones cortas
- [ ] **Responsive**: Funciona en laptop y celular
- [ ] **Iconografía**: consistente y significativa

---

## 3. Mock Data y Contenido de Prueba

### Para Modo Redacción:
- [ ] **Escenarios de correo**:
  - Solicitud de beca
  - Permiso para salida
  - Solicitud de práctica
  - Reunión con tutor
- **Texto de ejemplo para correcciones**:
  - Errores gramaticales: "I am agree" → "I agree", "She don't" → "She doesn't"
  - Mejoras de vocabulario: "big" → "large", "good" → "excellent"
  - Claridad: oraciones muy largas, voz pasiva

### Para Modo Conversación:
- [ ] **Escenarios predefinidos**:
  - Entrevista de trabajo (10 preguntas)
  - Café con amigo (5 intercambios)
  - Presentación formal (3 minutos)
- [ ] **Palabras clave por escenario**:
  - Entrevista: "experience", "strengths", "goals"
  - Café: "weekend", "recommend", "favorite"
  - Presentación: "introduce", "objective", "summary"
- [ ] **Guiones de IA**:
  - Preguntas de apertura
  - Preguntas de seguimiento
  - Cierre de conversación

### Datos de Progreso:
- [ ] **Panel de progreso**:
  - Palabras nuevas aprendidas
  - Errores que dejaron de aparecer
  - Minutos hablados
  - Etapas completadas

---

## 4. Decisiones de Diseño UI/UX

### Principios del curso:
1. **Sesiones cortas**: Interfaz optimizada para uso de 5-15 minutos
2. **Tolerancia al error**: Correcciones focalizadas, no masivas
3. **Feedback en lenguaje simple**: Explicaciones tipo "Cambié 'I am agree' por 'I agree' porque agree ya es un verbo"
4. **Identificación visual**: Colores/iconos para tipos de respuesta (reading, listening, speaking, vocabulario, ejercicios)
5. **Metas visibles**: Relacionado con panel de progreso

### Elementos visuales clave:
- [ ] **Distinción por colores/icones** para diferentes tipos de contenido
- [ ] **Indicativo de metas** relacionado con panel de progreso
- [ ] **Vista de control de cambios**: Texto original y versión corregida en paralelo, cada cambio resaltado y clasificado por color
- [ ] **Barra de etapas visible**: "Planificar → Borrador → Revisar → Cerrar" - la IA no pasa de etapa sin que el usuario confirme
- [ ] **Panel de progreso**: Palabras nuevas, errores corregidos, minutos hablados

### Respondiendo a correcciones de la IA:
- [ ] Mostrar criterio de corrección en lenguaje simple
- [ ] Ejemplo: "Cambié I am agree por I agree porque agree ya es un verbo"
- [ ] Subrayado diferenciador: rojo = gramática, azul = vocabulario
- [ ] Panel lateral o modal con explicación del cambio

---

## 5. Tecnologías a Utilizar

### Stack recomendado (por ser demo/mocking):
- **HTML5** - Estructura semántica
- **CSS3** - TailwindCSS o estilos personalizados
- **JavaScript Vanilla** - Lógica de interacción (sin frameworks complejos para demo rápida)
- **Font Awesome o SVGs** - Iconografía
- **Google Fonts: Inter** - Tipografía legible

### Alternativas consideradas:
- **React + TailwindCSS** - Para prototipado más robusto
- **Figma** - Para diseño estático antes de codear
- **Framer Motion** - Para animaciones sutiles de transición

---

## 6. Checklist de Implementación Fase 1

### Semana 1: Estructura Base
- [ ] Crear index.html con layout de 3 pantallas (selector, writing, conversation)
- [ ] Configurar css/style.css con variables de colores y tipografía
- [ ] Implementar selector de tareas con 4 modos
- [ ] Hacer diseño responsive (mobile-first)

### Semana 2: Modo Redacción Asistida
- [ ] Etapas visibles: Planificar → Borrador → Revisar → Cerrar
- [ ] Formulario de planificación completado
- [ ] Área de borrador con 3 componentes (asunto, cuerpo, cierre)
- [ ] Botón "Generar esquema IA" con mocking
- [ ] Subrayado rojo/blue mock
- [ ] Botón "Buscar sinónimos"
- [ ] Vista control de cambios simplificada

### Semana 3: Modo Conversación
- [ ] Selector de escenario (entrevista/café/presentación)
- [ ] Panel de chat con avatares IA/usuario
- [ ] Botón micrófono grande funcional (mock)
- [ ] Caja de texto para respuesta
- [ ] Botón "Siguiente pregunta"
- [ ] Indicador progreso minutos hablados
- [ ] Panel vocabulario lateral

### Semana 4: Detalles Finales
- [ ] Paleta de colores implementada
- [ ] Tipografía Inter aplicada
- [ ] Iconografía consistente
- [ ] Micro-interacciones y estados hover
- [ ] Testing en laptop y celular
- [ ] Documentación básica del sistema

---

## 7. Cómo Ejecutar el Proyecto

1. Abrir `index.html` en cualquier navegador
2. Navegar entre los 3 modos principales
3. Interactuar con los elementos mock
4. Probar responsive en diferentes tamaños de ventana

---

## 8. Próximas Mejoras (Fuera del Scope Actual)

- Integración real con API de IA
- Almacenamiento local de progreso
- Base de datos de escenarios y vocabulario
- Sistema de autenticación de usuario
- Exportar correos y grabaciones
- Múltiples idiomas objetivo