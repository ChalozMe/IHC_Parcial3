// ========================================
// HCI Demo - JavaScript de Interacción
// ========================================

/* ========================================
   ESTADO DE LA APLICACIÓN
   ======================================== */
const appState = {
    currentMode: 'selector', // selector, writing, conversation
    currentWritingStage: 'planificar',
    currentScenario: 'entrevista',
    conversationMinutes: 0,
    isRecording: false,
    turnCounter: 0
};

/* ========================================
   INICIALIZACIÓN
   ======================================== */
document.addEventListener('DOMContentLoaded', () => {
    // Configurar event listeners
    setupModeSwitching();
    setupWritingStages();
    setupConversationMode();
    setupTaskSelector();
});

/* ========================================
   CAMBIO DE MODOS
   ======================================== */
function setupModeSwitching() {
    // Botones de modo card en selector
    document.querySelectorAll('[data-mode]').forEach(card => {
        card.addEventListener('click', () => {
            const mode = card.getAttribute('data-mode');
            switchMode(mode);
        });
    });
    
    // Botones de regreso
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchMode('selector');
        });
    });
}

function switchMode(mode) {
    // Ocultar todas las pantallas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Mostrar la pantalla seleccionada
    const screen = document.getElementById(`${mode}-mode`);
    if (screen) {
        screen.classList.add('active');
        appState.currentMode = mode;
    }
    
    // Reiniciar estados según el modo
    if (mode === 'writing') {
        appState.currentWritingStage = 'planificar';
        updateEtapas();
    }
    
    if (mode === 'conversation') {
        appState.conversationMinutes = 0;
        appState.isRecording = false;
        updateProgressBar();
    }
}

/* ========================================
   MODO REDACCIÓN ASISTIDA
   ======================================== */
function setupWritingStages() {
    // Navegar entre etapas
    document.querySelectorAll('.etapa').forEach(etapa => {
        etapa.addEventListener('click', () => {
            const stage = etapa.getAttribute('data-stage');
            moveToStage(stage);
        });
    });
    
    // Botón generar esquema
    const btnGenerar = document.querySelector('.btn-generar');
    if (btnGenerar) {
        btnGenerar.addEventListener('click', generarEsquemaIA);
    }
    
    // Siguiente en etapa revisar
    document.querySelectorAll('.btn-siguiente').forEach(btn => {
        btn.addEventListener('click', () => {
            const stage = btn.getAttribute('stage');
            moveToStage(stage);
        });
    });
    
    // Botones finalizar/enviar
    document.querySelectorAll('.btn-finalizar, .btn-enviar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.disabled = true;
            e.target.textContent = e.target.textContent.includes('Enviar') 
                ? 'Enviado!' 
                : 'Revisado!';
            setTimeout(() => {
                e.target.disabled = false;
                e.target.textContent = e.target === document.querySelector('.btn-enviar') 
                    ? 'Enviar correo' 
                    : 'Revisar formato y ortografía';
            }, 2000);
        });
    });
}

function moveToStage(stage) {
    // Ocultar todas las etapas
    document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));
    
    // Mostrar la etapa seleccionada
    const stageEl = document.querySelector(`[stage="${stage}"]`);
    if (stageEl) {
        stageEl.classList.add('active');
        appState.currentWritingStage = stage;
    }
    
    // Actualizar indicador de etapas
    updateEtapas();
}

function updateEtapas() {
    document.querySelectorAll('.etapa').forEach((etapa, index) => {
        const stages = ['planificar', 'borrador', 'revisar', 'cerrar'];
        if (stages[index] === appState.currentWritingStage) {
            etapa.classList.add('active');
        } else {
            etapa.classList.remove('active');
        }
    });
}

function generarEsquemaIA() {
    // Mock: generar esquema de correo
    const textarea = document.querySelector('[component="cuerpo"] textarea');
    if (textarea) {
        textarea.value = `Estimado/a [Destinatario],

[Presentación personal]

[Solicitud principal - claramente articulada]

[Datos necesarios incluidos]

[Cierre cordial]

Atentamente,
[Tu nombre]`;
        
        showMockFeedback('Esquema generado por IA', 'vocabulario');
    }
}

function showMockFeedback(message, type) {
    // Crear elemento de feedback mock
    const feedback = document.createElement('div');
    feedback.className = 'mock-feedback';
    feedback.innerHTML = `<span>${message}</span>`;
    
    // Insertar después de .review-area si existe, o al final de la stage revisar
    const reviewArea = document.querySelector('.review-area');
    if (reviewArea) {
        reviewArea.parentElement.insertBefore(feedback, reviewArea.nextSibling);
    } else {
        // Si no hay review area, crear una
        const stageRevisar = document.querySelector('[stage="revisar"]');
        if (stageRevisar) {
            stageRevisar.querySelector('.final-actions').insertBefore(feedback, stageRevisar.querySelector('.final-actions').firstChild);
        }
    }
    
    // Remover después de 3 segundos
    setTimeout(() => feedback.remove(), 3000);
}

/* ========================================
   MODO SIMULACIÓN DE CONVERSACIÓN
   ======================================== */
