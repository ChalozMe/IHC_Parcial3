/* ============================================================
   Chat · mensajes, composer, side queries y respuestas mock
   Papers: Gu (workflows), Kazemitabaar (side queries)
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

    function chipHtml(chip) {
        const icon = (I[chip.icon] || I.info)(12);
        const attrs = chip.action
            ? `data-action="${chip.action}" ${chip.id ? `data-id="${chip.id}"` : ''}`
            : '';
        const tag = chip.action ? 'button' : 'span';
        return `<${tag} class="chip ${chip.kind || ''}" ${attrs}>${icon}${escapeHtml(chip.text)}</${tag}>`;
    }

    function actionBarHtml(msg, idx) {
        if (msg.retry) {
            return `<div class="msg-actions"><button class="msg-action" data-action="retry-last">${I.refresh(14)} Reintentar</button></div>`;
        }
        if (!msg.generated) return '';
        return `
            <div class="msg-actions" role="group" aria-label="Acciones de esta respuesta">
                <button class="msg-action" data-action="msg-copy" data-idx="${idx}">${I.copy(14)} Copiar</button>
                <button class="msg-action" data-action="msg-regen" data-idx="${idx}">${I.refresh(14)} Regenerar</button>
                <button class="msg-action" data-action="msg-rate" data-idx="${idx}" data-rate="up" aria-pressed="${msg.rating === 'up'}" aria-label="Respuesta útil">${I.thumbUp(14)}</button>
                <button class="msg-action" data-action="msg-rate" data-idx="${idx}" data-rate="down" aria-pressed="${msg.rating === 'down'}" aria-label="Respuesta no útil">${I.thumbDown(14)}</button>
            </div>`;
    }

    function messageHtml(msg, idx) {
        if (msg.role === 'user') {
            return `<div class="bubble user">${escapeHtml(msg.text)}</div>`;
        }
        const bar = actionBarHtml(msg, idx);
        return `
            <div class="bubble ai ${bar ? 'has-actions' : ''} ${msg.error ? 'error' : ''}">
                <div class="bubble-label">${msg.error ? I.alert(14) + ' ' : ''}${escapeHtml(msg.label || 'TUTOR IA')}</div>
                <p>${escapeHtml(msg.text)}</p>
                ${msg.chips && msg.chips.length ? `<div class="chip-row">${msg.chips.map(chipHtml).join('')}</div>` : ''}
                ${bar}
            </div>`;
    }

    function typingHtml() {
        return `
            <div class="bubble ai typing-bubble" aria-label="El tutor está escribiendo">
                <div class="bubble-label">TUTOR IA · ESCRIBIENDO</div>
                <div class="typing-dots"><span></span><span></span><span></span></div>
            </div>`;
    }

    function writingChat() {
        const st = S.get();
        const msgs = st.messages.writing;
        const initial = msgs.slice(0, 2).map(messageHtml).join('');
        const rest = msgs.slice(2).map((m, i) => messageHtml(m, i + 2)).join('');
        return `
            ${initial}
            ${window.Corrections.renderAnalysis()}
            ${rest}
            ${st.typing ? typingHtml() : ''}
        `;
    }

    function conversationChat() {
        const st = S.get();
        const scenario = D.scenarios.find((s) => s.id === st.scenario) || D.scenarios[0];
        return `
            <div class="scenario-strip" role="group" aria-label="Escenario activo">
                ${D.scenarios.map((s) => `
                    <button class="scenario-chip ${s.id === st.scenario ? 'is-active' : ''}" data-action="select-scenario" data-scenario="${s.id}">
                        ${(I[s.icon] || I.message)(13)} ${s.name}
                    </button>
                `).join('')}
                <button class="text-btn scenario-next" data-action="next-prompt">Siguiente pregunta ${I.arrowRight(13)}</button>
            </div>
            ${st.messages.conversation.map((m, i) => messageHtml(m, i)).join('')}
            ${st.typing ? typingHtml() : ''}
        `;
    }

    function lessonsChat() {
        const st = S.get();
        const selected = st.selectedWord ? D.article.words.find((w) => w.word === st.selectedWord) : null;
        return `
            <div class="reading-card">
                <div class="section-head">
                    <div class="section-title-wrap">
                        <h4>${D.article.title}</h4>
                        <span class="paper-tag">LightVA · data lens</span>
                    </div>
                    <span class="muted-text">${D.article.source}</span>
                </div>
                ${D.article.paragraphs.map((p) => `<p>${p}</p>`).join('')}
                <div class="word-picker">
                    ${D.article.words.map((w) => `<button class="word-chip ${st.selectedWord === w.word ? 'is-active' : ''}" data-action="select-word" data-word="${w.word}">${w.word}</button>`).join('')}
                </div>
                ${selected ? `
                    <div class="inline-word-detail">
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
            </div>
            <div class="reading-prompt-card">
                <div><h4>¿Tienes otra lectura?</h4><p>Puedes pegarla en el chat y escribir la palabra que necesitas entender. El tutor usará el contexto para explicarla.</p></div>
                <div class="prompt-example">“Te paso esta lectura. ¿Qué significa <b>dedicated</b> aquí? Dame dos ejemplos en inglés y dime cuándo se usa.”</div>
                <button class="btn btn-ghost" data-action="use-reading-prompt">Escribir mi consulta</button>
            </div>
            ${st.messages.lessons.map((m, i) => messageHtml(m, i)).join('')}
            ${st.typing ? typingHtml() : ''}
        `;
    }

    function modeGuide(mode) {
        const guide = D.modeGuides[mode];
        if (!guide) return '';
        const papers = {
            conversation: ['Gu et al. · workflow', 'LightVA · task flow', 'Yang et al. · WoZ', 'WaitGPT · granularidad'],
            lessons: ['LightVA · data lens', 'Kazemitabaar · side query', 'Yang et al. · WoZ', 'WaitGPT · cobertura'],
            questions: ['Gu et al. · workflow', 'Yang et al. · rigor', 'LightVA · insights', 'WaitGPT · exportar']
        }[mode] || [];
        return `
            <section class="mode-guide-card">
                <div class="section-head">
                    <div class="section-title-wrap">
                        <h4>${guide.title}</h4>
                        <span class="paper-tag">Demo · apoyo visual</span>
                    </div>
                </div>
                <p class="muted-text">${guide.lead}</p>
                <div class="guide-grid">
                    ${guide.steps.map((s) => `
                        <div class="guide-step">
                            <span class="guide-num">${s.n}</span>
                            <div><strong>${s.title}</strong><p>${s.text}</p></div>
                        </div>`).join('')}
                </div>
                <div class="guide-papers">${papers.map((p) => `<span class="paper-tag">${p}</span>`).join('')}</div>
            </section>
        `;
    }

    function questionsChat() {
        const st = S.get();
        return `
            ${st.messages.questions.map((m, i) => messageHtml(m, i)).join('')}
            <div class="quick-prompts">
                <span class="muted-text">Prueba una pregunta rápida:</span>
                <button class="chip" data-action="quick-question" data-text="¿Cuándo uso agree sin am?">${I.message(12)} ¿Cuándo uso “agree” sin “am”?</button>
                <button class="chip" data-action="quick-question" data-text="¿Diferencia entre important y relevant?">${I.book(12)} important vs relevant</button>
                <button class="chip" data-action="quick-question" data-text="¿Cómo suena comfortable?">${I.mic(12)} comfortable</button>
            </div>
            ${st.typing ? typingHtml() : ''}
        `;
    }

    function renderSideQuery() {
        const st = S.get();
        const el = document.getElementById('side-query');
        if (!el) return;
        el.hidden = !st.sideOpen;
        if (!st.sideOpen) {
            el.innerHTML = '';
            return;
        }
        el.innerHTML = `
            <div class="side-query-head">
                <div>
                    <strong>Consulta lateral</strong>
                    <span class="paper-tag">Kazemitabaar · UIST'24 · side query</span>
                </div>
                <button class="icon-btn tiny" data-action="close-side-query" aria-label="Cerrar consulta lateral">${I.close(15)}</button>
            </div>
            <div class="side-examples">
                <button class="chip" data-action="side-example" data-text="¿Cuántas correcciones quedan?">${I.layers(12)} ¿Cuántas correcciones quedan?</button>
                <button class="chip" data-action="side-example" data-text="¿Cuáles son las reglas de tono?">${I.book(12)} Reglas de tono</button>
                <button class="chip" data-action="side-example" data-text="¿Qué palabras se repiten?">${I.search(12)} Palabras repetidas</button>
            </div>
            <form id="side-form" class="side-form">
                <input id="side-input" type="text" value="${escapeHtml(st.sidePrefill)}" placeholder="Pregunta sin salir de esta corrección…">
                <button class="btn btn-primary" type="submit">${I.send(14)} Consultar</button>
            </form>
            ${st.sideAnswer ? `
                <div class="side-answer">
                    <p><strong>Respuesta mock:</strong> ${st.sideAnswer.text}</p>
                    ${st.sideAnswer.rows ? `<div class="mini-table-wrap compact"><table class="mini-table"><tbody>${st.sideAnswer.rows.map((r) => `<tr><td class="mono">${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table></div>` : ''}
                    <div class="modal-actions">
                        <button class="text-btn" data-action="side-add-criterion">${I.plus(13)} Añadir a criterios</button>
                        <button class="text-btn" data-action="side-insert">${I.arrowRight(13)} Insertar en el texto</button>
                    </div>
                </div>
            ` : ''}
        `;
        const form = document.getElementById('side-form');
        if (form) form.addEventListener('submit', onSideSubmit);
        const input = document.getElementById('side-input');
        if (input) input.focus();
    }

    function onSideSubmit(e) {
        e.preventDefault();
        const input = document.getElementById('side-input');
        if (!input || !input.value.trim()) return;
        const q = input.value.trim();
        const st = S.get();
        const remaining = Object.values(st.statuses).filter((s) => s === 'pending').length;
        const answer = /correccion|queda/i.test(q)
            ? { text: `Quedan ${remaining} correcciones pendientes de verificar.`, rows: [['Pendientes', String(remaining)], ['Aceptadas', String(Object.values(st.statuses).filter((s) => s === 'accepted').length)], ['Rechazadas', String(Object.values(st.statuses).filter((s) => s === 'rejected').length)]] }
            : /tono/i.test(q)
                ? { text: 'Para este contexto usa “Could you please…?” en lugar de “I want you to…”.', rows: [['Formal', 'Could you please…?'], ['Informal', 'Can you…?']] }
                : { text: 'Las palabras “important” y “deadline” se repiten. Puedes variar con “relevant” y “due date”.', rows: [['important', '2 apariciones'], ['deadline', '2 apariciones']] };
        S.set({ sideAnswer: answer, sidePrefill: q });
        renderSideQuery();
    }

    function replyFor(mode, text) {
        const list = D.replies[mode] || D.replies.questions;
        const found = list.find((r) => r.match.test(text));
        return found || list[list.length - 1];
    }

    let pending = null;

    function announce(text) {
        const live = document.getElementById('live-region');
        if (live) live.textContent = text;
    }

    function generate(mode, text) {
        S.set({ typing: true });
        window.Chat.scrollToBottom();
        if (navigator.onLine === false) {
            S.get().messages[mode].push({ role: 'ai', label: 'TUTOR IA · SIN CONEXIÓN', text: 'No pude generar la respuesta porque no hay conexión. Tu mensaje se conservó; reinténtalo cuando vuelvas a estar en línea.', retry: true, error: true, chips: [] });
            S.set({ typing: false });
            announce('No se pudo generar la respuesta. Sin conexión.');
            return;
        }
        pending = { mode, timer: window.setTimeout(() => {
            pending = null;
            const reply = replyFor(mode, text);
            const label = { writing: 'TUTOR IA · REDACCIÓN', conversation: 'ENTREVISTADORA IA · CONVERSACIÓN', lessons: 'TUTOR IA · LECTURA', questions: 'TUTOR IA · DUDAS' }[mode];
            S.get().messages[mode].push({ role: 'ai', label, text: reply.text, chips: reply.chips || [], generated: true });
            S.set({ typing: false });
            announce(reply.text);
            window.Chat.scrollToBottom();
        }, 850) };
    }

    window.Chat = {
        render() {
            const el = document.getElementById('chat-messages');
            if (!el) return;
            const st = S.get();
            let html = '';
            if (st.mode === 'writing') html = writingChat();
            else if (st.mode === 'conversation') html = conversationChat();
            else if (st.mode === 'lessons') html = lessonsChat();
            else html = questionsChat();
            el.innerHTML = html;
            this.renderSideQuery();
        },

        renderSideQuery,

        scrollToBottom() {
            const scroll = document.getElementById('chat-scroll');
            if (scroll) requestAnimationFrame(() => { scroll.scrollTop = scroll.scrollHeight; });
        },

        scrollToTop() {
            const scroll = document.getElementById('chat-scroll');
            if (scroll) requestAnimationFrame(() => { scroll.scrollTop = 0; });
        },

        send(text) {
            const st = S.get();
            const clean = String(text || '').trim();
            if (!clean || st.typing) return;
            st.messages[st.mode].push({ role: 'user', text: clean });
            generate(st.mode, clean);
        },

        stop() {
            if (!pending) return;
            window.clearTimeout(pending.timer);
            const mode = pending.mode;
            pending = null;
            S.get().messages[mode].push({ role: 'ai', label: 'TUTOR IA · DETENIDO', text: 'Detuviste la respuesta. Puedes reintentar o escribir otra cosa.', retry: true, chips: [] });
            S.set({ typing: false });
            announce('Respuesta detenida.');
            window.Chat.scrollToBottom();
        },

        retry() {
            const st = S.get();
            const list = st.messages[st.mode];
            while (list.length && list[list.length - 1].role !== 'user') list.pop();
            const last = list[list.length - 1];
            if (last) generate(st.mode, last.text);
        },

        regenerate(idx) {
            const st = S.get();
            const list = st.messages[st.mode];
            if (st.typing || !list[idx]) return;
            let u = idx - 1;
            while (u >= 0 && list[u].role !== 'user') u--;
            if (u < 0) return;
            const text = list[u].text;
            list.splice(idx, 1);
            generate(st.mode, text);
        },

        copy(idx) {
            const st = S.get();
            const msg = st.messages[st.mode][idx];
            if (!msg) return Promise.resolve(false);
            if (navigator.clipboard && navigator.clipboard.writeText) {
                return navigator.clipboard.writeText(msg.text).then(() => true).catch(() => false);
            }
            return Promise.resolve(false);
        },

        rate(idx, value) {
            const msg = S.get().messages[S.get().mode][idx];
            if (!msg) return;
            msg.rating = msg.rating === value ? null : value;
            S.touch();
        }
    };
})();
