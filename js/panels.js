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
                <span><b class="legend-sample hl-clarity">ab</b>Claridad</span>
            </div>`;
    }

    /* ---------------- Tabs del aside ---------------- */
    function renderTabs() {
        const st = S.get();
        const mode = D.modes[st.mode];
        const guidedTabs = {
            writing: ['text', 'rules'],
            conversation: ['scenario', 'vocabulary'],
            lessons: ['article', 'vocabulary'],
            questions: ['answers', 'sources']
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
            scenario: 'Cambiar el contexto de la conversación.',
            vocabulary: 'Guardar y repasar palabras del contexto.',
            progress: 'Consultar tu avance de aprendizaje.',
            article: 'Leer el texto y explorar palabras.',
            answers: 'Revisar respuestas frecuentes.',
            sources: 'Consultar el origen de una explicación.'
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
    function renderTextPanel() {
        const st = S.get();
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
                <button class="btn" data-action="open-export">${I.export(14)} Exportar resumen</button>
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
                <button class="btn btn-primary" data-action="open-export">${I.export(14)} Exportar cambios</button>
            </div>
        `;
    }

    function renderScenarioPanel() {
        const st = S.get();
        return `
            <div class="panel-head">
                <div><h3>Escenario</h3><p>Contexto de la conversación</p></div>
                <span class="paper-tag">Gu et al. · contexto</span>
            </div>
            <div class="stack">
                ${D.scenarios.map((s) => `
                    <button class="scenario-card ${st.scenario === s.id ? 'is-active' : ''}" data-action="select-scenario" data-scenario="${s.id}">
                        <span class="scenario-icon">${(I[s.icon] || I.message)(18)}</span>
                        <span>
                            <strong>${s.name}</strong>
                            <span>${s.goal}</span>
                        </span>
                    </button>
                `).join('')}
            </div>
            <div class="panel-note">
                <strong>Plan de la sesión</strong>
                <p>${D.scenarios.find((s) => s.id === st.scenario).prompts.length} preguntas · 5–10 minutos · nivel B1–B2.</p>
            </div>
        `;
    }

    function renderVocabularyPanel() {
        const st = S.get();
        if (st.mode === 'lessons') return renderSavedWordsPanel();
        const scenario = D.scenarios.find((s) => s.id === st.scenario);
        const words = scenario.vocab.map((w, i) => ({ word: w, meaning: ['experiencia', 'fortalezas', 'metas', 'puesto', 'reto', 'trabajo en equipo'][i] || 'palabra clave', example: '' }));

        return `
            <div class="panel-head">
                <div><h3>Palabras clave</h3><p>Úsalas en tus respuestas y guárdalas para repasar</p></div>
                <span class="paper-tag">LightVA · insights</span>
            </div>
            <div class="stack">
                ${words.map((w) => `
                    <article class="word-card ${st.savedWords.includes(w.word) ? 'is-saved' : ''}">
                        <div class="word-top">
                            <strong>${w.word}</strong>
                            <button class="mini-btn" data-action="save-word" data-word="${w.word}" aria-label="Guardar ${w.word}">${st.savedWords.includes(w.word) ? I.check(13) : I.plus(13)}</button>
                        </div>
                        <p>${w.meaning}</p>
                        ${w.example ? `<p class="muted-text italic">“${w.example}”</p>` : ''}
                    </article>
                `).join('')}
            </div>
            <p class="panel-note">Guardadas: ${st.savedWords.length || 'ninguna'} · se añaden a tu repaso.</p>
        `;
    }

    function renderSavedWordsPanel() {
        const st = S.get();
        const saved = D.article.words.filter((w) => st.savedWords.includes(w.word));
        return `
            <div class="panel-head">
                <div><h3>Tus palabras</h3><p>Las que guardas de la lectura, para repasar</p></div>
            </div>
            ${saved.length ? `
                <div class="stack">
                    ${saved.map((w) => `
                        <article class="word-card is-saved">
                            <div class="word-top"><strong>${w.word}</strong></div>
                            <p>${w.meaning}</p>
                            <p class="muted-text italic">“${w.example}”</p>
                        </article>`).join('')}
                </div>` : `
                <div class="empty-state">
                    <strong>Todavía no guardas palabras</strong>
                    <p>Elige una palabra de la lectura y pulsa “Guardar palabra”. Aparecerá aquí para repasarla.</p>
                </div>`}
        `;
    }

    function renderProgressPanel() {
        const st = S.get();
        const saved = st.savedWords.length;
        return `
            <div class="panel-head">
                <div><h3>Tu progreso</h3><p>Esta semana</p></div>
                <span class="paper-tag">WoZ · rigor</span>
            </div>
            <div class="stat-grid">
                <div class="stat-card"><strong>14</strong><span>palabras nuevas</span></div>
                <div class="stat-card"><strong>5</strong><span>errores superados</span></div>
                <div class="stat-card"><strong>38</strong><span>min hablados</span></div>
            </div>
            <div class="goal-box">
                <div class="coverage-head"><span>Meta: 20 palabras nuevas</span><strong>${14 + saved} / 20</strong></div>
                <div class="coverage-bar"><span style="width:${Math.min(((14 + saved) / 20) * 100, 100)}%"></span></div>
                <p class="muted-text">Guardaste ${saved} palabra${saved === 1 ? '' : 's'} en esta sesión.</p>
            </div>
            <div class="panel-note">
                <strong>Errores que dejaron de aparecer</strong>
                <p>“I am agree” · 4 días sin repetirse.</p>
            </div>
            <div class="panel-actions">
                <button class="btn" data-action="open-progress">Ver detalle</button>
            </div>
        `;
    }

    function renderArticlePanel() {
        const st = S.get();
        const selected = st.selectedWord ? D.article.words.find((w) => w.word === st.selectedWord) : null;
        return `
            <div class="panel-head">
                <div><h3>${D.article.title}</h3><p>${D.article.source}</p></div>
                <span class="paper-tag">LightVA · data lens</span>
            </div>
            <div class="article-box">
                ${D.article.paragraphs.map((p, pi) => `<p>${pi === 0 ? p : p}</p>`).join('')}
            </div>
            <p class="panel-note">Selecciona una palabra del artículo para ver su significado en contexto.</p>
            <div class="word-picker">
                ${D.article.words.map((w) => `<button class="word-chip ${st.selectedWord === w.word ? 'is-active' : ''}" data-action="select-word" data-word="${w.word}">${w.word}</button>`).join('')}
            </div>
            ${selected ? `
                <div class="word-detail">
                    <div class="word-detail-head"><strong>${selected.word}</strong><span>Significado en este artículo</span></div>
                    <p><b>Significado:</b> ${selected.meaning}</p>
                    <div class="word-example featured"><span>En el artículo</span>“${selected.example}”</div>
                    <div class="word-extra-example"><span>Otro ejemplo</span>“${selected.examples[0]}”</div>
                    <p class="word-use"><b>Cómo se usa:</b> ${selected.use}</p>
                    <div class="word-detail-actions">
                        <button class="btn btn-primary" data-action="open-word-examples" data-word="${selected.word}">Ver más ejemplos</button>
                        <button class="btn" data-action="save-word" data-word="${selected.word}">${I.plus(14)} Guardar palabra</button>
                    </div>
                </div>
            ` : ''}
        `;
    }

    function renderAnswersPanel() {
        const msgs = S.get().messages.questions;
        const pairs = [];
        msgs.forEach((m, i) => {
            if (m.role === 'user' && msgs[i + 1] && msgs[i + 1].role === 'ai') pairs.push({ q: m.text, a: msgs[i + 1].text });
        });
        return `
            <div class="panel-head">
                <div><h3>Tus dudas</h3><p>Lo que ya resolviste en esta sesión</p></div>
            </div>
            ${pairs.length ? `
                <div class="stack">
                    ${pairs.map((x) => `<article class="qa-card"><strong>${escapeHtml(x.q)}</strong><p>${escapeHtml(x.a)}</p></article>`).join('')}
                </div>` : `
                <div class="empty-state">
                    <strong>Aún no hay dudas resueltas</strong>
                    <p>Escribe tu duda en el chat o prueba una de las preguntas rápidas. La respuesta quedará guardada aquí.</p>
                </div>`}
        `;
    }

    function renderSourcesPanel() {
        return `
            <div class="panel-head">
                <div><h3>Fuentes</h3><p>De dónde sale cada respuesta</p></div>
                <span class="paper-tag">WoZ · rigor</span>
            </div>
            <div class="stack">
                <div class="source-card"><strong>Cambridge Grammar</strong><span>Uso de “agree” y verbos estativos.</span><span class="source-tag">verificado</span></div>
                <div class="source-card"><strong>Longman Dictionary</strong><span>Matices entre “important” y “relevant”.</span><span class="source-tag">verificado</span></div>
                <div class="source-card"><strong>British Council</strong><span>Pronunciación de “comfortable” en inglés británico.</span><span class="source-tag">mock</span></div>
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
            scenario: renderScenarioPanel,
            vocabulary: renderVocabularyPanel,
            progress: renderProgressPanel,
            article: renderArticlePanel,
            answers: renderAnswersPanel,
            sources: renderSourcesPanel
        };
        if (mode === 'lessons' && tab === 'vocabulary') return renderVocabularyPanel();
        if (mode === 'conversation' && tab === 'vocabulary') return renderVocabularyPanel();
        return (map[tab] || renderTextPanel)();
    }

    /* ---------------- Footer / drawer / sugerencias ---------------- */
    function historyGroupsHtml() {
        const st = S.get();
        const groups = [
            { mode: 'writing', label: 'Revisión de correo', icon: 'doc' },
            { mode: 'conversation', label: 'Práctica de conversación', icon: 'message' },
            { mode: 'lessons', label: 'Vocabulario en contexto', icon: 'book' },
            { mode: 'questions', label: 'Dudas rápidas', icon: 'search' }
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

    function renderSuggestions() {
        const st = S.get();
        if (st.detailsLevel < 3) {
            return `
                <div class="popover-head">
                    <h4>Una forma de avanzar</h4>
                    <button class="icon-btn tiny" data-action="toggle-suggestions" aria-label="Cerrar ayuda">${I.close(15)}</button>
                </div>
                <div class="learner-tip">
                    <span class="suggestion-icon">${I.lightbulb(16)}</span>
                    <div><strong>Piensa antes de aceptar.</strong><p>Lee la pista, intenta explicar el cambio con tus propias palabras y luego decide.</p></div>
                </div>
                <button class="btn btn-ghost full" data-action="set-help" data-help="explicacion">Mostrar explicación</button>
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
                <button class="btn btn-primary full" data-action="open-export">${I.export(14)} Exportar resumen</button>
                <div class="aside-footer-row">
                    <button class="text-btn" data-action="open-protocol">${I.shield(13)} Protocolo WoZ</button>
                    <button class="text-btn" data-action="open-debriefing">${I.info(13)} Debriefing</button>
                </div>
            `;
        }
    };
})();
