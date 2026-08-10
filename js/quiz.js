/* ============================================================
   quiz.js — bộ chơi câu hỏi (luyện tập / thi thử), 작문, 구술, fun
   ============================================================ */

const Quiz = (() => {
  const E = UI.esc;

  let list = [];       // câu hỏi hiện tại
  let idx = 0;
  let mode = 'practice';
  let picks = [];      // đáp án đã chọn (exam)
  let answered = false;
  let nCorrect = 0;
  let title = '';
  let backTo = null;
  let timer = null;
  let endAt = 0;

  /* ================= LUYỆN TẬP / THI THỬ ================= */

  function start(qs, opts = {}) {
    if (!qs.length) { UI.toast('Không có câu hỏi nào 😢'); return; }
    list = qs;
    idx = 0;
    mode = opts.mode || 'practice';
    picks = new Array(qs.length).fill(null);
    answered = false;
    nCorrect = 0;
    title = opts.title || 'Luyện tập';
    backTo = opts.back || (() => App.tab('home'));

    if (mode === 'exam') {
      endAt = Date.now() + (opts.minutes || 50) * 60000;
      clearInterval(timer);
      timer = setInterval(tick, 1000);
    }
    draw();
  }

  function quit() {
    UI.confirm(
      mode === 'exam' ? 'Dừng bài thi?' : 'Thoát luyện tập?',
      mode === 'exam'
        ? 'Bài thi sẽ không được tính điểm. Bạn chắc chứ?'
        : 'Tiến độ câu đã trả lời vẫn được lưu.',
      'Thoát',
      () => { clearInterval(timer); backTo(); });
  }

  function tick() {
    const left = Math.max(0, endAt - Date.now());
    const el = document.getElementById('qTimer');
    if (el) {
      const m = Math.floor(left / 60000), s = Math.floor(left % 60000 / 1000);
      el.textContent = `${m}:${String(s).padStart(2, '0')}`;
      el.classList.toggle('hot', left < 5 * 60000);
    }
    if (left <= 0) { clearInterval(timer); finishExam(true); }
  }

  function draw() {
    const q = list[idx];
    const dm = Data.domainMeta(q.domain);
    const isExam = mode === 'exam';

    UI.topbar({
      title: `${title}`,
      back: quit,
      action: isExam ? { label: 'Nộp bài', fn: () => confirmSubmit() } : null
    });

    const head = `
      <div class="qhead">
        <div class="qcount">${idx + 1} / ${list.length}</div>
        <div class="qprog"><i style="width:${(idx + 1) / list.length * 100}%"></i></div>
        ${isExam ? '<div class="qtimer" id="qTimer">--:--</div>' : ''}
      </div>`;

    const tags = `
      <div class="qtags">
        <span class="chip pri">${dm.em} ${E(dm.vi)}</span>
        <span class="chip">${E(dm.ko)}${q.topic ? ' · ' + E(q.topic) : ''}</span>
        <span class="chip gold">${q.points}점</span>
        ${!isExam && Store.isWrongNote(q.id) ? '<span class="chip no">🔁 Câu từng sai</span>' : ''}
      </div>`;

    const pass = q.passage
      ? `<div class="qpass">${E(q.passage)}</div>` : '';

    const sel = isExam ? picks[idx] : null;
    const opts = q.choices.map((c, i) => `
      <button class="opt${sel === i ? ' pick' : ''}" data-i="${i}">
        <span class="n">${UI.CIRC[i]}</span><span class="t">${E(c)}</span>
      </button>`).join('');

    const nav = isExam ? `
      <div class="qbtns">
        <button class="btn ghost" id="bPrev" ${idx === 0 ? 'disabled' : ''}>‹ Trước</button>
        <button class="btn" id="bNext">${idx === list.length - 1 ? 'Xem lại & nộp' : 'Sau ›'}</button>
      </div>` : '';

    UI.render(`${head}${tags}
      <div class="qtext">${E(q.q)}</div>${pass}
      <div class="opts" id="opts">${opts}</div>
      <div id="after"></div>
      ${nav}`);

    document.getElementById('opts').querySelectorAll('.opt')
      .forEach(b => b.onclick = () => choose(+b.dataset.i));

    if (isExam) {
      document.getElementById('bPrev').onclick = () => { if (idx > 0) { idx--; draw(); } };
      document.getElementById('bNext').onclick = () => {
        if (idx < list.length - 1) { idx++; draw(); } else confirmSubmit();
      };
      tick();
    }
    answered = false;
  }

  function choose(i) {
    const q = list[idx];

    if (mode === 'exam') {
      picks[idx] = i;
      document.querySelectorAll('#opts .opt').forEach((b, k) =>
        b.classList.toggle('pick', k === i));
      // tự chuyển câu sau 250ms cho mượt
      setTimeout(() => {
        if (idx < list.length - 1) { idx++; draw(); }
      }, 240);
      return;
    }

    if (answered) return;
    answered = true;

    const ok = i === q.answer;
    if (ok) nCorrect++;

    document.querySelectorAll('#opts .opt').forEach((b, k) => {
      b.disabled = true;
      if (k === q.answer) b.classList.add('right');
      else if (k === i) b.classList.add('wrong');
      else b.classList.add('dim');
    });

    const r = Store.recordAnswer(q.id, ok, q.points);
    showExplain(q, ok, r);
    if (r.leveledTo) setTimeout(() => UI.levelUp(r.leveledTo), 600);
  }

  function showExplain(q, ok, r) {
    const rec = r.rec || {};
    const streakNote = ok && rec.c >= 3 && rec.w > 0
      ? '<span class="chip ok">🎓 Đã thuộc — rời sổ tay câu sai</span>' : '';

    const kw = (q.keywords || []).map(k => `<span class="chip">${E(k)}</span>`).join('');

    document.getElementById('after').innerHTML = `
      <div class="exp">
        <div class="exp-top ${ok ? 'ok' : 'no'}">
          <span>${ok ? '✅' : '❌'}</span>
          <span>${ok ? 'Chính xác!' : 'Sai rồi'} — Đáp án ${UI.CIRC[q.answer]}</span>
          <span class="exp-xp">+${r.xp} XP</span>
        </div>
        <div class="exp-body">
          <div class="exp-vi">${E(q.explain_vi || '')}</div>
          ${q.explain_ko ? `<div class="exp-ko">🇰🇷 ${E(q.explain_ko)}</div>` : ''}
          ${kw || streakNote ? `<div class="exp-kw">${kw}${streakNote}</div>` : ''}
        </div>
      </div>
      <div class="qbtns">
        <button class="btn" id="bNx">${idx === list.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo ›'}</button>
      </div>`;

    const b = document.getElementById('bNx');
    b.onclick = () => {
      if (idx === list.length - 1) finishPractice();
      else { idx++; draw(); }
    };
    b.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------- kết thúc luyện tập ---------- */
  function finishPractice() {
    const p = UI.pct(nCorrect, list.length);
    const bonus = p === 100 ? 30 : p >= 80 ? 15 : 0;
    if (bonus) { const r = Store.addXp(bonus); if (r.leveledTo) setTimeout(() => UI.levelUp(r.leveledTo), 500); }

    const em = p === 100 ? '🏆' : p >= 80 ? '🎉' : p >= 60 ? '👍' : '💪';
    const msg = p === 100 ? 'Hoàn hảo! Không sai câu nào.'
      : p >= 80 ? 'Rất tốt! Giữ nhịp này là đậu chắc.'
      : p >= 60 ? 'Qua mức đậu rồi, nhưng đừng dừng ở đây nhé.'
      : 'Chưa ổn. Vào "Sổ tay câu sai" luyện lại mấy câu này đi.';

    UI.topbar({ title: 'Kết quả', back: backTo });
    UI.render(`
      <div class="res">
        <div class="res-emoji">${em}</div>
        <div class="res-score">${nCorrect}<small> / ${list.length}</small></div>
        <div class="res-tag ${p >= 60 ? 'pass' : 'fail'}">${p}% đúng</div>
        <div class="res-msg">${msg}${bonus ? `<br><b style="color:var(--gold)">Thưởng +${bonus} XP</b>` : ''}</div>
      </div>
      <div class="qbtns mt2">
        <button class="btn ghost" id="bHome">Trang chủ</button>
        <button class="btn" id="bAgain">Luyện tiếp</button>
      </div>`, { plain: false });

    document.getElementById('bHome').onclick = () => App.tab('home');
    document.getElementById('bAgain').onclick = backTo;
  }

  /* ---------- nộp bài thi ---------- */
  function confirmSubmit() {
    const blank = picks.filter(p => p === null).length;
    UI.confirm('Nộp bài thi?',
      blank ? `Còn ${blank} câu chưa trả lời. Câu bỏ trống được tính 0 điểm.`
            : 'Bạn đã trả lời hết. Nộp bài nhé?',
      'Nộp bài', () => finishExam(false));
  }

  function finishExam(timeout) {
    clearInterval(timer);

    let raw = 0, maxRaw = 0, correct = 0;
    const review = [];
    list.forEach((q, i) => {
      maxRaw += q.points;
      const ok = picks[i] === q.answer;
      if (ok) { raw += q.points; correct++; }
      Store.recordAnswer(q.id, ok, q.points);
      if (!ok) review.push({ q, pick: picks[i] });
    });

    // Quy đổi về thang thật: trắc nghiệm 36 câu = 65 điểm / tổng 100
    const mcScore = maxRaw ? raw / maxRaw * 65 : 0;
    // Ước tính tổng điểm nếu 작문(10) + 구술(25) đạt cùng tỉ lệ
    const est = Math.floor(mcScore / 65 * 100);
    const pass = est >= 60;

    Store.addExam({ score: est, mc: Math.floor(mcScore), pass, correct, total: list.length });
    const r = Store.addXp(pass ? 150 : 60);

    const em = est >= 90 ? '🏆' : est >= 80 ? '🎊' : pass ? '✅' : '😵';
    const msg = est >= 90 ? 'Điểm này là dư sức đậu. Xuất sắc!'
      : est >= 80 ? 'Rất an toàn. Mục tiêu 80~90 điểm đã đạt.'
      : pass ? 'Đậu rồi, nhưng còn sát. Luyện thêm cho chắc.'
      : 'Chưa đạt 60 điểm. Xem lại các câu sai bên dưới nhé.';

    UI.topbar({ title: 'Kết quả thi thử', back: () => App.tab('exam') });

    const revHtml = review.length ? review.map(({ q, pick }) => `
      <div class="rev">
        <div class="rq">${E(q.q)}</div>
        <div class="ra">
          ${pick === null ? '<s>Bỏ trống</s>' : `<s>Bạn chọn: ${UI.CIRC[pick]} ${E(q.choices[pick])}</s>`}<br>
          <b>Đáp án: ${UI.CIRC[q.answer]} ${E(q.choices[q.answer])}</b><br>
          <span style="color:var(--tx2)">${E(q.explain_vi || '')}</span>
        </div>
      </div>`).join('')
      : '<div class="card center" style="color:var(--ok);font-weight:700">Không sai câu nào! 🎯</div>';

    UI.render(`
      <div class="res">
        <div class="res-emoji">${em}</div>
        <div class="res-score">${est}<small> / 100</small></div>
        <div class="res-tag ${pass ? 'pass' : 'fail'}">${pass ? 'ĐẬU (≥60)' : 'CHƯA ĐẬU'}</div>
        <div class="res-msg">
          ${timeout ? '<b style="color:var(--no)">Hết giờ — bài được nộp tự động.</b><br>' : ''}
          Trắc nghiệm đúng <b>${correct}/${list.length}</b> câu ·
          <b>${Math.floor(mcScore)}/65</b> điểm phần trắc nghiệm.<br>
          ${msg}
          <br><b style="color:var(--gold)">+${r.gained} XP</b>
        </div>
      </div>
      <div class="qbtns mt2">
        <button class="btn ghost" id="bHome">Trang chủ</button>
        <button class="btn" id="bWrong">Sổ tay câu sai</button>
      </div>
      <div class="h2">📋 Các câu đã sai <span class="ko">오답 ${review.length}문항</span></div>
      ${revHtml}
      <div class="card muted mt" style="line-height:1.65">
        ℹ️ Điểm 100 ở trên là <b>ước tính</b>: phần trắc nghiệm thật chiếm 65/100 điểm,
        còn 작문 10 điểm và 구술 25 điểm được quy đổi theo cùng tỉ lệ.
        Muốn chắc thì luyện thêm phần Viết và Nói.
      </div>`);

    if (r.leveledTo) setTimeout(() => UI.levelUp(r.leveledTo), 700);
    document.getElementById('bHome').onclick = () => App.tab('home');
    document.getElementById('bWrong').onclick = () => App.wrongNote();
  }

  /* ================= 작문 — VIẾT ================= */

  function writing(w) {
    const key = 'kinat.wr.' + w.id;
    UI.topbar({ title: 'Luyện viết 작문', back: () => App.writingList() });

    const subs = (w.subquestions || []).map(s => `<li>${E(s)}</li>`).join('');
    const exps = (w.useful_expressions || []).map(x =>
      `<div class="exrow"><b>${E(x.ko)}</b><i>${E(x.vi)}</i></div>`).join('');
    const chk = (w.checkpoints_vi || []).map(c => `<li>${E(c)}</li>`).join('');

    UI.render(`
      <div class="qtags">
        <span class="chip pri">✍️ 작문형</span>
        <span class="chip gold">10점 · 10분</span>
        <span class="chip">200자 원고지 1장</span>
      </div>
      <div class="qtext">${E(w.prompt)}</div>
      <div class="wr-sub"><ul>${subs}</ul></div>

      <textarea class="wpad" id="wpad" placeholder="Viết bài của bạn ở đây… (khoảng 200 chữ)"></textarea>
      <div class="wcount" id="wcount">0자</div>

      <div class="qbtns">
        <button class="btn ghost" id="bClear">Xóa</button>
        <button class="btn" id="bShow">Xem bài mẫu</button>
      </div>

      <div id="wrAfter"></div>

      <div class="h2">💡 Mẹo làm bài <span class="ko">공략법</span></div>
      <div class="card" style="font-size:14.5px;line-height:1.7">${E(w.tips_vi || '')}</div>

      ${chk ? `<div class="h2">✅ Điểm chấm <span class="ko">채점 포인트</span></div>
      <div class="card"><ul style="margin:0;padding-left:19px;font-size:14px;line-height:1.75">${chk}</ul></div>` : ''}

      ${exps ? `<div class="h2">🗣️ Mẫu câu hữu ích <span class="ko">유용한 표현</span></div>
      <div class="exlist">${exps}</div>` : ''}`);

    const pad = document.getElementById('wpad');
    const cnt = document.getElementById('wcount');
    pad.value = localStorage.getItem(key) || '';

    const upd = () => {
      const n = UI.countChars(pad.value);
      cnt.textContent = n + '자';
      cnt.className = 'wcount' + (n > 200 ? ' over' : n >= 170 ? ' good' : '');
      localStorage.setItem(key, pad.value);
    };
    pad.oninput = upd; upd();

    document.getElementById('bClear').onclick = () => {
      pad.value = ''; upd(); pad.focus();
    };

    document.getElementById('bShow').onclick = () => {
      const n = UI.countChars(pad.value);
      let xp = 0;
      const done = Store.get('wrDone') || [];
      if (n >= 120 && !done.includes(w.id)) {
        done.push(w.id); Store.set('wrDone', done);
        xp = 40;
        const r = Store.addXp(xp);
        UI.xpToast(xp);
        if (r.leveledTo) setTimeout(() => UI.levelUp(r.leveledTo), 500);
      }
      document.getElementById('wrAfter').innerHTML = `
        <div class="h2">📄 Bài mẫu <span class="ko">모범답안 (${w.char_count || UI.countChars(w.model_answer)}자)</span></div>
        <div class="model">${E(w.model_answer)}</div>
        ${n < 120 ? '<div class="muted mt">✍️ Tự viết ít nhất 120 chữ rồi mới xem bài mẫu sẽ nhận được +40 XP.</div>' : ''}`;
      document.getElementById('wrAfter').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  }

  /* ================= 구술 — NÓI ================= */

  function speaking(sp) {
    UI.topbar({ title: 'Luyện nói 구술', back: () => App.speakingList() });

    const qs = (sp.questions || []).map(q => {
      const pts = (q.key_points_vi || []).map(k => `<li>${E(k)}</li>`).join('');
      return `
      <div class="spq" data-no="${q.no}">
        <div class="n">${q.type === 'personal' ? 'CÂU HỎI RIÊNG · 개별질문' : 'THEO BÀI ĐỌC · 지문관련'} — ${q.no}번 (5점)</div>
        <div class="q">${E(q.q)}</div>
        ${q.hint_vi ? `<div class="hint">💭 ${E(q.hint_vi)}</div>` : ''}
        <button class="btn ghost sm mt" data-rev="${q.no}">Xem câu trả lời mẫu</button>
        <div class="reveal" id="rev${q.no}" hidden>
          <div class="lbl">모범답안 · CÂU TRẢ LỜI MẪU</div>
          <div class="ans">${E(q.model_answer_ko)}</div>
          ${pts ? `<ul>${pts}</ul>` : ''}
        </div>
      </div>`;
    }).join('');

    UI.render(`
      <div class="qtags">
        <span class="chip pri">🗣️ 구술형</span>
        <span class="chip gold">25점 · 10분</span>
        <span class="chip">${E(sp.topic)}</span>
      </div>
      <div class="h2">📖 Bài đọc <span class="ko">지문</span></div>
      <div class="qpass">${E(sp.passage)}</div>
      <div class="card muted" style="line-height:1.6">
        ⚠️ Trong phòng thi bạn <b>chỉ nhận được bài đọc</b>, câu hỏi thì giám khảo giữ.
        Hãy đọc kỹ rồi tự đoán xem người ta sẽ hỏi gì.
      </div>
      <div class="h2">❓ 5 câu hỏi <span class="ko">질문</span></div>
      ${qs}
      <div class="qbtns mt2"><button class="btn" id="bDone">Đã luyện xong bài này</button></div>`);

    UI.app().querySelectorAll('[data-rev]').forEach(b => {
      b.onclick = () => {
        const r = document.getElementById('rev' + b.dataset.rev);
        r.hidden = !r.hidden;
        b.textContent = r.hidden ? 'Xem câu trả lời mẫu' : 'Ẩn câu trả lời mẫu';
      };
    });

    document.getElementById('bDone').onclick = () => {
      const done = Store.get('spDone') || [];
      if (!done.includes(sp.id)) {
        done.push(sp.id); Store.set('spDone', done);
        const r = Store.addXp(35);
        UI.xpToast(35);
        if (r.leveledTo) setTimeout(() => UI.levelUp(r.leveledTo), 500);
      } else UI.toast('Bài này đã luyện rồi 👍');
      App.speakingList();
    };
  }

  /* ================= FUN QUIZ ================= */

  let funList = [], funIdx = 0, funScore = 0, funAnswered = false;

  function funStart() {
    if (!Data.fun.length) { UI.toast('Chưa nạp được bộ câu vui 😢'); return; }
    funList = Data.shuffle(Data.fun).slice(0, 10);
    funIdx = 0; funScore = 0;
    funDraw();
  }

  function funDraw() {
    const f = funList[funIdx];
    funAnswered = false;

    UI.topbar({ title: '진짜 한국인 테스트', back: () => App.tab('fun') });

    const opts = f.choices_vi.map((c, i) => `
      <button class="opt" data-i="${i}">
        <span class="n">${UI.CIRC[i]}</span>
        <span class="t">${E(c)}<br><span class="ko">${E((f.choices_ko || [])[i] || '')}</span></span>
      </button>`).join('');

    UI.render(`
      <div class="qhead">
        <div class="qcount">${funIdx + 1} / ${funList.length}</div>
        <div class="qprog"><i style="width:${(funIdx + 1) / funList.length * 100}%"></i></div>
        <div class="qcount" style="color:var(--gold)">🔥 ${funScore}</div>
      </div>
      <div class="qtags"><span class="chip pri">😎 ${E(f.category || 'K-common sense')}</span></div>
      <div class="qtext">${E(f.q_vi)}<div class="ko" style="margin-top:6px;font-size:13px">${E(f.q_ko)}</div></div>
      <div class="opts" id="opts">${opts}</div>
      <div id="after"></div>`);

    document.getElementById('opts').querySelectorAll('.opt')
      .forEach(b => b.onclick = () => funChoose(+b.dataset.i));
  }

  function funChoose(i) {
    if (funAnswered) return;
    funAnswered = true;
    const f = funList[funIdx];
    const ok = i === f.answer;
    if (ok) funScore++;

    document.querySelectorAll('#opts .opt').forEach((b, k) => {
      b.disabled = true;
      if (k === f.answer) b.classList.add('right');
      else if (k === i) b.classList.add('wrong');
      else b.classList.add('dim');
    });

    const r = Store.recordFun(f.id, ok);
    if (r.leveledTo) setTimeout(() => UI.levelUp(r.leveledTo), 700);

    document.getElementById('after').innerHTML = `
      <div class="roast ${ok ? 'ok' : 'no'}">
        <div class="lbl">${ok ? '👏 CHÍNH XÁC' : '💀 SAI RỒI'}</div>
        ${E(ok ? f.correct_vi : f.wrong_vi)}
      </div>
      ${f.explain_vi ? `<div class="card mt" style="font-size:14px;line-height:1.7">
        <b style="color:var(--pri)">ℹ️ Giải thích</b><br>${E(f.explain_vi)}</div>` : ''}
      <div class="qbtns">
        <button class="btn" id="bNx">${funIdx === funList.length - 1 ? 'Xem kết quả' : 'Câu tiếp ›'}</button>
      </div>`;

    document.getElementById('bNx').onclick = () => {
      if (funIdx === funList.length - 1) funEnd();
      else { funIdx++; funDraw(); }
    };
  }

  function funEnd() {
    const n = funScore, t = funList.length;
    if (n > (Store.get('funBest') || 0)) Store.set('funBest', n);

    let em, tag, msg;
    if (n === t)      { em = '🇰🇷'; tag = 'NGƯỜI HÀN THẬT SỰ'; msg = 'Chèn ơi… trình này thì khỏi thi luôn, cấp quốc tịch liền! 🏆'; }
    else if (n >= 8)  { em = '😎'; tag = 'DÂN HÀN XỊN';       msg = 'Ngon lành! Chỉ thiếu chút xíu nữa là hoàn hảo rồi nha.'; }
    else if (n >= 6)  { em = '🙂'; tag = 'TẠM ĐƯỢC';          msg = 'Cũng được, nhưng còn phải học thêm mấy cái "thường thức" nha.'; }
    else if (n >= 4)  { em = '😅'; tag = 'CÒN YẾU';           msg = 'Hmm… sống ở Hàn bao lâu rồi mà zậy? Học lại đi hen!'; }
    else              { em = '🍜'; tag = 'THÔI VỀ ĐÀ NẴNG';   msg = 'Trời đất ơi… Thôi dẹp, về Đà Nẵng ăn mì Quảng cho khỏe! 🇻🇳'; }

    UI.topbar({ title: 'Kết quả', back: () => App.tab('fun') });
    UI.render(`
      <div class="res">
        <div class="res-emoji">${em}</div>
        <div class="res-score">${n}<small> / ${t}</small></div>
        <div class="res-tag ${n >= 6 ? 'pass' : 'fail'}">${tag}</div>
        <div class="res-msg">${msg}</div>
      </div>
      <div class="qbtns mt2">
        <button class="btn ghost" id="bBack">Quay lại</button>
        <button class="btn acc" id="bAgain">Chơi tiếp 🔁</button>
      </div>`);
    document.getElementById('bBack').onclick = () => App.tab('fun');
    document.getElementById('bAgain').onclick = funStart;
  }

  return { start, writing, speaking, funStart };
})();
