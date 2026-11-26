/* ============================================================
   Panels · tabs del aside, chats recientes, sugerencias e historial
   Papers: Gu (workflows), Kazemitabaar (supuestos), LightVA (task flow)
   ============================================================ */
(function () {
    'use strict';

    const D = window.DemoData;
    const S = window.DemoState;
    const I = window.Icons;

    const escapeHtml = (str) => String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const hlClass = { grammar: 'hl-grammar', vocab: 'hl-vocab', tone: 'hl-tone', clarity: 'hl-clarity' };

    /* ---------------- Texto de la sesión ---------------- */
    function textWithHighlights(version) {
        const st = S.get();
        let text = D.writingText;

        if (version === 'original') {
            return text.split('\n\n').map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
        }

        const ordered = D.corrections.slice().sort((a, b) => b.before.length - a.before.length);

        if (version === 'final') {
            ordered.forEach((c) => {
                if (st.statuses[c.id] === 'accepted') {
                    text = text.split(c.before).join(c.after);
                }
            });
        }

        ordered.forEach((c) => {
            if (version === 'final' && st.statuses[c.id] === 'accepted') return;
            const cls = hlClass[c.kind];
            const status = st.statuses[c.id];
            text = text.split(c.before).join(
                `<span class="hl ${cls} status-${status}" data-corr="${c.id}" title="${escapeHtml(c.label)}: ${escapeHtml(c.title)}">${escapeHtml(c.before)}</span>`
            );
        });

        return text.split('\n\n').map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    }

    function finalPlainText() {
        const st = S.get();
        let text = D.writingText;
        D.corrections.slice().sort((a, b) => b.before.length - a.before.length).forEach((c) => {
            if (st.statuses[c.id] === 'accepted') text = text.split(c.before).join(c.after);
        });
        return text;
    }

    function legend() {
        /* cada categoría usa la misma marca que aparece en el texto (forma + color) */
        return `
            <div class="legend" aria-label="Leyenda de marcas en el texto">
                <span><b class="legend-sample hl-grammar">ab</b>Gramática</span>
                <span><b class="legend-sample hl-vocab">ab</b>Vocabulario</span>
                <span><b class="legend-sample hl-tone">ab</b>Tono</span>
                <span><b class="legend-sample hl-clarity">ab</b>Claridad y coherencia</span>
            </div>`;
    }

    /* ---------------- Tabs del aside ---------------- */
    function renderTabs() {
        const st = S.get();
        const mode = D.modes[st.mode];
        const guidedTabs = {
            writing: ['text', 'rules'],
            errors: ['rtext', 'errlist', 'rule'],
            lessons: ['reading', 'vocabulary']
        };
        const allowed = guidedTabs[st.mode] || [mode.tabs[0].id];
        if (st.detailsLevel === 2) {
            return `<span class="aside-context-label">Herramientas</span><button class="aside-more" data-action="advance-details">Volver al tutor</button>`;
        }
        const tabs = st.detailsLevel === 0
            ? mode.tabs.slice(0, 1)
            : st.detailsLevel === 1
                ? mode.tabs.filter((tab) => allowed.includes(tab.id))
                : mode.tabs.filter((tab) => tab.id === st.tab);
        return tabs.map((tab) => `
            <button class="aside-tab ${st.tab === tab.id ? 'is-active' : ''}" role="tab" aria-selected="${st.tab === tab.id}" data-action="set-tab" data-tab="${tab.id}">
                ${tab.label}${tab.id === 'changes' ? ' <span class="tab-count">4</span>' : ''}
            </button>
        `).join('') + `<button class="aside-more" data-action="${st.detailsLevel === 3 ? 'open-aside-tools' : 'advance-details'}">${st.detailsLevel === 0 ? 'Más apoyo' : st.detailsLevel === 1 ? 'Herramientas avanzadas' : 'Más vistas'}</button>`;
    }

    function advancedDescription(id) {
        const descriptions = {
            rules: 'Entender la regla y practicar con un ejemplo.',
            criteria: 'Ajustar lo que quieres lograr con la actividad.',
            plan: 'Revisar los pasos de la tarea.',
            path: 'Ver tu ruta y el avance de cada paso.',
            changes: 'Consultar decisiones y comparar versiones.',
            errlist: 'Ver tus errores y su estado.',
            rule: 'Leer la regla del error que practicas.',
            vocabulary: 'Guardar y repasar palabras del contexto.',
            rtext: 'Ver tu texto original, con marcas o con tus cambios.',
            reading: 'Ver tus ideas principales, oraciones analizadas y respuestas.',
            progress: 'Consultar tu avance de aprendizaje.',
        };
        return descriptions[id] || 'Abrir esta vista de apoyo.';
    }

    function renderAdvancedMenu() {
        const st = S.get();
        const options = D.modes[st.mode].tabs.slice(1);
        return `
            <div class="panel-head">
                <div><h3>Herramientas disponibles</h3><p>Abre solo la que necesites ahora</p></div>
            </div>
            <div class="advanced-menu-note">Estas vistas ayudan a revisar el proceso, pero no necesitas usarlas todas para aprender.</div>
            <div class="advanced-menu-list">
                ${options.map((tab) => `
                    <button class="advanced-option" data-action="open-detail-tab" data-tab="${tab.id}">
                        <span><strong>${tab.label}</strong><small>${advancedDescription(tab.id)}</small></span>
                        <span aria-hidden="true">${I.arrowRight(14)}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    /* ---------------- Contenido por tab ---------------- */
    /* Tu propio correo (el que pegaste en el chat), con marcas o con tus cambios */
    /* Un texto revisado (Producir o Revisar): original, con marcas o con tus cambios (0.3.1 y 0.3.8) */
    function reviewedTextHtml(st, R, progress) {
        const G = R.genre();
        const v = st.version === 'final' || st.version === 'original' ? st.version : 'draft';
        const tab = (id, label) => `<button class="version-tab ${v === id ? 'is-active' : ''}" data-action="set-version" data-version="${id}" aria-pressed="${v === id}">${label}</button>`;
        return `
            <div class="panel-head"><div><h3>${G.Noun}</h3><p>${escapeHtml(progress)}</p></div></div>
            <div class="version-tabs" role="group" aria-label="Versiones de ${G.noun}">${tab('original', 'Original')}${tab('draft', 'Con marcas')}${tab('final', 'Con tus cambios')}</div>
            <div class="text-box" lang="en">${R.panelHtml(v)}</div>
            ${v === 'draft' ? legend() : ''}`;
    }
    function renderOwnTextPanel(st) {
        const W = window.Writing;
        if (!st.wr) {
            const plan = W.planHtml();
            return `<div class="panel-head"><div><h3>${plan ? 'Tu plan' : 'Tu texto'}</h3><p>${escapeHtml(W.status().progress)}</p></div></div>
                ${plan || '<p class="muted-text">Cuando me digas qué vas a escribir, aquí verás tu plan, tus ideas y tu esquema. Cuando envíes tu borrador, aparecerá con sus marcas y con los cambios que decidas.</p>'}`;
        }
        return reviewedTextHtml(st, W.reviewer, W.status().progress);
    }
    /* Revisar: tu texto y, debajo, tu registro de errores (0.3.7) */
    function renderRTextPanel() {
        const st = S.get(); const E = window.Errors; const gs = E.groups();
        const reg = `<div class="panel-note"><strong>Tu registro de errores</strong><p>${gs.length ? `${gs.length} ${gs.length === 1 ? 'tipo' : 'tipos'} · ${gs.filter((g) => g.e.status === 'pending').length} ${gs.filter((g) => g.e.status === 'pending').length === 1 ? 'pendiente' : 'pendientes'}` : 'Vacío: se llena con las correcciones que aplicas.'}</p></div>${gs.length ? E.listHtml(gs.slice(0, 4)) : ''}`;
        if (!st.rv) return `<div class="panel-head"><div><h3>Tu texto</h3><p>Todavía no lo pegaste</p></div></div>
            <p class="muted-text">Pega en el chat tu correo, cuento u otro texto en inglés. Aquí verás el original, las marcas y tu versión con los cambios que decidas.</p>${reg}`;
        return reviewedTextHtml(st, E.reviewer, E.reviewer.status().progress) + reg;
    }
    /* Comprender: lo que vas logrando con tu lectura */
    function renderReadingPanel() {
        const html = window.Vocab.summaryHtml();
        return `<div class="panel-head"><div><h3>Tu lectura</h3><p>${html ? 'Lo que vas entendiendo del texto' : 'Todavía no pegaste un texto'}</p></div></div>
            ${html || '<p class="muted-text">Pega un texto en inglés en el chat. Aquí quedarán sus datos, tus ideas principales, las oraciones que analices y tus respuestas.</p>'}`;
    }

    function renderTextPanel() {
        const st = S.get();
        if (!(st.wDemoAt >= 0 && !st.wr)) return renderOwnTextPanel(st);
        const inspected = st.inspected.length;
        const versions = [
            { id: 'original', label: 'Original' },
            { id: 'draft', label: 'Borrador' },
            { id: 'final', label: 'Versión final' }
        ];
        return `
            <div class="panel-head">
                <div>
                    <h3>Tu texto</h3>
                    <p>Correo · solicitud de prórroga</p>
                </div>
                <span class="paper-tag">WaitGPT · data lens</span>
            </div>
            <div class="version-tabs" role="group" aria-label="Versiones del texto">
                ${versions.map((v) => `<button class="version-tab ${st.version === v.id ? 'is-active' : ''}" data-action="set-version" data-version="${v.id}">${v.label}</button>`).join('')}
            </div>
            <div class="text-box ${st.dataLens ? 'is-data-lens' : ''}" data-doc>
                ${textWithHighlights(st.version)}
            </div>
            ${legend()}
            <div class="lens-row">
                <div>
                    <strong>Resaltar lo revisado</strong>
                    <p class="muted-text">Colorea las zonas que ya inspeccionaste.</p>
                </div>
                <button class="switch ${st.dataLens ? 'is-on' : ''}" data-action="toggle-lens" role="switch" aria-checked="${st.dataLens}" aria-label="Resaltar las zonas revisadas"><span></span></button>
            </div>
            <div class="coverage-box">
                <div class="coverage-head"><span>Cobertura de revisión</span><strong>${Math.round((inspected / 4) * 100)}%</strong></div>
                <div class="coverage-bar"><span style="width:${Math.round((inspected / 4) * 100)}%"></span></div>
                <p class="muted-text">${inspected} de 4 zonas inspeccionadas${inspected < 4 ? ' · la IA sugiere revisar las restantes.' : ' · ya revisaste todo.'}</p>
            </div>
            <div class="panel-actions">
                <button class="btn" data-action="open-synonyms">${I.search(14)} Buscar sinónimos</button>
                <button class="btn" data-action="open-export">${I.export(14)} Resumen de tus cambios</button>
            </div>
        `;
    }

    function renderRulesPanel() {
        return `
            <div class="panel-head">
                <div><h3>Reglas y ejemplos</h3><p>El criterio detrás de cada corrección</p></div>
                <span class="paper-tag">Gu et al. · procedure</span>
            </div>
            <div class="stack">
                ${D.rules.map((r) => `
                    <article class="rule-card kind-${r.kind}">
                        <div class="badge-row">
                            <span class="type-badge ${r.kind}">${r.label}</span>
                        </div>
                        <h4>${r.title}</h4>
                        <p>${r.body}</p>
                        <div class="rule-example good"><span>Correcto</span>${r.good}</div>
                        <div class="rule-example bad"><span>Evitar</span>${r.bad}</div>
                        <button class="text-btn" data-action="open-rule" data-id="${r.id}">${I.book(14)} Ver regla completa</button>
                    </article>
                `).join('')}
            </div>
        `;
    }

    function renderCriteriaPanel() {
        const st = S.get();
        return `
            <div class="panel-head">
                <div><h3>Criterios editables</h3><p>La IA los usa para explicar y reescribir</p></div>
                <span class="paper-tag">Kazemitabaar · UIST'24</span>
            </div>
            <p class="panel-note">Edita un supuesto y la interfaz te pedirá crear una rama antes de regenerar. Así puedes comparar versiones sin perder tu trabajo.</p>
            <div class="stack">
                ${st.criteria.map((c) => `
                    <label class="criterion-card">
                        <span class="criterion-icon">${(I[c.icon] || I.tag)(16)}</span>
                        <span class="criterion-body">
                            <span class="criterion-label">${c.label}</span>
                            <input type="text" data-criterion="${c.id}" value="${escapeHtml(c.value)}">
                        </span>
                    </label>
                `).join('')}
            </div>
            <button class="btn btn-ghost full" data-action="add-criterion">${I.plus(14)} Añadir supuesto</button>
            <div class="panel-actions">
                <button class="btn btn-primary" data-action="save-criteria">Guardar cambios</button>
                <button class="btn" data-action="discard-criteria">Descartar</button>
            </div>
        `;
    }

    function renderPlanPanel() {
        const st = S.get();
        return `
            <div class="panel-head">
                <div><h3>Plan de escritura</h3><p>Pasos en lenguaje natural</p></div>
                <span class="paper-tag">LightVA · plan</span>
            </div>
            <p class="panel-note">Marca los pasos opcionales. La IA no avanza de etapa sin tu confirmación.</p>
            <div class="stack">
                ${st.plan.map((p) => `
                    <label class="plan-step ${p.done ? 'is-done' : ''}">
                        <input type="checkbox" data-plan-check="${p.id}" ${p.done ? 'checked' : ''}>
                        <span class="plan-index">${p.id.replace('p', '')}</span>
                        <input type="text" data-plan="${p.id}" value="${escapeHtml(p.text)}">
                        ${p.optional ? '<span class="optional-badge">opcional</span>' : ''}
                    </label>
                `).join('')}
            </div>
            <div class="panel-actions">
                <button class="btn btn-primary" data-action="regenerate-plan">${I.refresh(14)} Regenerar desde el plan</button>
            </div>
        `;
    }

    function renderPathPanel() {
        const st = S.get();
        return `
            <div class="panel-head">
                <div><h3>Ruta de aprendizaje</h3><p>Subtares y relaciones AND / DOWN</p></div>
                <span class="paper-tag">LightVA · task flow</span>
            </div>
            <div class="task-flow">
                ${st.tasks.map((t, i) => `
                    <div class="flow-row">
                        <div class="flow-node status-${t.status}">
                            <div class="flow-top">
                                <span class="flow-id">${t.id.toUpperCase()}</span>
                                <span class="relation-badge">${t.type}</span>
                                <span class="status-pill ${t.status}">${t.progress}%</span>
                            </div>
                            <strong>${t.title}</strong>
                            <p>${t.detail}</p>
                            <div class="task-progress"><span style="width:${t.progress}%"></span></div>
                            ${t.progress < 100 ? `<button class="text-btn" data-action="decompose-task" data-task="${t.id}">${I.sparkles(12)} Descomponer</button>` : ''}
                        </div>
                        ${i < st.tasks.length - 1 ? `<div class="flow-connector"><span></span></div>` : ''}
                    </div>
                `).join('')}
            </div>
            <div class="legend-row">
                <span><b class="relation-badge">AND</b> en paralelo</span>
                <span><b class="relation-badge">DOWN</b> secuencial</span>
            </div>
        `;
    }

    function renderChangesPanel() {
        const st = S.get();
        return `
            <div class="panel-head">
                <div><h3>Cambios</h3><p>Historial de decisiones</p></div>
                <span class="paper-tag">WaitGPT · granular</span>
            </div>
            <div class="stack">
                ${D.corrections.map((c) => {
                    const s = st.statuses[c.id];
                    return `
                        <article class="change-row status-${s}">
                            <div class="change-top">
                                <span class="type-badge ${c.kind}">${c.label}</span>
                                <span class="status-pill ${s}">${s}</span>
                            </div>
                            <strong>${c.title}</strong>
                            <p class="mono small">${c.before} → ${c.after}</p>
                            <div class="change-actions">
                                ${s !== 'pending' ? `<button class="text-btn" data-action="correction-undo" data-id="${c.id}">${I.undo(12)} Deshacer</button>` : '<span class="muted-text">Sin decisión todavía.</span>'}
                            </div>
                        </article>`;
                }).join('')}
            </div>
            <div class="panel-actions">
                <button class="btn btn-primary" data-action="open-export">${I.export(14)} Resumen de tus cambios</button>
            </div>
        `;
    }

    /* ---------------- Tarea 2: errores frecuentes ---------------- */
    function renderErrListPanel() {
        const E = window.Errors;
        const gs = E.groups();
        return `
            <div class="panel-head">
                <div><h3>Tu registro de errores</h3><p>Salen de las correcciones que aplicas al revisar tus textos</p></div>
            </div>
            ${gs.length ? E.listHtml(gs) : `
                <div class="empty-state">
                    <strong>Todavía no tienes errores guardados</strong>
                    <p>Aplica una corrección al revisar un texto, o haz el diagnóstico de 5 oraciones en el chat.</p>
                </div>`}
        `;
    }

    function renderRulePanel() {
        const st = S.get();
        const r = st.errRule && window.Exercises.RULES[st.errRule];
        return `
            <div class="panel-head">
                <div><h3>La regla</h3><p>${r ? r.name : 'Elige un error para ver su regla'}</p></div>
            </div>
            ${r ? `<p>${r.why}</p>${window.Errors.exHtml(escapeHtml(r.bad), escapeHtml(r.good))}<p class="muted-text">Mirarla durante la práctica cuenta como ayuda solo si pides la pista en el chat.</p>` : ''}
        `;
    }

    /* ---------------- Tarea 3: tus palabras (las que registras en el chat) ---------------- */
    function renderVocabularyPanel() {
        const words = S.get().vocabWords;
        return `
            <div class="panel-head">
                <div><h3>Tus palabras</h3><p>Las que registras en el chat, con su oración</p></div>
            </div>
            ${words.length ? `
                <div class="stack">
                    ${words.map((w) => `
                        <article class="word-card is-saved">
                            <div class="word-top"><strong lang="en">${escapeHtml(w.word)}</strong><span class="voc-state ${w.practicedAt ? 'is-used' : ''}">${w.practicedAt ? 'Usada' : 'Nueva'}</span></div>
                            <p>${escapeHtml(w.meaning)}</p>
                            <p class="muted-text" lang="en">“${escapeHtml(w.sentence)}”</p>
                            ${w.own ? `<p class="voc-own" lang="en"><span class="sr-only">Tu oración: </span>${escapeHtml(w.own)}</p>` : ''}
                        </article>`).join('')}
                </div>
                <div class="panel-actions"><button class="btn" data-action="vocab-csv">${I.export(14)} Descargar (CSV)</button></div>` : `
                <div class="empty-state">
                    <strong>Todavía no tienes palabras</strong>
                    <p>Pega un texto en el chat y marca las palabras que no conozcas. Aquí aparecerán con su significado.</p>
                </div>`}
        `;
    }

    function renderProgressPanel() {
        const st = S.get();
        const words = st.vocabWords.length;
        const used = st.vocabWords.filter((w) => w.practicedAt).length;
        const bank = Object.keys(st.errBank).map((id) => ({ id, e: st.errBank[id], r: window.Exercises.RULES[id] })).filter((x) => x.r);
        const done = bank.filter((x) => x.e.status === 'done');
        const applied = [st.wr, st.rv].filter(Boolean).reduce((n, w) => n + w.issues.filter((i) => i.status === 'accepted').length, 0);
        return `
            <div class="panel-head">
                <div><h3>Tu progreso</h3><p>Lo que hiciste en este navegador</p></div>
            </div>
            <div class="stat-grid">
                <div class="stat-card"><strong>${words}</strong><span>palabras guardadas</span></div>
                <div class="stat-card"><strong>${done.length} de ${bank.length}</strong><span>errores superados</span></div>
                <div class="stat-card"><strong>${applied}</strong><span>cambios aplicados a tus textos</span></div>
            </div>
            <div class="goal-box">
                <div class="coverage-head"><span>Palabras que ya usaste en una oración tuya</span><strong>${used} / ${words}</strong></div>
                <div class="coverage-bar"><span style="width:${words ? Math.round((used / words) * 100) : 0}%"></span></div>
            </div>
            <div class="panel-note">
                <strong>Errores superados</strong>
                <p>${done.length ? done.map((x) => x.r.name).join(' · ') : 'Todavía ninguno. Practica un error hasta lograr 4 de 5 sin pista.'}</p>
            </div>
        `;
    }


    function renderAsideContent() {
        const tab = S.get().tab;
        const mode = S.get().mode;
        if (S.get().detailsLevel === 2) return renderAdvancedMenu();
        const map = {
            text: renderTextPanel,
            rules: renderRulesPanel,
            criteria: renderCriteriaPanel,
            plan: renderPlanPanel,
            path: renderPathPanel,
            changes: renderChangesPanel,
            errlist: renderErrListPanel,
            rule: renderRulePanel,
            vocabulary: renderVocabularyPanel,
            progress: renderProgressPanel,
            rtext: renderRTextPanel,
            reading: renderReadingPanel
        };
        return (map[tab] || renderTextPanel)();
    }

    /* ---------------- Footer / drawer / sugerencias ---------------- */
    function historyGroupsHtml() {
        const st = S.get();
        const groups = [
            { mode: 'lessons', label: 'Comprender', icon: 'book' },
            { mode: 'writing', label: 'Producir', icon: 'doc' },
            { mode: 'errors', label: 'Revisar', icon: 'tag' }
        ];
        const currentMode = st.historyMode || st.mode;
        const orderedGroups = groups.slice().sort((a, b) => (a.mode === currentMode ? -1 : b.mode === currentMode ? 1 : 0));
        return orderedGroups.map((group) => {
            const sessions = st.sessions.filter((s) => s.mode === group.mode);
            if (!sessions.length) return '';
            return `
                <section class="history-group ${group.mode === currentMode ? 'is-current' : ''}">
                    <h3>${(I[group.icon] || I.doc)(14)} ${group.label}</h3>
                    <div class="history-list">
                        ${sessions.map((s) => `
                            <button class="history-item ${s.active ? 'is-active' : ''}" data-action="select-session" data-session="${s.id}" ${s.active ? 'aria-current="true"' : ''}>
                                <span class="history-item-main"><strong>${s.title}</strong><small>${s.active ? 'Chat actual · ' : ''}${s.meta}</small></span>
                                <span class="history-item-device">${(I[s.device] || I.monitor)(13)} ${s.device === 'phone' ? 'Celular' : 'Laptop'}</span>
                            </button>
                        `).join('')}
                    </div>
                </section>`;
        }).join('');
    }

    /* Franja de íconos a la izquierda: inicio, nuevo chat y chats (se abren como panel) */
    function renderChatRail() {
        const st = S.get();
        return `
            <button class="rail-btn" data-action="go-home">${I.home(20)}<span>Inicio</span></button>
            <button class="rail-btn" data-action="new-chat">${I.plus(20)}<span>Nuevo</span></button>
            <button class="rail-btn" data-action="toggle-history" aria-expanded="${st.historyOpen}" aria-controls="history-drawer">${I.message(20)}<span>Chats</span></button>
        `;
    }

    /* Mismo contenido como panel deslizante (pantallas angostas) */
    function renderHistoryDrawer() {
        return `
            <div class="history-head">
                <div><strong>Chats recientes</strong><small>Elige una actividad para continuar</small></div>
                <button class="icon-btn" data-action="close-history" aria-label="Cerrar chats">${I.close(18)}</button>
            </div>
            <div class="drawer-actions">
                <button class="btn" data-action="go-home">${I.home(16)} Inicio</button>
                <button class="btn" data-action="new-chat">${I.plus(16)} Nuevo chat</button>
            </div>
            <div class="history-groups">${historyGroupsHtml()}</div>
        `;
    }

    /* Un consejo por tarea, ligado a su aprendizaje (Causalidad__Cobertura_y_Bugs__Copy_.md) */
    const HELP = {
        writing: { title: 'Planifica antes de escribir.', text: 'Define el tipo de texto, haz una lluvia de ideas y ordénalas en un esquema. Después escribe tu borrador y decide cada sugerencia.', asks: ['Tengo que escribir un cuento corto', '¿Cómo empiezo un correo formal?', 'Ver un modelo'] },
        errors: { title: 'Primero encuéntralo tú.', text: 'Antes de aplicar una sugerencia, lee la pista y busca por qué está mal: lo que descubres tú se recuerda mejor.', asks: ['¿Cuándo uso since y for?', 'Ver mi registro', 'Ponme a prueba'] },
        lessons: { title: 'Lee primero el texto completo.', text: 'Busca la idea de cada párrafo antes de traducir palabras: el significado depende del contexto.', asks: ['¿Qué significa deadline?', 'Explícame esta oración: The decision was postponed until next term.'] }
    };

    function renderSuggestions() {
        const st = S.get();
        if (st.detailsLevel < 3) {
            const tip = HELP[st.mode] || HELP.writing;
            return `
                <div class="popover-head">
                    <h4>Una forma de avanzar</h4>
                    <button class="icon-btn tiny" data-action="toggle-suggestions" aria-label="Cerrar ayuda">${I.close(15)}</button>
                </div>
                <div class="learner-tip">
                    <span class="suggestion-icon">${I.lightbulb(16)}</span>
                    <div><strong>${tip.title}</strong><p>${tip.text}</p></div>
                </div>
                <p class="help-asks-label">Puedes pedirme, por ejemplo:</p>
                <div class="chip-row help-asks">${tip.asks.map((a) => `<button class="chip" data-action="fill-input" data-text="${a}">${I.message(12)} ${a}</button>`).join('')}</div>
            `;
        }
        return `
            <div class="popover-head">
                <span class="paper-tag strong">Yang et al. · CHI'26 · WoZ</span>
                <button class="icon-btn tiny" data-action="toggle-suggestions" aria-label="Cerrar sugerencias">${I.close(15)}</button>
            </div>
            <h4>Sugerencias para este paso</h4>
            <div class="suggestions-list">
                ${D.suggestions.map((s) => `
                    <div class="suggestion-item">
                        <span class="suggestion-icon">${(I[s.icon] || I.info)(16)}</span>
                        <div><strong>${s.title}</strong><p>${s.text}</p></div>
                    </div>
                `).join('')}
            </div>
            <button class="btn btn-ghost full" data-action="open-protocol">${I.shield(14)} Ver protocolo del wizard</button>
        `;
    }

    window.Panels = {
        finalPlainText,
        renderTabs,
        renderAsideContent,
        renderChatRail,
        renderHistoryDrawer,
        renderSuggestions,
        renderAsideFooter() {
            const st = S.get();
            if (st.detailsLevel < 3) {
                return `<div class="learner-footer-note"><strong>El tutor te acompaña paso a paso.</strong><span>${st.detailsLevel === 0 ? 'Puedes abrir “Más apoyo” para consultar una regla concreta.' : st.detailsLevel === 1 ? 'Puedes abrir “Herramientas avanzadas” para elegir una vista de apoyo.' : 'Elige una sola herramienta para revisar el proceso.'}</span></div>`;
            }
            return `
                <button class="papers-strip" data-action="open-paper-map" title="Ver qué parte de la interfaz viene de cada paper">
                    <span class="papers-label">Papers en la demo</span>
                    <span class="paper-tag">Yang</span>
                    <span class="paper-tag">Gu</span>
                    <span class="paper-tag">Kazemitabaar</span>
                    <span class="paper-tag">LightVA</span>
                    <span class="paper-tag">WaitGPT</span>
                    <span class="papers-more">ver mapa</span>
                </button>
                <button class="btn btn-primary full" data-action="open-export">${I.export(14)} Resumen de tus cambios</button>
                <div class="aside-footer-row">
                    <button class="text-btn" data-action="open-protocol">${I.shield(13)} Protocolo WoZ</button>
                    <button class="text-btn" data-action="open-debriefing">${I.info(13)} Debriefing</button>
                </div>
            `;
        }
    };
})();
