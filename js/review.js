/* ============================================================
   Review · revisión de un texto propio (correo, cuento u otro)
   La usan 0.2 Producir (0.2.6–0.2.8: retroalimentación y versión
   final) y 0.3 Revisar (0.3.1–0.3.8). El revisor (checker.js) es
   por reglas y sabe el tipo de texto: en un cuento revisa el
   pasado de la narración; en un correo, el saludo y el tono.
   ============================================================ */
(function () {
    'use strict';

    const S = window.DemoState;
    const C = window.Checker;
    const I = window.Icons;
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;

    const GENRES = {
        email: { label: 'correo formal', noun: 'tu correo', Noun: 'Tu correo', copy: 'Copiar mi correo', source: 'Tu correo', after: 'Pégalo en tu correo electrónico, revisa el asunto y envíalo.' },
        story: { label: 'cuento o relato', noun: 'tu cuento', Noun: 'Tu cuento', copy: 'Copiar mi cuento', source: 'Tu cuento', after: 'Pégalo en tu documento y guárdalo como versión final.' },
        other: { label: 'otro tipo de texto', noun: 'tu texto', Noun: 'Tu texto', copy: 'Copiar mi texto', source: 'Tu texto', after: 'Pégalo en tu documento y guárdalo como versión final.' }
    };
    const FORMALITY = { email: 2, story: 1, other: 2 };

    function make(cfg) {
        const st = () => S.get();
        const R = () => st()[cfg.key];
        const g = () => GENRES[(R() && R().genre) || 'other'];
        const chip = (text, action, id, icon) => ({ icon: icon || 'arrowRight', text, action, id, kind: 'info' });

        /* Revisa y guarda las marcas; la revisión anterior queda fija en el historial */
        function review(text, genre, opts) {
            cfg.msgs().forEach((m) => { if (m.dyn === cfg.dyn) { m.html = reviewHtml(false); delete m.dyn; } });
            const gen = GENRES[genre] ? genre : C.genre(text);
            const found = C.check(text, { formality: FORMALITY[gen], genre: gen });
            st()[cfg.key] = { text, genre: gen, original: (opts && opts.original) || text, round: ((R() && opts && opts.recheck) ? R().round + 1 : 1), issues: found.map((f, n) => Object.assign({ id: `i${n}`, status: 'pending' }, f)) };
            cfg.onStage('reviewed');
            const G = g();
            const others = Object.keys(GENRES).filter((k) => k !== gen).map((k) => chip(`Revisarlo como ${GENRES[k].label}`, `${cfg.act}-genre`, k, 'refresh'));
            const as = `Lo leo como ${G.label}${gen === 'story' ? ', narrado en pasado' : ''}. `;
            if (!found.length) {
                cfg.tutor(`${opts && opts.recheck ? 'Volví a revisar tu versión final' : `${as}Revisé ${G.noun}`} con mis ${C.RULES.length} reglas y no encontré nada que cambiar. Eso no garantiza que esté perfecto: léelo una vez en voz alta.`, {
                    dyn: cfg.dyn, tone: 'ok', chips: [chip(G.copy, `${cfg.act}-copy`, '', 'copy')].concat(opts && opts.recheck ? [] : others)
                });
                if (opts && opts.recheck) cfg.onStage('checked');
                return;
            }
            const by = {};
            found.forEach((f) => { by[f.kind] = (by[f.kind] || 0) + 1; });
            cfg.tutor(`${opts && opts.recheck ? 'Volví a revisar tu versión final' : `${as}Revisé ${G.noun}`} con mis ${C.RULES.length} reglas y marqué ${plural(found.length, 'cosa', 'cosas')}. En cada una te explico la regla: aplica la sugerencia o mantén tu versión.`, {
                dyn: cfg.dyn,
                chips: Object.keys(by).map((k) => ({ icon: 'info', text: `${C.KINDS[k]}: ${by[k]}`, kind: k })).concat(opts && opts.recheck ? [] : others)
            });
            if (opts && opts.recheck) cfg.onStage('checked');
        }
        function fixed() {
            const w = R(); if (!w) return '';
            let out = w.text;
            w.issues.filter((i) => i.status === 'accepted' && i.fixes[0] !== undefined).sort((a, b) => b.start - a.start)
                .forEach((i) => { out = out.slice(0, i.start) + i.fixes[0] + out.slice(i.end); });
            return out;
        }
        function markedHtml(w) {
            let h = ''; let pos = 0;
            w.issues.slice().sort((a, b) => a.start - b.start).forEach((i, n) => {
                if (i.start < pos) return;
                h += esc(w.text.slice(pos, i.start));
                if (i.status === 'accepted' && i.fixes[0] !== undefined) h += `<ins class="wr-fixed">${esc(i.fixes[0])}</ins>`;
                else h += `<span class="hl-${i.kind}">${esc(i.fragment)}</span><sup class="wr-num">${n + 1}</sup>`;
                pos = i.end;
            });
            h += esc(w.text.slice(pos));
            return h.replace(/\n/g, '<br>');
        }
        function reviewHtml(live) {
            const w = R(); if (!w) return '';
            const G = g();
            const items = w.issues.map((i, n) => {
                const r = C.rule(i.ruleId);
                const fix = i.fixes[0];
                const state = i.status === 'accepted' ? `${I.check(14)} Aplicada` : i.status === 'rejected' ? 'Mantienes tu versión' : '';
                const buttons = !live ? '' : i.status === 'pending'
                    ? `${fix !== undefined ? `<button class="btn btn-sm" data-action="${cfg.act}-accept" data-id="${i.id}">Aplicar <span lang="en">“${esc(fix)}”</span></button>` : ''}<button class="btn btn-sm btn-ghost" data-action="${cfg.act}-keep" data-id="${i.id}">${fix !== undefined ? 'Mantener' : 'Entendido'}</button>`
                    : `<button class="text-btn" data-action="${cfg.act}-undo" data-id="${i.id}">Deshacer</button>`;
                return `<li class="wr-item ${i.status !== 'pending' ? 'is-decided' : ''}">
                    <div class="wr-item-head"><span class="wr-num-badge">${n + 1}</span><span class="type-badge ${i.kind}">${C.KINDS[i.kind]}</span><strong>${esc(r.name)}</strong>${r.type === 'idea' ? '<small>sugerencia, no error</small>' : ''}</div>
                    <p><span lang="en">“${esc(i.fragment.length > 90 ? `${i.fragment.slice(0, 87)}…` : i.fragment)}”</span>${fix !== undefined ? ` → <span lang="en">${esc(fix)}</span>` : ''}</p>
                    <p class="wr-why"><strong>Pista:</strong> ${esc(r.hint)} ${esc(r.why)}</p>
                    <div class="wr-actions">${state ? `<span class="wr-state">${state}</span>` : ''}${buttons}</div>
                </li>`;
            }).join('');
            const pending = w.issues.filter((i) => i.status === 'pending').length;
            const done = live && w.issues.length && !pending;
            return `<p class="wr-label">${G.Noun}</p><div class="wr-text" lang="en">${markedHtml(w)}</div>
                ${items ? `<ol class="wr-list">${items}</ol>` : ''}
                ${live && w.issues.length ? `<p class="muted-text">${pending ? `Te quedan ${plural(pending, 'sugerencia', 'sugerencias')} por decidir.` : 'Decidiste todas. Tu versión final:'}</p>` : ''}
                ${done ? `<pre class="wr-final" lang="en">${esc(fixed())}</pre><div class="wr-actions"><button class="btn btn-sm btn-primary" data-action="${cfg.act}-copy">${I.copy(14)} ${G.copy}</button><button class="btn btn-sm" data-action="${cfg.act}-recheck">${I.refresh ? I.refresh(14) : ''} Revisar de nuevo la versión final</button></div>` : ''}`;
        }
        function decide(id, status) {
            const w = R(); if (!w) return;
            const i = w.issues.find((x) => x.id === id); if (!i) return;
            i.status = status;
            const key = `own-${cfg.key}-${i.ruleId}-${i.start}-${i.fragment}`;
            if (window.Exercises.RULES[i.ruleId]) {
                if (status === 'accepted') window.Errors.add({ ruleId: i.ruleId, key, sentence: i.sentence, fragment: i.fragment, fix: i.fixes[0] !== undefined ? i.sentence.replace(i.fragment, i.fixes[0]) : i.sentence, source: g().source });
                else window.Errors.remove(i.ruleId, key);
            }
            cfg.onStage(w.issues.some((x) => x.status === 'pending') ? 'deciding' : 'done');
        }
        function copyText(text) {
            if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
            return Promise.resolve(false);
        }
        /* Botones de la revisión: devuelve true si los manejó */
        function action(name, id) {
            const w = R();
            switch (name) {
                case `${cfg.act}-accept`: decide(id, 'accepted'); return true;
                case `${cfg.act}-keep`: decide(id, 'rejected'); return true;
                case `${cfg.act}-undo`: decide(id, 'pending'); return true;
                case `${cfg.act}-genre`: if (w) review(w.text, id, { original: w.original }); return true;
                case `${cfg.act}-recheck`: if (w) { const t = fixed(); review(t, w.genre, { original: w.original, recheck: true }); } return true;
                case `${cfg.act}-copy`: {
                    const text = w ? fixed() : '';
                    if (!text) return true;
                    copyText(text).then((ok) => { cfg.tutor(ok ? `Copié ${g().noun}. ${g().after}` : 'No pude copiarlo: selecciona el texto de la versión final y cópialo.', { tone: ok ? 'ok' : '' }); cfg.onStage('copied'); S.touch(); });
                    return true;
                }
                default: return false;
            }
        }
        function status() {
            const w = R();
            if (!w) return null;
            const n = w.issues.length; const done = w.issues.filter((i) => i.status !== 'pending').length;
            if (!n) return { progress: 'Revisado: sin sugerencias', next: `Copia ${g().noun}` };
            return { progress: `${done} de ${plural(n, 'sugerencia revisada', 'sugerencias revisadas')}`, next: done < n ? 'Decide qué aplicar' : 'Copia tu versión final o revísala de nuevo' };
        }
        const panelHtml = (v) => {
            const w = R(); if (!w) return '';
            if (v === 'original') return esc(w.original).replace(/\n/g, '<br>');
            return v === 'final' ? esc(fixed()).replace(/\n/g, '<br>') : markedHtml(w);
        };
        return { review, fixed, markedHtml, reviewHtml, decide, action, status, panelHtml, genre: () => g(), get: R };
    }

    window.Reviewer = { make, GENRES };
})();
