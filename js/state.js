/* ============================================================
   State · store mínimo con suscripciones
   ============================================================ */
(function () {
    'use strict';

    const D = window.DemoData;
    const clone = (v) => JSON.parse(JSON.stringify(v));

    const initial = {
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
        recording: false,
        typing: false,
        activeStage: 2,
        messages: clone(D.initialMessages),
        scenario: 'interview',
        selectedWord: null,
        savedWords: [],
        plan: clone(D.plan),
        tasks: clone(D.tasks),
        criteria: clone(D.criteria),
        sessions: clone(D.sessions),
        suggestionsOpen: false,
        drawerOpen: false,
        historyOpen: false,
        historyMode: null,
        // 0 = vista tutor, 1 = apoyo guiado, 2 = índice de herramientas, 3 = una herramienta abierta
        detailsLevel: 0,
        analysisPlaying: false,
        focusCorrection: null
    };

    let state = clone(initial);
    const subscribers = [];

    function emit() {
        subscribers.slice().forEach((fn) => fn(state));
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
