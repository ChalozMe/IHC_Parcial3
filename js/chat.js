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
            <div class="bubble ai ${bar ? 'has-actions' : ''} ${msg.error ? 'error' : ''} ${msg.tone === 'ok' ? 'is-ok' : ''}">
                <div class="bubble-label">${msg.error ? I.alert(14) + ' ' : ''}${escapeHtml(msg.label || 'TUTOR IA')}</div>
                <p>${escapeHtml(msg.text)}</p>
                ${msg.html ? `<div class="bubble-card">${msg.html}</div>` : ''}
                ${msg.dyn === 'reading' ? `<div class="bubble-card">${window.Vocab.readingHtml(isLiveReading(idx))}</div>` : ''}
                ${msg.chips && msg.chips.length ? `<div class="chip-row ${msg.replies ? 'is-replies' : ''}">${msg.chips.map(chipHtml).join('')}</div>` : ''}
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

    function errorsChat() {
        const st = S.get();
        if (!st.messages.errors.length) window.Errors.intro();
        return `
            ${st.messages.errors.map((m, i) => messageHtml(m, i)).join('')}
        `;
    }

    /* La lectura solo se puede tocar en su último mensaje y mientras marcas palabras */
    function isLiveReading(idx) {
        const st = S.get();
        if (st.mode !== 'lessons' || !st.vocab || st.vocab.stage !== 'mark') return false;
        const list = st.messages.lessons;
        for (let i = list.length - 1; i >= 0; i -= 1) if (list[i].dyn === 'reading') return i === idx;
        return false;
    }

    function lessonsChat() {
        const st = S.get();
        if (!st.messages.lessons.length) window.Vocab.intro();
        return `
            ${st.messages.lessons.map((m, i) => messageHtml(m, i)).join('')}
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
        const list = D.replies[mode] || D.replies.writing;
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
            const label = 'TUTOR IA · REDACCIÓN';
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
            else if (st.mode === 'errors') html = errorsChat();
            else html = lessonsChat();
            el.innerHTML = html;
            this.renderSideQuery();
        },

        renderSideQuery,

        scrollToBottom() {
            const scroll = document.getElementById('chat-scroll');
            if (scroll) requestAnimationFrame(() => { scroll.scrollTop = scroll.scrollHeight; });
        },

        /* Deja un texto en el campo de mensaje para que la persona lo edite */
        fill(text) {
            window.setTimeout(() => {
                const input = document.getElementById('chat-input');
                if (!input) return;
                input.value = text;
                input.dispatchEvent(new Event('input'));
                input.focus();
            }, 0);
        },

        scrollToTop() {
            const scroll = document.getElementById('chat-scroll');
            if (scroll) requestAnimationFrame(() => { scroll.scrollTop = 0; });
        },

        send(text) {
            const st = S.get();
            const clean = String(text || '').trim();
            if (!clean || st.typing) return;
            if (st.mode === 'errors') { window.Errors.handle(clean); this.scrollToBottom(); return; }
            if (st.mode === 'lessons') { window.Vocab.handle(clean); this.scrollToBottom(); return; }
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
