/* ============================================================
   Graph · mapa de revisión (WaitGPT · operation graph)
   ============================================================ */
(function () {
    'use strict';

    const D = window.DemoData;
    const I = window.Icons;

    const statusLabel = { ok: 'ok', warning: 'revisar', error: 'error' };

    function glyph(node) {
        let cells = '';
        for (let i = 0; i < 12; i++) {
            let cls = 'glyph-cell';
            if (node.status === 'error' && (i === 4 || i === 7 || i === 10)) cls += ' is-error';
            else if (node.status === 'warning' && (i === 2 || i === 5 || i === 9)) cls += ' is-warning';
            else if (i % 3 === 0) cls += ' is-ok';
            else cls += ' is-muted';
            cells += `<span class="${cls}"></span>`;
        }
        return `<span class="table-glyph" aria-hidden="true">${cells}</span>`;
    }

    window.Graph = {
        render() {
            const nodes = D.graphNodes.map((node, index) => {
                const iconFn = I[node.icon] || I.doc;
                const arrow = index < D.graphNodes.length - 1
                    ? `<span class="graph-arrow" aria-hidden="true">${I.arrowRight(14)}</span>`
                    : '';
                return `
                    <button class="graph-node status-${node.status}" data-action="graph-node" data-node="${node.id}" ${node.corr ? `data-corr="${node.corr}"` : ''}>
                        <span class="graph-node-top">
                            <span class="graph-icon">${iconFn(14)}</span>
                            <span class="graph-status">${statusLabel[node.status]}</span>
                        </span>
                        <span class="graph-title">${node.title}</span>
                        ${glyph(node)}
                    </button>${arrow}`;
            }).join('');

            return `
                <section class="graph-card" aria-label="Mapa de revisión">
                    <div class="section-head">
                        <div class="section-title-wrap">
                            <h4>Mapa de revisión</h4>
                            <span class="paper-tag">WaitGPT · operation graph</span>
                        </div>
                        <button class="text-btn" data-action="play-analysis">
                            ${I.play(14)} Reproducir análisis
                        </button>
                    </div>
                    <div class="graph-track">${nodes}</div>
                    <p class="graph-caption">Haz clic en un nodo para ver el detalle, preguntar o re-ejecutar desde ahí.</p>
                </section>
            `;
        },

        detail(nodeId) {
            const node = D.graphNodes.find((n) => n.id === nodeId);
            if (!node) return '<p>Nodo no encontrado.</p>';
            const correction = node.corr ? D.corrections.find((c) => c.id === node.corr) : null;
            return `
                <div class="modal-body">
                    <p class="modal-eyebrow">WaitGPT · operation graph</p>
                    <div class="detail-status status-${node.status}">
                        <span>${node.title}</span>
                        <span class="status-pill ${node.status}">${statusLabel[node.status]}</span>
                    </div>
                    <p class="modal-text">${node.detail}</p>
                    ${correction ? `
                        <div class="mini-correction">
                            <span class="type-badge ${correction.kind}">${correction.label}</span>
                            <div class="mini-diff">
                                <span class="diff-before">${correction.before}</span>
                                <span class="diff-arrow">→</span>
                                <span class="diff-after">${correction.after}</span>
                            </div>
                        </div>
                    ` : ''}
                    <div class="detail-grid">
                        <div><span class="detail-label">Parámetros</span><strong>Nivel B1–B2 · tono formal</strong></div>
                        <div><span class="detail-label">Última ejecución</span><strong>hace 2 s · 148 ms</strong></div>
                        <div><span class="detail-label">Control WoZ</span><strong>lógica del sistema</strong></div>
                        <div><span class="detail-label">Riesgo</span><strong>variabilidad</strong></div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" data-action="node-ask" data-node="${node.id}">${I.message(14)} Preguntar sobre esta operación</button>
                        <button class="btn" data-action="node-rerun" data-node="${node.id}">${I.refresh(14)} Re-ejecutar desde aquí</button>
                    </div>
                </div>
            `;
        }
    };
})();
