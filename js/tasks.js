/* ============================================================
   Tasks · registro de tareas
   Cada tarea se describe a sí misma (nombre, para qué sirve,
   ejemplos de prompt, palabras clave, detector y seed).
   El inicio, el router y las pruebas se generan desde aquí:
   una tarea nueva = un archivo con su register(...) y su <script>.
   ============================================================ */
(function () {
    'use strict';

    const list = [];
    const nWords = (t) => String(t).trim().split(/\s+/).filter(Boolean).length;
    const EN = /\b(the|an|and|but|or|so|to|of|is|are|was|were|am|be|been|i|you|she|it|we|they|my|your|his|her|their|our|for|with|from|into|at|by|as|not|have|has|had|do|did|this|that|there|who|which|in|on|will|can|would|could|please|one|day|time|upon)\b/gi;
    const looksEnglish = (t) => { const w = nWords(t); return w >= 3 && ((String(t).match(EN) || []).length / w) >= 0.15; };
    const looksEmail = (t) => /^\s*(dear|hi|hello|good (morning|afternoon))\b/i.test(t) || /\b(regards|sincerely|best wishes|thank you in advance|yours)\b[,.]?\s*\n?/i.test(t);

    window.Tasks = {
        /* t: { id, name, pitch, understood, examples[], keywords[], detect(text) → 0..1, module } */
        register(t) {
            if (list.some((x) => x.id === t.id)) return;
            list.push(Object.assign({ keywords: [], examples: [], detect: () => 0 }, t));
        },
        all: () => list.slice(),
        get: (id) => list.find((t) => t.id === id),
        util: { nWords, looksEnglish, looksEmail }
    };
})();
