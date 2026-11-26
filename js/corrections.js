/* ============================================================
   Corrections · tarjetas de verificación + progreso + descomposición
   Papers: Yang (WoZ), WaitGPT (granularidad), LightVA (descomposición)
   ============================================================ */
(function () {
    'use strict';

    const D = window.DemoData;
    const S = window.DemoState;
    const I = window.Icons;

    const helpLabels = {
        pista: 'Pista',
        explicacion: 'Explicación',
        ejemplo: 'Ejemplo',
        reescritura: 'Reescritura completa'
    };

    function helpsFor(c) {
        const help = S.get().help;
        const parts = [];
        if (help === 'pista') {
            parts.push(`<div class="hint-box"><strong>Pista:</strong> ${c.hint}</div>`);
            return parts.join('');
        }
        parts.push(`<div class="hint-box"><strong>Pista:</strong> ${c.hint}</div>`);
        if (help === 'explicacion' || help === 'ejemplo' || help === 'reescritura') {
            parts.push(`<p class="why"><strong>Por qué:</strong> ${c.why}</p>`);
            if (c.alt) parts.push(`<p class="why alt"><strong>También válido:</strong> ${c.alt}</p>`);
        }
        if (help === 'ejemplo' || help === 'reescritura') {
            parts.push(`<div class="example-box"><span class="example-label">Ejemplo</span>${c.example}</div>`);
            parts.push(`<p class="try-first">${I.wand(14)} Antes de aceptar, intenta escribirla tú con tus palabras.</p>`);
        }
        return parts.join('');
    }

    /* Nivel de ayuda junto a lo que modifica: la tarjeta (proximidad) */
    function helpControl() {
        const help = S.get().help;
        return `
            <div class="card-help" role="group" aria-label="Nivel de ayuda">
                <span class="help-label">Ayuda</span>
                ${Object.keys(helpLabels).map((id) => `<button class="help-pill ${help === id ? 'is-active' : ''}" data-action="set-help" data-help="${id}" aria-pressed="${help === id}">${helpLabels[id]}</button>`).join('')}
            </div>`;
    }

    function renderCard(c) {
        const st = S.get();
        const simple = st.detailsLevel !== 3;
        const status = st.statuses[c.id] || 'pending';
        const isAccepted = status === 'accepted';
        const isRejected = status === 'rejected';

        const diff = S.get().help === 'pista'
            ? ''
            : `<div class="diff-line">
                    <span class="diff-before">${c.before}</span>
                    <span class="diff-arrow" aria-hidden="true">→</span>
                    <span class="diff-after">${c.after}</span>
               </div>`;

        const actions = status === 'pending' && simple
            ? `
                <button class="btn btn-primary" data-action="correction-accept" data-id="${c.id}">Usar esta sugerencia</button>
                <button class="btn" data-action="correction-reject" data-id="${c.id}">Mantener mi frase</button>
                <button class="text-btn" data-action="correction-confused" data-id="${c.id}">Explícamelo de otra forma</button>
              `
            : status === 'pending'
            ? `
                <button class="btn btn-primary" data-action="correction-accept" data-id="${c.id}">Aceptar</button>
                <button class="btn" data-action="correction-reject" data-id="${c.id}">Rechazar</button>
                <button class="btn" data-action="correction-confused" data-id="${c.id}">No entiendo</button>
                <span class="actions-spacer"></span>
                <button class="text-btn" data-action="correction-rule" data-id="${c.id}">${I.book(14)} Ver regla y ejemplo</button>
                <button class="text-btn" data-action="correction-ask" data-id="${c.id}">${I.message(14)} Preguntar</button>
                <button class="text-btn" data-action="correction-inspect" data-id="${c.id}">${I.eye(14)} Inspeccionar</button>
              `
            : `
                <span class="resolved-note">${isAccepted ? 'Aceptada: la reescritura ya incorpora este cambio.' : 'Rechazada: se mantiene tu versión original.'}</span>
                <span class="actions-spacer"></span>
                <button class="text-btn" data-action="correction-undo" data-id="${c.id}">${I.undo(14)} Deshacer</button>
              `;

        return `
            <article class="correction-card kind-${c.kind} status-${status}" data-card="${c.id}" ${status === 'accepted' ? 'data-accepted="true"' : ''}>
                <div class="correction-head">
                    <div class="badge-row">
                        <span class="type-badge ${c.kind}">${c.label}</span>
                        <span class="paper-tag">${c.paper}</span>
                    </div>
                    <span class="correction-count">${simple ? 'Paso' : 'Corrección'} ${c.correctionNo} de 4</span>
                </div>

                <div class="correction-title-row">
                    <h4>${c.title}</h4>
                    <span class="status-pill ${status}">${status === 'pending' ? 'Pendiente' : status === 'accepted' ? 'Aceptada' : 'Rechazada'}</span>
                </div>

                ${simple ? helpControl() : ''}
                ${diff}
                ${helpsFor(c)}

                <div class="woz-row">
                    <span class="woz-chip"><b>Control:</b> ${c.control}</span>
                    <span class="woz-chip"><b>Riesgo:</b> ${c.risk}</span>
                    <span class="woz-chip subtle">Yang et al. · CHI'26</span>
                </div>

                <div class="correction-actions">${actions}</div>
            </article>
        `;
    }

    function renderProgress() {
        const st = S.get();
        const simple = st.detailsLevel !== 3;
        const done = Object.keys(st.statuses).filter((k) => st.statuses[k] !== 'pending').length;
        const bars = D.corrections.map((c) => {
            const s = st.statuses[c.id];
            return `<span class="progress-seg ${s}" title="${c.label}: ${s}"></span>`;
        }).join('');

        return `
            <section class="progress-card" aria-label="Progreso de verificación">
                <div class="progress-head">
                    <div>
                        <strong>${simple ? 'Tu avance' : 'Progreso de verificación'}</strong>
                        <span class="paper-tag">WaitGPT · cobertura</span>
                    </div>
                    <span class="progress-count">${done} de 4</span>
                </div>
                <div class="progress-bars">${bars}</div>
                <div class="progress-foot">
                    <span>${simple ? `${done} de 4 pasos revisados` : `${done} de 4 operaciones verificadas · ${Math.round((done / 4) * 100)}% de cobertura`}</span>
                    <button class="text-btn" data-action="open-progress">Ver progreso</button>
                </div>
            </section>
        `;
    }

    function renderDecomposition() {
        const st = S.get();
        if (!st.showDecomp || st.decompIgnored) return '';
        const accepted = st.decompAccepted;
        const chain = D.tasks.map((t, i) => `
            <span class="chain-task ${t.status}">
                <b>${t.id.toUpperCase()}</b> ${t.title}
                <span class="relation-badge">${t.type}</span>
            </span>${i < D.tasks.length - 1 ? `<span class="chain-arrow" aria-hidden="true">${I.arrowRight(12)}</span>` : ''}
        `).join('');

        return `
            <section class="decomp-card" aria-label="Descomposición on-demand">
                <div class="badge-row">
                    <span class="paper-tag strong">LightVA · descomposición on-demand</span>
                    <span class="status-pill ${accepted ? 'accepted' : 'pending'}">${accepted ? 'Plan aplicado' : 'Sugerencia'}</span>
                </div>
                <h4>${accepted ? 'Plan descompuesto en 4 subtareas' : 'Completitud 7/10. ¿Descomponer la revisión?'}</h4>
                <p class="muted-text">Separa la verificación en pasos pequeños para reducir la carga cognitiva. <b>AND</b> = en paralelo · <b>DOWN</b> = secuencial.</p>
                <div class="task-chain">${chain}</div>
                ${accepted ? `
                    <div class="modal-actions">
                        <button class="btn" data-action="open-tab" data-tab="path">${I.layers(14)} Ver ruta completa</button>
                        <button class="text-btn" data-action="reset-decomp">Volver a la revisión simple</button>
                    </div>
                ` : `
                    <div class="modal-actions">
                        <button class="btn btn-primary" data-action="decomp-accept">Aceptar descomposición</button>
                        <button class="btn" data-action="decomp-ignore">Ignorar</button>
                        <button class="text-btn" data-action="open-tab" data-tab="plan">Editar plan</button>
                    </div>
                `}
            </section>
        `;
    }

    function renderInsight() {
        const st = S.get();
        const done = Object.keys(st.statuses).filter((k) => st.statuses[k] !== 'pending').length;
        if (done < 4) return '';
        const accepted = Object.values(st.statuses).filter((s) => s === 'accepted').length;
        return `
            <section class="insight-card is-goal-done" aria-label="Tu correo está listo">
                <span class="insight-icon">${I.check(18)}</span>
                <div>
                    <strong>Tu correo está listo para enviar</strong>
                    <p>Aceptaste ${accepted} de 4 correcciones. La petición es clara y el tono es adecuado para una profesora.</p>
                    <div class="insight-actions">
                        <button class="btn btn-primary" data-action="copy-final">${I.copy(14)} Copiar correo final</button>
                        <button class="btn" data-action="set-stage" data-stage="3">Ir a Cerrar ${I.arrowRight(14)}</button>
                        <button class="text-btn" data-action="open-export">${I.export(14)} Resumen de tus cambios</button>
                    </div>
                </div>
            </section>
        `;
    }

    function renderDataView() {
        if (S.get().workflow !== 'data') return '';
        const st = S.get();
        const rows = D.corrections.map((c) => {
            const s = st.statuses[c.id];
            return `
                <tr class="${s}">
                    <td><span class="type-badge ${c.kind}">${c.label}</span></td>
                    <td class="mono">${c.before.length > 32 ? c.before.slice(0, 30) + '…' : c.before}</td>
                    <td class="mono">${c.after.length > 32 ? c.after.slice(0, 30) + '…' : c.after}</td>
                    <td><span class="status-pill ${s}">${s}</span></td>
                </tr>`;
        }).join('');

        return `
            <section class="data-view-card" aria-label="Vista por datos">
                <div class="section-head">
                    <div class="section-title-wrap">
                        <h4>Vista por datos</h4>
                        <span class="paper-tag">Gu et al. · CHI'24 · data-oriented</span>
                    </div>
                    <button class="text-btn" data-action="open-tab" data-tab="text">${I.doc(14)} Abrir texto</button>
                </div>
                <p class="muted-text">Revisa las filas del texto real antes de decidir. Cada fila es una corrección detectada.</p>
                <div class="mini-table-wrap">
                    <table class="mini-table">
                        <thead><tr><th>Tipo</th><th>Antes</th><th>Después</th><th>Estado</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </section>
        `;
    }

    window.Corrections = {
        renderAnalysis() {
            const st = S.get();
            if (st.detailsLevel === 3 && st.tab === 'path') return `${window.Graph.render()}${renderProgress()}`;
            const current = D.corrections.find((c) => (st.statuses[c.id] || 'pending') === 'pending') || D.corrections[D.corrections.length - 1];
            if (st.detailsLevel !== 3 || st.tab !== 'path') return `${renderCard(current)}${renderInsight()}`;
            return `
                ${window.Graph.render()}
                ${renderDataView()}
                <div class="analysis-cards">
                    ${D.corrections.map(renderCard).join('')}
                </div>
                ${renderProgress()}
                ${renderDecomposition()}
                ${renderInsight()}
            `;
        },
        renderCard,
        renderProgress,
        renderDecomposition,
        helpLabels
    };
})();
