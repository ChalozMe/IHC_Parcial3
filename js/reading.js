/* ============================================================
   Reading · apoyo por reglas para 0.1 Comprender un texto
   Sin IA ni red: mide el texto, encuentra palabras clave, propone
   la oración principal de cada párrafo, analiza la estructura de
   una oración y arma preguntas de comprensión con el propio texto.
   ============================================================ */
(function () {
    'use strict';

    const C = window.Checker;
    const G = window.Glossary;

    const STOP = new Set(('a an the and or but if so of to in on at by for with from into about as than then that this these those there here it its they them their he him his she her we us our you your i me my mine is are was were be been being am have has had do does did can could will would should may might must shall not no yes very more most much many some any each every all also just only even still such own same other another which who whom whose what when where why how while because although though however after before during until since over under again further once both few nor too can\'t don\'t isn\'t aren\'t wasn\'t weren\'t one two three first last new old good great make made get got go went take took come came say said see saw know knew think thought well way like').split(/\s+/));

    const words = (t) => (String(t).match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || []);
    const stem = (w) => {
        let s = w.toLowerCase().replace(/['’]s$/, '');
        if (s.length > 5 && /ies$/.test(s)) s = `${s.slice(0, -3)}y`;
        else if (s.length > 4 && /[^s]s$/.test(s)) s = s.slice(0, -1);
        return s;
    };
    const sentencesOf = (t) => C.sentences(t).map((s) => s.text);
    const paragraphsOf = (t) => {
        const ps = C.paragraphs(String(t).trim()).map((p) => p.text.trim()).filter(Boolean);
        // Un solo bloque largo: se parte en grupos de 3 oraciones para trabajar la idea de cada parte
        if (ps.length === 1) {
            const ss = sentencesOf(ps[0]);
            if (ss.length > 5) { const out = []; for (let i = 0; i < ss.length; i += 3) out.push(ss.slice(i, i + 3).join(' ')); return { list: out, split: true }; }
        }
        return { list: ps, split: false };
    };

    /* ---------- 0.1.1 y 0.1.2: qué texto es y qué tan difícil ---------- */
    function stats(text) {
        const ws = words(text); const ss = sentencesOf(text); const ps = paragraphsOf(text).list;
        const avg = ws.length / Math.max(1, ss.length);
        const long = ws.filter((w) => w.length >= 8).length / Math.max(1, ws.length);
        const level = avg < 15 && long < 0.17 ? 'B1: accesible' : avg < 22 && long < 0.24 ? 'B1–B2: intermedio' : 'B2–C1: exigente';
        const g = C.genre(text);
        const opinion = /\b(i think|i believe|in my opinion|we should|must be|it is important)\b/i.test(text);
        const type = g === 'story' ? 'narración (cuento o relato)' : g === 'email' ? 'correo' : opinion ? 'texto de opinión' : 'texto expositivo (artículo o explicación)';
        const intent = g === 'story' ? 'contar una historia y entretener' : g === 'email' ? 'pedir algo o informar a alguien' : opinion ? 'convencer al lector de una idea' : 'informar o explicar un tema';
        return { words: ws.length, sentences: ss.length, paragraphs: ps.length, minutes: Math.max(1, Math.round(ws.length / 150)), avg: Math.round(avg), level, type, intent, genre: g };
    }

    /* ---------- Palabras clave: las palabras de contenido más repetidas ---------- */
    function keywords(text, n) {
        const count = new Map(); const first = new Map(); const shown = new Map();
        words(text).forEach((w, i) => {
            const s = stem(w);
            if (s.length < 4 || STOP.has(s) || STOP.has(w.toLowerCase()) || IRR_PART.has(s) || IRR_PAST.has(s)) return;
            count.set(s, (count.get(s) || 0) + 1);
            if (!first.has(s)) { first.set(s, i); shown.set(s, w.toLowerCase()); }
        });
        // un verbo que aparece una sola vez no es tema del texto ("become"); si se repite, sí ("work")
        [...count.keys()].forEach((k) => { if (count.get(k) < 2 && (VERBS.has(k) || /(?:ed|ing)$/.test(k))) count.delete(k); });
        // más repetidas primero; a igual frecuencia, las más largas (suelen ser las de contenido)
        return [...count.keys()].sort((a, b) => count.get(b) - count.get(a) || b.length - a.length || first.get(a) - first.get(b)).slice(0, n || 6).map((s) => ({ stem: s, word: shown.get(s) }));
    }

    /* ¿Qué palabras clave menciona una respuesta? En inglés compara raíces; en español usa el glosario */
    function covers(answer, keys) {
        const mine = new Set(words(answer).map(stem));
        const low = String(answer).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        // cognados: comité ~ committee, decisión ~ decision (mismo comienzo de 5 letras)
        const esWords = low.match(/[a-zñ]{5,}/g) || [];
        return keys.filter((k) => {
            if (mine.has(k.stem)) return true;
            const one = (w) => w.replace(/(.)\1/g, '$1').slice(0, 5);
            if (k.stem.length >= 5 && esWords.some((w) => one(w) === one(k.stem))) return true;
            const h = G && G.lookup(k.word);
            return !!(h && h.senses.some((s) => s.es.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[,;/]| o /).map((x) => x.trim()).some((x) => x.length > 3 && low.includes(x))));
        });
    }

    /* ---------- 0.1.6 Estructura de una oración ---------- */
    const MODAL = { can: 'poder (capacidad o permiso)', could: 'podría / pudo', should: 'debería (consejo)', must: 'deber (obligación)', may: 'quizá / poder (permiso)', might: 'quizá (posibilidad)', would: 'condicional (-ría)', shall: 'futuro formal' };
    const BE = /^(?:am|is|are|was|were|be|been|being)$/;
    const HAVE = /^(?:have|has|had|having)$/;
    const DO = /^(?:do|does|did)$/;
    const IRR_PART = new Set('gone done written seen taken given come spoken begun known chosen eaten broken driven made found told said thought understood become left felt kept met brought bought been had sent built paid run won lost held heard taught put set cut read grown drawn shown'.split(' '));
    const IRR_PAST = new Set('went did had was were wrote saw took gave came spoke began knew chose ate broke drove sent made got found told said thought understood ran became left felt kept met brought bought caught fell flew heard held lost sat slept stood swam woke won sang threw taught grew drew spent built paid rode hid fought forgot put cut read'.split(' '));
    const VERBS = new Set('be have do go get make take give come see know think say tell find feel become leave keep meet bring buy work study live want need like love use help start begin stop try ask answer call show play move believe happen write read provide lose pay include continue learn change understand watch follow create speak spend walk teach offer remember consider wait send expect build stay remain suggest pass require report decide explain finish attend hope depend agree arrive allow lead grow open close discover explore visit travel return value recommend separate produce reduce increase improve affect cause develop discuss describe compare prefer seem look sound appear raise postpone submit assess approve receive invite announce prepare protect support'.split(' '));
    const isVerbWord = (w) => {
        const x = w.toLowerCase();
        if (BE.test(x) || HAVE.test(x) || DO.test(x) || MODAL[x] || x === 'will' || IRR_PAST.has(x) || IRR_PART.has(x) || VERBS.has(x)) return true;
        if (/ies$/.test(x) && VERBS.has(`${x.slice(0, -3)}y`)) return true;
        if (/e?s$/.test(x) && (VERBS.has(x.slice(0, -1)) || VERBS.has(x.slice(0, -2)))) return true;
        if (/ed$/.test(x) && x.length > 4) return true;
        if (/ing$/.test(x) && x.length > 5) return true;
        return false;
    };
    const isPart = (w) => IRR_PART.has(w) || (/ed$/.test(w) && w.length > 4);
    const isIng = (w) => /ing$/.test(w) && w.length > 4;
    const CONNECTORS = [
        ['however', 'sin embargo', 'contraste'], ['although', 'aunque', 'contraste'], ['though', 'aunque', 'contraste'], ['but', 'pero', 'contraste'], ['while', 'mientras / aunque', 'tiempo o contraste'],
        ['because', 'porque', 'causa'], ['since', 'ya que / desde', 'causa o tiempo'], ['so', 'así que', 'consecuencia'], ['therefore', 'por lo tanto', 'consecuencia'], ['as a result', 'como resultado', 'consecuencia'],
        ['and', 'y', 'suma'], ['in addition', 'además', 'suma'], ['moreover', 'además', 'suma'], ['also', 'también', 'suma'], ['such as', 'como (ejemplo)', 'ejemplo'], ['for example', 'por ejemplo', 'ejemplo'],
        ['when', 'cuando', 'tiempo'], ['after', 'después de', 'tiempo'], ['before', 'antes de', 'tiempo'], ['until', 'hasta (que)', 'tiempo'], ['then', 'luego', 'tiempo'],
        ['if', 'si', 'condición'], ['unless', 'a menos que', 'condición'], ['which', 'que / el cual', 'relativo'], ['who', 'que / quien', 'relativo'], ['that', 'que', 'relativo o completivo'], ['not', 'no', 'negación']
    ];
    const PREPS = ['in', 'on', 'at', 'for', 'with', 'about', 'to', 'from', 'of', 'by', 'during', 'into', 'between', 'without', 'through', 'under', 'over'];
    const SUBORD = new Set(['because', 'although', 'though', 'when', 'if', 'which', 'who', 'while', 'until', 'since', 'unless', 'that', 'before', 'after']);

    function tenseOf(vp, all) {
        const has = (rx) => vp.some((w) => rx.test(w));
        const at = (i) => vp[i] || '';
        const v0 = at(0);
        if (v0 === 'would' && at(1) === 'have' && isPart(at(2))) return { en: 'Condicional perfecto (would have + participio)', es: 'habría + participio (“habría venido”)' };
        if (v0 === 'will') return BE.test(at(1)) && isPart(at(2)) ? { en: 'Futuro en voz pasiva (will be + participio)', es: 'será + participio' } : { en: 'Futuro simple (will + verbo)', es: 'futuro (“trabajaré”)' };
        if (MODAL[v0]) return { en: `Verbo modal “${v0}” + verbo base`, es: `${MODAL[v0]}; en inglés el verbo que sigue va sin “to”` };
        if (v0 === 'had' && isPart(at(1))) return { en: 'Pasado perfecto (had + participio)', es: 'había + participio (“había terminado”)' };
        if (HAVE.test(v0) && at(1) === 'been' && isIng(at(2))) return { en: 'Presente perfecto continuo (have/has been + -ing)', es: 'lleva + gerundio (“lleva trabajando”)' };
        if (HAVE.test(v0) && at(1) === 'been' && isPart(at(2))) return { en: 'Presente perfecto en voz pasiva', es: 'ha sido + participio' };
        if (/^(?:have|has)$/.test(v0) && isPart(at(1))) return { en: 'Presente perfecto (have/has + participio)', es: 'he/ha + participio (“ha descubierto”)' };
        if (/^(?:am|is|are)$/.test(v0) && isIng(at(1))) return { en: 'Presente continuo (am/is/are + -ing)', es: 'está + gerundio (“está trabajando”)' };
        if (/^(?:was|were)$/.test(v0) && isIng(at(1))) return { en: 'Pasado continuo (was/were + -ing)', es: 'estaba + gerundio (“estaba leyendo”)' };
        if (/^(?:am|is|are)$/.test(v0) && isPart(at(1))) return { en: 'Voz pasiva en presente (is/are + participio)', es: 'es/son + participio, o “se” + verbo (“se considera”)' };
        if (/^(?:was|were)$/.test(v0) && isPart(at(1))) return { en: 'Voz pasiva en pasado (was/were + participio)', es: 'fue/fueron + participio (“fue aprobado”)' };
        if (/^(?:was|were)$/.test(v0)) return { en: 'Pasado del verbo be', es: 'era / estaba / fue' };
        if (/^(?:am|is|are)$/.test(v0)) return { en: 'Presente del verbo be', es: 'es / está' };
        if (v0 === 'did') return { en: 'Pasado simple con “did” (negación o pregunta)', es: 'pasado (“no fue”, “¿fue?”)' };
        if (/^(?:do|does)$/.test(v0)) return { en: 'Presente simple con “do/does” (negación o pregunta)', es: 'presente (“no trabaja”)' };
        if (IRR_PAST.has(v0) || (/ed$/.test(v0) && v0.length > 4)) return { en: 'Pasado simple', es: 'pretérito (“descubrió”, “trabajó”)' };
        if (has(/^had$/)) return { en: 'Pasado del verbo have', es: 'tenía / tuvo' };
        return { en: 'Presente simple', es: `presente (“trabaja”)${all && /s$/.test(v0) ? '; con he/she/it el verbo lleva -s' : ''}` };
    }

    function analyze(sentence) {
        const raw = String(sentence).trim();
        const toks = raw.split(/\s+/);
        const clean = (w) => w.toLowerCase().replace(/^[^a-z']+|[^a-z']+$/g, '');
        const notes = [];
        // Inversión condicional ("Had I known, …" = "If I had known, …")
        if (/^(had|were|should)\s+(i|you|he|she|it|we|they)\b/i.test(raw)) notes.push(`Empieza con una inversión: “${toks.slice(0, 3).join(' ').replace(/,$/, '')}” equivale a “If ${toks[1] === 'I' ? 'I' : toks[1].toLowerCase()} ${toks[0].toLowerCase()} ${clean(toks[2])}” (condición).`);
        // Si hay una frase introductoria con coma al inicio, la oración principal empieza después
        let startAt = 0;
        const comma = toks.findIndex((w) => /,$/.test(w));
        const inverted = notes.length > 0;
        if (comma >= 0 && comma < 7 && (inverted || !toks.slice(0, comma + 1).some((w, i) => i > 0 && isVerbWord(clean(w)) && !/ing$/.test(clean(w))))) { startAt = comma + 1; if (!notes.length) notes.push(`“${toks.slice(0, comma + 1).join(' ').replace(/,$/, '')}” es una frase introductoria: da contexto (tiempo, condición o contraste) antes de la idea principal.`); }
        let vi = -1;
        for (let i = startAt; i < toks.length; i += 1) {
            const w = clean(toks[i]);
            if (!w || (i > startAt && clean(toks[i - 1]) === 'to')) continue;
            if (isVerbWord(w) && !(i === startAt && /ing$/.test(w)) && !(/ed$/.test(w) && i > startAt && /^(the|a|an|his|her|their|my|our|its)$/.test(clean(toks[i - 1])))) { vi = i; break; }
        }
        if (vi < 0) return { ok: false, sentence: raw, notes };
        // "remote work also creates": un verbo base seguido de otro verbo conjugado era un sustantivo
        const bare = clean(toks[vi]);
        if (VERBS.has(bare) && !BE.test(bare) && !HAVE.test(bare) && !DO.test(bare)) {
            for (let k = vi + 1; k <= vi + 3 && k < toks.length; k += 1) {
                const w = clean(toks[k]);
                if (/^(always|never|often|also|still|usually|already|just|really)$/.test(w)) continue;
                if (BE.test(w) || HAVE.test(w) || MODAL[w] || w === 'will' || (isVerbWord(w) && /(?:s|ed)$/.test(w) && !/ss$/.test(w))) vi = k;
                break;
            }
        }
        const subject = toks.slice(startAt, vi).join(' ').replace(/\s+(?:always|never|often|also|still|usually|already|just|really)$/i, '');
        const vp = []; let j = vi;
        while (j < toks.length) {
            const w = clean(toks[j]);
            const aux = BE.test(w) || HAVE.test(w) || DO.test(w) || MODAL[w] || w === 'will' || w === 'not' || /^(always|never|often|also|still|usually|already|just|really)$/.test(w);
            if (j === vi || aux) { if (w !== 'not' && !/^(always|never|often|also|still|usually|already|just|really)$/.test(w)) vp.push(w); j += 1; if (/,$/.test(toks[j - 1])) break; continue; }
            if (isVerbWord(w)) { vp.push(w); j += 1; }
            break;
        }
        const rest = toks.slice(j).join(' ');
        const low = ` ${raw.toLowerCase().replace(/[^a-z' ]/g, ' ')} `;
        const connectors = CONNECTORS.filter(([en]) => low.includes(` ${en} `)).map(([en, es, role]) => ({ en, es, role }));
        const preps = PREPS.filter((p) => low.includes(` ${p} `));
        const articles = ['the', 'a', 'an'].filter((p) => low.includes(` ${p} `));
        const subs = connectors.filter((c) => SUBORD.has(c.en));
        const tense = tenseOf(vp, true);
        return { ok: true, sentence: raw, subject: subject || '(implícito: es una orden o el sujeto viene antes)', verb: toks.slice(vi, j).join(' ').replace(/[,.;:!?]+$/, ''), rest: rest.replace(/[.!?]+$/, ''), tense, connectors, preps, articles, subs, notes, words: toks.length };
    }

    /* ---------- 0.1.7 Preguntas con el propio texto ---------- */
    function cloze(text, used, usedS) {
        const keys = keywords(text, 12);
        const all = sentencesOf(text); const ss = all.filter((s, i) => words(s).length >= 7 && (all.length < 4 || i > 0));
        for (const k of keys) {
            if (used && used.includes(k.stem)) continue;
            const s = ss.find((x) => words(x).some((w) => stem(w) === k.stem) && !(usedS || []).includes(x));
            if (!s) continue;
            const w = words(s).find((x) => stem(x) === k.stem);
            const i = s.search(new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`));
            return { stem: k.stem, answer: w, sentence: s, gap: `${s.slice(0, i)}_____${s.slice(i + w.length)}`, para: paragraphsOf(text).list.findIndex((p) => p.includes(s)) };
        }
        return null;
    }
    const sameWord = (a, b) => stem(String(a).trim().replace(/[.,;:!?"“”]/g, '')) === stem(b);
    const copied = (mine, text) => {
        const ws = words(mine).map((w) => w.toLowerCase()); if (ws.length < 5) return false;
        return sentencesOf(text).some((s) => { const o = new Set(words(s).map((w) => w.toLowerCase())); return ws.filter((w) => o.has(w)).length / ws.length >= 0.8; });
    };

    window.Reading = { stats, keywords, covers, analyze, cloze, sameWord, copied, paragraphsOf, sentencesOf, words, stem };
})();
