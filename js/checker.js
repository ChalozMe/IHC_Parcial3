/* ============================================================
   Checker · revisor de inglés por reglas
   Analiza CUALQUIER texto que escriba la persona. No usa IA ni red:
   solo encuentra los errores que describen estas reglas.
   ============================================================ */
(function () {
    'use strict';

    const KINDS = {
        grammar: 'Gramática',
        vocab: 'Vocabulario',
        tone: 'Tono',
        clarity: 'Claridad'
    };

    /* ---------- Utilidades ---------- */
    const each = (text, rx, fn) => {
        const out = [];
        rx.lastIndex = 0;
        let m;
        while ((m = rx.exec(text))) {
            if (m[0] === '') { rx.lastIndex += 1; continue; }
            const r = fn(m, text);
            if (r) {
                const start = m.index + (r.offset || 0);
                out.push({ start, end: start + (r.length || m[0].length), fixes: r.fixes || (r.fix ? [r.fix] : []) });
            }
        }
        return out;
    };
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const like = (model, s) => (/^[A-Z]/.test(model) && !/^I\b/.test(model) ? cap(s) : s);
    const before = (text, i, n) => text.slice(Math.max(0, i - (n || 30)), i).toLowerCase();

    const ABBR = /\b(?:dr|mr|mrs|ms|prof|st|no|etc|e\.g|i\.e|a\.m|p\.m)\.$/i;
    function sentences(text) {
        const out = [];
        let start = 0;
        for (let i = 0; i < text.length; i += 1) {
            const ch = text[i];
            const end = ch === '\n'
                || ('.!?'.includes(ch) && (i + 1 >= text.length || /[\s"”')]/.test(text[i + 1])) && !ABBR.test(text.slice(start, i + 1)));
            if (end) {
                const raw = text.slice(start, i + 1);
                const lead = raw.length - raw.trimStart().length;
                const body = raw.trim();
                if (body) out.push({ start: start + lead, end: start + lead + body.length, text: body });
                start = i + 1;
            }
        }
        const raw = text.slice(start);
        const body = raw.trim();
        if (body) {
            const lead = raw.length - raw.trimStart().length;
            out.push({ start: start + lead, end: start + lead + body.length, text: body });
        }
        return out;
    }
    const sentenceAt = (text, i) => (sentences(text).find((s) => i >= s.start && i < s.end) || { text: text.trim() }).text;

    /* ---------- Formas verbales ---------- */
    const BASE = 'have go do need want like work study live know think make take get give come see use find tell ask feel become leave call try start help show play move believe bring happen write provide lose pay meet include continue learn change understand watch follow stop create speak spend walk teach offer remember consider buy wait send expect build stay remain suggest pass require report decide explain finish attend request hope depend agree say begin arrive'.split(' ');
    const third = (v) => (v === 'have' ? 'has' : /(?:s|sh|ch|x|o)$/.test(v) ? `${v}es` : /[^aeiou]y$/.test(v) ? `${v.slice(0, -1)}ies` : `${v}s`);
    const ing = (v) => (v === 'be' ? 'being' : /ie$/.test(v) ? `${v.slice(0, -2)}ying` : /[^e]e$/.test(v) ? `${v.slice(0, -1)}ing` : /^(?:get|stop|begin)$/.test(v) ? `${v}${v.slice(-1)}ing` : `${v}ing`);
    const PAST = { went: 'go', did: 'do', had: 'have', was: 'be', were: 'be', wrote: 'write', saw: 'see', took: 'take', gave: 'give', came: 'come', spoke: 'speak', began: 'begin', knew: 'know', chose: 'choose', ate: 'eat', broke: 'break', drove: 'drive', sent: 'send', made: 'make', got: 'get', found: 'find', told: 'tell', said: 'say', thought: 'think', understood: 'understand', received: 'receive', finished: 'finish', studied: 'study', wanted: 'want', needed: 'need', worked: 'work', attended: 'attend', submitted: 'submit', completed: 'complete', asked: 'ask', answered: 'answer', arrived: 'arrive', passed: 'pass', learned: 'learn', used: 'use', liked: 'like', lived: 'live', explained: 'explain', sends: 'send', goes: 'go', has: 'have', needs: 'need', wants: 'want', works: 'work', studies: 'study', knows: 'know', makes: 'make', takes: 'take', gives: 'give', helps: 'help', writes: 'write', attends: 'attend', finishes: 'finish' };
    const PART = { went: 'gone', did: 'done', wrote: 'written', saw: 'seen', took: 'taken', gave: 'given', came: 'come', spoke: 'spoken', began: 'begun', knew: 'known', chose: 'chosen', ate: 'eaten', broke: 'broken', drove: 'driven' };
    const OBJ = { he: 'him', she: 'her', they: 'them', we: 'us', i: 'me' };
    const base = BASE.join('|');
    const AUX = /\b(?:do|does|did|can|could|will|would|should|may|might|must|shall|to|let|lets|make|makes|made|help|helps|helped|see|saw|hear|heard|that|suggest|recommend|if)\s+(?:the\s+)?$/;

    /* ---------- Listas ---------- */
    const SPELL = { recieve: 'receive', recieved: 'received', becouse: 'because', beacuse: 'because', becuase: 'because', tomorow: 'tomorrow', tommorow: 'tomorrow', wich: 'which', writting: 'writing', untill: 'until', definately: 'definitely', necesary: 'necessary', neccesary: 'necessary', posible: 'possible', imposible: 'impossible', diferent: 'different', comunication: 'communication', profesor: 'professor', proffesor: 'professor', adress: 'address', oportunity: 'opportunity', responsability: 'responsibility', sincerly: 'sincerely', sincerelly: 'sincerely', atached: 'attached', atach: 'attach', knowlege: 'knowledge', realy: 'really', allways: 'always', togheter: 'together', foward: 'forward', comming: 'coming', begining: 'beginning', studing: 'studying', inmediately: 'immediately', inconvinience: 'inconvenience', inconvenient: null, importan: 'important', expecially: 'especially', experiance: 'experience', enviroment: 'environment', goverment: 'government', sugestion: 'suggestion', apreciate: 'appreciate', acommodate: 'accommodate', sucess: 'success', succesful: 'successful', occured: 'occurred', truely: 'truly', greatful: 'grateful', thier: 'their', freind: 'friend', wether: 'whether', asignment: 'assignment', asigment: 'assignment', extention: 'extension', aproval: 'approval', aprove: 'approve', comitee: 'committee', carrer: 'career', semestre: 'semester', univercity: 'university', universty: 'university', schollarship: 'scholarship', scolarship: 'scholarship' };
    Object.keys(SPELL).forEach((k) => { if (!SPELL[k]) delete SPELL[k]; });
    const CAPS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'january', 'february', 'april', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'english', 'spanish', 'french', 'german', 'peruvian', 'american', 'peru', 'lima', 'arequipa'];
    const CONTR = { "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "can't": 'cannot', "couldn't": 'could not', "won't": 'will not', "wouldn't": 'would not', "shouldn't": 'should not', "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not', "haven't": 'have not', "hasn't": 'has not', "hadn't": 'had not', "i'm": 'I am', "i've": 'I have', "i'll": 'I will', "i'd": 'I would', "you're": 'you are', "you've": 'you have', "you'll": 'you will', "we're": 'we are', "we've": 'we have', "we'll": 'we will', "they're": 'they are', "they've": 'they have', "it's": 'it is', "that's": 'that is', "there's": 'there is', "he's": 'he is', "she's": 'she is', "what's": 'what is', "let's": 'let us' };
    const INFORMAL = { hi: 'Dear', hey: 'Dear', thanks: 'Thank you', thx: 'Thank you', gonna: 'going to', wanna: 'want to', gotta: 'have to', kids: 'children', guys: 'everyone', asap: 'as soon as possible', cuz: 'because', btw: 'in addition', pls: 'please', plz: 'please', yeah: 'yes', ok: 'acceptable', okay: 'acceptable', awesome: 'excellent', cool: 'interesting', bye: 'Sincerely', sorry: 'I apologize' };
    const UNC = { informations: 'information', advices: 'advice', homeworks: 'homework', equipments: 'equipment', knowledges: 'knowledge', feedbacks: 'feedback', furnitures: 'furniture', softwares: 'software', researches: 'research', luggages: 'luggage', evidences: 'evidence', progresses: null };
    delete UNC.progresses;
    const VAGUE = { 'very good': ['excellent', 'outstanding'], 'very bad': ['poor', 'serious'], 'very important': ['essential', 'crucial'], 'very big': ['considerable', 'substantial'], 'very difficult': ['challenging', 'demanding'], 'very tired': ['exhausted'], 'a lot of': ['many', 'much', 'a great deal of'], 'lots of': ['many', 'much'], things: ['aspects', 'topics', 'matters'], stuff: ['material', 'content'], nice: ['pleasant', 'helpful'] };
    const PREP = [
        ['depend(s|ed)? of', 'depend$1 on'], ['depending of', 'depending on'], ['interested (?:on|for)', 'interested in'], ['married with', 'married to'],
        ['consist(s|ed)? (?:in|on)', 'consist$1 of'], ['arrive(s|d)? to', 'arrive$1 at'], ['participate(s|d)? of', 'participate$1 in'], ['discuss(es|ed)? about', 'discuss$1'],
        ['according with', 'according to'], ['in the weekend', 'at the weekend'], ['in monday', 'on Monday'], ['in tuesday', 'on Tuesday'], ['in wednesday', 'on Wednesday'], ['in thursday', 'on Thursday'], ['in friday', 'on Friday'],
        ['responsible of', 'responsible for'], ['different of', 'different from'], ['explain(s|ed)? (me|us|him|her|them)', 'explain$1 to $2'], ['listen(s|ed)? (?=music|the|my|your)', 'listen$1 to '],
        ['think(s)? in (?=the|my|your|a )', 'think$1 about '], ['capable to', 'capable of'], ['congratulations for', 'congratulations on'], ['enter(s|ed)? to the', 'enter$1 the'], ['ask(s|ed)? for (?=you |him |her |them )', null]
    ].filter((p) => p[1] !== null);
    const COLL = [
        ['make(s)? (a|some|the|my) questions?', (m) => `ask${m[1] || ''} ${m[2]} question${/s$/.test(m[0]) ? 's' : ''}`], ['made (a|some|the|my) questions?', (m) => `asked ${m[1]} question${/s$/.test(m[0]) ? 's' : ''}`],
        ['(?:do|does) a question', () => 'ask a question'], ['(do|does|did) (a|some|the|many) mistakes?', (m) => `${{ do: 'make', does: 'makes', did: 'made' }[m[1].toLowerCase()]} ${m[2]} mistake${/s$/.test(m[0]) ? 's' : ''}`],
        ['(make|makes|made) (?:(my|the|his|her) )?homework', (m) => `${{ make: 'do', makes: 'does', made: 'did' }[m[1].toLowerCase()]} ${m[2] ? `${m[2]} ` : ''}homework`],
        ['(make|makes|made) (an|the|my) exam', (m) => `${{ make: 'take', makes: 'takes', made: 'took' }[m[1].toLowerCase()]} ${m[2]} exam`],
        ['(said|say|says) (me|you|him|her|us|them)\\b(?! (?:and|or))', (m) => `${{ said: 'told', say: 'tell', says: 'tells' }[m[1].toLowerCase()]} ${m[2]}`],
        ['(have|had) (a|some) doubts? about', (m) => `${m[1]} ${m[2]} question${m[2] === 'some' ? 's' : ''} about`], ['take(s)? a decision', (m) => `make${m[1] || ''} a decision`], ['took a decision', () => 'made a decision'], ['(do|did) an? effort', (m) => `${m[1].toLowerCase() === 'did' ? 'made' : 'make'} an effort`]
    ];
    const FALSE = [
        ['(assist|assisted|assists) to (?=the|my|your|a |class|all)', (m) => `${{ assist: 'attend', assisted: 'attended', assists: 'attends' }[m[1].toLowerCase()]} `],
        ['(realize|realized|realizes) (a|an|the|my|this|our) (project|work|activity|exam|practice|essay|presentation|study|task)', (m) => `${{ realize: 'carry out', realized: 'carried out', realizes: 'carries out' }[m[1].toLowerCase()]} ${m[2]} ${m[3]}`],
        ['(approve|approved) (the|my|an|this|all the|all my) (exams?|courses?|subjects?|class(?:es)?)', (m) => `${m[1].toLowerCase() === 'approve' ? 'pass' : 'passed'} ${m[2]} ${m[3]}`],
        ['in the actuality', () => 'currently'], ['(molest|molested) you', (m) => `${m[1].toLowerCase() === 'molest' ? 'bother' : 'bothered'} you`],
        ['wait (?:for )?your (?:answer|response|reply)', () => 'look forward to your reply'], ['my actual (job|address|phone|teacher|course|semester|situation)', (m) => `my current ${m[1]}`],
        ['(?:a|the) success (?:that )?happened', () => 'an event happened'], ['pretend to (study|finish|travel|apply|work|graduate)', (m) => `intend to ${m[1]}`]
    ];
    const PLNOUN = 'exam day week month year student course project document question hour subject book email teacher problem reason semester assignment page minute error'.split(' ');
    const plural = (n) => (/[^aeiou]y$/.test(n) ? `${n.slice(0, -1)}ies` : /(?:s|x|ch|sh)$/.test(n) ? `${n}es` : `${n}s`);
    const NUM = 'two|three|four|five|six|seven|eight|nine|ten|many|several|[2-9]|[1-9]\\d+';

    const listRule = (dict) => (text) => each(text, new RegExp(`\\b(${Object.keys(dict).sort((a, b) => b.length - a.length).join('|')})\\b`, 'gi'), (m) => ({ fix: like(m[0], dict[m[0].toLowerCase()]) }));
    const pairRule = (pairs) => (text) => pairs.reduce((acc, [src, rep]) => acc.concat(each(text, new RegExp(`\\b${src}`, 'gi'), (m) => {
        const fix = typeof rep === 'function' ? rep(m) : m[0].replace(new RegExp(src, 'i'), (...a) => rep.replace(/\$(\d)/g, (_, n) => a[Number(n)] || ''));
        return { fix: like(m[0], fix) };
    })), []);

    /* ---------- Reglas ----------
       type: 'error' (se registra y se practica) | 'idea' (mejora opcional) */
    const RULES = [
        {
            id: 'agree', kind: 'grammar', name: '“Agree” sin “be”',
            hint: '“Agree” ya es un verbo. ¿Necesita otro verbo delante?',
            why: '“Agree” es un verbo completo: no lleva “am”, “is” ni “are”.',
            bad: 'I am agree with the plan.', good: 'I agree with the plan.',
            find: (t) => each(t, /\b(am|is|are|was|were)\s+(not\s+)?agree\b/gi, (m) => {
                const v = m[1].toLowerCase(); const not = m[2];
                const fix = not ? ({ am: 'do not agree', are: 'do not agree', is: 'does not agree', was: 'did not agree', were: 'did not agree' })[v] : ({ am: 'agree', are: 'agree', is: 'agrees', was: 'agreed', were: 'agreed' })[v];
                return { fix };
            })
        },
        {
            id: 'third', kind: 'grammar', name: 'Tercera persona (-s)',
            hint: 'Mira el sujeto: es una sola persona o cosa. ¿Qué le falta al verbo?',
            why: 'En presente, con he, she, it o un sujeto singular, el verbo lleva -s o -es.',
            bad: 'She work in the library.', good: 'She works in the library.',
            find: (t) => each(t, new RegExp(`\\b(he|she)\\s+(?:(always|usually|often|never|also|still|really)\\s+)?(${base})\\b(?!['’])`, 'gi'), (m, x) => {
                if (AUX.test(before(x, m.index))) return null;
                const off = m[0].length - m[3].length;
                return { offset: off, length: m[3].length, fix: third(m[3].toLowerCase()) };
            }).concat(each(t, /(^|[.!?\n]\s*|\b(?:and|but|because|so)\s+|,\s*)(it)\s+(need|work|include|require|depend|start|help|take|make|seem|look|mean|cost|contain)\b/gi, (m) => ({ offset: m[0].length - m[3].length, length: m[3].length, fix: third(m[3].toLowerCase()) })))
                .concat(each(t, /\b(?:my|the|our|his|her|this|your)\s+(?:professor|teacher|friend|brother|sister|mother|father|boss|university|company|course|project|student|deadline|document|report|exam)\s+(have|go|want|know|think|give|say|begin|explain|finish|include|require|need|depend|start)\b/gi, (m, x) => {
                    if (/\b(?:do|does|did|can|could|will|would|should|may|might|must|let|make|makes|made|help|helps|helped|that|of|and|or)\s+$/.test(before(x, m.index))) return null;
                    return { offset: m[0].length - m[1].length, length: m[1].length, fix: third(m[1].toLowerCase()) };
                }))
        },
        {
            id: 'concord', kind: 'grammar', name: 'Concordancia con be y have',
            hint: 'Comprueba si el sujeto es singular o plural. ¿El verbo coincide?',
            why: 'I am/have/was · he, she, it is/has/was · you, we, they y los plurales are/have/were.',
            bad: 'The students is ready.', good: 'The students are ready.',
            find: (t) => each(t, /\b(I|[Yy]ou|[Ww]e|[Tt]hey)\s+(is|has|was)\b/g, (m, x) => {
                const s = m[1].toLowerCase(); const v = m[2];
                if (s === 'i' && v === 'was') return null;
                if (/\b(?:of|than|like|between|for|with|to)\s+$/.test(before(x, m.index))) return null;
                const fix = v === 'has' ? 'have' : s === 'i' ? 'am' : v === 'is' ? 'are' : 'were';
                return { offset: m[0].length - v.length, length: v.length, fix };
            }).concat(each(t, /\b(I)\s+(are|were)\b/g, (m, x) => (/\b(?:if|wish|though|and|than)\s+$/.test(before(x, m.index)) ? null : { offset: 2, length: m[2].length, fix: m[2] === 'are' ? 'am' : 'was' })))
                .concat(each(t, /\b(he|she|it)\s+(are|have|were|am)\b/gi, (m, x) => {
                    if (m[2] === 'have') return null;
                    if (/\b(?:if|wish|and|or)\s+$/.test(before(x, m.index))) return null;
                    return { offset: m[0].length - m[2].length, length: m[2].length, fix: m[2] === 'were' ? 'was' : 'is' };
                }))
                .concat(each(t, /\b(people|children|students|teachers|professors|exams|classes|documents|courses|results|deadlines|men|women)\s+(is|was|has)\b/gi, (m, x) => {
                    if (/\b(?:of|with|for|between|about|to|from|in)\s+(?:the\s+|my\s+|our\s+|your\s+|these\s+)?$/.test(before(x, m.index))) return null;
                    return { offset: m[0].length - m[2].length, length: m[2].length, fix: { is: 'are', was: 'were', has: 'have' }[m[2].toLowerCase()] };
                }))
        },
        {
            id: 'want', kind: 'grammar', name: 'Want + persona + to',
            hint: 'Después de “want” y la persona falta una palabra antes del verbo.',
            why: 'Se dice want + persona + to + verbo: “I want you to help me”.',
            bad: 'I want you give me more time.', good: 'I want you to give me more time.',
            find: (t) => each(t, new RegExp(`\\b(want|wants|wanted|need|needs)\\s+(?:that\\s+)?(you|he|she|they|we|I|him|her|them|us|me)\\s+(${base})\\b`, 'gi'), (m) => ({ fix: `${m[1]} ${OBJ[m[2].toLowerCase()] || m[2]} to ${m[3]}` }))
        },
        {
            id: 'bebase', kind: 'grammar', name: 'Be + verbo sin -ing',
            hint: 'Hay dos verbos seguidos. ¿Es una acción en curso o algo habitual?',
            why: 'Usa be + verbo con -ing (I am studying) o solo el verbo (I study).',
            bad: 'I am study engineering.', good: 'I am studying engineering.',
            find: (t) => each(t, /\b(I am|you are|we are|they are|he is|she is)\s+(study|need|want|live|go|have|think|know|attend|finish|write|send|work|learn|prepare)\b/gi, (m) => {
                const s = m[1].split(' ')[0]; const v = m[2].toLowerCase(); const t3 = /^(?:he|she)$/i.test(s);
                const stative = /^(?:need|want|have|know|think)$/.test(v);
                const a = `${m[1]} ${ing(v)}`; const b = `${s} ${t3 ? third(v) : v}`;
                return { fixes: stative ? [b] : [a, b] };
            })
        },
        {
            id: 'age', kind: 'grammar', name: 'Edad con “be”',
            hint: 'En inglés la edad no se “tiene”. ¿Qué verbo se usa?',
            why: 'La edad se expresa con be: “I am 20 years old”.',
            bad: 'I have 20 years.', good: 'I am 20 years old.',
            find: (t) => each(t, /\b(I|you|we|they|he|she)\s+(have|has|had)\s+(\d{1,2}|eighteen|nineteen|twenty(?:[- ]\w+)?|thirty)\s+years(?:\s+old)?\b(?!\s+(?:of|in\s+(?!19|20)|to|left|experience|working))/gi, (m) => {
                const s = m[1]; const past = /had/i.test(m[2]); const l = s.toLowerCase();
                const be = past ? (/^(?:you|we|they)$/.test(l) ? 'were' : 'was') : l === 'i' ? 'am' : /^(?:he|she)$/.test(l) ? 'is' : 'are';
                return { fix: `${s} ${be} ${m[3]} years old` };
            })
        },
        {
            id: 'since', kind: 'grammar', name: 'For y since',
            hint: '¿Indicas cuánto tiempo dura o en qué momento empezó?',
            why: '“For” + duración (for two years); “since” + momento de inicio (since 2022).',
            bad: 'I have studied here since two years.', good: 'I have studied here for two years.',
            find: (t) => each(t, /\bsince\s+((?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|many|several|a few)\s+(?:days?|weeks?|months?|years?|hours?))\b(?!\s+ago)/gi, (m) => ({ fix: `${like(m[0], 'for')} ${m[1]}` }))
                .concat(each(t, /\bfor\s+((?:19|20)\d\d|(?:last\s+(?:week|month|year|monday|friday)))\b(?=\s*[.,\n]|$)/gi, (m) => (/\b(?:have|has|had)\b/i.test(sentenceAt(t, m.index)) ? { fix: `since ${m[1]}` } : null)))
        },
        {
            id: 'article', kind: 'grammar', name: 'A / an',
            hint: 'Di la siguiente palabra en voz baja: ¿empieza con sonido de vocal?',
            why: '“An” va antes de sonido de vocal (an exam, an hour); “a” antes de sonido de consonante (a university).',
            bad: 'I have a exam.', good: 'I have an exam.',
            find: (t) => each(t, /\b(a)\s+([aeiou][a-z]+|hour|hours|honest|honor|heir)\b/gi, (m) => {
                if (/^(?:uni(?!n|m)|use|usu|eu|one|once|ut[ei])/i.test(m[2]) || m[1] === 'A' && m.index > 0 && !/[.!?\n]\s*$/.test(t.slice(0, m.index))) return null;
                return { length: 1, fix: like(m[1], 'an') };
            }).concat(each(t, /\b(an)\s+((?!hour|honest|honor|heir)[bcdfghjklmnpqrstvwxyz][a-z]+|uni(?:versity|versal|form|on|que|t)\w*|useful|european|user|one)\b/gi, (m) => (/^[A-Z]{2,}$/.test(m[2]) ? null : { length: 2, fix: like(m[1], 'a') })))
        },
        {
            id: 'baseform', kind: 'grammar', name: 'Verbo base después de modal y did',
            hint: 'Después de can, could, must o did, ¿en qué forma va el verbo?',
            why: 'Después de un modal o de do/does/did (not) va el verbo base, sin “to”, -s ni pasado.',
            bad: 'I did not went to class.', good: 'I did not go to class.',
            find: (t) => each(t, /\b(can|could|must|should|will|would|may|might|cannot)\s+(?:(not|you|I|we|he|she|they)\s+)?to\s+([a-z]+)\b/gi, (m) => ({ fix: `${m[1]} ${m[2] ? `${m[2]} ` : ''}${m[3]}` }))
                .concat(each(t, new RegExp(`\\b(did not|didn't|does not|doesn't|do not|don't|can|could|cannot|can't|could not|must|should|will|would|may|might)\\s+(${Object.keys(PAST).join('|')})\\b`, 'gi'), (m, x) => {
                    if (/\b(?:the|this|that|a)\s+$/.test(before(x, m.index)) && /^(?:can|will|might)$/i.test(m[1])) return null;
                    return { fix: `${m[1]} ${PAST[m[2].toLowerCase()]}` };
                }))
                .concat(each(t, new RegExp(`\\b(did)\\s+(you|I|we|he|she|they)\\s+(${Object.keys(PAST).join('|')})\\b`, 'gi'), (m) => ({ fix: `${m[1]} ${m[2]} ${PAST[m[3].toLowerCase()]}` })))
        },
        {
            id: 'perfect', kind: 'grammar', name: 'Participio con have',
            hint: 'Después de have o has va el participio. ¿Cuál es el de este verbo?',
            why: 'Have / has / had + participio: “I have written”, no “I have wrote”.',
            bad: 'I have wrote the essay.', good: 'I have written the essay.',
            find: (t) => each(t, new RegExp(`\\b(have|has|had)\\s+(?:(already|never|just|not|also)\\s+)?(${Object.keys(PART).join('|')})\\b`, 'gi'), (m) => ({ offset: m[0].length - m[3].length, length: m[3].length, fix: PART[m[3].toLowerCase()] }))
        },
        {
            id: 'plural', kind: 'grammar', name: 'Plural después de números',
            hint: 'Hablas de más de uno. ¿Cómo termina el sustantivo?',
            why: 'Después de un número mayor que uno, many o several, el sustantivo va en plural.',
            bad: 'I have two exam this week.', good: 'I have two exams this week.',
            find: (t) => each(t, new RegExp(`\\b(${NUM})\\s+(${PLNOUN.join('|')})\\b(?!\\s+(?:extension|period|deadline|course|project|trip|break|delay|plan|old|essay|report))(?!-)`, 'gi'), (m) => ({ offset: m[0].length - m[2].length, length: m[2].length, fix: plural(m[2].toLowerCase()) }))
        },
        {
            id: 'uncount', kind: 'grammar', name: 'Palabras sin plural',
            hint: 'Esta palabra no se cuenta en inglés. ¿Lleva -s?',
            why: 'Information, advice, homework, equipment, knowledge y feedback no tienen plural ni usan “a/an”.',
            bad: 'I need more informations.', good: 'I need more information.',
            find: (t) => each(t, new RegExp(`\\bmany\\s+(${Object.keys(UNC).join('|')})\\b`, 'gi'), (m) => ({ fixes: [`a lot of ${UNC[m[1].toLowerCase()]}`, `much ${UNC[m[1].toLowerCase()]}`] })).concat(listRule(UNC)(t).filter((f) => !/\bmany\s+$/i.test(t.slice(0, f.start)))).concat(each(t, /\b(?:a|an)\s+(information|advice|homework|equipment|feedback)\b/gi, (m) => ({ fixes: [like(m[0], m[1]), like(m[0], `some ${m[1]}`)] })))
        },
        {
            id: 'prep', kind: 'grammar', name: 'Preposiciones',
            hint: 'La preposición se copió del español. ¿Cuál usa este verbo en inglés?',
            why: 'Cada verbo pide su preposición: depend on, interested in, arrive at, explain to me, discuss (sin “about”).',
            bad: 'It depends of the date.', good: 'It depends on the date.',
            find: pairRule(PREP)
        },
        {
            id: 'gerund', kind: 'grammar', name: '-ing después de preposición',
            hint: 'Después de una preposición, ¿en qué forma va el verbo?',
            why: 'Después de for, to (look forward to), in o without, el verbo lleva -ing.',
            bad: 'I look forward to hear from you.', good: 'I look forward to hearing from you.',
            find: (t) => each(t, /\b(look(?:ing)? forward to|thank you for|interested in|instead of|without|apologize for)\s+(hear|receive|meet|see|get|know|read|have|talk|speak|discuss|work|give|consider|take|study|learn|send|join|participate|be)\b/gi, (m) => ({ offset: m[0].length - m[2].length, length: m[2].length, fix: ing(m[2].toLowerCase()) }))
        },
        {
            id: 'spelling', kind: 'grammar', name: 'Ortografía y mayúsculas',
            hint: 'Revisa cómo se escribe esta palabra, letra por letra.',
            why: 'Los días, meses, idiomas, países y “I” llevan mayúscula; algunas palabras se confunden por su parecido con el español.',
            bad: 'I will recieve it on monday.', good: 'I will receive it on Monday.',
            find: (t) => listRule(SPELL)(t).concat(each(t, new RegExp(`\\b(${CAPS.join('|')})\\b`, 'g'), (m) => ({ fix: cap(m[0]) }))).concat(each(t, /(^|[\s("“])i(?=[\s,]|['’](?:m|ve|ll|d)\b)/g, (m) => ({ offset: m[1].length, length: 1, fix: 'I' })))
        },
        {
            id: 'colloc', kind: 'vocab', name: 'Make, do, say y ask',
            hint: 'Ese verbo se tradujo del español. ¿Con qué verbo se combina en inglés?',
            why: 'Se dice ask a question, make a mistake, do homework, take an exam y tell someone.',
            bad: 'I want to make a question.', good: 'I want to ask a question.',
            find: pairRule(COLL)
        },
        {
            id: 'falsef', kind: 'vocab', name: 'Falsos amigos',
            hint: 'Se parece a una palabra en español, pero significa otra cosa.',
            why: 'assist ≠ asistir (attend) · realize ≠ realizar (carry out) · approve ≠ aprobar un curso (pass) · pretend ≠ pretender (intend).',
            bad: 'I assisted to the class.', good: 'I attended the class.',
            find: pairRule(FALSE)
        },
        {
            id: 'direct', kind: 'tone', name: 'Petición demasiado directa',
            hint: 'Suena a orden. ¿Cómo lo pedirías con cortesía?',
            why: 'En un correo formal se pide con “Could you please…?”, “Would it be possible to…?” o “I would like to…”.',
            bad: 'Send me the document.', good: 'Could you please send me the document?',
            find: (t) => {
                const out = [];
                sentences(t).forEach((s) => {
                    const end = s.text.replace(/[.!?]+$/, '');
                    let m;
                    if ((m = /^(?:I want|I need)\s+you\s+to\s+(.+)$/i.exec(end))) out.push({ start: s.start, end: s.end, fixes: [`Could you please ${m[1]}?`, `Would it be possible for you to ${m[1]}?`] });
                    else if ((m = /^(give|send|tell|answer|reply|help|explain|let me know|check|review|extend|confirm)\s+(.+)$/i.exec(end))) out.push({ start: s.start, end: s.end, fixes: [`Could you please ${m[1].toLowerCase()} ${m[2]}?`] });
                    else if ((m = /^You\s+(?:must|have to|should|need to)\s+(give|send|tell|answer|reply|help|explain|check|review|extend|confirm)\s+(.+)$/i.exec(end))) out.push({ start: s.start, end: s.end, fixes: [`Could you please ${m[1].toLowerCase()} ${m[2]}?`] });
                    else if ((m = /^(I want)\s+(?!you\b|to thank)(.+)$/i.exec(end))) out.push({ start: s.start, end: s.start + m[1].length, fixes: ['I would like'] });
                });
                return out;
            }
        },
        {
            id: 'contraction', kind: 'tone', name: 'Contracciones', minFormality: 2,
            hint: 'En un texto formal, ¿se escriben las formas cortas con apóstrofo?',
            why: 'En un correo formal se escribe la forma completa: “I am”, “do not”, “cannot”.',
            bad: "I can't attend the class.", good: 'I cannot attend the class.',
            find: (t) => each(t, new RegExp(`\\b(${Object.keys(CONTR).map((k) => k.replace("'", "['’]")).join('|')})(?![a-z])`, 'gi'), (m) => {
                const f = CONTR[m[0].toLowerCase().replace('’', "'")];
                return f ? { fix: like(m[0], f) } : null;
            })
        },
        {
            id: 'informal', kind: 'tone', name: 'Palabras informales', minFormality: 2,
            hint: 'Esta palabra es de conversación entre amigos. ¿Hay una más formal?',
            why: 'Un correo formal evita el lenguaje de chat: “thanks” → “thank you”, “asap” → “as soon as possible”.',
            bad: 'Thanks for your help.', good: 'Thank you for your help.',
            find: (t) => listRule(INFORMAL)(t).map((r) => (/^(?:hi|hey|bye)$/i.test(t.slice(r.start, r.end)) && !/(^|\n)\s*$/.test(t.slice(0, r.start)) ? null : r)).filter(Boolean)
                .concat(each(t, /!{2,}/g, () => ({ fix: '.' })))
        },
        {
            id: 'question', kind: 'clarity', name: 'Signo de pregunta',
            hint: 'La oración pide algo en forma de pregunta. ¿Cómo debe terminar?',
            why: 'Could you…, Would you…, Can you… y Would it be possible… son preguntas: terminan en “?”.',
            bad: 'Could you help me.', good: 'Could you help me?',
            find: (t) => sentences(t).filter((s) => /^(?:could|would|can|may|will)\s+(?:you|I|it|we)\b/i.test(s.text) && /\.$/.test(s.text)).map((s) => ({ start: s.start, end: s.end, fixes: [s.text.replace(/\.+$/, '?')] }))
        },
        {
            id: 'long', kind: 'clarity', name: 'Oración muy larga', type: 'idea',
            hint: 'Tiene más de 28 palabras. ¿Dónde termina la primera idea?',
            why: 'Una idea por oración se entiende mejor. Divide donde haya “and”, “but” o “because”.',
            bad: 'I had to work and I could not finish and I was ill and…', good: 'I had to work. As a result, I could not finish.',
            find: (t) => sentences(t).filter((s) => s.text.split(/\s+/).length > 28).map((s) => ({ start: s.start, end: s.end, fixes: [] }))
        },
        {
            id: 'dup', kind: 'clarity', name: 'Palabra repetida', type: 'idea',
            hint: 'Lee despacio: hay una palabra escrita dos veces seguidas.',
            why: 'La repetición suele ser un descuido al escribir.',
            bad: 'I have the the document.', good: 'I have the document.',
            find: (t) => each(t, /\b([a-z]+)\s+\1\b/gi, (m) => (/^(?:that|had)$/i.test(m[1]) ? null : { fix: m[1] }))
        },
        {
            id: 'vague', kind: 'vocab', name: 'Palabra poco precisa', type: 'idea',
            hint: 'Es correcta, pero muy general. ¿Hay una más precisa?',
            why: 'En un texto formal, una palabra precisa comunica mejor. No es un error: puedes mantenerla.',
            bad: 'It is very important.', good: 'It is essential.',
            find: (t) => each(t, new RegExp(`\\b(${Object.keys(VAGUE).join('|')})\\b`, 'gi'), (m) => ({ fixes: VAGUE[m[0].toLowerCase()].map((f) => like(m[0], f)) }))
        }
    ];
    const byId = {};
    RULES.forEach((r) => { r.type = r.type || 'error'; byId[r.id] = r; });

    /* ---------- Motor ---------- */
    function check(text, ctx) {
        const formality = (ctx && ctx.formality) || 2;   // 1 semiformal · 2 formal · 3 muy formal
        const only = ctx && ctx.only;
        const found = [];
        RULES.forEach((r, order) => {
            if (only && !only.includes(r.id)) return;
            if (r.minFormality && formality < r.minFormality) return;
            r.find(text).forEach((f) => {
                const frag = text.slice(f.start, f.end);
                const fixes = f.fixes.filter((x) => x !== frag);
                if (f.fixes.length && !fixes.length) return;
                found.push({ ruleId: r.id, kind: r.kind, type: r.type, order, start: f.start, end: f.end, fragment: frag, fixes, sentence: sentenceAt(text, f.start) });
            });
        });
        // Sin solapes: gana el error sobre la mejora y, después, el fragmento más corto
        found.sort((a, b) => (a.type === b.type ? 0 : a.type === 'error' ? -1 : 1) || (a.end - a.start) - (b.end - b.start) || a.order - b.order);
        const kept = [];
        found.forEach((f) => { if (!kept.some((k) => f.start < k.end && k.start < f.end)) kept.push(f); });
        return kept.sort((a, b) => a.start - b.start);
    }

    window.Checker = { KINDS, RULES, rule: (id) => byId[id], check, sentences, sentenceAt, CONTR };
})();
