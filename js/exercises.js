/* ============================================================
   Exercises · banco de práctica: 8 oraciones por tipo de error (tarea 2)
   Formato: oración con error => respuesta aceptada | otra aceptada
   ============================================================ */
(function () {
    'use strict';

    const RAW = {
        agree: `She is agree with the proposal. => She agrees with the proposal.
I am agree with your comments. => I agree with your comments.
We are agree about the date. => We agree about the date.
They were agree with the change. => They agreed with the change.
I am not agree with that idea. => I do not agree with that idea. | I disagree with that idea.
My parents are agree with my decision. => My parents agree with my decision.
He was agree to help us. => He agreed to help us.
The teacher is agree with the new date. => The teacher agrees with the new date.`,
        third: `She work in the library. => She works in the library.
He always arrive late. => He always arrives late.
My teacher explain the topic well. => My teacher explains the topic well.
The course start in March. => The course starts in March.
He study every night. => He studies every night.
She have two brothers. => She has two brothers.
The exam include three parts. => The exam includes three parts.
He go to the gym on Fridays. => He goes to the gym on Fridays.`,
        concord: `The students is ready. => The students are ready.
We was in the meeting. => We were in the meeting.
I has a question. => I have a question.
People is worried about the exam. => People are worried about the exam.
They has finished the report. => They have finished the report.
You is very kind. => You are very kind.
The results was good. => The results were good.
She are my professor. => She is my professor.`,
        want: `I want you help me with this. => I want you to help me with this.
She wants that we send the report. => She wants us to send the report.
They want that he explain the rule. => They want him to explain the rule.
I need you send me the file. => I need you to send me the file.
He wants me finish today. => He wants me to finish today.
We want that they attend the class. => We want them to attend the class.
My parents want that I study more. => My parents want me to study more.
She wanted him call the office. => She wanted him to call the office.`,
        bebase: `I am study engineering. => I am studying engineering. | I study engineering.
We are need more time. => We need more time.
She is work at a bank. => She is working at a bank. | She works at a bank.
They are live in Cusco. => They are living in Cusco. | They live in Cusco.
I am write to request a letter. => I am writing to request a letter. | I write to request a letter.
He is want a scholarship. => He wants a scholarship.
I am attend an English course. => I am attending an English course. | I attend an English course.
You are have a good idea. => You have a good idea.`,
        age: `I have 20 years. => I am 20 years old. | I am 20.
She has 19 years. => She is 19 years old. | She is 19.
He has 25 years old. => He is 25 years old. | He is 25.
They have 18 years. => They are 18 years old. | They are 18.
We have 22 years old. => We are 22 years old. | We are 22.
I had 17 years in 2020. => I was 17 years old in 2020. | I was 17 in 2020.
You have 30 years. => You are 30 years old. | You are 30.
She had 21 years then. => She was 21 years old then. | She was 21 then.`,
        since: `I have studied here since two years. => I have studied here for two years.
She has worked here since three months. => She has worked here for three months.
We have waited since two hours. => We have waited for two hours.
He has lived in Lima since ten years. => He has lived in Lima for ten years.
They have known me since five years. => They have known me for five years.
I have been ill since four days. => I have been ill for four days.
I have studied English for 2019. => I have studied English since 2019.
She has taught here for 2015. => She has taught here since 2015.`,
        article: `I have a exam tomorrow. => I have an exam tomorrow.
She is an university student. => She is a university student.
It takes a hour. => It takes an hour.
He wrote a essay. => He wrote an essay.
This is an useful book. => This is a useful book.
I need a answer today. => I need an answer today.
We had an meeting yesterday. => We had a meeting yesterday.
It is a honest opinion. => It is an honest opinion.`,
        baseform: `I did not went to class. => I did not go to class.
She can to speak English. => She can speak English.
He does not has a computer. => He does not have a computer.
We must to submit the essay. => We must submit the essay.
Did you received my email? => Did you receive my email?
They could not finished the project. => They could not finish the project.
I will to send the document. => I will send the document.
She did not wrote the report. => She did not write the report.`,
        perfect: `I have wrote the essay. => I have written the essay.
She has went to the library. => She has gone to the library. | She went to the library.
We have saw the results. => We have seen the results.
They have took the exam. => They have taken the exam.
He has gave me the book. => He has given me the book.
I have already did the homework. => I have already done the homework.
She has spoke with the director. => She has spoken with the director.
I had chose another topic. => I had chosen another topic.`,
        plural: `I have two exam this week. => I have two exams this week.
She needs three document. => She needs three documents.
There are many student in the room. => There are many students in the room.
I have several question. => I have several questions.
He waited for five day. => He waited for five days.
We read ten page. => We read ten pages.
The test has 4 error. => The test has 4 errors.
I studied for six hour. => I studied for six hours.`,
        uncount: `I need more informations. => I need more information.
She gave me good advices. => She gave me good advice.
We have many homeworks. => We have a lot of homework. | We have much homework. | We have lots of homework.
Thank you for your feedbacks. => Thank you for your feedback.
The lab has new equipments. => The lab has new equipment.
I want to improve my knowledges. => I want to improve my knowledge.
He gave me an advice. => He gave me some advice. | He gave me advice.
I have an information for you. => I have some information for you. | I have information for you.`,
        prep: `It depends of the date. => It depends on the date.
I am interested on the course. => I am interested in the course.
She is responsible of the project. => She is responsible for the project.
Please explain me the rule. => Please explain the rule to me. | Please explain to me the rule.
We discussed about the topic. => We discussed the topic.
I arrived to the university at nine. => I arrived at the university at nine.
The course consists in four units. => The course consists of four units.
This is different of my plan. => This is different from my plan. | This is different to my plan. | This is different than my plan.`,
        gerund: `I look forward to hear from you. => I look forward to hearing from you.
Thank you for consider my request. => Thank you for considering my request.
I am interested in study abroad. => I am interested in studying abroad.
He left without speak to us. => He left without speaking to us.
I apologize for be late. => I apologize for being late.
Thank you for give me time. => Thank you for giving me time.
I look forward to meet you. => I look forward to meeting you.
She stayed instead of take the bus. => She stayed instead of taking the bus.`,
        spelling: `I will recieve the letter soon. => I will receive the letter soon.
The class is on monday. => The class is on Monday.
I am writting to you. => I am writing to you.
It is a great oportunity. => It is a great opportunity.
My english is improving. => My English is improving.
I stayed home becouse I was ill. => I stayed home because I was ill.
It is posible to finish today. => It is possible to finish today.
The exam is in july. => The exam is in July.`,
        colloc: `I want to make a question. => I want to ask a question.
She did a mistake. => She made a mistake.
I made my homework last night. => I did my homework last night.
He said me the answer. => He told me the answer.
We took a decision. => We made a decision.
I made an exam yesterday. => I took an exam yesterday. | I had an exam yesterday.
They did an effort. => They made an effort.
I have a doubt about the essay. => I have a question about the essay.`,
        falsef: `I assisted to the class. => I attended the class.
We realized a project about water. => We carried out a project about water. | We did a project about water.
I approved the exam. => I passed the exam.
My actual job is in Lima. => My current job is in Lima.
She realized an activity. => She carried out an activity. | She did an activity.
I pretend to study abroad. => I intend to study abroad. | I plan to study abroad.
He assists to all meetings. => He attends all meetings.
I do not want to molest you. => I do not want to bother you. | I do not want to disturb you.`,
        direct: `Send me the document. => Could you please send me the document? | Could you send me the document, please? | Could you send me the document? | Would you please send me the document? | Can you please send me the document?
Give me more time. => Could you please give me more time? | Could you give me more time, please? | Could you give me more time? | Would it be possible to have more time?
I want more information. => I would like more information.
I want you to review my essay. => Could you please review my essay? | Could you review my essay, please? | Could you review my essay? | Would it be possible for you to review my essay?
You must answer my email. => Could you please answer my email? | Could you answer my email, please? | Could you answer my email?
Tell me the date of the exam. => Could you please tell me the date of the exam? | Could you tell me the date of the exam, please? | Could you tell me the date of the exam?
I want to change my group. => I would like to change my group.
Explain the topic again. => Could you please explain the topic again? | Could you explain the topic again, please? | Could you explain the topic again?`,
        contraction: `I can't attend the class. => I cannot attend the class. | I can not attend the class.
I'm a student of engineering. => I am a student of engineering.
I don't have the document. => I do not have the document.
It's an important course. => It is an important course.
We haven't received an answer. => We have not received an answer.
She doesn't work today. => She does not work today.
I'd like to request a letter. => I would like to request a letter.
They won't finish on time. => They will not finish on time.`,
        informal: `Thanks for your help. => Thank you for your help.
I need it asap. => I need it as soon as possible.
I am gonna send the form. => I am going to send the form. | I will send the form.
I wanna apply for the course. => I want to apply for the course. | I would like to apply for the course.
I was ill cuz of the rain. => I was ill because of the rain.
Pls confirm the date. => Please confirm the date.
The kids were in the museum. => The children were in the museum.
Sorry for the delay. => I apologize for the delay.`,
        question: `Could you help me. => Could you help me?
Would it be possible to meet. => Would it be possible to meet?
Can you send the file. => Can you send the file?
Would you confirm the date. => Would you confirm the date?
May I ask a question. => May I ask a question?
Could I have more time. => Could I have more time?
Could we change the group. => Could we change the group?
Would you review my essay. => Would you review my essay?`
    };

    const BANK = {};
    Object.keys(RAW).forEach((id) => {
        BANK[id] = RAW[id].split('\n').map((line, n) => {
            const [wrong, right] = line.split(' => ');
            return { id: `${id}-${n}`, ruleId: id, wrong: wrong.trim(), answers: right.split(' | ').map((s) => s.trim()) };
        });
    });

    /* ---------- Palabras donde está el error (comparando con la respuesta) ---------- */
    const words = (s) => s.split(/\s+/);
    function errorTokens(ex) {
        const a = words(ex.wrong); const b = words(ex.answers[0]);
        const n = a.length; const m = b.length;
        const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
        for (let i = n - 1; i >= 0; i -= 1) for (let j = m - 1; j >= 0; j -= 1) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
        const bad = new Set(); let i = 0; let j = 0;
        while (i < n || j < m) {
            if (i < n && j < m && a[i] === b[j]) { i += 1; j += 1; } else if (j >= m || (i < n && L[i + 1][j] >= L[i][j + 1])) { bad.add(i); i += 1; } else {
                if (i > 0) bad.add(i - 1);
                if (i < n) bad.add(i);
                j += 1;
            }
        }
        return bad;
    }

    /* ---------- Comparar la respuesta ---------- */
    const CONTR = {"don't":"do not","doesn't":"does not","didn't":"did not","can't":"cannot","couldn't":"could not","won't":"will not","wouldn't":"would not","shouldn't":"should not","isn't":"is not","aren't":"are not","wasn't":"was not","weren't":"were not","haven't":"have not","hasn't":"has not","hadn't":"had not","i'm":"I am","i've":"I have","i'll":"I will","i'd":"I would","you're":"you are","you've":"you have","you'll":"you will","we're":"we are","we've":"we have","we'll":"we will","they're":"they are","they've":"they have","it's":"it is","that's":"that is","there's":"there is","he's":"he is","she's":"she is","what's":"what is","let's":"let us"};
    /* Nombre, pista y regla de cada tipo de error */
    const RULES = {
     "agree": {
      "name": "“Agree” sin “be”",
      "kind": "grammar",
      "hint": "“Agree” ya es un verbo. ¿Necesita otro verbo delante?",
      "why": "“Agree” es un verbo completo: no lleva “am”, “is” ni “are”.",
      "bad": "I am agree with the plan.",
      "good": "I agree with the plan."
     },
     "third": {
      "name": "Tercera persona (-s)",
      "kind": "grammar",
      "hint": "Mira el sujeto: es una sola persona o cosa. ¿Qué le falta al verbo?",
      "why": "En presente, con he, she, it o un sujeto singular, el verbo lleva -s o -es.",
      "bad": "She work in the library.",
      "good": "She works in the library."
     },
     "concord": {
      "name": "Concordancia con be y have",
      "kind": "grammar",
      "hint": "Comprueba si el sujeto es singular o plural. ¿El verbo coincide?",
      "why": "I am/have/was · he, she, it is/has/was · you, we, they y los plurales are/have/were.",
      "bad": "The students is ready.",
      "good": "The students are ready."
     },
     "want": {
      "name": "Want + persona + to",
      "kind": "grammar",
      "hint": "Después de “want” y la persona falta una palabra antes del verbo.",
      "why": "Se dice want + persona + to + verbo: “I want you to help me”.",
      "bad": "I want you give me more time.",
      "good": "I want you to give me more time."
     },
     "bebase": {
      "name": "Be + verbo sin -ing",
      "kind": "grammar",
      "hint": "Hay dos verbos seguidos. ¿Es una acción en curso o algo habitual?",
      "why": "Usa be + verbo con -ing (I am studying) o solo el verbo (I study).",
      "bad": "I am study engineering.",
      "good": "I am studying engineering."
     },
     "age": {
      "name": "Edad con “be”",
      "kind": "grammar",
      "hint": "En inglés la edad no se “tiene”. ¿Qué verbo se usa?",
      "why": "La edad se expresa con be: “I am 20 years old”.",
      "bad": "I have 20 years.",
      "good": "I am 20 years old."
     },
     "since": {
      "name": "For y since",
      "kind": "grammar",
      "hint": "¿Indicas cuánto tiempo dura o en qué momento empezó?",
      "why": "“For” + duración (for two years); “since” + momento de inicio (since 2022).",
      "bad": "I have studied here since two years.",
      "good": "I have studied here for two years."
     },
     "article": {
      "name": "A / an",
      "kind": "grammar",
      "hint": "Di la siguiente palabra en voz baja: ¿empieza con sonido de vocal?",
      "why": "“An” va antes de sonido de vocal (an exam, an hour); “a” antes de sonido de consonante (a university).",
      "bad": "I have a exam.",
      "good": "I have an exam."
     },
     "baseform": {
      "name": "Verbo base después de modal y did",
      "kind": "grammar",
      "hint": "Después de can, could, must o did, ¿en qué forma va el verbo?",
      "why": "Después de un modal o de do/does/did (not) va el verbo base, sin “to”, -s ni pasado.",
      "bad": "I did not went to class.",
      "good": "I did not go to class."
     },
     "perfect": {
      "name": "Participio con have",
      "kind": "grammar",
      "hint": "Después de have o has va el participio. ¿Cuál es el de este verbo?",
      "why": "Have / has / had + participio: “I have written”, no “I have wrote”.",
      "bad": "I have wrote the essay.",
      "good": "I have written the essay."
     },
     "plural": {
      "name": "Plural después de números",
      "kind": "grammar",
      "hint": "Hablas de más de uno. ¿Cómo termina el sustantivo?",
      "why": "Después de un número mayor que uno, many o several, el sustantivo va en plural.",
      "bad": "I have two exam this week.",
      "good": "I have two exams this week."
     },
     "uncount": {
      "name": "Palabras sin plural",
      "kind": "grammar",
      "hint": "Esta palabra no se cuenta en inglés. ¿Lleva -s?",
      "why": "Information, advice, homework, equipment, knowledge y feedback no tienen plural ni usan “a/an”.",
      "bad": "I need more informations.",
      "good": "I need more information."
     },
     "prep": {
      "name": "Preposiciones",
      "kind": "grammar",
      "hint": "La preposición se copió del español. ¿Cuál usa este verbo en inglés?",
      "why": "Cada verbo pide su preposición: depend on, interested in, arrive at, explain to me, discuss (sin “about”).",
      "bad": "It depends of the date.",
      "good": "It depends on the date."
     },
     "gerund": {
      "name": "-ing después de preposición",
      "kind": "grammar",
      "hint": "Después de una preposición, ¿en qué forma va el verbo?",
      "why": "Después de for, to (look forward to), in o without, el verbo lleva -ing.",
      "bad": "I look forward to hear from you.",
      "good": "I look forward to hearing from you."
     },
     "spelling": {
      "name": "Ortografía y mayúsculas",
      "kind": "grammar",
      "hint": "Revisa cómo se escribe esta palabra, letra por letra.",
      "why": "Los días, meses, idiomas, países y “I” llevan mayúscula; algunas palabras se confunden por su parecido con el español.",
      "bad": "I will recieve it on monday.",
      "good": "I will receive it on Monday."
     },
     "colloc": {
      "name": "Make, do, say y ask",
      "kind": "vocab",
      "hint": "Ese verbo se tradujo del español. ¿Con qué verbo se combina en inglés?",
      "why": "Se dice ask a question, make a mistake, do homework, take an exam y tell someone.",
      "bad": "I want to make a question.",
      "good": "I want to ask a question."
     },
     "falsef": {
      "name": "Falsos amigos",
      "kind": "vocab",
      "hint": "Se parece a una palabra en español, pero significa otra cosa.",
      "why": "assist ≠ asistir (attend) · realize ≠ realizar (carry out) · approve ≠ aprobar un curso (pass) · pretend ≠ pretender (intend).",
      "bad": "I assisted to the class.",
      "good": "I attended the class."
     },
     "direct": {
      "name": "Petición demasiado directa",
      "kind": "tone",
      "hint": "Suena a orden. ¿Cómo lo pedirías con cortesía?",
      "why": "En un correo formal se pide con “Could you please…?”, “Would it be possible to…?” o “I would like to…”.",
      "bad": "Send me the document.",
      "good": "Could you please send me the document?"
     },
     "contraction": {
      "name": "Contracciones",
      "kind": "tone",
      "hint": "En un texto formal, ¿se escriben las formas cortas con apóstrofo?",
      "why": "En un correo formal se escribe la forma completa: “I am”, “do not”, “cannot”.",
      "bad": "I can't attend the class.",
      "good": "I cannot attend the class."
     },
     "informal": {
      "name": "Palabras informales",
      "kind": "tone",
      "hint": "Esta palabra es de conversación entre amigos. ¿Hay una más formal?",
      "why": "Un correo formal evita el lenguaje de chat: “thanks” → “thank you”, “asap” → “as soon as possible”.",
      "bad": "Thanks for your help.",
      "good": "Thank you for your help."
     },
     "question": {
      "name": "Signo de pregunta",
      "kind": "clarity",
      "hint": "La oración pide algo en forma de pregunta. ¿Cómo debe terminar?",
      "why": "Could you…, Would you…, Can you… y Would it be possible… son preguntas: terminan en “?”.",
      "bad": "Could you help me.",
      "good": "Could you help me?"
     }
    };
    function norm(s, ruleId) {
        let t = String(s).replace(/[’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
        if (ruleId !== 'question' && ruleId !== 'direct') t = t.replace(/[.!?]+$/, ''); else if (!/[?]$/.test(t)) t = t.replace(/[.!]+$/, '');
        if (ruleId !== 'spelling') t = t.toLowerCase();
        if (ruleId !== 'contraction') t = t.replace(/[a-z]+'[a-z]+/gi, (w) => CONTR[w.toLowerCase()] || w);
        if (ruleId !== 'spelling') t = t.toLowerCase();
        return t;
    }
    const isCorrect = (ex, answer) => ex.answers.some((a) => norm(a, ex.ruleId) === norm(answer, ex.ruleId));
    const unchanged = (ex, answer) => String(answer).replace(/\s+/g, ' ').trim() === ex.wrong;

    window.Exercises = { BANK, RULES, words, errorTokens, isCorrect, unchanged };
})();
