/* ============================================================
   State · store mínimo con suscripciones
   ============================================================ */
(function () {
    'use strict';

    const D = window.DemoData;
    const clone = (v) => JSON.parse(JSON.stringify(v));

    const initial = {
        view: 'home',                  // home | work
        mode: 'writing',
        workflow: 'procedure',          // procedure | data
        help: 'pista',                 // pista | explicacion | ejemplo | reescritura
        tab: 'text',
        version: 'draft',              // original | draft | final
        dataLens: false,
        branch: 'main',
        branches: ['main'],
        statuses: { c1: 'pending', c2: 'pending', c3: 'pending', c4: 'pending' },
        inspected: ['c1', 'c2'],
        showDecomp: false,
        decompAccepted: false,
        decompIgnored: false,
        sideOpen: false,
        sidePrefill: '',
        sideAnswer: null,
        typing: false,
        activeStage: 2,
        messages: clone(D.initialMessages),
        vocab: null,                   // conversación de vocabulario en curso (tarea 3)
        vocabWords: [],                // tus palabras: significado, oración original y la tuya
        plan: clone(D.plan),
        tasks: clone(D.tasks),
        criteria: clone(D.criteria),
        sessions: clone(D.sessions),
        suggestionsOpen: false,
        historyOpen: false,
        historyMode: null,
        // 0 = vista tutor, 1 = apoyo guiado, 2 = índice de herramientas, 3 = una herramienta abierta
        detailsLevel: 0,
        analysisPlaying: false,
        showTags: false,
        reduceMotion: !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches),
        sheetOpen: false,
        errBank: {},                   // errores propios por tipo (tarea 2)
        errPractice: null,             // ronda de práctica en curso
        errRule: '',
        focusCorrection: null
    };

    /* ---------- Guardado en el navegador (que no se pierdan notas ni progreso al recargar) ---------- */
    const STORE_KEY = 'lingua-ia:v4';
    const OLD_KEYS = ['lingua-ia:v1', 'lingua-ia:v2', 'lingua-ia:v3'];
    const PERSISTED = [
        'vocab', 'vocabWords', 'sessions', 'statuses', 'inspected', 'messages', 'errBank', 'errPractice', 'errRule',
        'help', 'version', 'mode', 'activeStage', 'tab', 'branches', 'branch', 'plan', 'criteria',
        'historyMode', 'showTags', 'reduceMotion'
    ];

    function load() {
        try {
            const raw = window.localStorage.getItem(STORE_KEY);
            if (!raw) return clone(initial);
            const saved = JSON.parse(raw);
            const next = clone(initial);
            PERSISTED.forEach((k) => { if (saved[k] !== undefined && typeof saved[k] === typeof initial[k]) next[k] = saved[k]; });
            return next;
        } catch (e) {
            return clone(initial);
        }
    }

    let saveTimer = null;
    function save() {
        window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(() => {
            try {
                const out = {};
                PERSISTED.forEach((k) => { out[k] = state[k]; });
                window.localStorage.setItem(STORE_KEY, JSON.stringify(out));
            } catch (e) { /* sin almacenamiento: la app sigue funcionando sin guardar */ }
        }, 150);
    }

    let state = load();
    const subscribers = [];

    function emit() {
        subscribers.slice().forEach((fn) => fn(state));
        save();
    }

    window.DemoState = {
        get() {
            return state;
        },
        set(patch) {
            state = Object.assign({}, state, patch);
            emit();
            return state;
        },
        update(fn) {
            fn(state);
            emit();
            return state;
        },
        touch() {
            emit();
        },
        subscribe(fn) {
            subscribers.push(fn);
            return () => {
                const i = subscribers.indexOf(fn);
                if (i >= 0) subscribers.splice(i, 1);
            };
        },
        reset() {
            state = clone(initial);
            emit();
        },
        clearSaved() {
            try { [STORE_KEY].concat(OLD_KEYS).forEach((k) => window.localStorage.removeItem(k)); } catch (e) { /* nada que borrar */ }
            window.clearTimeout(saveTimer);
            state = clone(initial);
            subscribers.slice().forEach((fn) => fn(state));
        },
        helpers: {
            correction(id) {
                return D.corrections.find((c) => c.id === id);
            },
            rule(id) {
                return D.rules.find((r) => r.id === id);
            },
            mode() {
                return D.modes[state.mode];
            },
            verifiedCount() {
                return Object.keys(state.statuses).filter((k) => state.statuses[k] !== 'pending').length;
            }
        }
    };
})();
