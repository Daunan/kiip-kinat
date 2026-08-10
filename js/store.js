/* ============================================================
   store.js — trạng thái người dùng, XP, level, điểm danh
   Lưu bằng localStorage. Không có server.
   ============================================================ */

const Store = (() => {
  const KEY = 'kinat.v1';

  const DEFAULTS = {
    xp: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    // { [questionId]: {c: số lần đúng liên tiếp, w: tổng số lần sai, seen: n, last: ts} }
    q: {},
    // lịch sử điểm danh: mảng chuỗi 'YYYY-MM-DD'
    days: [],
    streak: 0,
    lastDay: null,
    // kết quả thi thử: [{ts, score, pass, correct, total}]
    exams: [],
    // funquiz
    funSeen: {},
    funBest: 0,
    // cài đặt
    examDate: '',      // 'YYYY-MM-DD' ngày thi thật
    name: 'KIEU',
    // đã xem qua writing/speaking nào
    wrDone: [],
    spDone: [],
    lsDone: [],        // bài lý thuyết đã học xong
    // ===== DỰ ÁN 100 NGÀY =====
    planStart: '',                 // 'YYYY-MM-DD' ngày bắt đầu
    daily: {},                     // { 'YYYY-MM-DD': {n,c,w,s,e,done} }
    milestones: []                 // các mốc đã nhận thưởng
  };

  let s = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...DEFAULTS };
      const p = JSON.parse(raw);
      return { ...DEFAULTS, ...p, q: p.q || {} };
    } catch (e) {
      console.warn('store load failed', e);
      return { ...DEFAULTS };
    }
  }

  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(s)); }
      catch (e) { console.warn('store save failed', e); }
    }, 120);
  }
  function saveNow() {
    clearTimeout(saveTimer);
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }

  /* ---------- ngày ---------- */
  function today() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }
  function dayDiff(a, b) {
    // số ngày giữa 2 chuỗi 'YYYY-MM-DD'
    const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
    const da = Date.UTC(pa[0], pa[1] - 1, pa[2]);
    const db = Date.UTC(pb[0], pb[1] - 1, pb[2]);
    return Math.round((db - da) / 86400000);
  }

  /* ---------- level ---------- */
  // XP cần để lên từ level n → n+1
  function xpForLevel(n) { return 120 + (n - 1) * 45; }

  function levelInfo(xp) {
    let lv = 1, rest = xp;
    while (rest >= xpForLevel(lv) && lv < 200) { rest -= xpForLevel(lv); lv++; }
    const need = xpForLevel(lv);
    return { lv, cur: rest, need, pct: Math.min(100, Math.round(rest / need * 100)) };
  }

  const RANKS = [
    { min: 1,  em: '🌱', vi: 'Tân binh KIIP',        ko: '입문' },
    { min: 5,  em: '📚', vi: 'Học viên chăm chỉ',    ko: '성실 학습자' },
    { min: 10, em: '🔥', vi: 'Cao thủ ôn thi',       ko: '시험 고수' },
    { min: 16, em: '🏅', vi: 'Ứng viên sáng giá',    ko: '유력 후보' },
    { min: 23, em: '👑', vi: 'Sắp thành người Hàn',  ko: '거의 한국인' },
    { min: 32, em: '🇰🇷', vi: 'Người Hàn thật sự',   ko: '진짜 한국인' }
  ];
  function rank(lv) {
    let r = RANKS[0];
    for (const x of RANKS) if (lv >= x.min) r = x;
    return r;
  }

  /* ---------- XP ---------- */
  // trả về {gained, leveledTo|null}
  function addXp(n) {
    if (!n) return { gained: 0, leveledTo: null };
    const before = levelInfo(s.xp).lv;
    s.xp += n;
    const after = levelInfo(s.xp).lv;
    save();
    return { gained: n, leveledTo: after > before ? after : null };
  }

  /* ---------- điểm danh ---------- */
  // Gọi 1 lần khi mở app. Trả về null nếu hôm nay đã điểm danh.
  function checkIn() {
    const t = today();
    if (s.lastDay === t) return null;

    if (s.lastDay && dayDiff(s.lastDay, t) === 1) s.streak += 1;
    else s.streak = 1;

    s.lastDay = t;
    if (!s.days.includes(t)) s.days.push(t);
    if (s.days.length > 400) s.days = s.days.slice(-400);

    const base = 20;
    const bonus = Math.min(s.streak, 10) * 5;      // tối đa +50
    const milestone = [7, 30, 100].includes(s.streak) ? 100 : 0;
    const total = base + bonus + milestone;

    const r = addXp(total);
    saveNow();
    return { streak: s.streak, base, bonus, milestone, total, leveledTo: r.leveledTo };
  }

  /* ============================================================
     DỰ ÁN 100 NGÀY — 100일 프로젝트
     ============================================================ */

  const PLAN_LEN = 100;

  const PHASES = [
    { from: 1,  to: 30,  em: '🌱', vi: 'Nền tảng',      ko: '기초 다지기',
      desc_vi: 'Xây nền: tiếng Hàn, xã hội, văn hóa, giáo dục — những phần gần với đời sống hằng ngày nhất.',
      goal: 20, doms: ['kor_vocab','kor_grammar','kor_reading','society','education','culture'] },
    { from: 31, to: 60,  em: '⚙️', vi: 'Chinh phục',    ko: '심화 정복',
      desc_vi: 'Phần khó nhất: chính trị, kinh tế, pháp luật và TOÀN BỘ chương trình nâng cao 심화 — thứ chỉ đề nhập tịch mới có.',
      goal: 25, doms: ['politics','economy','law','adv_citizen','adv_history','adv_politics','adv_economy','adv_law'] },
    { from: 61, to: 85,  em: '🏯', vi: 'Sử · Địa · Viết · Nói', ko: '역사·지리 + 작문·구술',
      desc_vi: 'Lịch sử và địa lý cần thời gian ngấm. Song song bắt đầu luyện Viết (10đ) và Nói (25đ) — 35 điểm không được bỏ.',
      goal: 25, doms: ['history','geography'] },
    { from: 86, to: 100, em: '🎯', vi: 'Thực chiến',    ko: '실전 마무리',
      desc_vi: 'Thi thử liên tục, dọn sạch sổ tay câu sai, ôn lại các mốc hay quên. Mục tiêu không phải 60 mà là 80~90 điểm.',
      goal: 30, doms: [] }
  ];

  const MILESTONES = [
    { d: 10,  xp: 100,  em: '🔟', vi: '10 ngày đầu tiên!' },
    { d: 25,  xp: 250,  em: '💪', vi: '1/4 chặng đường' },
    { d: 50,  xp: 500,  em: '🔥', vi: 'Nửa đường rồi!' },
    { d: 75,  xp: 750,  em: '🚀', vi: '75 ngày — sắp tới đích' },
    { d: 100, xp: 1500, em: '🏆', vi: 'HOÀN THÀNH 100 NGÀY!' }
  ];

  function planEnsure() {
    if (!s.planStart) { s.planStart = today(); saveNow(); }
    return s.planStart;
  }
  function planDay(dateStr) {
    planEnsure();
    return dayDiff(s.planStart, dateStr || today()) + 1;
  }
  function planLen() { return PLAN_LEN; }
  function phaseOf(day) {
    for (const p of PHASES) if (day >= p.from && day <= p.to) return p;
    return day < 1 ? PHASES[0] : PHASES[PHASES.length - 1];
  }
  function phases() { return PHASES; }
  function milestones() { return MILESTONES; }

  function dayRec(d) {
    return s.daily[d || today()] || { n: 0, c: 0, w: 0, sp: 0, e: 0, done: false };
  }
  function dailyGoal() { return phaseOf(planDay()).goal; }

  function daysDone() {
    let n = 0;
    for (const k in s.daily) {
      if (!s.daily[k].done) continue;
      const d = planDay(k);
      if (d >= 1 && d <= PLAN_LEN) n++;
    }
    return n;
  }

  function planGrid() {
    planEnsure();
    const cur = planDay();
    const g = [];
    const p0 = s.planStart.split('-').map(Number);
    for (let i = 1; i <= PLAN_LEN; i++) {
      const dt = new Date(Date.UTC(p0[0], p0[1] - 1, p0[2] + i - 1));
      const key = dt.getUTCFullYear() + '-' +
        String(dt.getUTCMonth() + 1).padStart(2, '0') + '-' +
        String(dt.getUTCDate()).padStart(2, '0');
      const r = s.daily[key];
      let st;
      if (i > cur) st = 'future';
      else if (r && r.done) st = 'done';
      else if (r && r.n > 0) st = 'partial';
      else st = 'miss';
      if (i === cur) st += ' today';
      g.push({ i, key, st });
    }
    return g;
  }

  /* type: 'q' | 'w' | 'sp' | 'e' */
  function recordDaily(type, correct) {
    planEnsure();
    const t = today();
    const r = s.daily[t] || { n: 0, c: 0, w: 0, sp: 0, e: 0, done: false };
    if (type === 'q') { r.n += 1; if (correct) r.c += 1; }
    else if (type === 'w') r.w += 1;
    else if (type === 'sp') r.sp += 1;
    else if (type === 'e') r.e += 1;

    const out = { goalJustMet: false, xp: 0, leveledTo: null, milestone: null };
    const goal = dailyGoal();
    if (!r.done && r.n >= goal) {
      r.done = true;
      out.goalJustMet = true;
      out.xp = 50;
      out.leveledTo = addXp(50).leveledTo;
    }
    s.daily[t] = r;

    if (out.goalJustMet) {
      const n = daysDone();
      const ms = MILESTONES.find(m => m.d === n && !s.milestones.includes(m.d));
      if (ms) {
        s.milestones.push(ms.d);
        const a2 = addXp(ms.xp);
        out.milestone = ms;
        if (a2.leveledTo) out.leveledTo = a2.leveledTo;
      }
    }
    saveNow();
    return out;
  }

  function resetPlan() { s.planStart = today(); s.milestones = []; saveNow(); }

  /* ---------- ghi kết quả 1 câu ---------- */
  function recordAnswer(qid, correct, points) {
    const rec = s.q[qid] || { c: 0, w: 0, seen: 0, last: 0 };
    rec.seen += 1;
    rec.last = Date.now();
    if (correct) rec.c += 1; else { rec.c = 0; rec.w += 1; }
    s.q[qid] = rec;

    s.totalAnswered += 1;
    if (correct) s.totalCorrect += 1;

    const xp = correct ? (points === 1 ? 6 : 10) : 2;
    const r = addXp(xp);
    return { xp, leveledTo: r.leveledTo, rec };
  }

  /* ---------- sổ tay câu sai (SRS đơn giản) ---------- */
  // Câu "chưa tốt nghiệp": đã từng sai và chưa đúng liên tiếp 3 lần
  function isWrongNote(qid) {
    const r = s.q[qid];
    return !!r && r.w > 0 && r.c < 3;
  }
  function wrongIds() {
    return Object.keys(s.q).filter(isWrongNote);
  }
  function graduatedIds() {
    return Object.keys(s.q).filter(id => { const r = s.q[id]; return r.w > 0 && r.c >= 3; });
  }
  function seenCount(qid) { return (s.q[qid] || {}).seen || 0; }
  function qRec(qid) { return s.q[qid] || null; }

  /* ---------- thi thử ---------- */
  function addExam(rec) {
    s.exams.unshift({ ts: Date.now(), ...rec });
    if (s.exams.length > 50) s.exams.length = 50;
    save();
  }

  /* ---------- fun quiz ---------- */
  function recordFun(id, correct) {
    s.funSeen[id] = (s.funSeen[id] || 0) + 1;
    const r = addXp(correct ? 5 : 1);
    return r;
  }

  /* ---------- D-day ---------- */
  function dday() {
    if (!s.examDate) return null;
    const n = dayDiff(today(), s.examDate);
    return n;
  }

  function set(k, v) { s[k] = v; saveNow(); }
  function get(k) { return s[k]; }
  function all() { return s; }

  function reset() {
    s = { ...DEFAULTS, q: {}, days: [], exams: [], funSeen: {} };
    saveNow();
  }

  return {
    all, get, set, save: saveNow, reset,
    today, dayDiff,
    levelInfo, rank, xpForLevel, addXp,
    checkIn, recordAnswer,
    planEnsure, planDay, planLen, phaseOf, phases, milestones,
    dayRec, dailyGoal, daysDone, planGrid, recordDaily, resetPlan,
    isWrongNote, wrongIds, graduatedIds, seenCount, qRec,
    addExam, recordFun, dday
  };
})();
