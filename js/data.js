/* ============================================================
   Mock data · Todo el contenido de la demo (sin backend)
   ============================================================ */
(function () {
    'use strict';

    /* ---------- Texto de la sesión de redacción ---------- */
    const writingText = `Dear Professor Ramos,

I am agree with the course deadline, but I had two exams last week. The deadline is important for my final grade, and I also had to work on a project and I could not finish the essay on time. I want you give me more time.

Thank you for your help.
Best regards`;

    /* ---------- Correcciones plantadas ---------- */
    const corrections = [
        {
            id: 'c1',
            kind: 'grammar',
            label: 'Gramática',
            title: 'Concordancia verbal',
            correctionNo: 1,
            before: 'I am agree',
            after: 'I agree',
            hint: 'Mira “I am agree”. ¿Necesita “agree” el auxiliar “am” para funcionar?',
            why: 'En inglés, “agree” ya es un verbo. No necesita el auxiliar “am”: se dice “I agree with…”.',
            example: 'I agree with the course deadline. / She agrees with the plan.',
            ruleId: 'r1',
            control: 'lógica del sistema',
            risk: 'variabilidad',
            paper: 'Yang · WoZ',
            status: 'pending'
        },
        {
            id: 'c2',
            kind: 'vocab',
            label: 'Vocabulario',
            title: 'Palabra poco precisa',
            correctionNo: 2,
            before: 'important',
            after: 'relevant',
            hint: 'Mira “important”. Para hablar de lo que afecta tu nota, ¿hay una palabra más precisa?',
            why: '“Relevant” expresa que el plazo es pertinente para tu evaluación; “important” es más general.',
            example: 'This deadline is relevant for my final grade.',
            alt: '“Pertinent” o “significant” también funcionan. “Important” no es incorrecto: solo es menos preciso aquí.',
            ruleId: 'r2',
            control: 'comunicación',
            risk: 'validez ecológica',
            paper: 'Yang · WoZ',
            status: 'pending'
        },
        {
            id: 'c3',
            kind: 'tone',
            label: 'Tono',
            title: 'Petición demasiado directa',
            correctionNo: 3,
            before: 'I want you give me more time',
            after: 'Could you please give me more time?',
            hint: 'Mira “I want you give me more time”. Para escribirle a una profesora, ¿suena lo bastante formal?',
            why: '“Could you please…?” es una petición cortés y adecuada para el contexto académico.',
            example: 'Could you please give me more time to submit the essay?',
            alt: 'Una opción algo menos formal pero aceptable: “Would it be possible to have more time?”.',
            ruleId: 'r3',
            control: 'colaboración',
            risk: 'decepción',
            paper: 'Yang · WoZ',
            status: 'pending'
        },
        {
            id: 'c4',
            kind: 'clarity',
            label: 'Claridad',
            title: 'Oración demasiado larga',
            correctionNo: 4,
            before: 'I also had to work on a project and I could not finish the essay on time.',
            after: 'I also had to work on a project. As a result, I could not finish the essay on time.',
            hint: 'Esa oración encadena dos ideas con “and”. ¿Podrías separarlas para que se entienda mejor?',
            why: 'Separar la causa y la consecuencia hace que el argumento sea más fácil de seguir.',
            example: 'I had to work on a project. As a result, I could not finish the essay on time.',
            ruleId: 'r4',
            control: 'guion predefinido',
            risk: 'reproducibilidad',
            paper: 'Yang · WoZ',
            status: 'pending'
        }
    ];

    /* ---------- Reglas y ejemplos ---------- */
    const rules = [
        {
            id: 'r1', kind: 'grammar', label: 'Gramática', title: '“Agree” ya es un verbo',
            body: 'No uses “am / is / are” delante de “agree”. El verbo se conjuga solo.',
            good: 'I agree with the deadline.',
            bad: 'I am agree with the deadline.'
        },
        {
            id: 'r2', kind: 'vocab', label: 'Vocabulario', title: 'Important vs. relevant',
            body: '“Important” indica valor general. “Relevant” indica que algo es pertinente para el tema o la evaluación.',
            good: 'This deadline is relevant for my final grade.',
            bad: 'This deadline is important for my final grade.'
        },
        {
            id: 'r3', kind: 'tone', label: 'Tono', title: 'Peticiones formales',
            body: 'En contextos académicos, usa modales de cortesía: could, would, may. Evita “I want you to…”.',
            good: 'Could you please give me more time?',
            bad: 'I want you give me more time.'
        },
        {
            id: 'r4', kind: 'clarity', label: 'Claridad', title: 'Una idea por oración',
            body: 'Si una oración tiene dos ideas unidas por “and”, sepáralas o usa un conector de consecuencia.',
            good: 'I had to work on a project. As a result, I could not finish on time.',
            bad: 'I had to work on a project and I could not finish on time.'
        }
    ];

    /* ---------- Criterios / supuestos editables (Kazemitabaar) ---------- */
    const criteria = [
        { id: 'audience', icon: 'user', label: 'Destinataria', value: 'Profesora Ramos · universidad' },
        { id: 'level', icon: 'layers', label: 'Nivel objetivo', value: 'B1–B2' },
        { id: 'tone', icon: 'message', label: 'Tono', value: 'Formal y cordial' },
        { id: 'goal', icon: 'tag', label: 'Objetivo', value: 'Solicitar una prórroga' },
        { id: 'avoid', icon: 'shield', label: 'Evitar', value: 'Contracciones y órdenes directas' }
    ];

    /* ---------- Plan de escritura ---------- */
    const plan = [
        { id: 'p1', text: 'Saludo: Dear Professor Ramos,', done: true, optional: false },
        { id: 'p2', text: 'Presentar el motivo: prórroga para el ensayo', done: true, optional: false },
        { id: 'p3', text: 'Justificar con dos exámenes y un proyecto', done: false, optional: false },
        { id: 'p4', text: 'Hacer la petición en tono formal', done: false, optional: false },
        { id: 'p5', text: 'Cierre: Thank you for your consideration.', done: false, optional: true }
    ];

    /* ---------- Task flow (LightVA) ---------- */
    const tasks = [
        { id: 't1', title: 'Saludo y contexto', type: 'DOWN', progress: 100, status: 'ok', detail: 'Abre el correo y sitúa a la destinataria.' },
        { id: 't2', title: 'Detectar gramática', type: 'DOWN', progress: 100, status: 'ok', detail: 'Localizar “I am agree”.' },
        { id: 't3', title: 'Vocabulario y tono', type: 'AND', progress: 50, status: 'warning', detail: 'Revisar “important” y la petición directa.' },
        { id: 't4', title: 'Claridad y cierre', type: 'DOWN', progress: 0, status: 'pending', detail: 'Separar ideas y cerrar con cortesía.' }
    ];

    /* ---------- Operation graph (WaitGPT) ---------- */
    const graphNodes = [
        { id: 'g1', title: 'Cargar texto', status: 'ok', icon: 'doc', corr: null, detail: 'Se cargaron 6 líneas y 64 palabras del correo.' },
        { id: 'g2', title: 'Detectar', status: 'warning', icon: 'scan', corr: 'c1', detail: 'Se detectaron 4 puntos: 1 gramatical, 1 de vocabulario, 1 de tono y 1 de claridad.' },
        { id: 'g3', title: 'Clasificar', status: 'warning', icon: 'tag', corr: 'c2', detail: 'Cada punto se clasificó por tipo, severidad y nivel de ayuda.' },
        { id: 'g4', title: 'Explicar', status: 'warning', icon: 'sparkles', corr: 'c3', detail: 'Se generó una explicación en lenguaje simple para cada corrección.' },
        { id: 'g5', title: 'Reescribir', status: 'error', icon: 'refresh', corr: 'c4', detail: 'La reescritura todavía no incorpora tus decisiones.' }
    ];

    /* ---------- Sugerencias del header (WoZ) ---------- */
    const suggestions = [
        { icon: 'shield', title: 'Motivación WoZ: rigor causal', text: 'Cada corrección muestra control y riesgo para que el estudio sea reproducible.' },
        { icon: 'layers', title: 'Workflow recomendado: Procedimiento + Datos', text: 'Alterna entre revisar el proceso y revisar el texto real.' },
        { icon: 'alert', title: 'Riesgo actual: variabilidad del agente', text: 'Dos ejecuciones podrían priorizar correcciones distintas. El log lo hace visible.' },
        { icon: 'arrowRight', title: 'Siguiente paso: inspeccionar gramática', text: 'Abre la corrección 1 y decide si la aceptas o la rechazas.' }
    ];

    /* ---------- Sesiones recientes ---------- */
    const sessions = [
        { id: 's1', title: 'Correo: prórroga', device: 'monitor', meta: 'Hoy 19:40', mode: 'writing', active: true },
        { id: 's2', title: 'Conversación: entrevista', device: 'phone', meta: 'Ayer 18:05', mode: 'conversation', active: false },
        { id: 's3', title: 'Artículo: vocabulario', device: 'monitor', meta: 'Lun 12:30', mode: 'lessons', active: false },
        { id: 's4', title: 'Presentación formal', device: 'monitor', meta: '26 oct', mode: 'conversation', scenario: 'presentation', active: false }
    ];

    /* ---------- Modos ---------- */
    const modes = {
        writing: {
            label: 'Revisión de correo',
            title: 'Revisión de un correo formal',
            subtitle: 'Correo · solicitud de prórroga',
            stages: ['Planificar', 'Borrador', 'Revisar', 'Cerrar'],
            activeStage: 2,
            tabs: [
                { id: 'text', label: 'Tu texto', paper: 'WaitGPT · data lens' },
                { id: 'rules', label: 'Reglas', paper: 'Gu et al. · procedimiento' },
                { id: 'criteria', label: 'Criterios', paper: 'Kazemitabaar · supuestos' },
                { id: 'plan', label: 'Plan', paper: 'LightVA · plan' },
                { id: 'path', label: 'Ruta', paper: 'LightVA · task flow' },
                { id: 'changes', label: 'Cambios', paper: 'WaitGPT · granular' }
            ],
            placeholder: 'Pregunta algo sobre tu correo o pide una pista…',
            modeHint: 'Modo: Revisión de correo'
        },
        conversation: {
            label: 'Práctica de conversación',
            title: 'Práctica de conversación escrita',
            subtitle: 'Entrevista de trabajo · inglés B1–B2',
            stages: ['Preparar', 'Hablar', 'Analizar', 'Repetir'],
            activeStage: 1,
            tabs: [
                { id: 'vocabulary', label: 'Palabras clave', paper: 'LightVA · insights' },
                { id: 'scenario', label: 'Escenario', paper: 'Gu et al. · contexto' },
                { id: 'progress', label: 'Progreso', paper: 'WoZ · rigor' },
                { id: 'path', label: 'Ruta', paper: 'LightVA · task flow' },
                { id: 'changes', label: 'Cambios', paper: 'WaitGPT · granular' }
            ],
            placeholder: 'Escribe tu respuesta en inglés o pide una pista…',
            modeHint: 'Modo: Práctica de conversación'
        },
        lessons: {
            label: 'Vocabulario en contexto',
            title: 'Vocabulario en contexto desde un artículo',
            subtitle: 'Artículo corto · vocabulario en contexto',
            stages: ['Leer', 'Descubrir', 'Registrar', 'Practicar'],
            activeStage: 1,
            tabs: [
                { id: 'vocabulary', label: 'Tus palabras', paper: 'Kazemitabaar · side query' },
                { id: 'article', label: 'Artículo', paper: 'LightVA · data lens' },
                { id: 'progress', label: 'Progreso', paper: 'WoZ · rigor' },
                { id: 'plan', label: 'Plan', paper: 'LightVA · plan' },
                { id: 'changes', label: 'Cambios', paper: 'WaitGPT · granular' }
            ],
            placeholder: 'Pega tu lectura y escribe la palabra que necesitas…',
            modeHint: 'Modo: Vocabulario en contexto'
        },
        questions: {
            label: 'Dudas rápidas',
            title: 'Dudas rápidas',
            subtitle: 'Consultas puntuales de gramática y vocabulario',
            stages: ['Preguntar', 'Explorar', 'Aplicar', 'Cerrar'],
            activeStage: 0,
            tabs: [
                { id: 'answers', label: 'Tus dudas', paper: 'Gu et al. · workflow' },
                { id: 'sources', label: 'Fuentes', paper: 'WoZ · rigor' },
                { id: 'progress', label: 'Progreso', paper: 'LightVA · insights' },
                { id: 'plan', label: 'Plan', paper: 'LightVA · plan' },
                { id: 'changes', label: 'Cambios', paper: 'WaitGPT · granular' }
            ],
            placeholder: 'Escribe una duda rápida de inglés…',
            modeHint: 'Modo: Dudas rápidas'
        }
    };

    /* ---------- Mensajes iniciales por modo ---------- */
    const initialMessages = {
        writing: [
            {
                role: 'user',
                text: 'Revisa mi correo para pedir una prórroga. Por ahora solo dame pistas y déjame verificar.'
            },
            {
                role: 'ai',
                label: 'TUTOR IA · REDACCIÓN',
                text: 'Terminé de revisar tu correo y marqué 4 cosas. Empecemos por la primera; tú decides qué aceptar.',
                chips: [
                    { icon: 'alert', text: 'Gramática: 1', kind: 'grammar' },
                    { icon: 'book', text: 'Vocabulario: 1', kind: 'vocab' },
                    { icon: 'message', text: 'Tono: 1', kind: 'tone' },
                    { icon: 'sparkles', text: 'Claridad: 1', kind: 'clarity' }
                ]
            }
        ],
        conversation: [
            {
                role: 'ai',
                label: 'ENTREVISTADORA IA · CONVERSACIÓN',
                text: 'Good morning! Thanks for coming. To start, could you tell me a little about yourself and why you are interested in this position?',
                chips: [
                    { icon: 'lightbulb', text: 'Pista: usa “I have experience in…”', kind: 'info' },
                    { icon: 'message', text: 'Responde por escrito en inglés', kind: 'info' }
                ]
            }
        ],
        lessons: [
            {
                role: 'ai',
                label: 'TUTOR IA · LECTURA',
                text: 'Lee el artículo y selecciona una palabra que no conozcas. Yo te ayudo con el significado en contexto, sin darte la respuesta completa.',
                chips: [
                    { icon: 'book', text: 'Artículo: The future of remote work', kind: 'info' },
                    { icon: 'lightbulb', text: 'Toca una palabra resaltada', kind: 'info' }
                ]
            }
        ],
        questions: [
            {
                role: 'ai',
                label: 'TUTOR IA · DUDAS',
                text: 'Pregúntame lo que quieras sobre gramática, vocabulario o pronunciación. Te responderé con una explicación corta y un ejemplo.',
                chips: [
                    { icon: 'message', text: '¿Cuándo uso “agree” sin “am”?', kind: 'info' },
                    { icon: 'book', text: '¿Diferencia entre “important” y “relevant”?', kind: 'info' },
                    { icon: 'mic', text: '¿Cómo suena “comfortable”?', kind: 'info' }
                ]
            }
        ]
    };

    /* ---------- Escenarios de conversación ---------- */
    const scenarios = [
        {
            id: 'interview', name: 'Entrevista de trabajo', icon: 'user',
            goal: 'Responder 4 preguntas y justificar tu experiencia.',
            prompts: [
                'Could you tell me a little about yourself?',
                'What are your main strengths for this position?',
                'Tell me about a challenge you solved.',
                'Where do you see yourself in three years?'
            ],
            vocab: ['experience', 'strengths', 'goals', 'position', 'challenge', 'teamwork']
        },
        {
            id: 'cafe', name: 'Café con un amigo', icon: 'message',
            goal: 'Mantener una conversación informal de 5 intercambios.',
            prompts: [
                'How was your weekend?',
                'What do you usually do to relax?',
                'Have you seen any good series lately?'
            ],
            vocab: ['weekend', 'recommend', 'favorite', 'relax', 'catch up']
        },
        {
            id: 'presentation', name: 'Presentación formal', icon: 'layers',
            goal: 'Presentar un proyecto en 3 minutos.',
            prompts: [
                'Good morning. Could you introduce your project?',
                'What is the main objective?',
                'How would you summarize the results?'
            ],
            vocab: ['introduce', 'objective', 'summary', 'results', 'team', 'impact']
        }
    ];

    /* ---------- Artículo de la lección ---------- */
    const article = {
        title: 'The future of remote work',
        source: 'Mini artículo · 120 palabras · B1–B2',
        paragraphs: [
            'Remote work has become a normal part of modern life. Many companies discovered that employees can be productive at home, and workers value the flexibility. However, remote work also creates challenges, such as isolation and difficulty separating work from personal time.',
            'Experts recommend creating a clear routine. A dedicated workspace, regular breaks, and short conversations with colleagues can help. The goal is not to work more, but to work better.'
        ],
        words: [
            {
                word: 'productive', meaning: 'que produce buenos resultados', example: 'Employees can be productive at home.',
                use: 'Se usa para describir a una persona, equipo o actividad que logra buenos resultados.',
                examples: ['A productive meeting ends with clear decisions.', 'She feels more productive in the morning.']
            },
            {
                word: 'flexibility', meaning: 'capacidad de adaptarse a distintos horarios', example: 'Workers value the flexibility.',
                use: 'Se usa para hablar de horarios, normas o formas de trabajo que pueden adaptarse.',
                examples: ['This job offers flexibility for students.', 'The flexibility of the schedule helps parents.']
            },
            {
                word: 'isolation', meaning: 'sensación de estar solo', example: 'Remote work can create isolation.',
                use: 'Se usa cuando una persona se siente separada de otras personas o de un grupo.',
                examples: ['Long periods of isolation can affect motivation.', 'The student experienced isolation during the first month.']
            },
            {
                word: 'dedicated', meaning: 'reservado para un uso concreto', example: 'A dedicated workspace helps you focus.',
                use: 'En este artículo significa “reservado exclusivamente para una función”.',
                examples: ['I use a dedicated notebook for new vocabulary.', 'The team has a dedicated room for meetings.']
            },
            {
                word: 'routine', meaning: 'secuencia habitual de actividades', example: 'Create a clear routine.',
                use: 'Se usa para hablar de actividades que se repiten de manera organizada.',
                examples: ['My morning routine starts with a short walk.', 'A regular routine can make studying easier.']
            }
        ]
    };


    /* ---------- Guía visual de modos secundarios ---------- */
    const modeGuides = {
        conversation: {
            title: 'Cómo funciona esta práctica',
            lead: 'Una sesión corta de speaking con apoyo visible, no una conversación infinita.',
            steps: [
                { n: '1', title: 'Elige el escenario', text: 'Entrevista, café o presentación formal.' },
                { n: '2', title: 'Responde', text: 'Escribe tu respuesta en inglés.' },
                { n: '3', title: 'Avanza', text: 'Pide una pista o pasa a la siguiente pregunta.' }
            ]
        },
        lessons: {
            title: 'Cómo funciona esta lección',
            lead: 'Lectura corta con vocabulario en contexto y una meta semanal visible.',
            steps: [
                { n: '1', title: 'Lee', text: 'Un artículo breve de nivel B1–B2.' },
                { n: '2', title: 'Descubre', text: 'Toca una palabra para ver su sentido.' },
                { n: '3', title: 'Registra', text: 'Guarda la palabra y crea tu ejemplo.' }
            ]
        },
        questions: {
            title: 'Cómo funciona esta vista',
            lead: 'Dudas puntuales con explicación corta, fuente y aplicación inmediata.',
            steps: [
                { n: '1', title: 'Pregunta', text: 'Escribe una duda concreta de inglés.' },
                { n: '2', title: 'Revisa', text: 'Mira la regla, el ejemplo y la fuente.' },
                { n: '3', title: 'Aplica', text: 'Convierte la respuesta en un ejercicio.' }
            ]
        }
    };

    /* ---------- Respuestas mock del chat ---------- */
    const replies = {
        writing: [
            { match: /pista|ayuda|hint/i, text: 'Pista: fíjate primero en “I am agree”. En inglés, “agree” ya es un verbo, así que no necesita “am”. ¿Quieres ver la regla completa?', chips: [{ icon: 'book', text: 'Ver regla', action: 'open-rule-r1', kind: 'info' }] },
            { match: /sinónim|vocabul|important/i, text: 'Para “important” puedes usar “relevant” si hablas de pertinencia, o “demanding” si hablas de una tarea exigente. ¿Cuál encaja mejor con tu frase?', chips: [{ icon: 'search', text: 'Buscar sinónimos', action: 'open-synonyms', kind: 'info' }] },
            { match: /regla|por qué|porque/i, text: 'La regla es simple: “agree” no lleva auxiliar. Se conjuga como cualquier verbo: I agree, she agrees, we agreed. ¿Quieres un ejemplo en tu correo?', chips: [{ icon: 'book', text: 'Ver ejemplo', action: 'open-rule-r1', kind: 'info' }] },
            { match: /pronunci|suena|audio/i, text: 'Pronuncia “agree” con el acento en la segunda sílaba: /əˈɡriː/. Intenta decir “I agree” tres veces en voz alta.', chips: [{ icon: 'mic', text: 'Grabar intento', action: 'toggle-mic', kind: 'info' }] },
            { match: /tono|formal|profesor/i, text: 'Para una profesora, cambia “I want you to…” por “Could you please…?”. Mantiene tu petición, pero suena más cortés.', chips: [{ icon: 'message', text: 'Editar criterio de tono', action: 'open-criteria', kind: 'info' }] }
        ],
        conversation: [
            { match: /pista|ayuda|hint/i, text: 'Pista: empieza con una estructura segura. “I have experience in…” + un ejemplo concreto. No necesitas una respuesta perfecta, solo clara.', chips: [{ icon: 'book', text: 'Ver vocabulario', action: 'open-vocabulary', kind: 'info' }] },
            { match: /nervios|miedo|no sé/i, text: 'Respira. Puedes ganar tiempo con “That’s a good question. Let me think for a second.” Luego responde con una idea y un ejemplo.', chips: [{ icon: 'mic', text: 'Practicar en voz alta', action: 'toggle-mic', kind: 'info' }] },
            { match: /.*/, text: 'Good answer. Ahora intenta añadir una razón: “because I enjoy…” o “for example, in my last project…”. Así tu respuesta gana detalle.', chips: [{ icon: 'arrowRight', text: 'Siguiente pregunta', action: 'next-prompt', kind: 'info' }] }
        ],
        lessons: [
            { match: /productiv/i, text: '“Productive” significa que produces buenos resultados. En el artículo: “employees can be productive at home”. ¿Puedes escribir una oración con “productive”?', chips: [{ icon: 'plus', text: 'Guardar palabra', action: 'save-word-productive', kind: 'info' }] },
            { match: /flexib/i, text: '“Flexibility” es la capacidad de adaptarse. Se usa mucho para horarios: “flexible hours”. En español sería “flexibilidad”.', chips: [{ icon: 'plus', text: 'Guardar palabra', action: 'save-word-flexibility', kind: 'info' }] },
            { match: /.*/, text: 'Buena elección. Para entender una palabra en contexto, mira la oración completa antes de traducirla. ¿Quieres que te dé una pista o el significado directo?', chips: [{ icon: 'lightbulb', text: 'Dame una pista', action: 'hint-word', kind: 'info' }] }
        ],
        questions: [
            { match: /agree/i, text: '“Agree” ya es un verbo, así que no lleva “am”: I agree, she agrees. Error típico: “I am agree”. Correcto: “I agree with you”.', chips: [{ icon: 'book', text: 'Ver regla', action: 'open-rule-r1', kind: 'info' }] },
            { match: /important|relevant/i, text: '“Important” indica valor general; “relevant” indica pertinencia. Si hablas de un plazo que afecta tu nota, “relevant” es más preciso.', chips: [{ icon: 'book', text: 'Ver regla', action: 'open-rule-r2', kind: 'info' }] },
            { match: /pronunci|comfortable|suena/i, text: '“Comfortable” se pronuncia /ˈkʌmftəbl/, con tres sílabas. No digas “com-for-ta-ble”: suena antinatural.', chips: [{ icon: 'mic', text: 'Grabar intento', action: 'toggle-mic', kind: 'info' }] },
            { match: /.*/, text: 'Buena pregunta. Te doy una explicación corta y un ejemplo para que puedas aplicarlo hoy mismo. ¿Quieres que lo convierta en ejercicio?', chips: [{ icon: 'sparkles', text: 'Crear ejercicio', action: 'create-exercise', kind: 'info' }] }
        ]
    };

    window.DemoData = {
        writingText,
        corrections,
        rules,
        criteria,
        plan,
        tasks,
        graphNodes,
        suggestions,
        sessions,
        modes,
        initialMessages,
        scenarios,
        article,
        modeGuides,
        replies,
        wizardProtocol: [
            { label: 'Regla 1', text: 'El wizard nunca corrige sin mostrar el criterio y el tipo de control.' },
            { label: 'Regla 2', text: 'Cada operación se registra con tiempo, entrada y salida (log mock).' },
            { label: 'Regla 3', text: 'La autonomía es simulada: el usuario acepta, rechaza o ramifica.' },
            { label: 'Regla 4', text: 'Los riesgos WoZ se etiquetan en la interfaz, no se ocultan.' }
        ]
    };
})();
