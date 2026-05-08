/* MathLingo - Tablas de multiplicar */
(() => {
  'use strict';

  // ---------- Storage ----------
  const STORAGE_KEY = 'mathlingo:v1';
  const defaultState = () => ({
    name: '',
    level: 1,
    totalXp: 0,
    dailyXp: 0,
    dailyDate: todayStr(),
    streak: 0,
    lastPlayDate: '',
    hearts: 5,
    heartsLostAt: 0,
    soundOn: true,
    vibrationOn: true,
    tables: Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [i + 1, { mastery: 0, lessonsDone: 0, bestAccuracy: 0 }])
    ),
    achievements: [],
  });

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function daysBetween(a, b) {
    if (!a || !b) return 0;
    const da = new Date(a + 'T00:00:00');
    const db = new Date(b + 'T00:00:00');
    return Math.round((db - da) / (24 * 3600 * 1000));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return Object.assign(defaultState(), parsed, {
        tables: Object.assign(defaultState().tables, parsed.tables || {}),
      });
    } catch {
      return defaultState();
    }
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  let state = loadState();

  // Reset daily XP if new day
  if (state.dailyDate !== todayStr()) {
    state.dailyXp = 0;
    state.dailyDate = todayStr();
    saveState();
  }

  // Refill hearts if 30+ minutes passed since last loss
  function maybeRefillHearts() {
    if (state.hearts >= 5) return;
    const sinceLost = Date.now() - (state.heartsLostAt || 0);
    if (sinceLost > 30 * 60 * 1000) {
      state.hearts = 5;
      saveState();
    }
  }
  maybeRefillHearts();

  // ---------- Sound ----------
  let audioCtx = null;
  function getAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    }
    return audioCtx;
  }
  function beep(freq, duration = 0.12, type = 'sine', vol = 0.15) {
    if (!state.soundOn) return;
    const ctx = getAudio(); if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  }
  const sounds = {
    correct: () => { beep(660, 0.1, 'triangle'); setTimeout(() => beep(880, 0.14, 'triangle'), 90); },
    wrong: () => { beep(220, 0.18, 'sawtooth', 0.1); setTimeout(() => beep(160, 0.18, 'sawtooth', 0.1), 110); },
    click: () => beep(420, 0.05, 'square', 0.06),
    levelUp: () => {
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.18, 'triangle', 0.18), i * 110));
    },
  };
  function vibrate(pattern) {
    if (!state.vibrationOn) return;
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  // ---------- Achievements ----------
  const achievements = [
    { id: 'first_lesson', icon: '🎓', title: 'Primer paso', desc: 'Completa tu primera lección' },
    { id: 'combo_5', icon: '🔥', title: 'En racha', desc: 'Acierta 5 seguidas' },
    { id: 'combo_10', icon: '⚡', title: 'Imparable', desc: 'Acierta 10 seguidas' },
    { id: 'perfect', icon: '✨', title: 'Perfecto', desc: 'Termina una lección con 100%' },
    { id: 'streak_3', icon: '📆', title: 'Constancia', desc: '3 días consecutivos' },
    { id: 'streak_7', icon: '🏆', title: 'Una semana fuerte', desc: '7 días consecutivos' },
    { id: 'master_5', icon: '🌟', title: 'Aprendiz', desc: 'Domina 5 tablas' },
    { id: 'master_all', icon: '👑', title: 'Maestro de las tablas', desc: 'Domina todas las tablas' },
    { id: 'no_hearts_win', icon: '💎', title: 'Sin errores', desc: 'Lección sin perder vidas' },
    { id: 'speed', icon: '🚀', title: 'Velocista', desc: 'Termina el reto contrarreloj' },
    { id: 'boss', icon: '🐉', title: 'Cazador de jefes', desc: 'Vence al jefe final' },
  ];
  function unlock(id) {
    if (state.achievements.includes(id)) return;
    state.achievements.push(id);
    saveState();
    showToast(`🏆 ¡Logro desbloqueado!`);
  }

  // ---------- DOM helpers ----------
  const $ = (id) => document.getElementById(id);
  const screens = ['welcome', 'home', 'game', 'result', 'achievements', 'noHearts']
    .reduce((acc, k) => (acc[k] = $(k + 'Screen'), acc), {});

  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove('active'));
    screens[name].classList.add('active');
    window.scrollTo(0, 0);
  }

  function showToast(msg) {
    const el = document.createElement('div');
    el.className = 'xp-pop';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  // ---------- Top bar ----------
  function updateTopBar() {
    $('streakCount').textContent = state.streak;
    $('xpCount').textContent = state.totalXp;
    $('heartsCount').textContent = state.hearts;
  }

  // ---------- Home ----------
  function levelFromXp(xp) {
    return Math.max(1, Math.floor(xp / 100) + 1);
  }

  function renderHome() {
    state.level = levelFromXp(state.totalXp);
    $('helloName').textContent = state.name || 'amigo';
    $('levelLabel').textContent = state.level;
    $('dailyXp').textContent = state.dailyXp;
    $('dailyProgress').style.width = Math.min(100, (state.dailyXp / 30) * 100) + '%';

    const grid = $('tablesGrid');
    grid.innerHTML = '';
    for (let n = 1; n <= 12; n++) {
      const t = state.tables[n];
      const tile = document.createElement('button');
      tile.className = 'table-tile';
      const stars = Math.min(3, Math.floor(t.mastery / 33.34));
      if (t.mastery >= 100) tile.classList.add('mastered');
      else if (t.mastery >= 60) tile.classList.add('completed');
      else if (t.mastery > 0) tile.classList.add('in-progress');

      tile.innerHTML = `
        ${t.mastery >= 100 ? '<span class="crown">★</span>' : ''}
        <div class="num">×${n}</div>
        <div class="label">Tabla del ${n}</div>
        <div class="stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
      `;
      tile.onclick = () => startLesson({ mode: 'table', table: n });
      grid.appendChild(tile);
    }
    updateTopBar();
  }

  // ---------- Question generation ----------
  function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildLesson(opts) {
    const total = opts.total || 10;
    const types = ['choice', 'choice', 'type', 'missing', 'tf'];
    const questions = [];
    for (let i = 0; i < total; i++) {
      const a = chooseFactor(opts);
      const b = rand(opts.minB ?? 1, opts.maxB ?? 12);
      const type = pick(types);
      questions.push(makeQuestion(type, a, b));
    }
    return questions;
  }

  function chooseFactor(opts) {
    if (opts.mode === 'table') return opts.table;
    if (opts.mode === 'mixed') {
      const unlocked = Object.keys(state.tables)
        .filter((k) => state.tables[k].mastery > 0)
        .map(Number);
      const pool = unlocked.length ? unlocked : [2, 3, 4, 5];
      return pick(pool);
    }
    if (opts.mode === 'timed') return rand(2, 9);
    if (opts.mode === 'boss') return rand(2, 12);
    return rand(2, 9);
  }

  function makeQuestion(type, a, b) {
    const ans = a * b;
    if (type === 'choice') {
      const opts = shuffle(uniqueOptions(ans, 4));
      return { type, a, b, ans, opts, prompt: 'Selecciona la respuesta correcta' };
    }
    if (type === 'type') {
      return { type, a, b, ans, prompt: 'Escribe la respuesta' };
    }
    if (type === 'missing') {
      const showA = Math.random() < 0.5;
      return { type, a, b, ans, showA, prompt: 'Encuentra el número que falta' };
    }
    if (type === 'tf') {
      const wrong = Math.random() < 0.5;
      const shown = wrong ? ans + (Math.random() < 0.5 ? -1 : 1) * rand(1, 5) : ans;
      return { type, a, b, ans, shown, isTrue: !wrong, prompt: '¿Es correcto?' };
    }
    return { type: 'choice', a, b, ans, opts: shuffle(uniqueOptions(ans, 4)), prompt: 'Selecciona la respuesta' };
  }

  function uniqueOptions(correct, count) {
    const set = new Set([correct]);
    while (set.size < count) {
      const delta = rand(-9, 9);
      const cand = correct + delta;
      if (cand > 0 && cand !== correct) set.add(cand);
    }
    return [...set];
  }

  // ---------- Lesson state ----------
  let lesson = null;

  function startLesson(opts) {
    if (state.hearts <= 0) {
      showScreen('noHearts');
      return;
    }
    sounds.click();
    const isTimed = opts.mode === 'timed';
    const isBoss = opts.mode === 'boss';
    const total = isTimed ? 999 : (isBoss ? 12 : 10);
    lesson = {
      opts,
      questions: buildLesson({ ...opts, total: isTimed ? 1 : total }),
      idx: 0,
      total,
      correct: 0,
      answered: 0,
      combo: 0,
      bestCombo: 0,
      heartsAtStart: state.hearts,
      startTime: Date.now(),
      timed: isTimed,
      timer: isTimed ? 60 : null,
      timerInt: null,
      currentSelection: null,
      currentTyped: '',
      finished: false,
    };
    showScreen('game');
    $('combo').hidden = true;
    if (isTimed) {
      $('timerBox').hidden = false;
      $('timerValue').textContent = lesson.timer;
      lesson.timerInt = setInterval(() => {
        lesson.timer -= 1;
        $('timerValue').textContent = lesson.timer;
        $('timerBox').classList.toggle('urgent', lesson.timer <= 10);
        if (lesson.timer <= 0) {
          clearInterval(lesson.timerInt);
          finishLesson();
        }
      }, 1000);
    } else {
      $('timerBox').hidden = true;
    }
    renderQuestion();
  }

  function nextQuestion() {
    if (lesson.timed) {
      lesson.questions = [makeQuestion(pick(['choice', 'choice', 'type', 'missing', 'tf']), rand(2, 9), rand(2, 12))];
      lesson.idx = 0;
    } else {
      lesson.idx++;
      if (lesson.idx >= lesson.total) {
        finishLesson();
        return;
      }
    }
    lesson.currentSelection = null;
    lesson.currentTyped = '';
    $('feedback').hidden = true;
    $('checkBtn').disabled = true;
    $('checkBtn').textContent = 'Comprobar';
    renderQuestion();
  }

  function renderQuestion() {
    const q = lesson.questions[lesson.idx];
    const area = $('questionArea');
    const progress = lesson.timed ? (60 - lesson.timer) / 60 : lesson.idx / lesson.total;
    $('gameProgress').style.width = (progress * 100) + '%';
    $('gameHearts').textContent = state.hearts;

    if (q.type === 'choice') {
      area.innerHTML = `
        <div class="question-prompt">${q.prompt}</div>
        <div class="question-text">${q.a} × ${q.b}</div>
        <div class="choices">
          ${q.opts.map(o => `<button class="choice" data-val="${o}">${o}</button>`).join('')}
        </div>
      `;
      area.querySelectorAll('.choice').forEach(btn => {
        btn.onclick = () => selectChoice(btn);
      });
    } else if (q.type === 'type') {
      area.innerHTML = `
        <div class="question-prompt">${q.prompt}</div>
        <div class="question-text">${q.a} × ${q.b} = ?</div>
        <input class="type-input" id="typeAnswer" type="number" inputmode="numeric" autocomplete="off" autofocus />
      `;
      const input = $('typeAnswer');
      input.oninput = () => {
        lesson.currentTyped = input.value;
        $('checkBtn').disabled = !input.value.trim();
      };
      input.onkeydown = (e) => {
        if (e.key === 'Enter' && input.value.trim()) submitAnswer();
      };
      setTimeout(() => input.focus(), 50);
    } else if (q.type === 'missing') {
      const left = q.showA
        ? `${q.a} × <span class="blank">?</span>`
        : `<span class="blank">?</span> × ${q.b}`;
      const target = q.showA ? q.b : q.a;
      const opts = shuffle(uniqueOptions(target, 4));
      lesson.questions[lesson.idx]._missingTarget = target;
      lesson.questions[lesson.idx]._missingOpts = opts;
      area.innerHTML = `
        <div class="question-prompt">${q.prompt}</div>
        <div class="question-text">${left} = ${q.ans}</div>
        <div class="choices">
          ${opts.map(o => `<button class="choice" data-val="${o}">${o}</button>`).join('')}
        </div>
      `;
      area.querySelectorAll('.choice').forEach(btn => {
        btn.onclick = () => selectChoice(btn);
      });
    } else if (q.type === 'tf') {
      area.innerHTML = `
        <div class="question-prompt">${q.prompt}</div>
        <div class="question-text">${q.a} × ${q.b} = ${q.shown}</div>
        <div class="tf-choices">
          <button class="choice" data-val="true"><span class="tf-icon">✅</span>Verdadero</button>
          <button class="choice" data-val="false"><span class="tf-icon">❌</span>Falso</button>
        </div>
      `;
      area.querySelectorAll('.choice').forEach(btn => {
        btn.onclick = () => selectChoice(btn);
      });
    }
  }

  function selectChoice(btn) {
    const area = $('questionArea');
    area.querySelectorAll('.choice').forEach(c => c.classList.remove('selected'));
    btn.classList.add('selected');
    lesson.currentSelection = btn.dataset.val;
    $('checkBtn').disabled = false;
    sounds.click();
  }

  function submitAnswer() {
    const q = lesson.questions[lesson.idx];
    let userAnswer = null;
    let isCorrect = false;

    if (q.type === 'choice') {
      userAnswer = parseInt(lesson.currentSelection, 10);
      isCorrect = userAnswer === q.ans;
    } else if (q.type === 'type') {
      userAnswer = parseInt(lesson.currentTyped, 10);
      isCorrect = userAnswer === q.ans;
      const input = $('typeAnswer');
      if (input) {
        input.classList.add(isCorrect ? 'correct' : 'incorrect');
        input.disabled = true;
      }
    } else if (q.type === 'missing') {
      userAnswer = parseInt(lesson.currentSelection, 10);
      isCorrect = userAnswer === q._missingTarget;
    } else if (q.type === 'tf') {
      const userBool = lesson.currentSelection === 'true';
      isCorrect = userBool === q.isTrue;
      userAnswer = lesson.currentSelection;
    }

    // mark choice buttons
    if (q.type === 'choice' || q.type === 'missing' || q.type === 'tf') {
      const area = $('questionArea');
      area.querySelectorAll('.choice').forEach(c => {
        c.classList.add('disabled');
        const v = c.dataset.val;
        if (q.type === 'tf') {
          if ((v === 'true') === q.isTrue) c.classList.add('correct');
          else if (c.classList.contains('selected')) c.classList.add('incorrect');
        } else {
          const target = q.type === 'missing' ? q._missingTarget : q.ans;
          if (parseInt(v, 10) === target) c.classList.add('correct');
          else if (c.classList.contains('selected')) c.classList.add('incorrect');
        }
      });
    }

    lesson.answered++;
    if (isCorrect) {
      lesson.correct++;
      lesson.combo++;
      if (lesson.combo > lesson.bestCombo) lesson.bestCombo = lesson.combo;
      if (lesson.combo >= 2) {
        $('combo').hidden = false;
        $('comboCount').textContent = lesson.combo;
      }
      if (lesson.combo === 5) unlock('combo_5');
      if (lesson.combo === 10) unlock('combo_10');
      sounds.correct();
      vibrate(30);
      const xpGain = 10 + Math.min(10, lesson.combo);
      addXp(xpGain);
      flashXp(xpGain);
      confetti(28);
      showFeedback(true, q);
    } else {
      lesson.combo = 0;
      $('combo').hidden = true;
      sounds.wrong();
      vibrate([60, 40, 60]);
      loseHeart();
      showFeedback(false, q);
    }

    $('checkBtn').textContent = 'Continuar';
    $('checkBtn').disabled = false;
    $('checkBtn').onclick = nextQuestion;
  }

  function showFeedback(correct, q) {
    const fb = $('feedback');
    fb.hidden = false;
    fb.classList.toggle('correct', correct);
    fb.classList.toggle('incorrect', !correct);
    $('feedbackEmoji').textContent = correct
      ? pick(['🎉', '🌟', '🚀', '💪', '✨', '🔥'])
      : pick(['🙅', '🤔', '😶', '💭']);
    $('feedbackTitle').textContent = correct
      ? pick(['¡Excelente!', '¡Genial!', '¡Así se hace!', '¡Muy bien!', '¡Crack!'])
      : pick(['Casi...', 'Inténtalo de nuevo', 'No exactamente', 'Sigue practicando']);
    $('feedbackSub').textContent = correct
      ? `${q.a} × ${q.b} = ${q.ans}`
      : `La respuesta correcta es ${q.a} × ${q.b} = ${q.ans}`;
  }

  function flashXp(amount) {
    const el = document.createElement('div');
    el.className = 'xp-pop';
    el.innerHTML = `+${amount} XP ⭐`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  function loseHeart() {
    state.hearts = Math.max(0, state.hearts - 1);
    state.heartsLostAt = Date.now();
    saveState();
    updateTopBar();
    $('gameHearts').textContent = state.hearts;

    const broken = document.createElement('div');
    broken.className = 'heart-lost';
    broken.textContent = '💔';
    document.body.appendChild(broken);
    setTimeout(() => broken.remove(), 1000);

    if (state.hearts <= 0) {
      setTimeout(() => {
        if (lesson && lesson.timerInt) clearInterval(lesson.timerInt);
        showScreen('noHearts');
      }, 900);
    }
  }

  function addXp(amount) {
    const oldLevel = state.level;
    state.totalXp += amount;
    state.dailyXp += amount;
    state.level = levelFromXp(state.totalXp);
    saveState();
    updateTopBar();
    if (state.level > oldLevel) {
      sounds.levelUp();
      setTimeout(() => showToast(`🎆 ¡Nivel ${state.level}!`), 200);
    }
  }

  function finishLesson() {
    if (!lesson || lesson.finished) return;
    lesson.finished = true;
    if (lesson.timerInt) clearInterval(lesson.timerInt);

    const total = lesson.timed ? lesson.answered : lesson.total;
    const acc = total === 0 ? 0 : Math.round((lesson.correct / total) * 100);
    const elapsed = Math.round((Date.now() - lesson.startTime) / 1000);

    // Update streak
    const today = todayStr();
    if (state.lastPlayDate !== today) {
      const d = daysBetween(state.lastPlayDate, today);
      if (d === 1) state.streak += 1;
      else if (d > 1 || !state.lastPlayDate) state.streak = 1;
      state.lastPlayDate = today;
    }
    if (state.streak >= 3) unlock('streak_3');
    if (state.streak >= 7) unlock('streak_7');

    // Update table mastery
    if (lesson.opts.mode === 'table') {
      const t = state.tables[lesson.opts.table];
      t.lessonsDone += 1;
      t.bestAccuracy = Math.max(t.bestAccuracy, acc);
      const gain = Math.round(acc / 4);
      t.mastery = Math.min(100, t.mastery + gain);
    } else {
      // mixed/timed/boss: small gain on all attempted
      Object.values(state.tables).forEach(t => {
        if (acc >= 70) t.mastery = Math.min(100, t.mastery + 1);
      });
    }

    // Achievements
    unlock('first_lesson');
    if (acc === 100 && total > 0) unlock('perfect');
    if (state.hearts === lesson.heartsAtStart && lesson.correct > 0) unlock('no_hearts_win');
    const mastered = Object.values(state.tables).filter(t => t.mastery >= 100).length;
    if (mastered >= 5) unlock('master_5');
    if (mastered >= 12) unlock('master_all');
    if (lesson.timed && total >= 8) unlock('speed');
    if (lesson.opts.mode === 'boss' && acc >= 80) unlock('boss');

    saveState();

    // Render result
    const earnedXp = lesson.correct * 12 + (acc === 100 ? 25 : 0);
    $('resultXp').textContent = earnedXp;
    $('resultAccuracy').textContent = acc + '%';
    $('resultCombo').textContent = lesson.bestCombo;
    $('resultTime').textContent = elapsed + 's';
    $('resultTitle').textContent = acc === 100
      ? '¡Lección perfecta!'
      : (acc >= 70 ? '¡Buen trabajo!' : 'Sigue practicando');
    $('resultMascot').textContent = acc >= 80 ? '🎉' : (acc >= 50 ? '💪' : '🤔');
    $('resultSub').textContent = acc === 100
      ? '¡Eres una máquina!'
      : (acc >= 70 ? 'Lo estás haciendo genial.' : 'Cada error te acerca al éxito.');
    showScreen('result');
    if (acc >= 70) confetti(80);
  }

  // ---------- Confetti ----------
  const colors = ['#58CC02', '#FFC800', '#1CB0F6', '#CE82FF', '#FF4B4B', '#FF9600'];
  function confetti(amount = 40) {
    const container = $('confettiContainer');
    for (let i = 0; i < amount; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      const left = Math.random() * 100;
      const delay = Math.random() * 0.4;
      const dur = 1.2 + Math.random() * 1.4;
      c.style.left = left + '%';
      c.style.background = colors[Math.floor(Math.random() * colors.length)];
      c.style.animationDuration = dur + 's';
      c.style.animationDelay = delay + 's';
      c.style.transform = `rotate(${Math.random() * 360}deg)`;
      container.appendChild(c);
      setTimeout(() => c.remove(), (dur + delay) * 1000 + 100);
    }
  }

  // ---------- Achievements view ----------
  function renderAchievements() {
    const list = $('achievementsList');
    list.innerHTML = '';
    achievements.forEach(a => {
      const unlocked = state.achievements.includes(a.id);
      const el = document.createElement('div');
      el.className = 'achievement' + (unlocked ? ' unlocked' : '');
      el.innerHTML = `
        <div class="achievement-icon">${a.icon}</div>
        <div class="achievement-info">
          <div class="achievement-title">${a.title}</div>
          <div class="achievement-desc">${a.desc}</div>
        </div>
        ${unlocked ? '<div style="color: var(--orange); font-size: 22px;">✓</div>' : ''}
      `;
      list.appendChild(el);
    });
  }

  // ---------- Wiring ----------
  function wire() {
    // Welcome
    $('startBtn').onclick = () => {
      const name = $('nameInput').value.trim();
      state.name = name || 'Crack';
      saveState();
      sounds.click();
      renderHome();
      showScreen('home');
    };
    $('nameInput').onkeydown = (e) => { if (e.key === 'Enter') $('startBtn').click(); };

    // Top bar
    $('homeBtn').onclick = () => {
      sounds.click();
      if (lesson && !lesson.finished) {
        if (!confirm('¿Quieres salir de la lección? Perderás tu progreso actual.')) return;
        if (lesson.timerInt) clearInterval(lesson.timerInt);
        lesson = null;
      }
      renderHome();
      showScreen('home');
    };
    $('settingsBtn').onclick = () => { sounds.click(); openSettings(); };

    // Quick modes
    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.onclick = () => startLesson({ mode: btn.dataset.mode });
    });

    // Game
    $('checkBtn').onclick = submitAnswer;
    $('continueBtn').onclick = nextQuestion;
    $('closeGameBtn').onclick = () => $('homeBtn').click();

    // Result
    $('resultRetry').onclick = () => {
      if (lesson) startLesson(lesson.opts);
    };
    $('resultContinue').onclick = () => {
      sounds.click();
      renderHome();
      showScreen('home');
    };

    // Achievements
    $('viewAchievements').onclick = () => {
      sounds.click();
      renderAchievements();
      showScreen('achievements');
    };
    $('closeAchievementsBtn').onclick = () => { sounds.click(); showScreen('home'); };

    // No hearts
    $('refillBtn').onclick = () => {
      state.hearts = 5;
      saveState();
      updateTopBar();
      sounds.levelUp();
      renderHome();
      showScreen('home');
    };
    $('backHomeBtn').onclick = () => { sounds.click(); renderHome(); showScreen('home'); };

    // Settings
    $('soundToggle').checked = state.soundOn;
    $('vibrationToggle').checked = state.vibrationOn;
    $('soundToggle').onchange = (e) => { state.soundOn = e.target.checked; saveState(); };
    $('vibrationToggle').onchange = (e) => { state.vibrationOn = e.target.checked; saveState(); };
    $('closeSettingsBtn').onclick = closeSettings;
    $('changeNameBtn').onclick = () => {
      const newName = prompt('Nuevo nombre:', state.name);
      if (newName && newName.trim()) {
        state.name = newName.trim().slice(0, 16);
        saveState();
        renderHome();
      }
    };
    $('resetBtn').onclick = () => {
      if (confirm('¿Seguro que quieres reiniciar TODO tu progreso? Esta acción no se puede deshacer.')) {
        localStorage.removeItem(STORAGE_KEY);
        state = defaultState();
        saveState();
        closeSettings();
        showScreen('welcome');
      }
    };
  }

  function openSettings() { $('settingsModal').hidden = false; }
  function closeSettings() { $('settingsModal').hidden = true; }

  // ---------- Init ----------
  function init() {
    wire();
    updateTopBar();
    if (!state.name) {
      showScreen('welcome');
    } else {
      renderHome();
      showScreen('home');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
