/* ============================================================
   Tarea 0.2 · Producir un texto en inglés (en el chat)
   0.2.1 Definir · 0.2.2–0.2.3 Preparar · 0.2.4 Organizar ·
   0.2.5–0.2.7 Redactar y obtener retroalimentación · 0.2.8 Versión final
   Tres tipos de texto (0.2.1.10 correo formal, 0.2.1.11 cuento,
   0.2.1.12 otros). La revisión es la de review.js, que sabe el tipo.
   ============================================================ */
(function () {
    'use strict';

    const S = window.DemoState;
    const D = window.DemoData;
    const U = window.Tasks.util;
    const LABEL = 'TUTOR IA · PRODUCIR';
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;

    const st = () => S.get();
    const P = () => st().wp || (st().wp = { type: null, kind: '', ideas: [], step: '' });
    const msgs = () => st().messages.writing;
    const tutor = (text, extra) => msgs().push(Object.assign({ role: 'ai', label: LABEL, text, chips: [], replies: true }, extra || {}));
    const me = (text) => msgs().push({ role: 'user', text });
    const chip = (text, action, id, icon) => ({ icon: icon || 'arrowRight', text, action, id, kind: 'info' });
    const setStage = (n) => { st().activeStage = n; };

    const R = window.Reviewer.make({
        key: 'wr', msgs, tutor, dyn: 'wreview', act: 'writing',
        onStage: (phase) => setStage(/done|copied|checked/.test(phase) ? 4 : 3)
    });

    /* ---------- Tipos de texto (0.2.1) ---------- */
    const TYPES = {
        email: {
            label: 'correo formal', goal: 'Producir un correo formal claro, con buen vocabulario y gramática correcta',
            define: '<ol class="wr-plan"><li><strong>Destinatario:</strong> ¿profesor, jefe, oficina? Define el saludo (Dear Professor…).</li><li><strong>Propósito:</strong> una sola petición, clara y cortés (Could you please…?).</li><li><strong>Datos:</strong> fecha, curso o documento que mencionas.</li><li><strong>Formalidad:</strong> sin contracciones ni palabras de chat (thanks, asap).</li></ol>',
            resources: '<ul class="wr-plan"><li><strong>Saludo:</strong> Dear Professor [apellido], · Dear Sir or Madam,</li><li><strong>Motivo:</strong> I am writing to ask for… · I am writing because…</li><li><strong>Petición cortés:</strong> Could you please…? · I would be grateful if…</li><li><strong>Cierre:</strong> Thank you for your time. · Best regards, [nombre]</li></ul>',
            parts: ['Saludo', 'Motivo', 'Petición y datos', 'Despedida'],
            template: 'Dear Professor [apellido],\n\nI am writing to ask for [lo que necesitas] because [motivo].\n\nCould you please [tu petición] by [fecha]?\n\nThank you for your time.\n\nBest regards,\n[tu nombre]',
            model: 'Dear Professor Ramos,\n\nI am writing to ask for a one-week extension for the final essay. I was sick last week and could not finish my research.\n\nCould you please let me submit it by Friday, June 14?\n\nThank you for your time.\n\nBest regards,\nAna Torres',
            notice: 'saludo con “Dear”, una sola petición con “Could you please…?”, y despedida con tu nombre.'
        },
        story: {
            label: 'cuento', goal: 'Producir un cuento en inglés, narrado en pasado y con inicio, nudo y desenlace',
            define: '<ol class="wr-plan"><li><strong>Propósito:</strong> ¿entretener, enseñar algo, contar una experiencia?</li><li><strong>Personajes:</strong> quién protagoniza la historia.</li><li><strong>Escenario:</strong> dónde y cuándo pasa.</li><li><strong>Conflicto:</strong> qué problema aparece.</li><li><strong>Tiempo verbal:</strong> se narra en pasado simple (lived, went, found).</li><li><strong>Extensión:</strong> unas 120 a 200 palabras, en 3 párrafos.</li></ol>',
            resources: '<ul class="wr-plan"><li><strong>Para empezar:</strong> Once upon a time, … · One day, … · Long ago, …</li><li><strong>Para seguir la secuencia:</strong> Then, … · After that, … · Suddenly, … · Meanwhile, …</li><li><strong>Para terminar:</strong> Finally, … · In the end, …</li><li><strong>Pasados irregulares frecuentes:</strong> go → went · find → found · see → saw · take → took · come → came · say → said · run → ran</li><li><strong>Para describir:</strong> old, dark, quiet, brave, frightened, huge, tiny</li></ul>',
            parts: ['Inicio: personajes y lugar', 'Nudo: el problema', 'Desenlace: cómo termina'],
            template: 'Once upon a time, there was [personaje] who lived in [lugar].\n\nOne day, [el problema]. Then, [qué hizo el personaje].\n\nIn the end, [cómo se resolvió].',
            model: 'Once upon a time, there was a young girl called Mia who lived near a dark forest.\n\nOne day, she found an old key under a tree. She followed a narrow path and saw a tiny house. Suddenly, the door opened and a cat walked out.\n\nIn the end, Mia gave the key to the cat, and the cat showed her the way home.',
            notice: 'verbos en pasado (lived, found, saw), conectores de tiempo (One day, Suddenly, In the end) y un párrafo por parte.'
        },
        other: {
            label: 'texto', goal: 'Producir un texto en inglés claro, organizado y con buena gramática',
            define: '<ol class="wr-plan"><li><strong>Tipo:</strong> ensayo, resumen, reseña, informe, opinión…</li><li><strong>Propósito:</strong> ¿informar, explicar, convencer?</li><li><strong>Lector:</strong> ¿tu docente, tus compañeros?</li><li><strong>Extensión:</strong> cuántas palabras o párrafos te piden.</li><li><strong>Formalidad:</strong> en un texto académico, sin contracciones ni palabras de chat.</li></ol>',
            resources: '<ul class="wr-plan"><li><strong>Introducir:</strong> This text explains… · In this essay, I will…</li><li><strong>Añadir:</strong> In addition, … · Moreover, …</li><li><strong>Contrastar:</strong> However, … · On the other hand, …</li><li><strong>Dar un ejemplo:</strong> For example, … · such as…</li><li><strong>Concluir:</strong> In conclusion, … · To sum up, …</li></ul>',
            parts: ['Introducción', 'Desarrollo', 'Conclusión'],
            template: '[Título]\n\n[Introducción: presenta el tema y tu idea principal].\n\nFirst, [idea 1]. In addition, [idea 2]. For example, [un ejemplo].\n\nIn conclusion, [retoma tu idea principal].',
            model: 'Why students should read in English\n\nReading in English helps students learn new words in context.\n\nFirst, a text shows how words are used in real sentences. In addition, readers see grammar patterns many times. For example, a short news article repeats the past tense in every paragraph.\n\nIn conclusion, reading regularly is one of the easiest ways to improve your English.',
            notice: 'una idea principal en la introducción, conectores (First, In addition, For example) y una conclusión que la retoma.'
        }
    };
    const typeFrom = (t) => (/cuento|historia|relato|narraci|f[aá]bula|\bstory\b/i.test(t) ? 'story'
        : /correo|e-?mail|\bmail\b|carta|profesor|jefe|solicit|pr[oó]rroga/i.test(t) ? 'email'
            : /ensayo|essay|resumen|rese[nñ]a|informe|p[aá]rrafo|opini[oó]n|composici|descripci|art[ií]culo|texto/i.test(t) ? 'other' : null);
    const kindFrom = (t) => { const m = t.match(/ensayo|resumen|rese[nñ]a|informe|p[aá]rrafo|opini[oó]n|composici[oó]n|descripci[oó]n|art[ií]culo/i); return m ? m[0].toLowerCase() : ''; };
    const T = () => TYPES[P().type] || null;

    /* ---------- 0.2.1 Definir ---------- */
    function intro() {
        setStage(0);
        tutor('¿Qué vas a escribir en inglés? Cuéntame el tipo de texto, para quién es y para qué. Te acompaño a planificarlo, escribirlo y revisarlo; tú decides qué cambiar.', {
            chips: [chip('Un correo formal', 'writing-type', 'email', 'doc'), chip('Un cuento', 'writing-type', 'story', 'book'), chip('Otro texto (ensayo, resumen…)', 'writing-type', 'other', 'doc')]
        });
    }
    function askType() {
        setStage(0);
        tutor('¿Qué tipo de texto vas a escribir? Cada uno tiene su estructura y su vocabulario.', {
            chips: [chip('Un correo formal', 'writing-type', 'email', 'doc'), chip('Un cuento', 'writing-type', 'story', 'book'), chip('Otro texto (ensayo, resumen…)', 'writing-type', 'other', 'doc')]
        });
    }
    function define(type, kind) {
        const p = P(); p.type = type; p.kind = kind || p.kind || ''; p.step = 'define'; setStage(0);
        const t = TYPES[type];
        const what = type === 'other' && p.kind ? `un ${p.kind}` : `un ${t.label}`;
        tutor(`Vamos a escribir ${what}. Antes de empezar, define estas características:`, {
            html: t.define,
            chips: [chip('Siguiente: mis ideas', 'writing-prepare', '', 'arrowRight'), chip('Ver un modelo', 'writing-model', '', 'book')]
                .concat(type === 'email' ? [chip('Ver una plantilla', 'writing-template', '', 'doc'), chip('Ver un correo de ejemplo', 'writing-sample', '', 'book')] : [])
        });
    }
    function model() {
        if (!T()) { askType(); return; }
        setStage(0);
        tutor(`Un modelo de ${T().label} para que veas sus convenciones. Fíjate en: ${T().notice}`, {
            html: `<pre class="wr-template" lang="en">${esc(T().model)}</pre>`,
            chips: [chip('Siguiente: mis ideas', 'writing-prepare', '', 'arrowRight')]
        });
    }

    /* ---------- 0.2.2 y 0.2.3 Preparar: ideas y recursos ---------- */
    function prepare() {
        if (!T()) { askType(); return; }
        const p = P(); p.step = 'ideas'; setStage(1);
        const ask = p.type === 'story' ? 'quién es el personaje, dónde pasa, qué problema aparece y cómo termina' : p.type === 'email' ? 'a quién le escribes, qué pides, por qué y para cuándo' : 'tu idea principal, los argumentos o datos que la apoyan y un ejemplo';
        tutor(`Haz una lluvia de ideas: escríbeme ${ask}. Una idea por línea o separadas por punto y coma; puede ser en español. Mientras tanto, estas expresiones te sirven:`, {
            html: T().resources,
            chips: p.ideas.length ? [chip('Organizar mis ideas', 'writing-organize', '', 'layers')] : []
        });
    }
    function addIdeas(t) {
        const p = P();
        const list = t.split(/\n|;|•|(?:^|\s)-\s|(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ¿])/).map((x) => x.replace(/^\s*\d+[.)]\s*/, '').trim()).filter((x) => x.length > 2);
        p.ideas = p.ideas.concat(list).slice(0, 12);
        const miss = p.type === 'story'
            ? [[/qui[eé]n|personaj|ni[nñ][oa]|chic[oa]|girl|boy|man|woman|[A-Z][a-z]+/, 'el personaje'], [/d[oó]nde|lugar|bosque|casa|ciudad|pueblo|escuela|forest|house|town|city|village|school/i, 'el lugar'], [/problema|perd|miedo|encontr|encuentr|robo|descubr|aparece|lost|found|find|problem|afraid|suddenly/i, 'el problema'], [/final|termina|al final|resuelv|end|finally|home/i, 'el final']]
                .filter(([rx]) => !p.ideas.some((i) => rx.test(i))).map(([, n]) => n)
            : [];
        tutor(`Anoté ${plural(list.length, 'idea', 'ideas')}; llevas ${p.ideas.length}.${miss.length ? ` Para un cuento te falta pensar en: ${miss.join(', ')}.` : ' Comprueba que todas respondan a tu propósito y descarta las que no.'}`, {
            html: `<ol class="wr-plan">${p.ideas.map((i) => `<li>${esc(i)}</li>`).join('')}</ol>`,
            chips: [chip('Organizar mis ideas', 'writing-organize', '', 'layers'), chip('Quitar la última', 'writing-drop', '', 'undo')]
        });
    }

    /* ---------- 0.2.4 Organizar ---------- */
    function layout() {
        const p = P(); const t = T(); const ideas = p.ideas.slice();
        const parts = t.parts.map((name) => ({ name, ideas: [] }));
        if (p.type === 'email') {
            parts[1].ideas = ideas.slice(0, 1); parts[2].ideas = ideas.slice(1);
        } else {
            // reparto parejo; si sobran ideas, van al principio (la última idea queda en el cierre)
            const n = parts.length; const m = ideas.length; const at = (k) => Math.ceil((k * m) / n);
            parts.forEach((part, k) => { part.ideas = ideas.slice(at(k), at(k + 1)); });
            if (p.type === 'other' && ideas.length >= 2 && !parts[2].ideas.length) { parts[2].ideas = [ideas[ideas.length - 1]]; parts[1].ideas = parts[1].ideas.filter((x) => x !== ideas[ideas.length - 1]); }
        }
        return parts;
    }
    function organize() {
        if (!T()) { askType(); return; }
        const p = P();
        if (!p.ideas.length) { prepare(); return; }
        p.step = 'organized'; setStage(2);
        const parts = layout();
        tutor(`Ordené tus ideas en la estructura de un ${T().label}. Revisa que la secuencia sea lógica y que cada parte tenga su idea:`, {
            html: `<ol class="wr-outline">${parts.map((x) => `<li><strong>${esc(x.name)}</strong>${x.ideas.length ? `<ul>${x.ideas.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : `<small>${/Saludo|Despedida/.test(x.name) ? 'Fórmula fija (ver plantilla)' : 'Sin idea todavía'}</small>`}</li>`).join('')}</ol>`,
            chips: [chip('Usar este esquema', 'writing-scaffold', '', 'message'), chip('Cambiar el orden', 'writing-reorder', '', 'refresh'), chip('Agregar ideas', 'writing-prepare', '', 'plus')]
        });
    }
    function reorder(t) {
        const p = P();
        const nums = (t.match(/\d+/g) || []).map(Number).filter((n) => n >= 1 && n <= p.ideas.length);
        if (!nums.length) { tutor(`Escríbeme los números de tus ideas en el nuevo orden, por ejemplo: ${p.ideas.map((_, i) => i + 1).reverse().join(', ')}.`); return; }
        const seen = new Set(); const order = nums.filter((n) => !seen.has(n) && seen.add(n));
        p.ideas = order.map((n) => p.ideas[n - 1]).concat(p.ideas.filter((_, i) => !seen.has(i + 1)));
        organize();
    }
    function scaffold() {
        const p = P(); const t = T(); if (!t) { askType(); return; }
        const parts = layout(); const b = (list, fb) => (list.length ? list.map((x) => `[${x}]`).join(' ') : fb);
        let text;
        if (p.type === 'story') text = `Once upon a time, ${b(parts[0].ideas, '[personaje y lugar]')}.\n\nOne day, ${b(parts[1].ideas, '[el problema]')}.\n\nIn the end, ${b(parts[2].ideas, '[cómo termina]')}.`;
        else if (p.type === 'email') text = `Dear [destinatario],\n\nI am writing ${b(parts[1].ideas, '[motivo]')}.\n\nCould you please ${b(parts[2].ideas, '[tu petición y los datos]')}?\n\nThank you for your time.\n\nBest regards,\n[tu nombre]`;
        else text = `[Título]\n\n${b(parts[0].ideas, '[introducción]')}.\n\nFirst, ${b(parts[1].ideas, '[desarrollo]')}. In addition, [otra idea].\n\nIn conclusion, ${b(parts[2].ideas, '[conclusión]')}.`;
        p.step = 'draft'; setStage(3);
        tutor('Dejé tu esquema en el campo de mensaje. Reemplaza lo que está entre corchetes por tus oraciones en inglés y envíamelo: lo reviso contigo.');
        window.Chat.fill(text);
    }
    function template() {
        if (!T()) { askType(); return; }
        P().step = 'draft'; setStage(3);
        tutor(`Esta es una estructura para un ${T().label}. Cambia lo que está entre corchetes y envíamelo para revisarlo.`, {
            html: `<pre class="wr-template" lang="en">${esc(T().template)}</pre>`,
            chips: [chip('Usar esta plantilla', 'writing-use-template', '', 'message')]
        });
    }

    /* ---------- 0.2.5–0.2.7 Borrador y retroalimentación ---------- */
    function draft(t) {
        if (/\[[^\]]+\]/.test(t)) { tutor('Todavía hay partes entre corchetes. Reemplázalas por tu texto en inglés y envíamelo de nuevo.'); window.Chat.fill(t); return; }
        const p = P();
        if (!p.type) { p.type = window.Checker.genre(t); }
        p.step = 'review';
        R.review(t, p.type);
    }
    /* "Hazlo más formal": aplica las sugerencias de tono con nivel muy formal (correo u otro texto) */
    function formal() {
        const w = R.get();
        if (!w) { tutor('Primero escribe tu texto en inglés y lo hago más formal.'); return; }
        if (w.genre === 'story') { tutor('Un cuento no necesita ser formal: lo que más importa es narrar en pasado y ordenar inicio, nudo y desenlace.'); return; }
        const base = R.fixed();
        const tone = window.Checker.check(base, { formality: 3, genre: w.genre }).filter((f) => f.kind === 'tone' && f.fixes.length);
        if (!tone.length) { tutor('No encuentro nada informal con mis reglas de tono: tu texto ya es formal.', { tone: 'ok' }); return; }
        let out = base;
        tone.slice().sort((a, b) => b.start - a.start).forEach((f) => { out = out.slice(0, f.start) + f.fixes[0] + out.slice(f.end); });
        tutor(`Cambié ${plural(tone.length, 'expresión', 'expresiones')} de tono: ${tone.map((f) => `“${f.fragment}” → “${f.fixes[0]}”`).join('; ')}. Revisa la nueva versión:`, {
            html: `<pre class="wr-final" lang="en">${esc(out)}</pre>`,
            chips: [chip('Revisar esta versión', 'writing-review-text', '', 'check')]
        });
        st().wrDraft = out;
    }

    /* ---------- Lo que escribes en el chat ---------- */
    const isTemplateAsk = (n) => /c[oó]mo (empiezo|empezar|inicio|comienzo|escribo|termino|cierro|despido)|plantilla|estructura|formato|saludo|despedida|no s[eé] (c[oó]mo|qu[eé]) (escribir|poner)/i.test(n);
    function handle(text, opts) {
        const t = text.trim(); me(t);
        respond(t, opts);
        S.touch();
    }
    function respond(t, opts) {
        const p = P();
        const english = U.looksEnglish(t) && U.nWords(t) >= 6 && !/^(make|hazlo)/i.test(t);
        if (p.step === 'ideas' && !(english && (U.nWords(t) >= 30 || window.Checker.sentences(t).length >= 3))) { if (/organiz|esquema|listo|ya est[aá]/i.test(t)) organize(); else addIdeas(t); return; }
        if (p.step === 'order') { p.step = 'organized'; reorder(t); return; }
        if (english) { draft(t); return; }
        if (/m[aá]s formal|menos informal|m[aá]s cort[eé]s|make it (more )?formal/i.test(t)) { formal(); return; }
        const type = typeFrom(t);
        if (type && (type !== p.type || !p.step)) { define(type, kindFrom(t)); return; }
        if (/modelo|ejemplo de/i.test(t)) { model(); return; }
        if (isTemplateAsk(t)) { template(); return; }
        if (/ideas?|lluvia/i.test(t)) { prepare(); return; }
        if (/organiz|esquema|orden/i.test(t)) { organize(); return; }
        if (type) { define(type, kindFrom(t)); return; }
        const other = !(opts && opts.seed) && window.Intent.elsewhere(t, 'writing');
        if (other) { window.Start.handoff('writing', other, t, false); return; }
        if (!p.type) { askType(); return; }
        tutor('No entendí qué necesitas. Puedes escribirme tus ideas, pegar tu borrador en inglés para revisarlo o pedirme por ejemplo:', {
            chips: ['Ver un modelo', '¿Cómo empiezo?', 'Organizar mis ideas'].map((e) => chip(e, 'writing-example', e, 'message'))
        });
    }
    /* Llega desde el inicio con el prompt de la persona */
    function seed(text) { st().wr = null; st().wp = null; st().wDemoAt = -1; handle(text, { seed: true }); }

    function action(name, id, el) {
        const label = el ? el.textContent.trim() : '';
        const quiet = /^writing-(accept|keep|undo)$/.test(name);
        if (label && !quiet) me(label);
        if (R.action(name, id)) { S.touch(); return; }
        switch (name) {
            case 'writing-type': define(id); break;
            case 'writing-model': model(); break;
            case 'writing-prepare': prepare(); break;
            case 'writing-organize': organize(); break;
            case 'writing-drop': { const p = P(); p.ideas.pop(); p.step = 'ideas'; tutor(`Quité la última idea; quedan ${p.ideas.length}.`, { html: `<ol class="wr-plan">${p.ideas.map((i) => `<li>${esc(i)}</li>`).join('')}</ol>`, chips: [chip('Organizar mis ideas', 'writing-organize', '', 'layers')] }); break; }
            case 'writing-reorder': { const p = P(); p.step = 'order'; tutor(`Escríbeme los números de tus ideas en el orden que prefieras, por ejemplo: ${p.ideas.map((_, i) => i + 1).reverse().join(', ')}.`, { html: `<ol class="wr-plan">${p.ideas.map((i) => `<li>${esc(i)}</li>`).join('')}</ol>` }); break; }
            case 'writing-scaffold': scaffold(); break;
            case 'writing-template': template(); break;
            case 'writing-use-template': P().step = 'draft'; window.Chat.fill(T() ? T().template : TYPES.email.template); break;
            case 'writing-example': msgs().pop(); window.Chat.fill(id); break;
            case 'writing-sample': {
                // tu revisión queda fija en el historial; el ejemplo pasa a ser lo que se revisa
                msgs().forEach((m) => { if (m.dyn === 'wreview') { m.html = R.reviewHtml(false); delete m.dyn; } });
                st().wr = null;
                st().wDemoAt = msgs().length;
                D.writingExample.forEach((m) => msgs().push(JSON.parse(JSON.stringify(m))));
                setStage(3); break;
            }
            case 'writing-review-text': if (st().wrDraft) R.review(st().wrDraft, (R.get() || {}).genre || 'email', { original: (R.get() || {}).original }); break;
            default: return;
        }
        S.touch();
    }

    function status() {
        const s = R.status(); if (s) return s;
        const p = P();
        if (!p.type) return { progress: 'Sin tipo de texto todavía', next: 'Dime qué vas a escribir' };
        const name = p.type === 'other' && p.kind ? p.kind : TYPES[p.type].label;
        if (p.step === 'ideas') return { progress: `${name} · ${plural(p.ideas.length, 'idea', 'ideas')}`, next: p.ideas.length ? 'Agrega ideas u organízalas' : 'Escribe tus ideas' };
        if (p.step === 'organized' || p.step === 'order') return { progress: `${name} · esquema de ${TYPES[p.type].parts.length} partes`, next: 'Usa el esquema y escribe tu borrador' };
        if (p.step === 'draft') return { progress: `${name} · borrador en curso`, next: 'Envía tu borrador para revisarlo' };
        return { progress: name, next: 'Escribe tus ideas o pide un modelo' };
    }
    const goal = () => (T() ? T().goal : 'Producir un texto en inglés: correo, cuento u otro');
    /* Plan para el panel cuando todavía no hay borrador */
    function planHtml() {
        const p = P(); if (!p.type) return '';
        const parts = p.ideas.length && /organized|order|draft/.test(p.step) ? layout() : null;
        return `<p class="muted-text">Tipo: <strong>${esc(p.type === 'other' && p.kind ? p.kind : TYPES[p.type].label)}</strong></p>
            ${p.ideas.length ? `<p class="wr-label">Tus ideas</p><ol class="wr-plan">${p.ideas.map((i) => `<li>${esc(i)}</li>`).join('')}</ol>` : ''}
            ${parts ? `<p class="wr-label">Tu esquema</p><ol class="wr-outline">${parts.map((x) => `<li><strong>${esc(x.name)}</strong>${x.ideas.length ? `<ul>${x.ideas.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}</li>`).join('')}</ol>` : ''}`;
    }

    window.Writing = { intro, handle, action, status, goal, planHtml, reviewHtml: R.reviewHtml, seed, fixed: R.fixed, panelHtml: R.panelHtml, reviewer: R, TYPES };

    window.Tasks.register({
        id: 'writing',
        name: 'Producir',
        pitch: 'ahí planificamos y escribimos tu correo, cuento u otro texto, paso a paso',
        understood: 'necesitas escribir un texto en inglés',
        examples: ['Tengo que escribir un cuento corto en inglés para mi clase', 'Tengo que escribirle un correo a mi profesor para pedir una prórroga'],
        keywords: [/correo|e-?mail|carta|redact|escribir|escribirle|cuento|historia|relato|ensayo|f[aá]bula|composici|\bstory\b|\bessay\b/i, /profesor|jefe|oficina|formal|solicit|pr[oó]rroga|pedir (un|una|más)|para (mi|la) clase|tarea|curso/i],
        detect: () => 0,
        module: window.Writing
    });
})();
