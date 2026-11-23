/* ============================================================
   Tarea 3 · Adquisición de vocabulario contextualizado (en el chat)
   3.1 Leer y detectar · 3.2 Traducir en contexto · 3.3 Registrar · 3.4 Practicar
   Todo pasa conversando: pegas el texto, marcas palabras, eliges o
   escribes el significado y escribes tus oraciones.
   ============================================================ */
(function () {
    'use strict';

    const S = window.DemoState;
    const D = window.DemoData;
    const G = window.Glossary;
    const C = window.Checker;
    const I = window.Icons;
    const LABEL = 'TUTOR IA · VOCABULARIO';
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
    const nWords = (t) => t.trim().split(/\s+/).filter(Boolean).length;
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    const EN = /\b(the|and|to|of|is|are|i|you|my|your|for|with|have|has|this|that|in|on|it|be|was|will|can|they|we)\b/gi;
    const looksEnglish = (t) => { const w = nWords(t); return w >= 3 && ((t.match(EN) || []).length / w) >= 0.15; };
    const markWord = (sentence, w) => {
        const m = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').exec(sentence);
        return m ? `${esc(sentence.slice(0, m.index))}<mark>${esc(m[0])}</mark>${esc(sentence.slice(m.index + m[0].length))}` : esc(sentence);
    };
    const dictLinks = (w) => {
        const q = encodeURIComponent(w.toLowerCase());
        return `<p class="voc-links">Consultar “${esc(w)}”: <a href="https://dictionary.cambridge.org/dictionary/english-spanish/${q}" target="_blank" rel="noopener noreferrer">Cambridge${I.arrowRight(12)}<span class="sr-only"> (otra pestaña)</span></a> <a href="https://www.wordreference.com/es/translation.asp?tranword=${q}" target="_blank" rel="noopener noreferrer">WordReference${I.arrowRight(12)}<span class="sr-only"> (otra pestaña)</span></a></p>`;
    };

    const st = () => S.get();
    const V = () => st().vocab;
    const msgs = () => st().messages.lessons;
    const tutor = (text, extra) => { msgs().push(Object.assign({ role: 'ai', label: LABEL, text, chips: [], replies: true }, extra || {})); };
    const me = (text) => msgs().push({ role: 'user', text });
    const chip = (text, action, id, icon) => ({ icon: icon || 'arrowRight', text, action, id, kind: 'info' });
    const STAGE = { text: 0, mark: 0, mean: 1, own: 1, saved: 2, sentence: 3, sense: 3, end: 3 };
    const go = (stage) => { V().stage = stage; st().activeStage = STAGE[stage]; };
    const tokens = (text) => { const out = []; const rx = /[A-Za-z]+(?:['’-][A-Za-z]+)*/g; let m; while ((m = rx.exec(text))) out.push({ w: m[0], start: m.index }); return out; };
    const wordById = (id) => st().vocabWords.find((w) => w.id === id);

    /* ---------- 3.1 Leer y detectar ---------- */
    function intro() {
        st().vocab = { stage: 'text', text: '', sample: false, marked: [], k: 0, practice: [], j: 0, pending: '', seen: [] };
        go('text');
        tutor('Pega aquí el texto en inglés que necesitas leer: un artículo, una consigna o un correo. Te ayudo a entender las palabras nuevas en su contexto.', {
            chips: [chip('Usar un artículo de ejemplo', 'vocab-sample', '', 'book')].concat(st().vocabWords.length ? [chip('Practicar mis palabras', 'vocab-practice-all', '', 'sparkles')] : [])
        });
    }
    function setText(text, sample) {
        const v = V(); v.text = text.trim(); v.sample = !!sample; v.marked = []; go('mark');
        const n = nWords(text);
        tutor(`Son ${n} palabras, unos ${Math.max(1, Math.round(n / 150))} min de lectura. Léelo completo y toca las palabras que no conozcas, o escríbemelas separadas por comas. Cuando termines, escribe “listo”.`, {
            dyn: 'reading', chips: [chip('Listo', 'vocab-done-mark', '', 'check')]
        });
    }
    /* La lectura se dibuja con el estado actual: se puede tocar mientras estás marcando */
    function readingHtml(active) {
        const v = V(); if (!v || !v.text) return '';
        const marked = new Set(v.marked.map((m) => m.start)); let h = ''; let pos = 0; let first = true;
        tokens(v.text).forEach((t) => {
            h += esc(v.text.slice(pos, t.start));
            h += active
                ? `<button class="voc-tok ${marked.has(t.start) ? 'is-on' : ''}" id="vt-${t.start}" data-action="vocab-mark" data-id="${t.start}" aria-pressed="${marked.has(t.start)}" tabindex="${first ? 0 : -1}">${esc(t.w)}</button>`
                : (marked.has(t.start) ? `<span class="voc-tok is-on">${esc(t.w)}</span>` : esc(t.w));
            first = false; pos = t.start + t.w.length;
        });
        h += esc(v.text.slice(pos));
        return `${v.sample ? '<p class="voc-sample">Texto de ejemplo</p>' : ''}<div class="voc-reading" lang="en" ${active ? 'role="group" aria-label="Texto: toca las palabras que no conozcas" data-roving' : ''}>${h.split(/\n\s*\n/).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')}</div>
            ${active ? `<p class="muted-text">Marcadas: ${v.marked.length ? v.marked.map((m) => `<span lang="en">${esc(m.word)}</span>`).join(', ') : 'ninguna todavía'}.</p>` : ''}`;
    }
    function markText(word) {
        const v = V(); const t = tokens(v.text).find((x) => x.w.toLowerCase() === word.toLowerCase());
        if (!t) return false;
        if (!v.marked.some((m) => m.start === t.start)) v.marked.push({ start: t.start, word: t.w, sentence: C.sentenceAt(v.text, t.start), meaning: '' });
        v.marked.sort((a, b) => a.start - b.start);
        return true;
    }

    /* ---------- 3.2 Traducir en contexto ---------- */
    function askMeaning() {
        const v = V(); const m = v.marked[v.k]; const hit = G.lookup(m.word); go('mean');
        const head = `Palabra ${v.k + 1} de ${v.marked.length}: “${m.word}”. Así aparece en tu texto:`;
        const quote = `<p class="voc-quote" lang="en">${markWord(m.sentence, m.word)}</p>`;
        if (hit) {
            tutor(`${head} ¿Qué significado encaja en esta oración? Elige uno o escríbelo.`, {
                html: quote, chips: hit.senses.map((s, n) => chip(`${s.es} (${s.when})`, 'vocab-sense', String(n), 'book')).concat([chip('Ninguno: lo escribo yo', 'vocab-own', '', 'message')])
            });
        } else {
            go('own');
            tutor(`${head} No está en mi glosario de ${G.size} palabras. Búscala y escríbeme el significado que encaja.`, { html: quote + dictLinks(m.word) });
        }
    }
    function setMeaning(meaning) {
        const v = V(); v.marked[v.k].meaning = meaning; v.k += 1;
        if (v.k < v.marked.length) { askMeaning(); return; }
        register();
    }

    /* ---------- 3.3 Registrar ---------- */
    function register() {
        const v = V(); const ids = []; let repeated = 0;
        v.marked.forEach((m) => {
            let w = st().vocabWords.find((x) => x.word.toLowerCase() === m.word.toLowerCase() && x.meaning === m.meaning);
            if (w) repeated += 1;
            else {
                w = { id: `w${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, word: m.word, meaning: m.meaning, sentence: m.sentence, source: v.sample ? 'Artículo de ejemplo' : 'Tu texto', own: '', practicedAt: null, at: Date.now() };
                st().vocabWords.unshift(w);
            }
            ids.push(w.id);
        });
        v.practice = ids; v.j = 0; go('saved');
        tutor(`Registré ${plural(ids.length, 'palabra', 'palabras')} con su significado y la oración original${repeated ? ` (${repeated} ya las tenías)` : ''}. Están en “Tus palabras”.`, {
            html: cardsHtml(ids),
            chips: [chip('Practicar con ellas', 'vocab-practice', '', 'sparkles'), chip('Leer otro texto', 'vocab-new', '', 'book')]
        });
    }
    const cardsHtml = (ids) => `<ul class="voc-cards">${ids.map(wordById).filter(Boolean).map((w) => `<li><strong lang="en">${esc(w.word)}</strong> · ${esc(w.meaning)}<small lang="en">“${esc(w.sentence)}”</small></li>`).join('')}</ul>`;

    /* ---------- 3.4 Practicar ---------- */
    function askSentence() {
        const v = V(); const w = wordById(v.practice[v.j]); v.seen = []; go('sentence');
        tutor(`Escribe una oración tuya en inglés con “${w.word}” (${w.meaning}). Que sea sobre tu vida o tus estudios, no una copia del texto.`, { chips: [chip('Saltar esta palabra', 'vocab-skip', '', 'arrowRight')] });
    }
    const VERB = /\b(?:am|is|are|was|were|be|been|have|has|had|do|does|did|can|could|will|would|should|may|might|must)\b|\b[a-z]+(?:ed|es)\b|\b(?:go|went|make|made|take|took|give|gave|get|got|need|want|like|feel|felt|help|use|work|study|live|know|think|see|saw|say|said|find|found|keep|kept|become|became|create|value|offer|show|seem|look|allow|bring|try|learn|read|write|wrote|leave|left|meet|met|lead|led|pay|paid|plan|enjoy|prefer|believe|hope|start|finish|recommend|avoid|improve)\b/i;
    function verify(t) {
        const v = V(); const w = wordById(v.practice[v.j]);
        const orig = new Set(w.sentence.toLowerCase().match(/[a-z']+/g) || []); const mine = t.toLowerCase().match(/[a-z']+/g) || [];
        const overlap = mine.length ? mine.filter((x) => orig.has(x)).length / mine.length : 0;
        const iss = C.check(t, { formality: 1 }).filter((x) => x.type === 'error' || x.ruleId === 'question');
        const list = [
            { ok: G.uses(t, w.word), t: `Usas “${w.word}”` },
            { ok: nWords(t) >= 5, t: 'Tiene al menos 5 palabras' },
            { ok: overlap < 0.7, t: 'Es tuya, no una copia del texto' },
            { ok: /^[A-Z"“]/.test(t) && /[.!?]["”]?$/.test(t), t: 'Empieza con mayúscula y termina con punto' },
            { ok: VERB.test(t), t: 'Tiene un verbo reconocible', soft: true },
            { ok: !iss.length, t: iss.length ? `Encuentro ${plural(iss.length, 'error', 'errores')}` : 'No encuentro errores de gramática', iss }
        ];
        v.seen = v.seen.concat(iss.map((i) => ({ ruleId: i.ruleId, fragment: i.fragment, sentence: i.sentence })));
        const html = `<ul class="voc-checks">${list.map((x) => `<li class="${x.ok ? 'is-ok' : ''}">${x.ok ? I.check(14) : I.alert(14)}<span>${esc(x.t)}${x.iss && x.iss.length ? `<small>${x.iss.map((i) => `<span lang="en">“${esc(i.fragment)}”</span>${i.fixes[0] ? ` → <span lang="en">${esc(i.fixes[0])}</span>` : ''}. ${C.rule(i.ruleId).hint}`).join('<br>')}</small>` : ''}${x.soft && !x.ok ? '<small>Puede ser un verbo que no conozco: revísalo tú.</small>' : ''}</span></li>`).join('')}</ul>`;
        if (!list.every((x) => x.ok || x.soft)) {
            tutor('Revisé tu oración. Corrige lo marcado y envíamela de nuevo.', { html, chips: [chip('Saltar esta palabra', 'vocab-skip', '', 'arrowRight')] });
            return;
        }
        v.pending = t; go('sense');
        tutor(`Revisé tu oración. No puedo comprobar el sentido: ¿en tu oración “${w.word}” significa «${w.meaning}»?`, {
            html, chips: [chip('Sí', 'vocab-sense-yes', '', 'check'), chip('No, significa otra cosa', 'vocab-sense-no', '', 'close')], tone: 'ok'
        });
    }
    function next() {
        const v = V(); v.j += 1;
        if (v.j < v.practice.length) { askSentence(); return; }
        go('end');
        tutor('Practicaste todas tus palabras. Quedan guardadas con la oración del texto y la tuya.', {
            chips: [chip('Descargar mis palabras', 'vocab-csv', '', 'export'), chip('Leer otro texto', 'vocab-new', '', 'book')], tone: 'ok'
        });
    }
    function download() {
        const q = (s) => `"${String(s || '').replace(/"/g, '""')}"`;
        const csv = ['palabra,significado,oracion_original,mi_oracion,fuente'].concat(st().vocabWords.map((w) => [w.word, w.meaning, w.sentence, w.own, w.source].map(q).join(','))).join('\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv' })); a.download = 'mis-palabras.csv';
        document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    /* ---------- Lo que escribes en el chat ---------- */
    function handle(text) {
        const t = text.trim(); const n = norm(t); me(t);
        const v = V(); if (!v) { intro(); S.touch(); return; }
        const ask = t.match(/(?:qu[eé] significa|significado de|qu[eé] quiere decir|what does|meaning of)\s+["“'«]?([a-z][a-z'’-]*)/i);
        if (ask) {
            const h = G.lookup(ask[1]);
            tutor(h ? `“${h.lemma}”: ${h.senses.map((s) => `${s.es} (${s.when})`).join(' · ')}.` : `“${ask[1]}” no está en mi glosario de ${G.size} palabras.`, { html: h ? '' : dictLinks(ask[1]) });
            S.touch(); return;
        }
        switch (v.stage) {
            case 'text':
                if (nWords(t) < 20) tutor(`Necesito un texto en inglés de al menos 20 palabras (este tiene ${nWords(t)}).`, { chips: [chip('Usar un artículo de ejemplo', 'vocab-sample', '', 'book')] });
                else if (nWords(t) > 1500) tutor('Es muy largo. Pega una parte de hasta 1500 palabras.');
                else if (!looksEnglish(t)) tutor('No parece estar en inglés. Pega un texto en inglés.');
                else setText(t, false);
                break;
            case 'mark': {
                if (/^(listo|ya|termine|ya termine|done|continuar|siguiente)$/.test(n)) { action('vocab-done-mark'); return; }
                const ok = []; const no = [];
                t.split(/[,;\n]|\s+y\s+/).map((x) => x.trim()).filter(Boolean).forEach((w) => (markText(w) ? ok : no).push(w));
                tutor(`${ok.length ? `Marqué: ${ok.join(', ')}.` : ''}${no.length ? ` No encuentro en el texto: ${no.join(', ')}.` : ''} Llevas ${plural(v.marked.length, 'palabra', 'palabras')}. Escribe “listo” cuando termines.`, { dyn: 'reading', chips: [chip('Listo', 'vocab-done-mark', '', 'check')] });
                break;
            }
            case 'mean': {
                const h = G.lookup(v.marked[v.k].word);
                const k = h ? h.senses.findIndex((s) => norm(s.es).split(',').some((x) => x.trim() && (n.includes(x.trim()) || x.trim().includes(n)))) : -1;
                if (k >= 0) { setMeaning(h.senses[k].es); break; }
                if (looksEnglish(t)) { tutor('Escríbeme el significado en español.'); break; }
                setMeaning(t); break;
            }
            case 'own':
                if (looksEnglish(t)) tutor('Escríbeme el significado en español.'); else setMeaning(t);
                break;
            case 'saved': case 'end':
                if (/practic/.test(n)) action('vocab-practice');
                else if (nWords(t) >= 20 && looksEnglish(t)) { intro(); setText(t, false); } else tutor('Puedes practicar con tus palabras, pegar otro texto o descargar tu lista.', { chips: [chip('Practicar con ellas', 'vocab-practice', '', 'sparkles'), chip('Leer otro texto', 'vocab-new', '', 'book')] });
                break;
            case 'sentence': verify(t); break;
            case 'sense':
                if (/^(si|sí|yes|claro|correcto)\b/.test(n)) { action('vocab-sense-yes'); return; }
                if (/^no\b/.test(n)) { action('vocab-sense-no'); return; }
                tutor('Respóndeme sí o no.');
                break;
            default: intro();
        }
        S.touch();
    }

    /* ---------- Botones del chat ---------- */
    function action(name, id, el) {
        const v = V();
        const label = el ? el.textContent.trim() : '';
        if (label && name !== 'vocab-mark') me(label);
        switch (name) {
            case 'vocab-new': intro(); break;
            case 'vocab-sample': {
                if (!v) intro();
                setText(`${D.article.paragraphs.join('\n\n')}`, true); break;
            }
            case 'vocab-mark': {
                if (!v || v.stage !== 'mark') return;
                const s = Number(id); const i = v.marked.findIndex((m) => m.start === s);
                if (i >= 0) v.marked.splice(i, 1);
                else { const t = tokens(v.text).find((x) => x.start === s); v.marked.push({ start: s, word: t.w, sentence: C.sentenceAt(v.text, s), meaning: '' }); v.marked.sort((a, b) => a.start - b.start); }
                break;
            }
            case 'vocab-done-mark':
                if (!v || v.stage !== 'mark') return;
                if (!v.marked.length) tutor('Marca al menos una palabra que no conozcas: tócala en el texto o escríbela.', { dyn: 'reading', chips: [chip('Listo', 'vocab-done-mark', '', 'check')] });
                else { v.k = 0; askMeaning(); }
                break;
            case 'vocab-sense': if (v && v.stage === 'mean') setMeaning(G.lookup(v.marked[v.k].word).senses[Number(id)].es); break;
            case 'vocab-own': if (v && v.stage === 'mean') { go('own'); tutor('Escríbeme el significado en español que encaja en esa oración.'); } break;
            case 'vocab-practice': if (v && v.practice.length) { v.j = 0; askSentence(); } break;
            case 'vocab-practice-all': {
                if (!v) intro();
                const pend = st().vocabWords.filter((w) => !w.practicedAt);
                V().practice = (pend.length ? pend : st().vocabWords).map((w) => w.id); V().j = 0; askSentence(); break;
            }
            case 'vocab-skip': if (v && /sentence|sense/.test(v.stage)) next(); break;
            case 'vocab-sense-yes': {
                if (!v || v.stage !== 'sense') return;
                const w = wordById(v.practice[v.j]); w.own = v.pending; w.practicedAt = Date.now();
                const fixed = v.seen.filter((x, i, a) => a.findIndex((y) => y.ruleId === x.ruleId && y.fragment === x.fragment) === i);
                fixed.forEach((x) => { if (window.Exercises.RULES[x.ruleId]) window.Errors.add({ ruleId: x.ruleId, key: `voc-${w.id}-${x.ruleId}-${x.fragment}`, sentence: x.sentence, fragment: x.fragment, fix: v.pending, source: `Oración con “${w.word}”` }); });
                tutor(`Guardé tu oración.${fixed.length ? ' Los errores que corregiste quedan en “Errores frecuentes” para practicarlos.' : ''}`, { tone: 'ok' });
                next(); break;
            }
            case 'vocab-sense-no': if (v && v.stage === 'sense') { go('sentence'); tutor('Entonces reescribe tu oración para usar la palabra con ese significado.'); } break;
            case 'vocab-csv': download(); tutor('Descargué “mis-palabras.csv” con tus palabras, sus significados y tus oraciones.'); break;
            default: return;
        }
        S.touch();
    }

    function status() {
        const v = V(); const ws = st().vocabWords; const done = ws.filter((w) => w.practicedAt).length;
        if (!v || v.stage === 'text') return { progress: ws.length ? `${done} de ${plural(ws.length, 'palabra usada', 'palabras usadas')}` : 'Sin texto todavía', next: 'Pega un texto en inglés en el chat' };
        if (v.stage === 'mark') return { progress: plural(v.marked.length, 'palabra marcada', 'palabras marcadas'), next: v.marked.length ? 'Escribe “listo” cuando termines de leer' : 'Toca o escribe las palabras que no conozcas' };
        if (v.stage === 'mean' || v.stage === 'own') return { progress: `Significado ${v.k + 1} de ${v.marked.length}`, next: 'Elige o escribe el que encaja en la oración' };
        if (v.stage === 'saved') return { progress: `${plural(v.practice.length, 'palabra registrada', 'palabras registradas')}`, next: 'Practica con ellas' };
        if (v.stage === 'end') return { progress: `${done} de ${plural(ws.length, 'palabra usada', 'palabras usadas')}`, next: 'Lee otro texto o descarga tu lista' };
        return { progress: `Oración ${v.j + 1} de ${v.practice.length}`, next: 'Escribe tu oración con la palabra' };
    }

    window.Vocab = { intro, handle, action, status, readingHtml, download, cardsHtml };
})();
