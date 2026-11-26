/* ============================================================
   App · bootstrap, render global y acciones
   Demo mocking · sin backend · prioridad visual
   ============================================================ */
(function () {
    'use strict';

    const D = window.DemoData;
    const S = window.DemoState;
    const I = window.Icons;
    const Chat = window.Chat;
    const Panels = window.Panels;
    const Graph = window.Graph;

    let modalOpen = false;
    let lastFocus = null;
    let pendingCriteria = null;
    let toastTimer = null;

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.prototype.slice.call(root.querySelectorAll(sel));

    const escapeHtml = (str) => String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    /* ---------------- Render ---------------- */
    function renderHeader() {
        const st = S.get();
        $$('#mode-nav .mode-pill').forEach((btn) => {
            const active = btn.dataset.mode === st.mode;
            btn.classList.toggle('is-active', active);
            if (active) btn.setAttribute('aria-current', 'true');
            else btn.removeAttribute('aria-current');
            btn.setAttribute('aria-pressed', String(active));
            if (active) { const nav = btn.parentElement; nav.scrollLeft = Math.max(0, btn.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft - 8); }
            btn.title = active ? `Actividad actual: ${D.modes[btn.dataset.mode].label}` : `Cambiar a ${D.modes[btn.dataset.mode].label} y ver sus chats`;
        });

        const pop = $('#suggestions-popover');
        const btn = $('#suggestions-btn');
        if (pop) {
            pop.hidden = !st.suggestionsOpen;
            if (st.suggestionsOpen) pop.innerHTML = Panels.renderSuggestions();
        }
        if (btn) btn.setAttribute('aria-expanded', String(st.suggestionsOpen));

        const input = $('#chat-input');
        if (input) input.placeholder = st.view === 'home' ? 'Ej.: Tengo que escribir un correo formal' : D.modes[st.mode].placeholder;
    }

    function renderStagebar() {
        const st = S.get();
        const mode = D.modes[st.mode];
        const stages = mode.stages.map((label, index) => {
            const state = index < st.activeStage ? 'is-done' : index === st.activeStage ? 'is-active' : '';
            return `
                <span class="stage ${state}" ${index === st.activeStage ? 'aria-current="step"' : ''}>
                    <span class="stage-dot" aria-hidden="true">${index < st.activeStage ? I.check(13) : index + 1}</span>
                    <span>${label}<span class="sr-only">${index < st.activeStage ? ' (hecha)' : index === st.activeStage ? ' (actual)' : ''}</span></span>
                </span>
                ${index < mode.stages.length - 1 ? '<span class="stage-line" aria-hidden="true"></span>' : ''}
            `;
        }).join('');

        const el = $('#stagebar');
        if (!el) return;
        el.innerHTML = `
            ${st.view === 'work' ? `<h1 class="sr-only">${mode.title}</h1>` : ''}
            <div class="stages" role="list" aria-label="Etapas de la tarea">${stages}</div>
            <div class="stage-actions">
                <button class="sheet-toggle" data-action="toggle-sheet" aria-controls="side-panel" aria-expanded="${st.sheetOpen}">${I.layers(14)} Apoyo</button>
            </div>
        `;
    }

    /* Las 3 subtareas de la Tarea 0 (Causalidad__Cobertura_y_Bugs__Copy_.md) */
    const GOALS = {
        writing: 'Producir un texto en inglés',
        errors: 'Revisar tu texto, entender tus errores y no repetirlos',
        lessons: 'Comprender un texto en inglés: ideas, vocabulario y gramática'
    };

    function goalFor(st) {
        if (st.mode === 'writing' && window.Writing.goal) return window.Writing.goal();
        return GOALS[st.mode];
    }

    function renderGoalStrip() {
        const el = $('#goal-strip');
        if (!el) return;
        const st = S.get();
        let progress;
        let next;
        if (st.mode === 'writing' && !(st.wDemoAt >= 0 && !st.wr)) {
            const w = window.Writing.status();
            progress = w.progress;
            next = w.next;
        } else if (st.mode === 'writing') {
            const pending = D.corrections.filter((c) => (st.statuses[c.id] || 'pending') === 'pending');
            const done = D.corrections.length - pending.length;
            progress = `${done} de ${D.corrections.length} correcciones revisadas`;
            next = pending.length ? `Siguiente: ${pending[0].title}` : 'Todo revisado: copia tu correo y envíalo';
        } else if (st.mode === 'errors') {
            const e = window.Errors.status();
            progress = e.progress;
            next = e.next;
        } else {
            const v = window.Vocab.status();
            progress = v.progress;
            next = v.next;
        }
        el.innerHTML = `
            <span class="goal-label">Tu meta</span>
            <strong class="goal-text">${goalFor(st)}</strong>
            <span class="goal-progress">${progress}</span>
            <span class="goal-next">${I.arrowRight(13)} ${next}</span>
        `;
    }

    function renderBranchRibbon() {
        const st = S.get();
        const el = $('#branch-ribbon');
        if (!el) return;
        const visible = st.branches.length > 1;
        el.hidden = !visible;
        if (!visible) { el.innerHTML = ''; return; }
        el.innerHTML = `
            <span class="ribbon-label">${I.branch(13)} Versiones</span>
            ${st.branches.map((b) => `<button class="branch-chip ${st.branch === b ? 'is-active' : ''}" data-action="select-branch" data-branch="${b}">${b}</button>`).join('')}
            <button class="branch-chip add" data-action="create-branch">${I.plus(12)} Nueva</button>
            <span class="ribbon-note">Cada rama guarda sus propios cambios · Kazemitabaar et al.</span>
        `;
    }

    function renderComposerState() {
        const st = S.get();
        const send = $('#send-btn');
        if (send) {
            const stopping = !!st.typing;
            if (send.classList.contains('is-stop') !== stopping) {
                send.classList.toggle('is-stop', stopping);
                send.setAttribute('aria-label', stopping ? 'Detener respuesta' : 'Enviar mensaje');
                send.title = stopping ? 'Detener respuesta' : 'Enviar';
                send.innerHTML = stopping ? I.stop(18) : I.send(20);
            }
        }
    }

    function renderHistory() {
        const st = S.get();
        const drawer = $('#history-drawer');
        const overlay = $('#history-overlay');
        if (!drawer || !overlay) return;
        drawer.hidden = !st.historyOpen;
        overlay.hidden = !st.historyOpen;
        if (st.historyOpen) drawer.innerHTML = Panels.renderHistoryDrawer();
    }

    function renderSidebar() {
        const el = $('#chat-rail');
        if (el) el.innerHTML = Panels.renderChatRail();
    }

    /* ---------------- Inicio ---------------- */
    const TASKS = [
        { mode: 'lessons', icon: 'book', name: 'Comprender', goal: 'Lee un texto, saca sus ideas principales, entiende el vocabulario y la gramática, y comprueba lo que entendiste.', time: '10–15 min' },
        { mode: 'writing', icon: 'doc', name: 'Producir', goal: 'Planifica y escribe un correo, un cuento u otro texto en inglés, con su estructura y vocabulario.', time: '10–15 min' },
        { mode: 'errors', icon: 'tag', name: 'Revisar', goal: 'Revisa tu texto por vocabulario, gramática y coherencia, registra tus errores y practícalos.', time: '5–10 min' }
    ];

    /* ---------------- Inicio dentro del mismo chat ----------------
       La persona escribe lo que necesita en el campo de siempre. La IA
       detecta la tarea y la vista se adapta en el mismo lugar: aparecen
       etapas, meta y panel. Solo pregunta si el prompt es ambiguo. */
    function startHtml() {
        const st = S.get();
        const msgs = st.homeMsgs || [];
        const active = st.sessions.find((s) => s.active) || st.sessions[0];
        const examples = window.Tasks.all().map((t) => t.examples[0]).filter(Boolean);
        return `
            <div class="start-hero">
                <h1 id="home-title">¿Qué necesitas hacer en inglés?</h1>
                <p class="home-lead">Cuéntamelo con tus palabras o pega tu texto aquí abajo. Me adapto a lo que necesitas: comprender un texto, producir el tuyo (un correo, un cuento u otro) o revisarlo.</p>
                ${msgs.length ? '' : `
                <div class="home-examples" role="group" aria-label="Ejemplos de lo que puedes escribir">
                    <span class="home-eyebrow">Prueba con</span>
                    <div class="chip-row">${examples.map((e) => `<button class="chip" data-action="fill-input" data-text="${escapeHtml(e)}">${I.message(12)} ${escapeHtml(e)}</button>`).join('')}</div>
                </div>
                ${active ? `<p class="home-continue-line">${I.arrowRight(13)} <button class="text-btn" data-action="continue-session">Continuar “${escapeHtml(active.title)}”</button></p>` : ''}`}
            </div>
            ${msgs.map((m, i) => Chat.messageHtml(m, i)).join('')}
            ${st.homeTyping ? `
            <div class="bubble ai typing" aria-label="La IA está escribiendo">
                <div class="bubble-label">TUTOR IA · ESCRIBIENDO</div>
                <div class="typing-dots"><span></span><span></span><span></span></div>
            </div>` : ''}`;
    }

    let startTimer = null;
    const chipOf = (text, action, id, icon) => ({ icon: icon || 'arrowRight', text, action, id, kind: 'info' });
    function startSend(text) {
        const st = S.get();
        if (st.homeTyping) return;
        S.set({ homeMsgs: (st.homeMsgs || []).concat({ role: 'user', text }), homeTyping: true, routeSeed: text });
        Chat.scrollToBottom();
        window.clearTimeout(startTimer);
        startTimer = window.setTimeout(() => {
            const r = window.Intent.route(text);
            if (r.task) { S.set({ homeTyping: false }); adaptTo(r.task.id); return; }
            const reply = { role: 'ai', label: 'TUTOR IA', replies: true, chips: [] };
            if (r.candidates.length) {
                Object.assign(reply, {
                    text: 'Puedo ayudarte de varias formas. ¿Qué quieres hacer primero?',
                    html: `<ul class="home-options">${r.candidates.map((t) => `<li><strong>${t.name}:</strong> ${t.pitch}.</li>`).join('')}</ul>`,
                    chips: r.candidates.map((t) => chipOf(t.name, 'route-go', t.id))
                });
            } else {
                Object.assign(reply, {
                    text: 'No entendí qué necesitas. Cuéntame qué tienes que hacer en inglés; por ejemplo:',
                    chips: window.Tasks.all().map((t) => chipOf(t.examples[0], 'fill-input', t.examples[0], 'message'))
                });
            }
            S.set({ homeMsgs: S.get().homeMsgs.concat(reply), homeTyping: false });
            say(reply.text);
            Chat.scrollToBottom();
        }, S.get().reduceMotion ? 150 : 700);
    }

    /* La vista se adapta a la tarea: mismo chat y mismo campo, con etapas, meta y panel de esa tarea */
    function adaptTo(id, text) {
        const task = window.Tasks.get(id);
        if (!task) return;
        const st = S.get();
        const seed = text || st.routeSeed || st.lastSeed;
        st.seeding = !!seed;                     // la tarea no saluda: empieza con tu prompt
        switchMode(id);
        S.set({ view: 'work', historyMode: id, homeMsgs: [], homeTyping: false });
        newChat({ quiet: true });
        if (seed) task.module.seed(seed);
        S.get().seeding = false;
        // aviso de la adaptación, con la opción de cambiar
        const others = window.Tasks.all().filter((t) => t.id !== id);
        S.get().messages[id].push({
            role: 'ai', note: true, label: 'TUTOR IA', replies: true,
            text: `Estoy en modo ${task.name}. ¿Buscabas otra cosa?`,
            chips: others.map((t) => chipOf(`Cambiar a ${t.name}`, 'route-go', t.id, 'refresh'))
        });
        S.set({ routeSeed: '', lastSeed: seed || '' });
        if (!st.reduceMotion) {
            document.body.classList.add('just-adapted');
            window.setTimeout(() => document.body.classList.remove('just-adapted'), 700);
        }
        Chat.scrollToBottom();
        const input = $('#chat-input');
        if (input && !modalOpen) input.focus();
        say(`Modo ${task.name}. ${task.understood.charAt(0).toUpperCase() + task.understood.slice(1)}.`);
    }

    /* Dentro de una tarea llega algo de otra: si no hay un ejercicio a medias, la vista se adapta sola */
    function handoff(from, task, text, busy) {
        const list = S.get().messages[from];
        S.get().routeSeed = text;
        if (busy) {
            list.push({ role: 'ai', label: 'TUTOR IA', replies: true, text: `Eso es de ${task.name}. Para no perder lo que estás haciendo, sigo aquí; cuando quieras, vamos allá con tu pregunta.`, chips: [chipOf(`Ir a ${task.name}`, 'route-go', task.id)] });
            return;
        }
        list.push({ role: 'ai', label: 'TUTOR IA', replies: true, text: `Eso es de ${task.name}: me cambio a ese modo con tu pregunta.`, chips: [] });
        adaptTo(task.id, text);
    }

    window.Start = { html: startHtml, send: startSend, adaptTo, handoff };

    function renderAside() {
        const tabs = $('#aside-tabs');
        const content = $('#aside-content');
        const footer = $('#aside-footer');
        if (tabs) tabs.innerHTML = Panels.renderTabs();
        if (content) content.innerHTML = Panels.renderAsideContent();
        if (footer) footer.innerHTML = Panels.renderAsideFooter();
    }

    function renderAll() {
        const detailLevel = S.get().detailsLevel;
        const stNow = S.get();
        document.body.classList.toggle('view-home', stNow.view === 'home');
        document.body.classList.toggle('show-tags', !!stNow.showTags);
        document.body.classList.toggle('reduce-motion', !!stNow.reduceMotion);
        document.body.classList.toggle('sheet-open', !!stNow.sheetOpen);
        document.body.classList.toggle('learner-mode', detailLevel === 0);
        document.body.classList.toggle('overview-mode', detailLevel === 1);
        document.body.classList.toggle('research-menu-mode', detailLevel === 2);
        document.body.classList.toggle('research-mode', detailLevel >= 3);
        renderHeader();
        renderStagebar();
        renderGoalStrip();
        renderBranchRibbon();
        renderComposerState();
        renderHistory();
        renderSidebar();
        const home = $('#home'); if (home) home.hidden = true;
        renderAside();
        Chat.render();
    }

    /* ---------------- Toast / modal ---------------- */
    function toast(message) {
        const el = $('#toast');
        if (!el) return;
        el.textContent = message;
        el.hidden = false;
        el.classList.add('is-visible');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => {
            el.classList.remove('is-visible');
            window.setTimeout(() => { el.hidden = true; }, 220);
        }, 2600);
        const live = $('#live-region');
        if (live) live.textContent = message;
    }

    /* Anuncia a lectores de pantalla sin mostrar aviso: para acciones cuyo efecto ya se ve en el lugar */
    function say(message) {
        const live = $('#live-region');
        if (live) live.textContent = message;
    }

    function openModal(title, body, eyebrow) {
        const overlay = $('#modal-overlay');
        const modal = $('#modal');
        if (!overlay || !modal) return;
        modal.innerHTML = `
            <div class="modal-head">
                <div>
                    ${eyebrow ? `<p class="modal-eyebrow">${eyebrow}</p>` : ''}
                    <h3 id="modal-title">${title}</h3>
                </div>
                <button class="icon-btn" data-action="modal-close" aria-label="Cerrar">${I.close(18)}</button>
            </div>
            ${body}
        `;
        overlay.hidden = false;
        if (!modalOpen) lastFocus = document.activeElement;
        modalOpen = true;
        const closeBtn = $('[data-action="modal-close"]', modal);
        if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
        const overlay = $('#modal-overlay');
        if (overlay) overlay.hidden = true;
        modalOpen = false;
        // el foco vuelve al botón que abrió la ventana
        if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
        else { const b = document.querySelector('[data-action="open-settings"]'); if (b) b.focus(); }
        lastFocus = null;
    }

    /* ---------------- Acciones ---------------- */
    function setCorrection(id, status) {
        const st = S.get();
        const statuses = Object.assign({}, st.statuses, { [id]: status });
        /* Una corrección aceptada pasa a ser un error propio para practicar (tarea 2) */
        const c = D.corrections.find((x) => x.id === id);
        if (c && c.practice) {
            const sentence = (D.writingText.split(/(?<=[.!?])\s+|\n+/).find((x) => x.includes(c.before)) || c.before).trim();
            if (status === 'accepted') window.Errors.add({ ruleId: c.practice, key: `mail-${id}`, sentence, fragment: c.before, fix: sentence.replace(c.before, c.after), source: 'Correo: prórroga' });
            else window.Errors.remove(c.practice, `mail-${id}`);
        }
        const patch = { statuses, showDecomp: true, decompIgnored: false };
        if (status !== 'pending') {
            const inspected = st.inspected.includes(id) ? st.inspected : st.inspected.concat(id);
            patch.inspected = inspected;
        }
        S.set(patch);
        say(status === 'accepted' ? 'Corrección aceptada. La reescritura se actualizó.' : status === 'rejected' ? 'Corrección rechazada. Se mantiene tu versión.' : 'Corrección devuelta a pendiente.');
    }

    function openRule(id) {
        const rule = D.rules.find((r) => r.id === id);
        if (!rule) return;
        openModal(rule.title, `
            <div class="modal-body">
                <div class="badge-row"><span class="type-badge ${rule.kind}">${rule.label}</span><span class="paper-tag">Gu et al. · regla visible</span></div>
                <p class="modal-text">${rule.body}</p>
                <div class="rule-example good"><span>Correcto</span>${rule.good}</div>
                <div class="rule-example bad"><span>Evitar</span>${rule.bad}</div>
                <div class="modal-note">${I.info(14)} La regla se muestra en lenguaje simple para que puedas decidir, no solo aceptar.</div>
                <div class="modal-actions">
                    <button class="btn btn-primary" data-action="modal-close">Entendido</button>
                    <button class="btn" data-action="open-synonyms">${I.search(14)} Buscar sinónimos</button>
                </div>
            </div>
        `, 'Regla y ejemplo');
    }

    function openExport() {
        const st = S.get();
        const label = { accepted: 'aplicada', rejected: 'mantuviste tu versión', pending: 'sin decidir' };
        const payload = {
            texto: 'Correo de ejemplo: solicitud de prórroga',
            cambios: D.corrections.map((c) => ({ tipo: c.label, antes: c.before, despues: c.after, decision: label[st.statuses[c.id]] || st.statuses[c.id] })),
            revisadas: `${Object.values(st.statuses).filter((s) => s !== 'pending').length} de ${D.corrections.length}`
        };
        openModal('Resumen de tus cambios', `
            <div class="modal-body">
                <p class="modal-text">Resumen de tus decisiones sobre el correo de ejemplo: qué sugerencias aplicaste y cuáles mantuviste.</p>
                <pre class="json-box" id="export-json">${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
                <div class="modal-actions">
                    <button class="btn btn-primary" data-action="copy-export">${I.copy(14)} Copiar resumen</button>
                    <button class="btn" data-action="modal-close">Cerrar</button>
                </div>
            </div>
        `, 'Copiar resumen de tus cambios');
    }

    function openProgress() {
        const st = S.get();
        const rows = D.corrections.map((c) => `
            <tr>
                <td><span class="type-badge ${c.kind}">${c.label}</span></td>
                <td>${c.title}</td>
                <td><span class="status-pill ${st.statuses[c.id]}">${st.statuses[c.id]}</span></td>
            </tr>`).join('');
        openModal('Progreso de verificación', `
            <div class="modal-body">
                <p class="modal-text">Cobertura actual: <b>${Math.round((Object.values(st.statuses).filter((s) => s !== 'pending').length / 4) * 100)}%</b>. Cada decisión queda registrada en la pestaña Cambios.</p>
                <div class="mini-table-wrap">
                    <table class="mini-table"><thead><tr><th>Tipo</th><th>Corrección</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table>
                </div>
                <div class="modal-note">${I.shield(14)} El progreso también alimenta la etiqueta de rigor del protocolo WoZ.</div>
                <div class="modal-actions"><button class="btn btn-primary" data-action="modal-close">Cerrar</button></div>
            </div>
        `, 'WaitGPT · cobertura');
    }

    function openProcessTools() {
        openModal('Proceso de aprendizaje', `
            <div class="modal-body">
                <p class="modal-text">Desde aquí puedes ajustar la actividad sin abrir todas las herramientas al mismo tiempo.</p>
                <div class="process-tool-list">
                    <button class="advanced-option" data-action="open-process-tab" data-tab="plan"><span><strong>Editar plan</strong><small>Ajustar los pasos de la actividad.</small></span>${I.arrowRight(14)}</button>
                    <button class="advanced-option" data-action="open-branch-overview"><span><strong>Ver versiones</strong><small>Comparar versiones sin perder tu trabajo.</small></span>${I.arrowRight(14)}</button>
                    <button class="advanced-option" data-action="open-progress"><span><strong>Ver mi progreso</strong><small>Observar lo que ya aprendiste y practicaste.</small></span>${I.arrowRight(14)}</button>
                </div>
            </div>
        `, 'Acompañamiento guiado');
    }

    function openBranchOverview() {
        const st = S.get();
        openModal('Ramas de la actividad', `
            <div class="modal-body">
                <p class="modal-text">Cada rama conserva una versión distinta del plan y de tus decisiones.</p>
                <div class="branch-overview-list">
                    ${st.branches.map((branch) => `<div class="branch-overview-item ${branch === st.branch ? 'is-active' : ''}"><span>${I.branch(14)} <strong>${branch}</strong></span>${branch === st.branch ? '<small>versión actual</small>' : '<small>versión guardada</small>'}</div>`).join('')}
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" data-action="create-branch">Crear nueva rama</button>
                    <button class="btn" data-action="modal-close">Cerrar</button>
                </div>
            </div>
        `, 'Kazemitabaar · branching');
    }

    function openSynonyms() {
        const groups = [
            { word: 'important', options: ['relevant', 'crucial', 'significant', 'demanding'] },
            { word: 'agree', options: ['accept', 'concur', 'be okay with'] },
            { word: 'help', options: ['support', 'assistance', 'guidance'] }
        ];
        openModal('Buscar sinónimos', `
            <div class="modal-body">
                <p class="modal-text">Elige una alternativa y añádela a tus criterios. La IA comprobará si encaja con el tono formal.</p>
                <div class="stack">
                    ${groups.map((g) => `
                        <div class="synonym-group">
                            <strong>${g.word}</strong>
                            <div class="chip-row">${g.options.map((o) => `<button class="chip" data-action="pick-synonym" data-word="${o}">${o}</button>`).join('')}</div>
                        </div>`).join('')}
                </div>
                <div class="modal-actions"><button class="btn" data-action="modal-close">Cerrar</button></div>
            </div>
        `, 'Gu et al. · side query de vocabulario');
    }

    function openPaperMap() {
        const rows = [
            { p: 'Yang et al. · CHI\'26', c: 'WoZ: tipos de control, riesgos, rigor y debriefing', where: 'Etiquetas “Control / Riesgo” en cada corrección, popover de sugerencias, protocolo y debriefing.' },
            { p: 'Gu et al. · CHI\'24', c: 'Verificación del proceso y de la evidencia contextual', where: 'Tarjetas de corrección, texto original, reglas y ejemplos.' },
            { p: 'Kazemitabaar et al. · UIST\'24', c: 'Supuestos editables, plan de ejecución, side queries y branching', where: 'Pestaña Criterios, consulta lateral, ramas y modal de regeneración.' },
            { p: 'LightVA', c: 'Task flow, descomposición on-demand, insights y data lens', where: 'Tarjeta de descomposición, pestaña Ruta, cobertura y lente de datos.' },
            { p: 'WaitGPT', c: 'Operation graph, table glyphs, edición granular y scrolltelling', where: 'Mapa de revisión, tarjetas de corrección, progreso, cambios y exportar.' }
        ];
        openModal('Mapa de papers en la interfaz', `
            <div class="modal-body">
                <p class="modal-text">Cada mecanismo de los papers tiene una parte visible y operable en la demo. Los detalles están en <b>reference.md</b>.</p>
                <div class="stack">
                    ${rows.map((r) => `
                        <div class="paper-map-row">
                            <span class="paper-tag strong">${r.p}</span>
                            <strong>${r.c}</strong>
                            <p>${r.where}</p>
                        </div>`).join('')}
                </div>
                <div class="modal-actions"><button class="btn btn-primary" data-action="modal-close">Cerrar</button></div>
            </div>
        `, 'Trazabilidad de la demo');
    }

    function openProtocol() {
        openModal('Protocolo del wizard (mock)', `
            <div class="modal-body">
                <p class="modal-text">Esta demo simula un agente LLM; no hay un wizard humano real. Aun así, la interfaz hace visibles las reglas del estudio.</p>
                <div class="stack">
                    ${D.wizardProtocol.map((r) => `<div class="protocol-row"><span>${r.label}</span><p>${r.text}</p></div>`).join('')}
                </div>
                <div class="detail-grid">
                    <div><span class="detail-label">Timing</span><strong>respuesta mock 850 ms</strong></div>
                    <div><span class="detail-label">Logs</span><strong>cada aceptar/rechazar</strong></div>
                    <div><span class="detail-label">Entrenamiento</span><strong>3 sesiones piloto</strong></div>
                    <div><span class="detail-label">Riesgo</span><strong>variabilidad</strong></div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" data-action="modal-close">Entendido</button>
                    <button class="btn" data-action="open-debriefing">${I.info(14)} Ir al debriefing</button>
                </div>
            </div>
        `, 'Yang et al. · CHI\'26 · WoZ');
    }

    function openDebriefing() {
        openModal('Debriefing', `
            <div class="modal-body">
                <p class="modal-text">La autonomía que ves es <b>simulada</b>. Las correcciones, la latencia y las respuestas provienen de datos mock.</p>
                <ul class="debrief-list">
                    <li>La IA no ejecuta código real ni consulta APIs.</li>
                    <li>Cada operación declara su tipo de control WoZ y su riesgo.</li>
                    <li>Puedes aceptar, rechazar, ramificar y deshacer sin perder el estado.</li>
                    <li>El objetivo es estudiar la interacción, no medir la calidad del modelo.</li>
                </ul>
                <div class="modal-note">${I.shield(14)} Si esto fuera un estudio real, aquí explicarías el engaño y pedirías consentimiento informado.</div>
                <div class="modal-actions"><button class="btn btn-primary" data-action="modal-close">Cerrar</button></div>
            </div>
        `, 'Yang et al. · ética WoZ');
    }

    function openSettings() {
        openModal('Configuración', `
            <div class="modal-body">
                <div class="settings-row"><div><strong>Reducir movimiento</strong><p class="muted-text">Desactiva las animaciones y transiciones.</p></div><button class="switch ${S.get().reduceMotion ? 'is-on' : ''}" role="switch" aria-checked="${S.get().reduceMotion}" aria-label="Reducir movimiento" data-action="toggle-setting" data-setting="reduceMotion"><span></span></button></div>
                <div class="settings-row"><div><strong>Datos guardados</strong><p class="muted-text">Tus palabras, chats y correcciones se guardan en este navegador. Puedes borrarlos cuando quieras.</p></div><button class="btn" data-action="clear-data">Borrar mis datos</button></div>
                <div class="settings-row"><div><strong>Tema</strong><p class="muted-text">Claro, con letra Figtree. Por ahora no hay modo oscuro.</p></div></div>
                <div class="modal-note">${I.info(14)} El tema es fijo en esta demo; los demás ajustes sí funcionan.</div>
                <div class="modal-actions"><button class="btn btn-primary" data-action="modal-close">Cerrar</button></div>
            </div>
        `, 'Configuración general');
    }

    function openBranchModal() {
        const st = S.get();
        const next = `rama-${st.branches.length}`;
        openModal('Crear rama', `
            <div class="modal-body">
                <p class="modal-text">Se guardará una copia del estado actual y podrás comparar cambios sin perder la versión principal.</p>
                <label class="field-label" for="branch-name">Nombre de la rama</label>
                <input class="text-input" id="branch-name" type="text" value="${next}">
                <div class="modal-note">${I.branch(14)} Kazemitabaar et al. · branching con supuestos editables.</div>
                <div class="modal-actions">
                    <button class="btn btn-primary" data-action="confirm-branch">Crear rama</button>
                    <button class="btn" data-action="modal-close">Cancelar</button>
                </div>
            </div>
        `, 'Kazemitabaar · UIST\'24');
    }

    function playAnalysis() {
        const nodes = $$('.graph-node');
        if (!nodes.length) { toast('El mapa de revisión no está visible en este modo.'); return; }
        const scroll = $('#chat-scroll');
        if (scroll) scroll.scrollTo({ top: 0, behavior: 'smooth' });
        nodes.forEach((node, i) => {
            window.setTimeout(() => {
                nodes.forEach((n) => n.classList.remove('is-playing'));
                node.classList.add('is-playing');
                if (i === nodes.length - 1) {
                    window.setTimeout(() => node.classList.remove('is-playing'), 900);
                }
            }, i * 420);
        });
        toast('Reproduciendo el análisis paso a paso (scrolltelling).');
    }

    function saveCriteria() {
        const st = S.get();
        const inputs = $$('[data-criterion]');
        const updated = st.criteria.map((c) => {
            const input = inputs.find((i) => i.dataset.criterion === c.id);
            return Object.assign({}, c, { value: input ? input.value : c.value });
        });
        const changed = updated.some((c, i) => c.value !== st.criteria[i].value);
        if (!changed) { toast('No hay cambios en los criterios.'); return; }
        pendingCriteria = updated;
        openModal('Regenerar desde criterios', `
            <div class="modal-body">
                <p class="modal-text">Se regenerará la revisión y se creará una rama para conservar la versión actual. ¿Continuar?</p>
                <div class="modal-note">${I.branch(14)} Cambio de supuesto detectado · Kazemitabaar et al.</div>
                <div class="modal-actions">
                    <button class="btn btn-primary" data-action="confirm-criteria-branch">Crear rama y regenerar</button>
                    <button class="btn" data-action="modal-close">Cancelar</button>
                </div>
            </div>
        `, 'Kazemitabaar · UIST\'24');
    }

    function confirmCriteriaBranch() {
        const st = S.get();
        if (!pendingCriteria) return;
        const branch = `rama-${st.branches.length}`;
        S.set({
            criteria: pendingCriteria,
            branches: st.branches.concat(branch),
            branch,
            sideOpen: false
        });
        pendingCriteria = null;
        closeModal();
        toast(`Criterios guardados · rama “${branch}” creada.`);
    }

    function confirmBranch() {
        const st = S.get();
        const input = $('#branch-name');
        const name = input && input.value.trim() ? input.value.trim() : `rama-${st.branches.length}`;
        const branches = st.branches.includes(name) ? st.branches : st.branches.concat(name);
        S.set({ branches, branch: name });
        closeModal();
        toast(`Rama “${name}” creada.`);
    }

    function copyExport() {
        const pre = $('#export-json');
        if (!pre) return;
        const text = pre.textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => toast('JSON copiado al portapapeles.')).catch(() => toast('No se pudo copiar; selecciona el texto.'));
        } else {
            toast('Selecciona el JSON y copia manualmente.');
        }
    }

    /* Chat nuevo en la actividad actual: se crea la sesión y se parte desde cero */
    const NEW_CHAT_TITLES = {
        writing: 'Texto nuevo',
        errors: 'Revisión nueva',
        lessons: 'Lectura nueva'
    };

    function newChat(opts) {
        const st = S.get();
        const mode = st.mode;
        const clone = (v) => JSON.parse(JSON.stringify(v));
        const sessions = st.sessions.map((s) => Object.assign({}, s, { active: false }));
        sessions.unshift({ id: `s${Date.now()}`, title: NEW_CHAT_TITLES[mode], device: 'monitor', meta: 'Ahora', mode, active: true });
        const patch = {
            sessions,
            view: 'work',
            historyMode: mode,
            historyOpen: false,
            messages: Object.assign({}, st.messages, { [mode]: clone(D.initialMessages[mode]) }),
            activeStage: D.modes[mode].activeStage,
            tab: D.modes[mode].tabs[0].id,
            help: 'pista',
            detailsLevel: 0,
            sideOpen: false,
            sideAnswer: null,
            suggestionsOpen: false,
            typing: false
        };
        if (mode === 'writing') {
            Object.assign(patch, {
                statuses: { c1: 'pending', c2: 'pending', c3: 'pending', c4: 'pending' },
                inspected: ['c1', 'c2'],
                version: 'draft',
                dataLens: false,
                showDecomp: false,
                decompAccepted: false,
                decompIgnored: false
            });
        }
        if (mode === 'writing') Object.assign(patch, { wr: null, wp: null, wDemoAt: -1, wrDraft: '' });
        if (mode === 'errors') Object.assign(patch, { errPractice: null, errRule: '', rv: null });
        if (mode === 'lessons') Object.assign(patch, { vocab: null });
        S.set(patch);
        const input = $('#chat-input');
        if (input) { input.value = ''; input.focus(); }
        if (opts && opts.quiet) return;
        Chat.scrollToTop();
        say(`${NEW_CHAT_TITLES[mode]} creado.`);
    }

    function switchMode(mode) {
        if (!D.modes[mode]) return;
        const m = D.modes[mode];
        S.set({
            mode,
            activeStage: m.activeStage,
            tab: m.tabs[0].id,
            suggestionsOpen: false,
            detailsLevel: 0,
            sideOpen: false,
            sideAnswer: null,
            typing: false
        });
        const input = $('#chat-input');
        if (input) input.value = '';
        Chat.scrollToTop();
    }

    /* ---------------- Delegación de eventos ---------------- */
    function handleAction(action, el) {
        const st = S.get();

        switch (action) {
            case 'toggle-history': S.set({ historyOpen: !st.historyOpen }); break;
            case 'close-history': S.set({ historyOpen: false }); break;
            case 'open-settings': openSettings(); break;
            case 'toggle-suggestions': S.set({ suggestionsOpen: !st.suggestionsOpen }); break;
            case 'advance-details': {
                const next = st.detailsLevel === 0 ? 1 : st.detailsLevel === 1 ? 2 : st.detailsLevel === 2 ? 0 : 2;
                S.set({ detailsLevel: next, tab: next === 0 ? D.modes[st.mode].tabs[0].id : st.tab });
                break;
            }
            case 'open-process-tools': openProcessTools(); break;
            case 'open-process-tab': {
                closeModal();
                S.set({ detailsLevel: 3, tab: el.dataset.tab });
                break;
            }
            case 'open-branch-overview': openBranchOverview(); break;
            case 'open-aside-tools': S.set({ detailsLevel: 2 }); break;
            case 'open-detail-tab': {
                S.set({ detailsLevel: 3, tab: el.dataset.tab });
                break;
            }
            case 'set-mode': {
                switchMode(el.dataset.mode);
                S.set({ historyMode: el.dataset.mode });
                break;
            }
            case 'set-tab': S.set({ tab: el.dataset.tab }); break;
            case 'open-tab': S.set({ tab: el.dataset.tab }); break;
            case 'set-version': S.set({ version: el.dataset.version }); break;
            case 'set-workflow': S.set({ workflow: el.dataset.workflow }); break;
            case 'toggle-lens': S.set({ dataLens: !st.dataLens }); break;
            case 'set-help': S.set({ help: el.dataset.help }); break;
            case 'set-stage': {
                const index = Number(el.dataset.stage);
                S.set({ activeStage: index });
                say(`Etapa: ${D.modes[st.mode].stages[index]}.`);
                break;
            }
            case 'scroll-sessions': {
                const track = $('#session-track');
                if (track) track.scrollBy({ left: Number(el.dataset.dir) * 260, behavior: 'smooth' });
                break;
            }
            case 'select-session': {
                const sessions = st.sessions.map((s) => Object.assign({}, s, { active: s.id === el.dataset.session }));
                const selected = st.sessions.find((s) => s.id === el.dataset.session);
                S.set({ sessions, historyOpen: false, historyMode: selected ? selected.mode : st.historyMode });
                if (selected && selected.mode) switchMode(selected.mode);
                say(`Chat cargado: ${selected ? selected.title : ''}.`);
                break;
            }
            case 'vocab-mark': {
                // marcar una palabra del texto: no baja el chat y el foco se queda en la palabra
                const scroll = $('#chat-scroll');
                const top = scroll ? scroll.scrollTop : 0;
                window.Vocab.action('vocab-mark', el.dataset.id, el);
                if (scroll) scroll.scrollTop = top;
                const again = document.getElementById(`vt-${el.dataset.id}`);
                if (again) { again.focus(); say(`${again.textContent} ${again.getAttribute('aria-pressed') === 'true' ? 'marcada' : 'desmarcada'}`); }
                break;
            }
            case 'new-chat': newChat(); break;
            case 'fill-input': S.set({ suggestionsOpen: false }); Chat.fill(el.dataset.text || el.dataset.id || ''); break;
            case 'route-go': adaptTo(el.dataset.id); break;
            case 'clear-data': {
                S.clearSaved();
                closeModal();
                toast('Datos borrados. Empiezas desde cero.');
                break;
            }
            case 'go-home': S.set({ view: 'home', homeMsgs: [], homeTyping: false, routeSeed: '', historyOpen: false, sheetOpen: false, suggestionsOpen: false }); { const i = $('#chat-input'); if (i) { i.value = ''; i.focus(); } } break;
            case 'continue-session': {
                // "Continuar" abre exactamente el chat que muestra la tarjeta
                const active = st.sessions.find((x) => x.active) || st.sessions[0];
                if (active.mode !== st.mode) switchMode(active.mode);
                S.set({ view: 'work', historyMode: active.mode });
                break;
            }
            case 'start-mode': {
                // el chat más reciente de esa actividad pasa a ser el actual
                const mode = el.dataset.mode;
                const recent = st.sessions.find((x) => x.mode === mode);
                const sessions = recent ? st.sessions.map((x) => Object.assign({}, x, { active: x === recent })) : st.sessions;
                switchMode(mode);
                S.set({ view: 'work', historyMode: mode, sessions });
                break;
            }
            case 'toggle-sheet': S.set({ sheetOpen: !st.sheetOpen }); break;
            case 'close-sheet': S.set({ sheetOpen: false }); break;
            case 'toggle-setting': {
                const key = el.dataset.setting;
                const next = !st[key];
                S.set({ [key]: next });
                el.classList.toggle('is-on', next);
                el.setAttribute('aria-checked', String(next));
                break;
            }
            case 'retry-last': Chat.retry(); break;
            case 'copy-final': {
                const text = Panels.finalPlainText();
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(() => toast('Correo final copiado.')).catch(() => toast('No se pudo copiar; ve a “Versión final” y copia el texto.'));
                } else {
                    toast('Ve a “Versión final” y copia el texto.');
                }
                break;
            }
            case 'msg-regen': Chat.regenerate(Number(el.dataset.idx)); break;
            case 'msg-rate': Chat.rate(Number(el.dataset.idx), el.dataset.rate); say('Valoración guardada.'); break;
            case 'msg-copy': Chat.copy(Number(el.dataset.idx)).then((ok) => toast(ok ? 'Respuesta copiada.' : 'No se pudo copiar; selecciona el texto.')); break;
            case 'focus-composer': {
                const input = $('#chat-input');
                if (input) input.focus();
                break;
            }
            /* Correcciones */
            case 'correction-accept': setCorrection(el.dataset.id, 'accepted'); break;
            case 'correction-reject': setCorrection(el.dataset.id, 'rejected'); break;
            case 'correction-undo': setCorrection(el.dataset.id, 'pending'); break;
            case 'correction-explain': S.set({ help: 'explicacion' }); break;
            case 'correction-rule': {
                const c = D.corrections.find((x) => x.id === el.dataset.id);
                if (c) openRule(c.ruleId);
                break;
            }
            case 'correction-confused': {
                const c = D.corrections.find((x) => x.id === el.dataset.id);
                S.set({ help: 'explicacion' });
                toast('Te muestro la explicación paso a paso.');
                const card = document.querySelector(`[data-card="${c ? c.id : ''}"]`);
                if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                break;
            }
            case 'correction-ask': {
                const c = D.corrections.find((x) => x.id === el.dataset.id);
                S.set({ sideOpen: true, sidePrefill: c ? `¿Por qué “${c.before}” → “${c.after}”?` : '' });
                break;
            }
            case 'correction-inspect': {
                const inspected = st.inspected.includes(el.dataset.id) ? st.inspected : st.inspected.concat(el.dataset.id);
                S.set({ tab: 'text', version: 'draft', inspected, dataLens: true });
                toast('Zona resaltada en Tu texto · data lens activo.');
                break;
            }

            /* Descomposición / ramas */
            case 'decomp-accept': {
                const tasks = st.tasks.map((t, i) => i < 3 ? Object.assign({}, t, { progress: 100, status: 'ok' }) : t);
                S.set({ decompAccepted: true, decompIgnored: false, tasks });
                toast('Plan descompuesto · la ruta se actualizó.');
                break;
            }
            case 'decomp-ignore': S.set({ decompIgnored: true }); break;
            case 'reset-decomp': S.set({ decompAccepted: false, decompIgnored: true }); break;
            case 'decompose-task': {
                const tasks = st.tasks.map((t) => t.id === el.dataset.task ? Object.assign({}, t, { progress: 100, status: 'ok' }) : t);
                S.set({ tasks });
                toast('Subtarea descompuesta y completada (mock).');
                break;
            }
            case 'create-branch': openBranchModal(); break;
            case 'confirm-branch': confirmBranch(); break;
            case 'select-branch': S.set({ branch: el.dataset.branch }); toast(`Viendo ${el.dataset.branch}.`); break;

            /* Plan / criterios */
            case 'edit-plan': S.set({ tab: 'plan' }); break;
            case 'open-criteria': S.set({ tab: 'criteria' }); break;
            case 'save-criteria': saveCriteria(); break;
            case 'discard-criteria': renderAside(); toast('Cambios descartados.'); break;
            case 'confirm-criteria-branch': confirmCriteriaBranch(); break;
            case 'add-criterion': {
                const criteria = st.criteria.concat({ id: `custom-${st.criteria.length}`, icon: 'tag', label: 'Supuesto nuevo', value: 'Escribe un criterio' });
                S.set({ criteria });
                break;
            }
            case 'regenerate-plan': toast('Plan regenerado · revisa los pasos actualizados (mock).'); break;
            case 'open-vocabulary': S.set({ tab: 'vocabulary' }); break;

            /* Graph */
            case 'graph-node': {
                const node = D.graphNodes.find((n) => n.id === el.dataset.node);
                if (node) openModal(node.title, Graph.detail(node.id), 'WaitGPT · operation graph');
                break;
            }
            case 'node-ask': {
                const node = D.graphNodes.find((n) => n.id === el.dataset.node);
                closeModal();
                S.set({ sideOpen: true, sidePrefill: node ? `¿Qué hizo el paso “${node.title}”?` : '' });
                break;
            }
            case 'node-rerun': {
                const node = D.graphNodes.find((n) => n.id === el.dataset.node);
                closeModal();
                toast(`Re-ejecutando desde “${node ? node.title : 'nodo'}” (mock)…`);
                break;
            }
            case 'play-analysis': playAnalysis(); break;

            /* Paneles / modales */
            case 'open-export': openExport(); break;
            case 'copy-export': copyExport(); break;
            case 'open-progress': openProgress(); break;
            case 'open-synonyms': openSynonyms(); break;
            case 'open-rule': openRule(el.dataset.id); break;
            case 'open-protocol': openProtocol(); break;
            case 'open-paper-map': openPaperMap(); break;
            case 'open-debriefing': openDebriefing(); break;
            case 'modal-close': closeModal(); break;
            case 'pick-synonym': closeModal(); toast(`“${el.dataset.word}” añadido a criterios (mock).`); break;

            /* Side query */
            case 'close-side-query': S.set({ sideOpen: false, sideAnswer: null }); break;
            case 'side-example': S.set({ sidePrefill: el.dataset.text }); {
                const input = $('#side-input');
                if (input) { input.value = el.dataset.text; input.focus(); }
                break;
            }
            case 'side-add-criterion': {
                const criteria = st.criteria.concat({ id: `side-${st.criteria.length}`, icon: 'message', label: 'Desde consulta lateral', value: st.sidePrefill || 'Supuesto añadido' });
                S.set({ criteria });
                toast('Añadido a criterios · consulta lateral.');
                break;
            }
            case 'side-insert': toast('Fragmento insertado en el borrador (mock).'); break;

            default: {
                if (action.indexOf('open-rule-') === 0) openRule(action.replace('open-rule-', ''));
                else if (action.indexOf('errors-') === 0) window.Errors.action(action, el.dataset.id, el);
                else if (action.indexOf('vocab-') === 0) { window.Vocab.action(action, el.dataset.id, el); Chat.scrollToBottom(); }
                else if (action.indexOf('writing-') === 0 || action.indexOf('review-') === 0) {
                    const keep = /^(writing|review)-(accept|keep|undo)$/.test(action);
                    const scroll = $('#chat-scroll'); const top = scroll ? scroll.scrollTop : 0;
                    (action.indexOf('review-') === 0 ? window.Errors : window.Writing).action(action, el.dataset.id, el);
                    if (keep && scroll) { scroll.scrollTop = top; say(/-accept$/.test(action) ? 'Sugerencia aplicada.' : /-keep$/.test(action) ? 'Mantienes tu versión.' : 'Sugerencia pendiente otra vez.'); } else Chat.scrollToBottom();
                }
                else if (action === 'set-mode-writing') { switchMode('writing'); S.set({ historyMode: 'writing' }); }
                break;
            }
        }
    }

    /* ---------------- Eventos ---------------- */
    function bindEvents() {
        document.addEventListener('click', (e) => {
            const el = e.target.closest('[data-action]');
            if (el) {
                e.preventDefault();
                handleAction(el.dataset.action, el);
                return;
            }
            if (modalOpen && !e.target.closest('.modal')) closeModal();
        });

        document.addEventListener('change', (e) => {
            const planCheck = e.target.closest('[data-plan-check]');
            if (planCheck) {
                const st = S.get();
                const plan = st.plan.map((p) => p.id === planCheck.dataset.planCheck ? Object.assign({}, p, { done: planCheck.checked }) : p);
                S.set({ plan });
                return;
            }
            const planText = e.target.closest('[data-plan]');
            if (planText) {
                const st = S.get();
                const plan = st.plan.map((p) => p.id === planText.dataset.plan ? Object.assign({}, p, { text: planText.value }) : p);
                S.set({ plan });
            }
        });

        const form = $('#chat-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (S.get().typing) {
                    if (e.submitter && e.submitter.id === 'send-btn') Chat.stop();
                    return;
                }
                const input = $('#chat-input');
                if (!input) return;
                const text = input.value;
                if (!text.trim()) return;
                input.value = '';
                input.style.height = '44px';
                Chat.send(text);
            });
        }

        const input = $('#chat-input');
        if (input) {
            input.addEventListener('input', () => {
                input.style.height = 'auto';
                input.style.height = Math.min(input.scrollHeight, 96) + 'px';
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const formEl = $('#chat-form');
                    if (formEl) formEl.dispatchEvent(new Event('submit', { cancelable: true }));
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            /* Texto de vocabulario: flechas, Inicio y Fin para moverse entre palabras; Enter marca */
            const tok = e.target.closest && e.target.closest('.voc-tok');
            if (tok && /^Arrow(Left|Right|Up|Down)$|^Home$|^End$/.test(e.key)) {
                const all = [...tok.closest('[data-roving]').querySelectorAll('.voc-tok')];
                let i = all.indexOf(tok);
                i = e.key === 'Home' ? 0 : e.key === 'End' ? all.length - 1 : i + (/Left|Up/.test(e.key) ? -1 : 1);
                const n = all[Math.max(0, Math.min(all.length - 1, i))];
                tok.tabIndex = -1; n.tabIndex = 0; n.focus(); e.preventDefault();
                return;
            }
            /* Tab no sale de la ventana abierta */
            if (e.key === 'Tab' && modalOpen) {
                const f = $$('#modal button, #modal [href], #modal input, #modal textarea, #modal select').filter((x) => !x.disabled && x.offsetParent !== null);
                if (f.length) {
                    const i = f.indexOf(document.activeElement);
                    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
                    else if (!e.shiftKey && (i === f.length - 1 || i < 0)) { e.preventDefault(); f[0].focus(); }
                }
            }
            if (e.key === 'Escape') {
                if (modalOpen) closeModal();
                else if (S.get().historyOpen) S.set({ historyOpen: false });
                else if (S.get().sheetOpen) S.set({ sheetOpen: false });
                else if (S.get().suggestionsOpen) S.set({ suggestionsOpen: false });
            }
        });

        document.addEventListener('mouseover', (e) => {
            const node = e.target.closest('.graph-node[data-corr]');
            $$('.correction-card').forEach((card) => card.classList.remove('is-highlighted'));
            if (node) {
                const card = document.querySelector(`[data-card="${node.dataset.corr}"]`);
                if (card) card.classList.add('is-highlighted');
            }
        });
    }

    /* ---------------- Init ---------------- */
    document.addEventListener('DOMContentLoaded', () => {
        S.subscribe(renderAll);
        bindEvents();
        renderAll();
        if (S.get().view === 'home') { const i = $('#chat-input'); if (i) i.focus(); }
        window.addEventListener('resize', renderHeader);
    });
})();
