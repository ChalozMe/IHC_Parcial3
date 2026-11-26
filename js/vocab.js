/* ============================================================
   Tarea 0.1 · Comprender un texto en inglés (en el chat)
   0.1.1–0.1.2 Leer · 0.1.3 Ideas principales · 0.1.4–0.1.5 Vocabulario ·
   0.1.6 Gramática · 0.1.7 Comprobar la comprensión
   Todo pasa conversando: pegas el texto, lo lees marcando palabras,
   escribes la idea de cada párrafo, eliges significados, analizas una
   oración y respondes preguntas hechas con tu propio texto.
   ============================================================ */
(function () {
    'use strict';

    const S = window.DemoState;
    const D = window.DemoData;
    const G = window.Glossary;
    const C = window.Checker;
    const I = window.Icons;
    const LABEL = 'TUTOR IA · COMPRENDER';
    const RD = window.Reading;
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
    const nWords = (t) => t.trim().split(/\s+/).filter(Boolean).length;
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    const EN = /\b(the|an|and|but|or|so|to|of|is|are|was|were|am|be|been|i|you|she|it|we|they|my|your|his|her|their|our|for|with|from|into|at|by|as|not|have|has|had|do|did|this|that|there|who|which|in|on|will|can|would|could|please|one|day|time|upon)\b/gi;
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
    const STAGE = { text: 0, mark: 0, idea: 1, nowords: 2, mean: 2, own: 2, saved: 2, sentence: 2, sense: 2, gram: 3, topic: 4, cloze: 4, summary: 4, end: 4 };
    const go = (stage) => { V().stage = stage; st().activeStage = STAGE[stage]; };
    const tokens = (text) => { const out = []; const rx = /[A-Za-z]+(?:['’-][A-Za-z]+)*/g; let m; while ((m = rx.exec(text))) out.push({ w: m[0], start: m.index }); return out; };
    const wordById = (id) => st().vocabWords.find((w) => w.id === id);
    const GRAM_ASK = /(?:expl[ií]ca(?:me)?|estructura|analiza|no entiendo|c[oó]mo se arma)[^:]{0,60}:\s*["“]?([^"”]+)["”]?\s*$/i;

    /* ---------- 3.1 Leer y detectar ---------- */
    const fresh = () => { st().vocab = { stage: 'text', text: '', sample: false, marked: [], k: 0, practice: [], j: 0, pending: '', seen: [], info: null, paras: [], pi: 0, ideas: [], hint: false, gram: [], topic: '', clozes: [], cz: null, summary: '', after: '' }; go('text'); };
    function intro() {
        fresh();
        tutor('Pega aquí el texto en inglés que necesitas comprender: un artículo, un cuento, una consigna o un correo. Lo leemos juntos: ideas principales, palabras nuevas, gramática y unas preguntas para comprobar que lo entendiste.', {
            chips: [chip('Usar un artículo de ejemplo', 'vocab-sample', '', 'book')].concat(st().vocabWords.length ? [chip('Practicar mis palabras', 'vocab-practice-all', '', 'sparkles')] : [])
        });
    }
    /* 0.1.1 y 0.1.2: qué texto es, cuánto dura, qué tan difícil y para qué lo escribieron */
    function setText(text, sample) {
        const v = V(); v.text = text.trim(); v.sample = !!sample; v.marked = []; go('mark');
        const i = RD.stats(v.text); v.info = i;
        tutor(`Lo leo como ${i.type}: ${plural(i.paragraphs, 'párrafo', 'párrafos')}, ${i.words} palabras, unos ${i.minutes} min. Intención probable del autor: ${i.intent}. Léelo completo y, mientras lees, toca las palabras que no conozcas (las vemos después). Cuando termines, escribe “listo”.`, {
            html: `<p class="voc-meta">Dificultad estimada: <strong>${esc(i.level)}</strong> · oraciones de ${i.avg} palabras en promedio. <small>Es una estimación por la longitud de oraciones y palabras.</small></p>`,
            dyn: 'reading', chips: [chip('Listo, ya lo leí', 'vocab-done-mark', '', 'check')]
        });
    }

    /* ---------- 0.1.3 Ideas principales ---------- */
    const quote = (t, mark) => `<blockquote class="voc-para" lang="en">${mark ? esc(t).replace(esc(mark), `<mark>${esc(mark)}</mark>`) : esc(t)}</blockquote>`;
    function startIdeas() {
        const v = V(); const ps = RD.paragraphsOf(v.text);
        v.paras = ps.list; v.pi = 0; v.ideas = [];
        askIdea(ps.split ? 'Tu texto es un solo bloque: lo dividí en partes de 3 oraciones. ' : '');
    }
    function askIdea(pre) {
        const v = V(); v.hint = false; go('idea');
        tutor(`${pre || ''}Ideas principales · ${v.paras.length > 1 ? `párrafo ${v.pi + 1} de ${v.paras.length}` : 'el texto'}. ¿Cuál es su idea central? Escríbela con tus palabras, en español o en inglés.`, {
            html: quote(v.paras[v.pi]),
            chips: [chip('Pista: ¿dónde suele estar?', 'vocab-idea-hint', '', 'lightbulb'), chip('Saltar este paso', 'vocab-skip-ideas', '', 'arrowRight')]
        });
    }
    function checkIdea(t) {
        const v = V(); const para = v.paras[v.pi];
        const keys = RD.keywords(para, 5); const cov = RD.covers(t, keys); const topic = RD.sentencesOf(para)[0] || para;
        v.ideas.push({ para: v.pi, mine: t, topic, cov: cov.length, of: keys.length });
        const miss = keys.filter((k) => !cov.includes(k)).map((k) => k.word);
        tutor(cov.length ? `Anoté tu idea. Menciona ${cov.length} de ${keys.length} palabras clave del párrafo${miss.length ? `; no aparecen: ${miss.join(', ')}` : ''}. Compárala con la oración principal (suele ser la primera):` : `Anoté tu idea, pero no menciona ninguna palabra clave del párrafo (${keys.map((k) => k.word).join(', ')}). Relee el párrafo y compárala con su oración principal:`, {
            html: `<p class="voc-quote" lang="en">${esc(topic)}</p>`, tone: cov.length >= Math.ceil(keys.length / 2) ? 'ok' : ''
        });
        nextIdea();
    }
    function nextIdea() {
        const v = V(); v.pi += 1;
        if (v.pi < v.paras.length) { askIdea(); return; }
        if (v.ideas.length) tutor('Tus ideas principales, en orden. Quedan en “Tu lectura”:', { html: `<ol class="wr-plan">${v.ideas.map((x) => `<li>${esc(x.mine)}</li>`).join('')}</ol>` });
        toVocab();
    }
    /* 0.1.4–0.1.5: las palabras marcadas al leer */
    function toVocab() {
        const v = V();
        if (v.marked.length) { tutor(`Ahora el vocabulario: marcaste ${plural(v.marked.length, 'palabra', 'palabras')}. Vemos su significado en la oración donde aparecen.`); v.k = 0; askMeaning(); return; }
        go('nowords');
        tutor('No marcaste palabras al leer. ¿Hay alguna que no conozcas o que te genere dudas?', {
            chips: [chip('Sí, marcar palabras', 'vocab-remark', '', 'book'), chip('No, seguir con la gramática', 'vocab-to-gram', '', 'arrowRight')]
        });
    }

    /* ---------- 0.1.6 Gramática de una oración ---------- */
    function askGram() {
        const v = V(); go('gram');
        const all = RD.sentencesOf(v.text);
        const pick = all.map((s, i) => ({ s, i })).filter((x) => RD.words(x.s).length >= 6).sort((a, b) => RD.words(b.s).length - RD.words(a.s).length).slice(0, 6).sort((a, b) => a.i - b.i);
        tutor('Gramática: elige una oración que te cueste entender. Tócala o escríbela, y te muestro sujeto, verbo, tiempo verbal y conectores.', {
            html: `<div class="voc-sents" role="group" aria-label="Oraciones del texto">${pick.map((x) => `<button class="voc-sent" data-action="vocab-gram" data-id="${x.i}" lang="en">${esc(x.s)}</button>`).join('')}</div>`,
            chips: [chip('Saltar este paso', 'vocab-to-check', '', 'arrowRight')]
        });
    }
    function gramHtml(a) {
        if (!a.ok) return `<p>No encontré el verbo principal de esta oración con mis reglas. Busca la palabra que dice qué pasa o qué hace alguien.</p>`;
        const row = (k, val) => `<div><dt>${k}</dt><dd>${val}</dd></div>`;
        return `<p class="voc-quote" lang="en">${esc(a.sentence)}</p><dl class="voc-gram">
            ${row('Sujeto', `<span lang="en">${esc(a.subject)}</span>`)}
            ${row('Verbo principal', `<span lang="en">${esc(a.verb)}</span>`)}
            ${row('Tiempo verbal', `${esc(a.tense.en)}<small>En español: ${esc(a.tense.es)}</small>`)}
            ${a.rest ? row('Objeto y complementos', `<span lang="en">${esc(a.rest)}</span>`) : ''}
            ${a.connectors.length ? row('Conectores', a.connectors.map((c) => `<span lang="en">${esc(c.en)}</span> (${esc(c.es)}: ${esc(c.role)})`).join(' · ')) : ''}
            ${a.preps.length || a.articles.length ? row('Preposiciones y artículos', `<span lang="en">${esc(a.preps.concat(a.articles).join(', '))}</span>`) : ''}
            ${a.subs.length ? row('Subordinadas', a.subs.map((c) => `una parte introducida por <span lang="en">“${esc(c.en)}”</span> (${esc(c.es)})`).join('; ')) : ''}
        </dl>${a.notes.map((n) => `<p class="muted-text">${esc(n)}</p>`).join('')}
        <p class="voc-compare"><strong>Comparado con el español:</strong> el orden es el mismo (sujeto + verbo + complementos), pero en inglés el sujeto se escribe siempre${/^\(/.test(a.subject) ? '' : ` (“${esc(a.subject)}”)`} y no se omite como en español.</p>
        <p class="muted-text">Análisis por reglas: en oraciones muy complejas puede equivocarse. Si no te convence, consúltalo con tu docente.</p>`;
    }
    function explainSentence(sentence, fromList) {
        const v = V(); const a = RD.analyze(sentence);
        if (v) v.gram.push(sentence);
        if (v && v.stage !== 'gram' && !fromList) {
            tutor('Así se arma esta oración:', { html: gramHtml(a) });
            return;
        }
        go('gram');
        tutor('Así se arma esta oración:', { html: gramHtml(a), chips: [chip('Otra oración', 'vocab-gram-again', '', 'refresh'), chip('Seguir: comprobar lo que entendí', 'vocab-to-check', '', 'arrowRight')] });
    }

    /* ---------- 0.1.7 Comprobar la comprensión ---------- */
    function askTopic() {
        go('topic');
        tutor('Comprobemos que lo entendiste. Primero: explica con tus palabras de qué trata el texto, en una o dos oraciones (en español o en inglés).', { chips: [chip('Saltar las preguntas', 'vocab-end', '', 'arrowRight')] });
    }
    function checkTopic(t) {
        const v = V(); v.topic = t;
        const keys = RD.keywords(v.text, 6); const cov = RD.covers(t, keys);
        const ok = cov.length >= 2;
        tutor(ok ? `Tu explicación menciona ${cov.length} de ${keys.length} palabras clave del texto (${cov.map((k) => k.word).join(', ')}). Va bien encaminada.` : `Tu explicación menciona ${cov.length} de ${keys.length} palabras clave del texto (${keys.map((k) => k.word).join(', ')}). Relee el primer párrafo: ahí suele estar el tema.`, { tone: ok ? 'ok' : '' });
        askCloze();
    }
    function askCloze() {
        const v = V();
        if (v.clozes.length >= 2) { askSummary(); return; }
        const c = RD.cloze(v.text, v.clozes.map((x) => x.stem), v.clozes.map((x) => x.sentence));
        if (!c) { askSummary(); return; }
        v.cz = c; go('cloze');
        tutor(`Información específica (${v.clozes.length + 1} de 2): completa con la palabra exacta del texto.`, {
            html: `<p class="voc-quote" lang="en">${esc(c.gap)}</p>`, chips: [chip('No la recuerdo', 'vocab-cloze-show', '', 'search')]
        });
    }
    function checkCloze(t, gaveUp) {
        const v = V(); const c = v.cz; if (!c) return;
        const ok = !gaveUp && RD.sameWord(t, c.answer);
        v.clozes.push({ stem: c.stem, answer: c.answer, mine: gaveUp ? '' : t, ok, gap: c.gap, sentence: c.sentence }); v.cz = null;
        if (ok) tutor(`Correcto: “${c.answer}”.`, { tone: 'ok' });
        else tutor(`${gaveUp ? 'La palabra era' : 'No es esa: era'} “${c.answer}”. Relee este ${v.info && v.info.paragraphs > 1 ? `párrafo (el ${c.para + 1})` : 'fragmento'}:`, { html: quote(RD.paragraphsOf(v.text).list[Math.max(0, c.para)] || c.sentence, c.sentence) });
        askCloze();
    }
    function askSummary() {
        go('summary');
        tutor('Para terminar, escribe un resumen final del texto en inglés: de 2 a 4 oraciones, con tus palabras.', { chips: [chip('Terminar sin resumen', 'vocab-end', '', 'arrowRight')] });
    }
    function checkSummary(t) {
        const v = V(); const keys = RD.keywords(v.text, 6); const cov = RD.covers(t, keys);
        const n = nWords(t); const ss = C.sentences(t).length;
        const iss = C.check(t, { formality: 1, genre: 'other' }).filter((x) => x.type === 'error');
        const list = [
            { ok: looksEnglish(t), t: 'Está en inglés' },
            { ok: ss >= 2 && ss <= 4, t: `Tiene ${plural(ss, 'oración', 'oraciones')} (se piden de 2 a 4)` },
            { ok: n >= 15 && n <= 120, t: `Tiene ${n} palabras` },
            { ok: cov.length >= 2, t: `Menciona ${cov.length} de ${keys.length} palabras clave (${keys.map((k) => k.word).join(', ')}); se piden al menos 2` },
            { ok: !RD.copied(t, v.text), t: 'Es tuyo, no una copia de una oración del texto' },
            { ok: !iss.length, t: iss.length ? `Encuentro ${plural(iss.length, 'error', 'errores')} de gramática` : 'No encuentro errores de gramática', iss }
        ];
        const html = `<ul class="voc-checks">${list.map((x) => `<li class="${x.ok ? 'is-ok' : ''}">${x.ok ? I.check(14) : I.alert(14)}<span>${esc(x.t)}${x.iss && x.iss.length ? `<small>${x.iss.map((i) => `<span lang="en">“${esc(i.fragment)}”</span>${i.fixes[0] ? ` → <span lang="en">${esc(i.fixes[0])}</span>` : ''}. ${esc(C.rule(i.ruleId).hint)}`).join('<br>')}</small>` : ''}</span></li>`).join('')}</ul>`;
        iss.forEach((i) => { if (window.Exercises.RULES[i.ruleId]) window.Errors.add({ ruleId: i.ruleId, key: `sum-${i.ruleId}-${i.fragment}-${t.length}`, sentence: i.sentence, fragment: i.fragment, fix: i.fixes[0] !== undefined ? i.sentence.replace(i.fragment, i.fixes[0]) : i.sentence, source: 'Tu resumen' }); });
        v.summary = t;
        if (list.every((x) => x.ok)) { tutor('Revisé tu resumen: cumple todo lo que puedo comprobar. No puedo juzgar si es fiel al texto: compáralo con tus ideas principales.', { html, tone: 'ok' }); finish(); return; }
        tutor(`Revisé tu resumen. Corrige lo marcado y envíamelo de nuevo, o termina así.${iss.length ? ' Los errores de gramática quedan en tu registro de Revisar.' : ''}`, { html, chips: [chip('Terminar así', 'vocab-end', '', 'check')] });
    }
    function finish() {
        const v = V(); go('end'); v.after = 'done';
        const ok = v.clozes.filter((c) => c.ok).length;
        const lines = [
            `${plural(v.ideas.length, 'idea principal', 'ideas principales')} anotadas`,
            `${plural(v.marked.length, 'palabra registrada', 'palabras registradas')}`,
            `${plural(v.gram.length, 'oración analizada', 'oraciones analizadas')}`,
            v.clozes.length ? `${ok} de ${v.clozes.length} datos específicos correctos` : '',
            v.summary ? 'resumen final escrito' : ''
        ].filter(Boolean);
        tutor('Terminaste la lectura. Todo queda en “Tu lectura”:', {
            html: `<ul class="wr-plan">${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`, tone: 'ok',
            chips: (st().vocabWords.length ? [chip('Practicar mis palabras', 'vocab-practice-all', '', 'sparkles')] : []).concat([chip('Leer otro texto', 'vocab-new', '', 'book')])
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
            chips: [chip('Seguir: gramática', 'vocab-to-gram', '', 'arrowRight'), chip('Practicar con ellas ahora', 'vocab-practice', '', 'sparkles')]
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
        const v2 = V();
        tutor('Practicaste todas tus palabras. Quedan guardadas con la oración del texto y la tuya.', {
            chips: (v2.text && !v2.after ? [chip('Seguir: gramática', 'vocab-to-gram', '', 'arrowRight')] : []).concat([chip('Descargar mis palabras', 'vocab-csv', '', 'export'), chip('Leer otro texto', 'vocab-new', '', 'book')]), tone: 'ok'
        });
        go(v2.text && !v2.after ? 'saved' : 'end');
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
        const U = window.Tasks.util;
        const gq = t.match(GRAM_ASK);
        if (gq && looksEnglish(gq[1])) { explainSentence(gq[1].trim()); S.touch(); return; }
        if ((/¿/.test(t) || (/\?/.test(t) && !U.looksEnglish(t))) && offer(t)) { S.touch(); return; }
        switch (v.stage) {
            case 'idea':
                if (/^(no se|ni idea|no lo se|pista)$/.test(n)) { action('vocab-idea-hint'); return; }
                if (/^(saltar|siguiente)$/.test(n)) { action('vocab-skip-ideas'); return; }
                checkIdea(t); break;
            case 'nowords':
                if (/^(si|sí)\b/.test(n)) { action('vocab-remark'); return; }
                if (/^no\b/.test(n)) { askGram(); break; }
                tutor('Respóndeme sí o no.'); break;
            case 'gram':
                if (looksEnglish(t)) explainSentence(t, true);
                else if (/^(seguir|siguiente|listo|saltar)$/.test(n)) askTopic();
                else tutor('Escríbeme la oración en inglés o tócala en la lista.');
                break;
            case 'topic': checkTopic(t); break;
            case 'cloze': checkCloze(t); break;
            case 'summary': checkSummary(t); break;
            case 'text':
                if (nWords(t) < 20 && !looksEnglish(t) && offer(t)) break;
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
                if (v.stage === 'saved' && /gram[aá]tica|seguir/.test(n)) { askGram(); break; }
                if (/practic/.test(n)) action('vocab-practice');
                else if (nWords(t) < 20 && offer(t)) break;
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
                if (v.after === 'remark') { v.after = ''; if (v.marked.length) { v.k = 0; askMeaning(); } else askGram(); } else startIdeas();
                break;
            case 'vocab-idea-hint': {
                if (!v || v.stage !== 'idea') return;
                const para = v.paras[v.pi]; const first = RD.sentencesOf(para)[0] || para;
                tutor('La idea central suele estar en la primera oración del párrafo (la oración principal). Las demás dan detalles, causas o ejemplos. ¿Qué dice esa oración con tus palabras?', { html: quote(para, first), chips: [chip('Saltar este paso', 'vocab-skip-ideas', '', 'arrowRight')] });
                break;
            }
            case 'vocab-skip-ideas': if (v && v.stage === 'idea') { v.pi = v.paras.length - 1; nextIdea(); } break;
            case 'vocab-remark': if (v && v.text) { v.after = 'remark'; go('mark'); tutor('Toca en el texto las palabras que no conozcas, o escríbelas separadas por comas. Escribe “listo” cuando termines.', { dyn: 'reading', chips: [chip('Listo', 'vocab-done-mark', '', 'check')] }); } break;
            case 'vocab-to-gram': if (v && v.text) askGram(); break;
            case 'vocab-gram': if (v && v.text) { const ss = RD.sentencesOf(v.text); if (ss[Number(id)]) explainSentence(ss[Number(id)], true); } break;
            case 'vocab-gram-again': if (v && v.text) askGram(); break;
            case 'vocab-to-check': if (v && v.text) askTopic(); break;
            case 'vocab-cloze-show': if (v && v.stage === 'cloze') checkCloze('', true); break;
            case 'vocab-end': if (v && v.text) finish(); break;
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
                tutor(`Guardé tu oración.${fixed.length ? ' Los errores que corregiste quedan en tu registro de Revisar para practicarlos.' : ''}`, { tone: 'ok' });
                next(); break;
            }
            case 'vocab-sense-no': if (v && v.stage === 'sense') { go('sentence'); tutor('Entonces reescribe tu oración para usar la palabra con ese significado.'); } break;
            case 'vocab-csv': download(); tutor('Descargué “mis-palabras.csv” con tus palabras, sus significados y tus oraciones.'); break;
            default: return;
        }
        S.touch();
    }

    /* Si lo que escribes es de otra tarea, ofrece ir allá con ese texto */
    function offer(t) {
        const other = window.Intent.elsewhere(t, 'lessons');
        if (!other) return false;
        window.Start.handoff('lessons', other, t, /^(mark|mean|own|sentence|sense)$/.test((V() || {}).stage || ''));
        return true;
    }
    /* Llega desde el inicio con el prompt de la persona */
    function seed(text) {
        const t = text.trim(); fresh(); me(t);
        const ask = t.match(/(?:qu[eé] significa|significado de|qu[eé] quiere decir|what does|meaning of)\s+["“'«]?([a-z][a-z'’-]*)/i);
        const gq = t.match(GRAM_ASK);
        if (gq && looksEnglish(gq[1])) {
            explainSentence(gq[1].trim());
            tutor('Si me pegas el texto completo, también vemos sus ideas principales, el vocabulario y unas preguntas para comprobar que lo entendiste.', { chips: [chip('Usar un artículo de ejemplo', 'vocab-sample', '', 'book')] });
        } else if (nWords(t) >= 20 && looksEnglish(t) && nWords(t) <= 1500) setText(t, false);
        else if (ask) {
            const h = G.lookup(ask[1]);
            tutor(h ? `“${h.lemma}”: ${h.senses.map((s) => `${s.es} (${s.when})`).join(' · ')}. El sentido depende de la oración: si me pegas tu texto, te ayudo a elegir el que encaja.` : `“${ask[1]}” no está en mi glosario de ${G.size} palabras. Búscala y, si me pegas tu texto, te ayudo a elegir el sentido que encaja.`, {
                html: h ? '' : dictLinks(ask[1]), chips: [chip('Usar un artículo de ejemplo', 'vocab-sample', '', 'book')]
            });
        } else {
            tutor('Pega aquí el texto en inglés que necesitas comprender. Primero lo lees marcando las palabras que no conozcas; después sacamos las ideas principales, vemos el vocabulario y la gramática, y te hago unas preguntas para comprobar que lo entendiste.', { chips: [chip('Usar un artículo de ejemplo', 'vocab-sample', '', 'book')] });
        }
        S.touch();
    }

    function status() {
        const v = V(); const ws = st().vocabWords; const done = ws.filter((w) => w.practicedAt).length;
        if (!v || v.stage === 'text') return { progress: ws.length ? `${done} de ${plural(ws.length, 'palabra usada', 'palabras usadas')}` : 'Sin texto todavía', next: 'Pega un texto en inglés en el chat' };
        if (v.stage === 'mark') return { progress: `${v.info ? `${v.info.type.split(' (')[0]} · ` : ''}${plural(v.marked.length, 'palabra marcada', 'palabras marcadas')}`, next: 'Lee y escribe “listo” cuando termines' };
        if (v.stage === 'idea') return { progress: `Idea principal ${v.pi + 1} de ${v.paras.length}`, next: 'Escribe la idea central con tus palabras' };
        if (v.stage === 'nowords') return { progress: 'Sin palabras marcadas', next: 'Marca palabras o sigue con la gramática' };
        if (v.stage === 'gram') return { progress: plural(v.gram.length, 'oración analizada', 'oraciones analizadas'), next: 'Elige una oración que te cueste' };
        if (v.stage === 'topic') return { progress: 'Comprobar: tema', next: 'Explica de qué trata el texto' };
        if (v.stage === 'cloze') return { progress: `Comprobar: dato ${v.clozes.length + 1} de 2`, next: 'Completa con la palabra del texto' };
        if (v.stage === 'summary') return { progress: 'Comprobar: resumen', next: 'Escribe un resumen de 2 a 4 oraciones' };
        if (v.stage === 'mean' || v.stage === 'own') return { progress: `Significado ${v.k + 1} de ${v.marked.length}`, next: 'Elige o escribe el que encaja en la oración' };
        if (v.stage === 'saved') return { progress: `${plural(v.practice.length, 'palabra registrada', 'palabras registradas')}`, next: 'Practica con ellas' };
        if (v.stage === 'end') return { progress: `Lectura terminada · ${v.clozes.filter((c) => c.ok).length} de ${v.clozes.length} datos`, next: 'Lee otro texto o practica tus palabras' };
        return { progress: `Oración ${v.j + 1} de ${v.practice.length}`, next: 'Escribe tu oración con la palabra' };
    }

    /* Para el panel “Tu lectura” */
    function summaryHtml() {
        const v = V(); if (!v || !v.text) return '';
        const i = v.info || RD.stats(v.text);
        return `<p class="muted-text">${esc(i.type)} · ${i.words} palabras · ${esc(i.level)}</p>
            <p class="wr-label">Ideas principales</p>${v.ideas.length ? `<ol class="wr-plan">${v.ideas.map((x) => `<li>${esc(x.mine)}<small lang="en">${esc(x.topic)}</small></li>`).join('')}</ol>` : '<p class="muted-text">Todavía no las escribiste.</p>'}
            ${v.gram.length ? `<p class="wr-label">Oraciones analizadas</p><ul class="wr-plan">${v.gram.map((g) => `<li lang="en">${esc(g)}</li>`).join('')}</ul>` : ''}
            ${v.topic ? `<p class="wr-label">De qué trata, con tus palabras</p><p>${esc(v.topic)}</p>` : ''}
            ${v.clozes.length ? `<p class="wr-label">Datos específicos</p><p>${v.clozes.filter((c) => c.ok).length} de ${v.clozes.length} correctos</p>` : ''}
            ${v.summary ? `<p class="wr-label">Tu resumen</p><p lang="en">${esc(v.summary)}</p>` : ''}`;
    }

    window.Vocab = { intro, handle, action, status, readingHtml, download, cardsHtml, seed, summaryHtml };

    window.Tasks.register({
        id: 'lessons',
        name: 'Comprender',
        pitch: 'ahí lees tu texto y sacamos sus ideas principales, el vocabulario y la gramática, con preguntas para comprobar que lo entendiste',
        understood: 'quieres comprender un texto en inglés',
        examples: ['Tengo que entender las ideas principales de un artículo en inglés', '¿Qué significa deadline?'],
        keywords: [/no entiendo|comprender|entender|ideas? principal|resum|art[ií]culo|lectura|\bleer\b/i, /palabras?|vocabulario|significa|quiere decir|traduc|t[eé]rmino|estructura|expl[ií]ca(me)? (esta|la|una) oraci|analiza/i],
        detect: (t) => {
            if (/qu[eé] significa|qu[eé] quiere decir|what does .+ mean|meaning of/i.test(t)) return 0.5;
            if (nWords(t) < 20 || !looksEnglish(t) || window.Tasks.util.looksEmail(t)) return 0;
            const g = window.Checker.genre(t);
            return window.Checker.check(t, { formality: 1, genre: g }).some((f) => f.type === 'error') ? 0 : 0.8;
        },
        module: window.Vocab
    });
})();
