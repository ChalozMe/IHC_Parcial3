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
        if (input) input.placeholder = D.modes[st.mode].placeholder;
    }

    function renderStagebar() {
        const st = S.get();
        const mode = D.modes[st.mode];
        // El control superior siempre abre el proceso; el botón del aside controla sus vistas.
        const detailAction = 'open-process-tools';
        const detailLabel = 'Ver proceso';
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
            <div class="stages" role="list" aria-label="Etapas de la tarea">${stages}</div>
            <div class="stage-actions">
                <button class="stage-link" data-action="edit-plan">Editar plan</button>
                <button class="stage-btn" data-action="create-branch">${I.branch(14)} Probar otra versión</button>
                <button class="stage-icon" data-action="play-analysis">${I.play(14)} Reproducir</button>
                <button class="details-toggle" data-action="${detailAction}">${detailLabel}</button>
                <button class="sheet-toggle" data-action="toggle-sheet" aria-controls="side-panel" aria-expanded="${st.sheetOpen}">${I.layers(14)} Apoyo</button>
            </div>
        `;
    }

    /* Las 5 tareas del proyecto, con el nombre y el objetivo que la interfaz sí cumple */
    const GOALS = {
        writing: 'Dejar tu correo claro, cortés y listo para enviar',
        conversation: 'Practicar tus respuestas en un escenario',
        lessons: 'Aprender las palabras del artículo en contexto',
        questions: 'Resolver tu duda y volver a tu práctica'
    };

    function goalFor(st) {
        if (st.mode === 'conversation' && st.scenario === 'presentation') return 'Ensayar tu presentación formal de 3 minutos';
        return GOALS[st.mode];
    }

    function renderGoalStrip() {
        const el = $('#goal-strip');
        if (!el) return;
        const st = S.get();
        let progress;
        let next;
        if (st.mode === 'writing') {
            const pending = D.corrections.filter((c) => (st.statuses[c.id] || 'pending') === 'pending');
            const done = D.corrections.length - pending.length;
            progress = `${done} de ${D.corrections.length} correcciones revisadas`;
            next = pending.length ? `Siguiente: ${pending[0].title}` : 'Todo revisado: copia tu correo o pasa a Cerrar';
        } else if (st.mode === 'conversation') {
            const scenario = D.scenarios.find((s) => s.id === st.scenario) || D.scenarios[0];
            const n = (st.promptIndex || 0) + 1;
            progress = `Pregunta ${n} de ${scenario.prompts.length} · ${scenario.name}`;
            next = n < scenario.prompts.length ? 'Responde y pulsa “Siguiente pregunta”' : 'Última pregunta: responde y elige otro escenario';
        } else if (st.mode === 'lessons') {
            const saved = D.article.words.filter((w) => st.savedWords.includes(w.word)).length;
            progress = `${saved} de ${D.article.words.length} palabras guardadas`;
            next = saved < D.article.words.length ? 'Elige una palabra de la lectura' : 'Lectura completa: repasa tus palabras';
        } else {
            const msgs = st.messages.questions;
            const solved = msgs.filter((m, i) => m.role === 'user' && msgs[i + 1] && msgs[i + 1].role === 'ai').length;
            progress = `${solved} ${solved === 1 ? 'duda resuelta' : 'dudas resueltas'}`;
            next = solved ? 'Vuelve a tu práctica cuando quieras' : 'Escribe tu duda o usa una pregunta rápida';
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
        { mode: 'writing', icon: 'doc', name: 'Revisión de un correo formal', goal: 'Revisa un correo de solicitud para que sea claro y cortés, y cópialo listo para enviar.', time: '10–15 min' },
        { mode: 'conversation', icon: 'message', name: 'Práctica de conversación escrita', goal: 'Responde por escrito las preguntas de un escenario (entrevista, café) con pistas y palabras clave.', time: '5–10 min' },
        { mode: 'lessons', icon: 'book', name: 'Vocabulario en contexto', goal: 'Lee un artículo, mira el significado de las palabras en su contexto y guárdalas para repasar.', time: '5–10 min' },
        { mode: 'questions', icon: 'search', name: 'Dudas rápidas', goal: 'Resuelve una duda de gramática o vocabulario con una explicación corta y un ejemplo.', time: '2–5 min' },
        { mode: 'conversation', scenario: 'presentation', icon: 'layers', name: 'Ensayo de una presentación formal', goal: 'Practica las preguntas de una presentación de 3 minutos con sus palabras clave.', time: '5–10 min' }
    ];

    function renderHome() {
        const el = $('#home');
        if (!el) return;
        const st = S.get();
        el.hidden = st.view !== 'home';
        if (st.view !== 'home') return;
        const active = st.sessions.find((s) => s.active) || st.sessions[0];
        const done = Object.values(st.statuses).filter((s) => s !== 'pending').length;
        const resume = active.mode === 'writing' ? `${done} de 4 correcciones revisadas` : D.modes[active.mode].title;
        el.innerHTML = `
            <div class="home-inner">
                <h1 id="home-title">¿Qué quieres practicar hoy?</h1>
                <p class="home-lead">Sesiones cortas de 5 a 15 minutos. El tutor te da pistas y te explica por qué; tú decides qué cambiar.</p>

                <section class="home-continue" aria-labelledby="continue-title">
                    <div>
                        <h2 id="continue-title" class="home-eyebrow">Continuar donde lo dejaste</h2>
                        <strong>${active.title}</strong>
                        <span>${resume} · ${active.meta}</span>
                    </div>
                    <button class="btn btn-primary btn-lg" data-action="continue-session">Continuar ${I.arrowRight(16)}</button>
                </section>

                <section aria-labelledby="modes-title">
                    <h2 id="modes-title" class="home-section-title">O empieza otra actividad</h2>
                    <div class="home-modes">
                        ${TASKS.map((t) => `
                            <button class="home-mode" data-action="start-mode" data-mode="${t.mode}" ${t.scenario ? `data-scenario="${t.scenario}"` : ''}>
                                <span class="home-mode-icon">${(I[t.icon] || I.doc)(20)}</span>
                                <span class="home-mode-body">
                                    <strong>${t.name}</strong>
                                    <span>${t.goal}</span>
                                    <small>${t.time}</small>
                                </span>
                            </button>`).join('')}
                    </div>
                </section>

                <section class="home-about" aria-labelledby="about-title">
                    <h2 id="about-title" class="home-section-title">Cómo te ayuda el tutor</h2>
                    <ul>
                        <li><strong>Primero pistas.</strong> Te da una pista antes que la respuesta, y tú eliges cuánta ayuda quieres.</li>
                        <li><strong>Explica cada cambio.</strong> Cada corrección trae su regla y un ejemplo.</li>
                        <li><strong>Puede equivocarse.</strong> Tú decides qué aceptar; siempre puedes deshacer.</li>
                    </ul>
                </section>
            </div>
        `;
    }

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
        renderHome();
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
        modalOpen = true;
        const closeBtn = $('[data-action="modal-close"]', modal);
        if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
        const overlay = $('#modal-overlay');
        if (overlay) overlay.hidden = true;
        modalOpen = false;
    }

    /* ---------------- Acciones ---------------- */
    function setCorrection(id, status) {
        const st = S.get();
        const statuses = Object.assign({}, st.statuses, { [id]: status });
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
        const payload = {
            sesion: D.modes[st.mode].label,
            consulta: 'Revisa mi correo para pedir una prórroga. Por ahora solo dame pistas.',
            workflow: st.workflow,
            rama: st.branch,
            ramas: st.branches,
            supuestos: st.criteria,
            operaciones: D.corrections.map((c) => ({
                tipo: c.kind,
                antes: c.before,
                despues: c.after,
                estado: st.statuses[c.id],
                controlWoZ: c.control,
                riesgoWoZ: c.risk
            })),
            cobertura: `${Math.round((Object.values(st.statuses).filter((s) => s !== 'pending').length / 4) * 100)}%`,
            insights: ['4 puntos detectados', '1 gramatical · 1 vocabulario · 1 tono · 1 claridad'],
            log: ['cargar texto', 'detectar', 'clasificar', 'explicar', 'esperar decisión'],
            riesgosWoZ: ['variabilidad del agente', 'validez ecológica', 'decepción']
        };
        openModal('Exportar resumen', `
            <div class="modal-body">
                <p class="modal-text">Resumen mock listo para entregar a la profesora. Incluye decisiones, supuestos, ramas y riesgos WoZ.</p>
                <pre class="json-box" id="export-json">${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
                <div class="modal-actions">
                    <button class="btn btn-primary" data-action="copy-export">${I.copy(14)} Copiar JSON</button>
                    <button class="btn" data-action="modal-close">Cerrar</button>
                </div>
            </div>
        `, 'WaitGPT · exportar resumen');
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
                <div class="settings-row"><div><strong>Modo evaluación</strong><p class="muted-text">Muestra las etiquetas de los papers en cada elemento.</p></div><button class="switch ${S.get().showTags ? 'is-on' : ''}" role="switch" aria-checked="${S.get().showTags}" aria-label="Modo evaluación: mostrar etiquetas de papers" data-action="toggle-setting" data-setting="showTags"><span></span></button></div>
                <div class="settings-row"><div><strong>Datos guardados</strong><p class="muted-text">Tus palabras, chats y correcciones se guardan en este navegador. Puedes borrarlos cuando quieras.</p></div><button class="btn" data-action="clear-data">Borrar mis datos</button></div>
                <div class="settings-row"><div><strong>Tema</strong><p class="muted-text">Claro · Figtree · paleta teal.</p></div><span class="paper-tag">Main.dc.html</span></div>
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

    function openLessonHint(word) {
        const w = D.article.words.find((x) => x.word === word);
        if (!w) return;
        openModal(w.word, `
            <div class="modal-body">
                <p class="modal-text"><b>Significado en el artículo:</b> ${w.meaning}</p>
                <div class="rule-example good"><span>En contexto</span>${w.example}</div>
                <p class="modal-text"><b>Cómo se usa:</b> ${w.use}</p>
                <div class="word-examples-modal">
                    <strong>Otros ejemplos para comparar</strong>
                    ${(w.examples || []).map((example) => `<div class="word-example-line">“${example}”</div>`).join('')}
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" data-action="save-word" data-word="${w.word}">${I.plus(14)} Guardar palabra</button>
                    <button class="btn" data-action="modal-close">Cerrar</button>
                </div>
            </div>
        `, 'Kazemitabaar · side query');
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

    function applyScenario(id) {
        const st = S.get();
        const scenario = D.scenarios.find((s) => s.id === id);
        if (!scenario) return;
        const messages = st.messages.conversation.slice(0, 1).map((m) => Object.assign({}, m, { text: scenario.prompts[0] }));
        S.set({ scenario: id, messages: Object.assign({}, st.messages, { conversation: messages }), promptIndex: 0 });
        say(`Escenario: ${scenario.name}.`);
    }

    function nextPrompt() {
        const st = S.get();
        const scenario = D.scenarios.find((s) => s.id === st.scenario);
        const last = scenario.prompts.length - 1;
        if ((st.promptIndex || 0) >= last) { toast('Esa era la última pregunta. Puedes elegir otro escenario.'); return; }
        const idx = (st.promptIndex || 0) + 1;
        st.promptIndex = idx;
        st.messages.conversation.push({
            role: 'ai',
            label: 'ENTREVISTADORA IA · CONVERSACIÓN',
            text: scenario.prompts[idx],
            chips: [{ icon: 'lightbulb', text: 'Pista: responde con una razón', kind: 'info' }]
        });
        S.set({});
        Chat.scrollToBottom();
    }

    function saveWord(word) {
        const st = S.get();
        if (!st.savedWords.includes(word)) {
            S.set({ savedWords: st.savedWords.concat(word) });
            toast(`“${word}” guardada para repaso.`);
        } else {
            toast(`“${word}” ya estaba guardada.`);
        }
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
        writing: 'Correo nuevo',
        conversation: 'Práctica nueva',
        lessons: 'Vocabulario nuevo',
        questions: 'Duda nueva'
    };

    function newChat() {
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
        if (mode === 'conversation') Object.assign(patch, { scenario: 'interview', promptIndex: 0 });
        if (mode === 'lessons') Object.assign(patch, { selectedWord: null });
        S.set(patch);
        const input = $('#chat-input');
        if (input) { input.value = ''; input.focus(); }
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
                if (selected && selected.scenario) applyScenario(selected.scenario);
                say(`Chat cargado: ${selected ? selected.title : ''}.`);
                break;
            }
            case 'select-scenario': applyScenario(el.dataset.scenario); break;
            case 'next-prompt': nextPrompt(); break;
            case 'select-word': S.set({ selectedWord: el.dataset.word }); break;
            case 'save-word': saveWord(el.dataset.word); break;
            case 'hint-word': openLessonHint(st.selectedWord || 'productive'); break;
            case 'open-word-examples': openLessonHint(el.dataset.word || st.selectedWord || 'productive'); break;
            case 'use-reading-prompt': {
                const input = $('#chat-input');
                if (input) {
                    input.value = 'Te paso esta lectura. ¿Qué significa "dedicated" aquí? Dame dos ejemplos en inglés y dime cuándo se usa.';
                    input.focus();
                }
                break;
            }
            case 'new-chat': newChat(); break;
            case 'clear-data': {
                S.clearSaved();
                closeModal();
                toast('Datos borrados. Empiezas desde cero.');
                break;
            }
            case 'go-home': S.set({ view: 'home', historyOpen: false, sheetOpen: false, suggestionsOpen: false }); window.scrollTo(0, 0); break;
            case 'continue-session': {
                // "Continuar" abre exactamente el chat que muestra la tarjeta
                const active = st.sessions.find((x) => x.active) || st.sessions[0];
                if (active.mode !== st.mode) switchMode(active.mode);
                if (active.scenario && active.scenario !== st.scenario) applyScenario(active.scenario);
                S.set({ view: 'work', historyMode: active.mode });
                break;
            }
            case 'start-mode': {
                // el chat más reciente de esa actividad pasa a ser el actual
                const mode = el.dataset.mode;
                const scenarioId = el.dataset.scenario;
                const recent = st.sessions.find((x) => x.mode === mode && (!scenarioId || x.scenario === scenarioId)) || st.sessions.find((x) => x.mode === mode);
                const sessions = recent ? st.sessions.map((x) => Object.assign({}, x, { active: x === recent })) : st.sessions;
                switchMode(mode);
                S.set({ view: 'work', historyMode: mode, sessions });
                if (scenarioId) applyScenario(scenarioId);
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
            case 'quick-question': {
                if (st.mode !== 'questions') {
                    switchMode('questions');
                    window.setTimeout(() => Chat.send(el.dataset.text), 60);
                } else {
                    Chat.send(el.dataset.text);
                }
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
                else if (action.indexOf('save-word-') === 0) saveWord(action.replace('save-word-', ''));
                else if (action === 'create-exercise') {
                    st.messages[st.mode].push({ role: 'ai', label: 'TUTOR IA · EJERCICIO', text: 'Completa: “I ______ (agree) with the deadline.” Escribe tu respuesta y te doy feedback.', chips: [] });
                    S.set({});
                }
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
        window.addEventListener('resize', renderHeader);
    });
})();
