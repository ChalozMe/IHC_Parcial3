/* ============================================================
   Tarea 0.3 · Revisar un texto en inglés (en el chat)
   0.3.1 Preparar · 0.3.2–0.3.4 Identificar errores · 0.3.5–0.3.6
   Explicar y aplicar · 0.3.7 Registrar · 0.3.8 Comprobar
   Pegas tu texto (correo, cuento u otro) y review.js lo revisa según
   su tipo. Lo que aplicas pasa a tu registro de errores, que se
   practica con oraciones nuevas (logro: 80 % sin pista).
   ============================================================ */
(function () {
    'use strict';

    const S = window.DemoState;
    const X = window.Exercises;
    const I = window.Icons;
    const LABEL = 'TUTOR IA · REVISAR';
    const need = (n) => Math.ceil(n * 0.8);
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
    const shuffle = (arr) => { const b = arr.slice(); for (let i = b.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
    const exById = (id) => X.BANK[id.replace(/-\d+$/, '')].find((e) => e.id === id);
    const mark = (sentence, frag) => { const i = sentence.indexOf(frag); return i < 0 ? esc(sentence) : `${esc(sentence.slice(0, i))}<mark>${esc(frag)}</mark>${esc(sentence.slice(i + frag.length))}`; };
    const exHtml = (bad, good) => `<div class="err-ex"><span class="err-bad">${I.close(14)}<span class="sr-only">Incorrecto: </span><span lang="en">${bad}</span></span><span class="err-good">${I.check(14)}<span class="sr-only">Correcto: </span><span lang="en">${good}</span></span></div>`;

    const st = () => S.get();
    const bank = () => st().errBank;
    const msgs = () => st().messages.errors;
    function tutor(text, extra) { msgs().push(Object.assign({ role: 'ai', label: LABEL, text, chips: [], replies: true }, extra || {})); }
    const chip = (text, action, id, icon) => ({ icon: icon || 'arrowRight', text, action, id, kind: 'info' });
    /* Etapas de Revisar: 0 Preparar · 1 Identificar · 2 Explicar y aplicar · 3 Registrar · 4 Comprobar.
       La práctica de un error (elegir, entender, practicar, evaluar) vive en Registrar y Comprobar. */
    const stageTo = (n) => { st().activeStage = n; };
    const setStage = (n) => stageTo([3, 2, 3, 4][n]);
    const RV = window.Reviewer.make({
        key: 'rv', msgs: () => st().messages.errors, tutor: (text, extra) => tutor(text, extra), dyn: 'rreview', act: 'review',
        onStage: (phase) => stageTo({ reviewed: 1, deciding: 2, done: 3, copied: 4, checked: 4 }[phase])
    });

    /* ---------- Banco de errores (lo alimenta la revisión del correo) ---------- */
    function add(o) {
        const b = bank();
        const e = b[o.ruleId] || (b[o.ruleId] = { occ: [], status: 'pending', attempts: [] });
        if (e.occ.some((x) => x.key === o.key)) return;
        if (e.status === 'done') { e.status = 'pending'; e.back = true; }
        e.occ.push({ key: o.key, sentence: o.sentence, fragment: o.fragment, fix: o.fix, source: o.source, at: Date.now() });
    }
    function remove(ruleId, key) {
        const e = bank()[ruleId]; if (!e) return;
        e.occ = e.occ.filter((x) => x.key !== key);
        if (!e.occ.length) delete bank()[ruleId];
    }
    const groups = () => Object.keys(bank()).filter((id) => X.RULES[id]).map((id) => ({ id, r: X.RULES[id], e: bank()[id] }))
        .sort((a, b) => (a.e.status === b.e.status ? b.e.occ.length - a.e.occ.length : a.e.status === 'pending' ? -1 : 1));

    /* ---------- 2.1 Elegir ---------- */
    function listHtml(gs) {
        return `<ul class="err-list">${gs.map((g) => {
            const last = (g.e.attempts || []).filter((a) => !a.retry).slice(-1)[0];
            return `<li><div><strong>${g.r.name}</strong><small>${plural(g.e.occ.length, 'vez', 'veces')} · ${g.e.status === 'done' ? 'Superado' : g.e.back ? 'Volvió a aparecer' : 'Pendiente'}${last ? ` · última ronda ${last.ok} de ${last.total}` : ''}</small></div>
                <button class="btn btn-sm" data-action="errors-pick" data-id="${g.id}">Practicar</button></li>`;
        }).join('')}</ul>`;
    }
    /* 0.3.1 Preparar: la persona trae su texto */
    function intro() {
        stageTo(0); st().errPractice = null;
        const n = groups().length;
        tutor('Pega el texto que quieres revisar: un correo, un cuento u otro. Te marco los errores de vocabulario, gramática y coherencia, te explico cada uno y tú decides qué cambiar. Tu original se guarda sin tocar, y lo que corrijas queda en tu registro de errores.', {
            chips: (n ? [chip(`Ver mi registro (${plural(n, 'tipo', 'tipos')})`, 'errors-list', '', 'tag')] : []).concat([chip('Diagnóstico de 5 oraciones', 'errors-diag', '', 'sparkles')])
        });
    }
    /* 0.3.7 Registro: tus errores por tipo, con su estado */
    function listErrors() {
        setStage(0); st().errPractice = null;
        const gs = groups();
        if (!gs.length) {
            tutor('Tu registro está vacío. Se llena cuando aplicas una corrección al revisar un texto. También podemos hacer un diagnóstico de 5 oraciones: lo que falles se guardará en tu registro.', {
                chips: [chip('Hacer el diagnóstico', 'errors-diag', '', 'sparkles'), chip('Revisar un texto', 'errors-new', '', 'doc')]
            });
            return;
        }
        const pend = gs.filter((g) => g.e.status === 'pending').length;
        tutor(`Tu registro de errores: ${plural(gs.length, 'tipo', 'tipos')}, ${plural(pend, 'pendiente', 'pendientes')}. Los primeros son los que más repites. ¿Cuál practicamos?`, {
            html: listHtml(gs),
            chips: [chip('Diagnóstico de 5 oraciones', 'errors-diag', '', 'sparkles')]
        });
    }

    /* ---------- 2.2 Entender ---------- */
    function pick(ruleId) {
        const r = X.RULES[ruleId]; const e = bank()[ruleId]; if (!r || !e) return;
        st().errRule = ruleId; setStage(1);
        const o = e.occ[e.occ.length - 1];
        tutor(o ? `${r.name}. Así lo escribiste en “${o.source}”:` : `${r.name}.`, {
            html: `${o ? exHtml(mark(o.sentence, o.fragment), esc(o.fix)) : ''}<p class="err-rule"><strong>La regla:</strong> ${r.why}</p>${exHtml(esc(r.bad), esc(r.good))}<p class="muted-text">¿Con cuántas oraciones practicamos? El logro es el 80 % sin pista.</p>`,
            chips: [chip('5 oraciones', 'errors-start', '5'), chip('8 oraciones', 'errors-start', '8')]
        });
    }

    /* ---------- 2.3 Practicar ---------- */
    function start(ruleId, n, opts) {
        const o = opts || {}; let items;
        if (o.diag) items = shuffle(Object.keys(X.BANK)).slice(0, 5).map((id) => shuffle(X.BANK[id])[0].id);
        else if (o.retry) items = o.retry;
        else {
            const used = new Set((bank()[ruleId] || {}).used || []); const pool = shuffle(X.BANK[ruleId]);
            items = pool.filter((x) => !used.has(x.id)).concat(pool.filter((x) => used.has(x.id))).slice(0, n).map((x) => x.id);
        }
        if (!o.retry) st().errSize = o.diag ? 5 : n;
        st().errPractice = { ruleId, diag: !!o.diag, retry: !!o.retry, items, i: 0, phase: 'find', res: items.map(() => ({ tries: 0, hint: false, shown: false, answer: '', ok: null })) };
        setStage(2);
        askFind();
    }
    function tokensHtml(ex, step) {
        return `<p class="err-tokens" lang="en" role="group" aria-label="Palabras de la oración">${X.words(ex.wrong).map((t, k) => `<button class="err-tok" data-action="errors-tok" data-id="${k}" data-step="${step}">${esc(t)}</button>`).join(' ')}</p>`;
    }
    /* Muestra la oración con palabras que se pueden tocar (se repite en cada respuesta para no tener que subir) */
    function findCard(text) {
        const p = st().errPractice; const ex = exById(p.items[p.i]); p.phase = 'find';
        tutor(text, { html: tokensHtml(ex, `${p.items.length}-${p.i}-${Date.now()}`), chips: [chip('No lo encuentro', 'errors-show', '', 'search')] });
    }
    function askFind() {
        const p = st().errPractice;
        findCard(`Oración ${p.i + 1} de ${p.items.length}. ¿Dónde está el error? Toca la palabra o escríbela.`);
    }
    function askWrite(shown) {
        const p = st().errPractice; const ex = exById(p.items[p.i]); const bad = X.errorTokens(ex); p.phase = 'write';
        tutor(`${shown ? 'Está aquí' : 'Exacto, ahí está'}. Ahora escribe la oración corregida y envíala.`, {
            html: `<p class="err-sentence" lang="en">${X.words(ex.wrong).map((t, k) => (bad.has(k) ? `<mark>${esc(t)}</mark>` : esc(t))).join(' ')}</p>`,
            chips: p.res[p.i].hint ? [] : [chip('Dame una pista', 'errors-hint', '', 'lightbulb')]
        });
        window.Chat.fill(ex.wrong);
    }
    function check(answer) {
        const p = st().errPractice; const ex = exById(p.items[p.i]); const r = p.res[p.i]; const rule = X.RULES[ex.ruleId];
        if (X.unchanged(ex, answer)) { tutor('Es la misma oración. Corrige la palabra marcada y envíamela.'); window.Chat.fill(ex.wrong); return; }
        r.answer = answer; r.ok = X.isCorrect(ex, answer);
        const clean = r.ok && !r.hint && !r.shown;
        if (r.ok) tutor(`Correcto.${clean ? '' : ' Con ayuda: esta no suma para el logro.'} ${rule.why}`, { tone: 'ok' });
        else {
            tutor(`No coincide con las respuestas previstas. ${rule.why}`, {
                html: `${exHtml(esc(answer), esc(ex.answers[0]))}${ex.answers.length > 1 ? `<p class="muted-text">También vale: <span lang="en">${ex.answers.slice(1).map(esc).join(' · ')}</span></p>` : ''}<p class="muted-text">Si crees que la tuya también es correcta, anótala para tu docente: comparo con respuestas previstas.</p>`
            });
        }
        p.i += 1;
        if (p.i < p.items.length) askFind(); else finish();
    }

    /* ---------- 2.4 Evaluar ---------- */
    function finish() {
        const p = st().errPractice; p.done = true; setStage(3);
        const clean = (r) => r.ok && !r.hint && !r.shown;
        const okN = p.res.filter(clean).length; const total = p.items.length;
        const failed = p.items.filter((_, n) => !clean(p.res[n]));
        if (p.diag) {
            p.items.forEach((id, n) => {
                if (clean(p.res[n])) return;
                const ex = exById(id); const bad = X.errorTokens(ex);
                add({ ruleId: ex.ruleId, key: `diag-${id}`, sentence: ex.wrong, fragment: X.words(ex.wrong).filter((_, k) => bad.has(k)).join(' '), fix: ex.answers[0], source: 'Diagnóstico' });
            });
            const n = new Set(failed.map((id) => id.replace(/-\d+$/, ''))).size;
            tutor(`Terminaste el diagnóstico: ${okN} de ${total}. ${n ? `Guardé ${plural(n, 'tipo de error', 'tipos de error')} para practicar.` : 'No fallaste ninguna, así que no guardé errores.'}`, {
                chips: [chip(n ? 'Ver mi registro' : 'Revisar un texto', n ? 'errors-list' : 'errors-new')]
            });
            return;
        }
        const e = bank()[p.ruleId];
        e.attempts = (e.attempts || []).concat({ at: Date.now(), ok: okN, total, retry: p.retry });
        e.used = (e.used || []).concat(p.items).slice(-8);
        if (!p.retry) e.passed = okN >= need(total);
        const reached = !p.retry && okN >= need(total);
        const chips = [];
        if (reached && e.status !== 'done') chips.push(chip('Marcar como superado', 'errors-done', '', 'check'));
        if (failed.length) chips.push(chip(failed.length === 1 ? 'Repetir la fallada' : `Repetir las ${failed.length} falladas`, 'errors-retry', '', 'refresh'));
        chips.push(chip('Otra ronda', 'errors-start', String(st().errSize || 5)), chip('Elegir otro error', 'errors-list'));
        tutor(`Resultado: ${okN} de ${total} sin pista. ${p.retry ? 'Repasar las falladas no cuenta para el logro: haz una ronda completa para medirlo.' : reached ? 'Alcanzaste el logro: puedes marcar este error como superado.' : `Necesitas ${need(total)} de ${total}. Repasa la regla y prueba otra ronda.`}`, { chips, tone: reached ? 'ok' : '' });
    }

    /* ---------- Entrada desde el chat y los botones ---------- */
    function handle(text) {
        const p = st().errPractice; const t = text.trim();
        msgs().push({ role: 'user', text: t });
        const U = window.Tasks.util;
        if (/¿/.test(t) || (/\?/.test(t) && !U.looksEnglish(t))) {
            const other = window.Intent.elsewhere(t, 'errors');
            if (other) { window.Start.handoff('errors', other, t, !!(p && !p.done)); S.touch(); return; }
            if (!p || p.done) { respond(t); S.touch(); return; }
            const rid = ruleFor(t);
            if (rid) {
                const r = X.RULES[rid];
                if (p.phase === 'find') findCard(`${r.name}: ${r.why} Sigamos: oración ${p.i + 1} de ${p.items.length}, ¿dónde está el error?`);
                else tutor(`${r.name}: ${r.why} Sigamos: escribe la oración corregida.`);
                S.touch(); return;
            }
        }
        if ((isText(t) || /^\s*(?:revisa|revisar|corrige|corregir|corr[ií]geme|rev[ií]same)\b[^:]{0,40}:/i.test(t)) && !(p && !p.done && p.phase === 'write')) { respond(t); S.touch(); return; }
        if (p && !p.done && p.phase === 'write') { check(t); S.touch(); return; }
        if (p && !p.done && p.phase === 'find') {
            const ex = exById(p.items[p.i]); const toks = X.words(ex.wrong); const bad = X.errorTokens(ex);
            const n = t.toLowerCase().replace(/[.,?!"“”]/g, '');
            const k = toks.findIndex((w) => w.toLowerCase().replace(/[.,?!]/g, '') === n);
            if (k < 0) findCard('Esa palabra no está en la oración. Toca una palabra o escríbela tal como aparece.');
            else if (bad.has(k)) askWrite(false);
            else miss();
            S.touch(); return;
        }
        if (/diagn/i.test(t)) { start(null, 5, { diag: true }); S.touch(); return; }
        const g = groups().find((x) => t.toLowerCase().includes(x.r.name.toLowerCase().split(' ')[0].replace(/[“”]/g, '')));
        if (g) { pick(g.id); S.touch(); return; }
        respond(t);
        S.touch();
    }

    /* ---------- Preguntas libres: la IA explica, guarda o lleva a otra tarea ---------- */
    const ASK = [
        [/\bsince\b|\bfor\b.*\b(since|tiempo)|desde hace/i, 'since'],
        [/\bagree\b|de acuerdo/i, 'agree'],
        [/\bwant\b|quiero que/i, 'want'],
        [/\b(have|has)\b|\b(is|are|was|were)\b.*\b(is|are|was|were)\b|concordancia/i, 'concord'],
        [/tercera persona|\b(he|she|it) \w+ ?s?\b.*-s|-s del verbo/i, 'third'],
        [/\ba\b (y|o) \ban\b|art[ií]culo/i, 'article'],
        [/\bmake\b|\bdo\b|\bsay\b|\btell\b/i, 'colloc'],
        [/edad|years old|a[nñ]os tengo/i, 'age'],
        [/preposic|\b(in|on|at)\b (y|o) /i, 'prep'],
        [/plural/i, 'plural'],
        [/falsos? amigos?/i, 'falsef'],
        [/-ing|gerundio/i, 'gerund'],
        [/contracci/i, 'contraction'],
        [/participio|present perfect/i, 'perfect']
    ];
    const ruleFor = (t) => { const hit = ASK.find(([rx]) => rx.test(t)); return hit && X.RULES[hit[1]] ? hit[1] : null; };
    function ensure(ruleId) { const b = bank(); return b[ruleId] || (b[ruleId] = { occ: [], status: 'pending', attempts: [] }); }
    function explain(ruleId) {
        const r = X.RULES[ruleId]; st().errRule = ruleId; setStage(1);
        tutor(`${r.name}. ${r.why}`, {
            html: `${exHtml(esc(r.bad), esc(r.good))}<p class="muted-text">Pista para recordarlo: ${esc(r.hint)}</p>`,
            chips: [chip('Ponme a prueba: 5 oraciones', 'errors-start', '5', 'sparkles'), chip('Otro ejemplo', 'errors-example', ruleId, 'refresh')]
        });
    }
    /* Revisa oraciones en inglés y guarda los errores en tu banco */
    function fromSentence(t) {
        const found = window.Checker.check(t, { formality: 1 }).filter((f) => f.type === 'error' && X.RULES[f.ruleId]);
        if (!found.length) return false;
        found.forEach((f) => add({ ruleId: f.ruleId, key: `ask-${f.ruleId}-${f.fragment}-${t.length}`, sentence: f.sentence, fragment: f.fragment, fix: f.fixes[0] !== undefined ? f.sentence.replace(f.fragment, f.fixes[0]) : f.sentence, source: 'Tu mensaje' }));
        const first = found[0];
        st().errRule = first.ruleId; setStage(1);
        tutor(`Encontré ${plural(found.length, 'error', 'errores')} y ${found.length === 1 ? 'lo guardé' : 'los guardé'} en tu registro de errores.`, {
            html: found.map((f) => `${exHtml(mark(f.sentence, f.fragment), esc(f.fixes[0] !== undefined ? f.sentence.replace(f.fragment, f.fixes[0]) : f.sentence))}<p class="err-rule"><strong>${esc(X.RULES[f.ruleId].name)}:</strong> ${esc(X.RULES[f.ruleId].why)}</p>`).join(''),
            chips: [chip('Practicar este error', 'errors-start', '5', 'sparkles'), chip('Ver mi registro', 'errors-list')]
        });
        return true;
    }
    /* Un texto (no una oración suelta) se revisa completo, según su tipo */
    const isText = (t) => { const U = window.Tasks.util; return U.looksEnglish(t) && (U.nWords(t) > 25 || window.Checker.sentences(t).length >= 3 || U.looksEmail(t)); };
    function respond(t, opts) {
        const U = window.Tasks.util;
        const asked = t.match(/^\s*(?:revisa|revisar|corrige|corregir|corr[ií]geme|rev[ií]same)\b[^:]{0,40}:\s*([\s\S]+)$/i);
        if (asked && U.looksEnglish(asked[1]) && U.nWords(asked[1]) >= 6) {
            const hint = /cuento|historia|relato/i.test(t) ? 'story' : /correo|carta|e-?mail/i.test(t) ? 'email' : /ensayo|texto|resumen|p[aá]rrafo/i.test(t) ? 'other' : null;
            st().errPractice = null; RV.review(asked[1].trim(), hint); return;
        }
        if (isText(t)) { st().errPractice = null; RV.review(t); return; }
        if (U.looksEnglish(t) && U.nWords(t) <= 40 && fromSentence(t)) return;
        if (/pon(me)? a prueba|practic|ejercicio|diagn/i.test(t) && !ruleFor(t)) { start(null, 5, { diag: true }); return; }
        const rid = ruleFor(t);
        if (rid) { ensure(rid); explain(rid); return; }
        const other = !(opts && opts.seed) && window.Intent.elsewhere(t, 'errors');
        if (other) {
            window.Start.handoff('errors', other, t, false);
            return;
        }
        if (/registro|mis errores|me equivoco|gram[aá]tica|mejorar/i.test(t)) { listErrors(); return; }
        if (/revis|corrig|mi (correo|cuento|texto|borrador|ensayo)/i.test(t)) { intro(); return; }
        tutor('No entendí qué quieres revisar. Pega tu texto en inglés, escríbeme una oración para revisarla o pregúntame por ejemplo:', {
            chips: ['¿Cuándo uso since y for?', 'Siempre me equivoco con have y has', 'Ver mi registro'].map((e) => chip(e, 'errors-example-ask', e, 'message'))
        });
    }
    /* Llega desde el inicio con el prompt de la persona */
    function seed(text) { st().errPractice = null; msgs().push({ role: 'user', text }); respond(text, { seed: true }); S.touch(); }
    function miss() {
        const p = st().errPractice; const r = p.res[p.i]; r.tries += 1;
        if (r.tries >= 2) { r.shown = true; askWrite(true); } else findCard('Ahí no está el error. Prueba otra palabra.');
    }
    function action(name, id, el) {
        const p = st().errPractice;
        const label = el ? el.textContent.trim() : '';
        if (label && name !== 'errors-tok' && !/^review-(accept|keep|undo)$/.test(name)) msgs().push({ role: 'user', text: label });
        if (RV.action(name, id)) { announce(); S.touch(); return; }
        switch (name) {
            case 'errors-list': listErrors(); break;
            case 'errors-new': intro(); break;
            case 'errors-diag': start(null, 5, { diag: true }); break;
            case 'errors-pick': pick(id); break;
            case 'errors-start': if (st().errRule) { ensure(st().errRule); start(st().errRule, Number(id) || 5); } else intro(); break;
            case 'errors-example': {
                const pool = X.BANK[id] || []; const ex = pool[Math.floor(Math.random() * pool.length)];
                if (ex) tutor('Otro ejemplo:', { html: exHtml(esc(ex.wrong), esc(ex.answers[0])), chips: [chip('Ponme a prueba: 5 oraciones', 'errors-start', '5', 'sparkles'), chip('Otro ejemplo', 'errors-example', id, 'refresh')] });
                break;
            }
            case 'errors-example-ask': msgs().pop(); window.Chat.fill(id); break;
            case 'errors-tok': {
                const last = msgs()[msgs().length - 1];
                if (!p || p.done || p.phase !== 'find' || !el || !last || !last.html || last.html.indexOf(`data-step="${el.dataset.step}"`) < 0) return;
                msgs().push({ role: 'user', text: label });
                if (X.errorTokens(exById(p.items[p.i])).has(Number(id))) askWrite(false); else miss();
                break;
            }
            case 'errors-show': if (p && p.phase === 'find') { p.res[p.i].shown = true; askWrite(true); } break;
            case 'errors-hint': if (p && p.phase === 'write') { p.res[p.i].hint = true; tutor(`Pista: ${X.RULES[exById(p.items[p.i]).ruleId].hint}`, { chips: [] }); } break;
            case 'errors-retry': if (p) start(p.ruleId, 0, { retry: p.items.filter((_, n) => !(p.res[n].ok && !p.res[n].hint && !p.res[n].shown)) }); break;
            case 'errors-done': {
                const e = p && bank()[p.ruleId];
                if (!e || !e.passed) { tutor('Todavía no alcanzas el logro en una ronda completa.'); break; }
                e.status = 'done'; e.back = false;
                tutor(`Marqué ${X.RULES[p.ruleId].name} como superado. Si vuelve a aparecer en un texto tuyo, regresará a pendiente.`, { chips: [chip('Elegir otro error', 'errors-list'), chip('Revisar un texto', 'errors-new', '', 'doc')], tone: 'ok' });
                break;
            }
            default: return;
        }
        S.touch();
    }

    /* 0.3.7: al decidir todas, dice qué quedó en el registro y cómo comprobar el resultado (0.3.8) */
    function announce() {
        const w = RV.get();
        if (!w || w.announced || w.issues.some((i) => i.status === 'pending') || !w.issues.length) return;
        w.announced = true;
        const saved = w.issues.filter((i) => i.status === 'accepted' && X.RULES[i.ruleId]);
        const kinds = [...new Set(saved.map((i) => X.RULES[i.ruleId].name))];
        tutor(saved.length ? `Registré ${plural(saved.length, 'error', 'errores')} en tu registro (${kinds.join(', ')}), con tu oración original y la corregida. Para comprobar el resultado, compara tu versión final con el original en el panel o revísala de nuevo.` : 'No registré errores: lo que decidiste eran sugerencias o mantuviste tu versión. Compara tu versión final con el original en el panel o revísala de nuevo.', {
            chips: [chip('Revisar de nuevo la versión final', 'review-recheck', '', 'refresh')].concat(saved.length ? [chip('Practicar mis errores', 'errors-list', '', 'sparkles')] : [])
        });
    }
    /* Progreso para la franja “Tu meta” */
    function status() {
        const p = st().errPractice; const gs = groups();
        const rv = RV.status();
        if (rv && !p) return rv;
        if (p && p.done) {
            const okN = p.res.filter((r) => r.ok && !r.hint && !r.shown).length;
            return { progress: `Resultado: ${okN} de ${p.items.length} sin pista`, next: p.diag ? 'Practica los errores que se guardaron' : 'Marca el error como superado u otra ronda' };
        }
        if (p && !p.done) {
            const okN = p.res.slice(0, p.i).filter((r) => r.ok && !r.hint && !r.shown).length;
            return { progress: `Oración ${p.i + 1} de ${p.items.length} · ${okN} sin pista`, next: p.phase === 'find' ? 'Encuentra el error' : 'Escribe la oración corregida' };
        }
        if (!gs.length) return { progress: 'Sin texto revisado todavía', next: 'Pega tu texto en inglés' };
        const pend = gs.filter((g) => g.e.status === 'pending').length;
        return { progress: `${pend} de ${gs.length} tipos pendientes`, next: pend ? 'Elige un error y practícalo' : 'Todo superado' };
    }

    window.Errors = { add, remove, groups, intro, handle, action, status, listHtml, exHtml, need, seed, reviewer: RV };

    window.Tasks.register({
        id: 'errors',
        name: 'Revisar',
        pitch: 'ahí reviso tu texto, te explico cada error y lo que corriges queda en tu registro para practicarlo',
        understood: 'quieres revisar un texto o dejar de repetir un error',
        examples: ['Revisa mi cuento: Once upon a time there was a girl who live in a small town. One day she find an old house.', 'Siempre me equivoco con have y has'],
        keywords: [/revis|corrig|correcci|errores?\b|me equivoco|equivocarme|gram[aá]tica|confundo|practicar|ponme a prueba|registro/i, /mi (correo|cuento|texto|borrador|ensayo|redacci)|cu[aá]ndo (se )?us[ao]|diferencia entre|\b(have|has|since|for|make|do|say|tell|agree|a|an|in|on|at) (y|o|vs\.?) [a-z]+/i],
        detect: (t) => {
            const U = window.Tasks.util;
            if (!U.looksEnglish(t)) return 0;
            const g = window.Checker.genre(t);
            return window.Checker.check(t, { formality: 1, genre: g }).some((f) => f.type === 'error') ? 0.8 : 0;
        },
        module: window.Errors
    });
})();