function setupConversationMode() {
    // Selector de escenario
    document.querySelectorAll('[escenario]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[escenario]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            appState.currentScenario = btn.getAttribute('data-id');
            cargarEscenario(btn.getAttribute('data-id'));
        });
    });
    
    // Botón siguiente pregunta
    const nextBtn = document.querySelector('.next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', siguientePregunta);
    }
    
    // Botón micrófono
    const micBtn = document.querySelector('.mic-btn');
    if (micBtn) {
        micBtn.addEventListener('click', toggleGrabacion);
    }
    
    // Cargar primer escenario
    cargarEscenario('entrevista');
}

function cargarEscenario(id) {
    const escenarios = {
        entrevista: {
            nombre: 'Entrevista de trabajo',
            pregunta: 'Hola! Hoy practicaremos una entrevista de trabajo en inglés. Estoy listo cuando tú estés.',
            palabrasClave: ['experience', 'strengths', 'goals', 'position']
        },
        cafe: {
            nombre: 'Café con amigo',
            pregunta: '¡Hola! ¿Qué tal te fue el fin de semana? Hay tanto que contar.',
            palabrasClave: ['weekend', 'recommend', 'favorite', 'plan']
        },
        presentacion: {
            nombre: 'Presentación formal',
            pregunta: 'Buenos días a todos. Hoy me gustaría presentar nuestro nuevo proyecto de.',
            palabrasClave: ['introduce', 'objective', 'summary', 'team']
        }
    };
    
    const escenario = escenarios[id] || escenarios.entrevista;
    
    // Actualizar selector
    document.querySelectorAll('[escenario]').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-id') === id);
    });
    
    // Mostrar pregunta de la IA
    const turnAi = document.querySelector('.turn.ai');
    if (turnAi) {
        const preguntaEl = turnAi.querySelector('.turn-text');
        if (preguntaEl) {
            preguntaEl.textContent = escenario.pregunta;
        }
    }
    
    // Actualizar palabras clave
    const palabrasEl = document.querySelector('.progress-bar .progress-text');
    if (palabrasEl) {
        palabrasEl.textContent = `Palabras clave: ${escenario.palabrasClave.join(', ')}`;
    }
    
    // Actualizar título
    const modeTitle = document.querySelector('.mode-title');
    if (modeTitle) {
        modeTitle.textContent = `Simulación de Conversación - ${escenario.nombre}`;
    }
}

function siguientePregunta() {
    // Mock: siguiente pregunta de la IA
    const turnText = document.querySelector('.turn.ai .turn-text');
    if (turnText) {
        turnText.textContent = `¡Excelente! Cuéntame más sobre ${appState.currentScenario}.`;
    }
    
    // Agregar turno de usuario
    addUserTurn('');
    
    // Actualizar progreso
    appState.conversationMinutes += 2;
    updateProgressBar();
}

function toggleGrabacion() {
    appState.isRecording = !appState.isRecording;
    const micBtn = document.querySelector('.mic-btn');
    
    if (appState.isRecording) {
        micBtn.classList.add('recording');
        micBtn.textContent = 'Grabar...';
        // Mock: iniciar grabación
        setTimeout(() => {
            micBtn.classList.remove('recording');
            micBtn.textContent = 'Microfono';
            showGrabacionMock();
        }, 5000);
    } else {
        micBtn.classList.remove('recording');
        micBtn.textContent = 'Microfono';
    }
}

function showGrabacionMock() {
    const turnText = document.querySelector('.turn.ai .turn-text');
    if (turnText) {
        turnText.textContent = 'Grabación guardada. ¿Deseas escucharla o continuar?';
    }
    
    // Agregar opción de continuar
    const controls = document.querySelector('.controls');
    if (controls) {
        const continuarBtn = document.createElement('button');
        continuarBtn.className = 'next-btn';
        continuarBtn.textContent = 'Continuar práctica';
        continuarBtn.style.marginTop = '10px';
        controls.insertBefore(continuarBtn, controls.firstChild);
    }
}

function addUserTurn(text = '') {
    const turns = document.querySelector('.chat-main');
    if (!turns) return;
    
    const turn = document.createElement('div');
    turn.className = 'turn user';
    turn.innerHTML = `
        <div class="avatar user">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12l4 4l12-4"/>
            </svg>
        </div>
        <div class="turn-content">
            <div class="turn-header">
                <span class="turn-role">Tú</span>
                <span class="turn-time">00:45</span>
            </div>
            <textarea class="turn-textarea" placeholder="Tu respuesta...">${text}</textarea>
        </div>
    `;
    
    turns.insertBefore(turn, turns.firstChild);
    
    // Mantener solo 2 turnos visibles
    if (turns.children.length > 4) {
        turns.removeChild(turns.children[turns.children.length - 1]);
    }
    
    // Enfocar textarea
    const textarea = turn.querySelector('.turn-textarea');
    if (textarea) {
        textarea.focus();
    }
}

function updateProgressBar() {
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    if (progressFill && progressText) {
        const percentage = Math.min((appState.conversationMinutes / 10) * 100, 100);
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `Minutos hablados: ${appState.conversationMinutes}`;
    }
}

/* ========================================
   SELECTOR DE TAREAS
   ======================================== */
function setupTaskSelector() {
    // Ya está configurado en switchMode, pero podemos agregar lógica adicional aquí
}