/* ============================================================
   data.js — nạp ngân hàng câu hỏi
   ============================================================ */

const Data = (() => {

  // Thứ tự hiển thị + nhãn song ngữ
  const DOMAINS = [
    { id:'kor_vocab',   em:'🔤', vi:'Từ vựng',            ko:'어휘',        grp:'korean' },
    { id:'kor_grammar', em:'🧩', vi:'Ngữ pháp',           ko:'문법',        grp:'korean' },
    { id:'kor_reading', em:'📖', vi:'Đọc hiểu',           ko:'읽기',        grp:'korean' },

    { id:'society',     em:'🏘️', vi:'Xã hội Hàn Quốc',    ko:'사회',        grp:'basic' },
    { id:'education',   em:'🎓', vi:'Giáo dục',           ko:'교육',        grp:'basic' },
    { id:'culture',     em:'🎎', vi:'Văn hóa',            ko:'문화',        grp:'basic' },
    { id:'politics',    em:'🏛️', vi:'Chính trị',          ko:'정치',        grp:'basic' },
    { id:'economy',     em:'💰', vi:'Kinh tế',            ko:'경제',        grp:'basic' },
    { id:'law',         em:'⚖️', vi:'Pháp luật',          ko:'법',          grp:'basic' },
    { id:'history',     em:'🏯', vi:'Lịch sử',            ko:'역사',        grp:'basic' },
    { id:'geography',   em:'🗺️', vi:'Địa lý',             ko:'지리',        grp:'basic' },

    { id:'adv_citizen', em:'📜', vi:'Quốc dân & Hiến pháp', ko:'대한민국의 국민', grp:'advanced' },
    { id:'adv_history', em:'🕊️', vi:'Lịch sử & phát triển', ko:'역사와 발전',   grp:'advanced' },
    { id:'adv_politics',em:'🗳️', vi:'Chính trị & ngoại giao',ko:'정치와 외교',  grp:'advanced' },
    { id:'adv_economy', em:'📈', vi:'Kinh tế thị trường',  ko:'경제',        grp:'advanced' },
    { id:'adv_law',     em:'👨‍⚖️', vi:'Trật tự pháp luật',  ko:'법질서',      grp:'advanced' }
  ];

  const GROUPS = [
    { id:'korean',   vi:'Tiếng Hàn',            ko:'한국어와 한국문화 (1~4단계)' },
    { id:'basic',    vi:'Hiểu biết xã hội — Cơ bản', ko:'한국사회이해 기본과정' },
    { id:'advanced', vi:'Hiểu biết xã hội — Nâng cao', ko:'한국사회이해 심화과정' }
  ];

  const FILES = [
    'korean','society','culture','politics','economy','law','history','geography','advanced'
  ];

  /* giáo trình lý thuyết — 이론 교재 */
  const LESSON_FILES = [
    'lessons_history','lessons_politics','lessons_law','lessons_citizen',
    'lessons_society','lessons_economy','lessons_geo_kor'
  ];

  let questions = [];
  let byDomain = {};
  let writing = [];
  let speaking = [];
  let fun = [];
  let lessons = [];
  let lessonsByDomain = {};
  let loadErrors = [];

  async function grab(path) {
    try {
      const r = await fetch(path, { cache: 'no-cache' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      if (!Array.isArray(j)) throw new Error('không phải mảng');
      return j;
    } catch (e) {
      loadErrors.push(path.split('/').pop() + ': ' + e.message);
      return [];
    }
  }

  function validQ(q) {
    return q && typeof q.q === 'string' && Array.isArray(q.choices) &&
      q.choices.length === 4 && Number.isInteger(q.answer) &&
      q.answer >= 0 && q.answer <= 3 && typeof q.id === 'string';
  }

  async function load() {
    const parts = await Promise.all(FILES.map(f => grab('data/' + f + '.json')));
    const seen = new Set();
    questions = [];
    for (const arr of parts) {
      for (const q of arr) {
        if (!validQ(q)) continue;
        if (seen.has(q.id)) continue;
        seen.add(q.id);
        q.points = (q.points === 1) ? 1 : 2;
        questions.push(q);
      }
    }

    byDomain = {};
    for (const q of questions) (byDomain[q.domain] ||= []).push(q);

    [writing, speaking, fun] = await Promise.all([
      grab('data/writing.json'),
      grab('data/speaking.json'),
      grab('data/funquiz.json')
    ]);

    fun = fun.filter(f => f && Array.isArray(f.choices_vi) && f.choices_vi.length === 4 &&
      Number.isInteger(f.answer) && f.answer >= 0 && f.answer <= 3);

    /* ---- giáo trình ---- */
    const lparts = await Promise.all(LESSON_FILES.map(f => grab('data/' + f + '.json')));
    const lseen = new Set();
    lessons = [];
    for (const arr of lparts) {
      for (const l of arr) {
        if (!l || typeof l.id !== 'string' || !Array.isArray(l.sections)) continue;
        if (lseen.has(l.id)) continue;
        lseen.add(l.id);
        lessons.push(l);
      }
    }
    lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
    lessonsByDomain = {};
    for (const l of lessons) (lessonsByDomain[l.domain] ||= []).push(l);

    return { n: questions.length, nl: lessons.length, errors: loadErrors };
  }

  function lessonsIn(domain) { return lessonsByDomain[domain] || []; }
  function lessonById(id) { return lessons.find(l => l.id === id); }
  function domainsWithLessons() {
    return DOMAINS.filter(d => (lessonsByDomain[d.id] || []).length > 0);
  }

  /* câu hỏi thuộc về một bài lý thuyết: cùng domain + khớp từ khóa `match` */
  function questionsForLesson(l) {
    const pool = inDomain(l.domain);
    const keys = (l.match || []).map(x => String(x).toLowerCase()).filter(Boolean);
    if (!keys.length) return pool;
    const hit = pool.filter(q => {
      const hay = ((q.topic || '') + ' ' + (q.keywords || []).join(' ') + ' ' + q.q).toLowerCase();
      return keys.some(k => hay.includes(k));
    });
    return hit.length >= 4 ? hit : pool;   // khớp quá ít thì lấy cả lĩnh vực
  }

  function domainMeta(id) {
    return DOMAINS.find(d => d.id === id) ||
      { id, em:'📌', vi:id, ko:id, grp:'basic' };
  }
  function inDomain(id) { return byDomain[id] || []; }
  function byId(id) { return questions.find(q => q.id === id); }
  function activeDomains() { return DOMAINS.filter(d => (byDomain[d.id] || []).length > 0); }

  /* fisher-yates */
  function shuffle(a) {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  }

  /* Chọn n câu, ưu tiên câu chưa gặp hoặc từng sai */
  function pick(pool, n) {
    const scored = pool.map(q => {
      const r = Store.qRec(q.id);
      let w;
      if (!r) w = 3;                       // chưa gặp bao giờ → ưu tiên cao
      else if (r.w > 0 && r.c < 3) w = 4;  // đang trong sổ sai → ưu tiên cao nhất
      else if (r.c >= 3) w = 0.4;          // đã thuộc → ít ưu tiên
      else w = 1.5;
      return { q, k: Math.random() / w };   // k nhỏ = ưu tiên
    });
    scored.sort((a, b) => a.k - b.k);
    return scored.slice(0, n).map(x => x.q);
  }

  /* Bộ đề thi thử 36 câu mô phỏng cấu trúc thật:
     7 câu 1 điểm (tiếng Hàn) + 29 câu 2 điểm */
  function makeExam() {
    const one = shuffle(questions.filter(q => q.points === 1)).slice(0, 7);
    const readCnt = 3;
    const reading = shuffle(inDomain('kor_reading')).slice(0, readCnt);
    const rest = questions.filter(q =>
      q.points === 2 && q.domain !== 'kor_reading');
    // phân bổ theo trọng số thực tế: cơ bản nhiều hơn, nâng cao đáng kể
    const wantAdv = 10;
    const adv = shuffle(rest.filter(q => q.level === 'advanced')).slice(0, wantAdv);
    const basicNeed = 29 - reading.length - adv.length;
    const basic = shuffle(rest.filter(q => q.level === 'basic')).slice(0, basicNeed);

    let two = [...reading, ...adv, ...basic];
    // nếu thiếu (ngân hàng nhỏ) thì bù bằng bất kỳ câu 2 điểm nào
    if (two.length < 29) {
      const have = new Set(two.map(q => q.id));
      for (const q of shuffle(rest)) {
        if (two.length >= 29) break;
        if (!have.has(q.id)) { two.push(q); have.add(q.id); }
      }
    }
    two = shuffle(two).slice(0, 29);
    return [...one, ...two];
  }

  return {
    load, DOMAINS, GROUPS,
    domainMeta, inDomain, byId, activeDomains,
    shuffle, pick, makeExam,
    lessonsIn, lessonById, domainsWithLessons, questionsForLesson,
    get lessons(){ return lessons },
    get questions(){ return questions },
    get writing(){ return writing },
    get speaking(){ return speaking },
    get fun(){ return fun },
    get errors(){ return loadErrors }
  };
})();
