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
    name: '',
    // đã xem qua writing/speaking nào
    wrDone: [],
    spDone: []
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
    isWrongNote, wrongIds, graduatedIds, seenCount, qRec,
    addExam, recordFun, dday
  };
})();
