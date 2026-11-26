/* ============================================================
   Intent · a qué tarea llevar a la persona según su prompt
   Simulación por reglas: puntaje = palabras clave + detector de
   cada tarea registrada en window.Tasks. Si dudas, pregunta.
   Para usar IA real solo cambia el interior de route(): debe
   devolver la misma forma { task, confidence, candidates }.
   ============================================================ */
(function () {
    'use strict';

    const T = window.Tasks;
    const KEYWORD = 0.35;          // cada palabra clave que aparece
    const WIN = 0.35;              // puntaje mínimo para sugerir una tarea (una palabra clave clara)
    const LEAD = 0.2;              // ventaja mínima sobre la segunda

    function score(task, text) {
        const kw = task.keywords.reduce((s, rx) => s + (rx.test(text) ? KEYWORD : 0), 0);
        let det = 0;
        try { det = Number(task.detect(text)) || 0; } catch (e) { det = 0; }
        return Math.min(1, kw + det);
    }

    function route(text) {
        const t = String(text || '').trim();
        const ranked = T.all().map((task) => ({ task, score: score(task, t) })).sort((a, b) => b.score - a.score);
        const [a, b] = ranked;
        if (a && a.score >= WIN && (!b || a.score - b.score >= LEAD)) return { task: a.task, confidence: a.score, candidates: [a.task] };
        const close = ranked.filter((r) => r.score >= 0.3 && a.score - r.score < LEAD).map((r) => r.task);
        if (close.length > 1) return { task: null, confidence: a.score, candidates: close };
        // Sin coincidencias: si parece una petición real, se ofrecen todas; si no, se pide aclarar
        const meaningful = T.util.nWords(t) >= 3 && /[aeiouáéíóú]{1}.*[aeiouáéíóú]/i.test(t);
        return { task: null, confidence: a ? a.score : 0, candidates: meaningful ? T.all() : [] };
    }

    /* Dentro de una tarea: si el prompt es claramente de otra, ofrece ir allá */
    function elsewhere(text, current) {
        const r = route(text);
        return r.task && r.task.id !== current ? r.task : null;
    }

    window.Intent = { route, elsewhere, score };
})();
