/* ============================================================
   app.js — điều hướng + các màn hình chính
   ============================================================ */

const App = (() => {
  const E = UI.esc;
  let curTab = 'home';

  /* ================= HOME ================= */

  function home() {
    const s = Store.all();
    const li = Store.levelInfo(s.xp);
    const rk = Store.rank(li.lv);
    const acc = UI.pct(s.totalCorrect, s.totalAnswered);
    const wrong = Store.wrongIds().length;
    const dd = Store.dday();
    const total = Data.questions.length;
    const studied = Object.keys(s.q).filter(id => Data.byId(id)).length;

    // 7 ngày gần nhất
    const days = [];
    const t = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() - i);
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      days.push({ key, lbl: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()], on: s.days.includes(key), today: i === 0 });
    }

    const ddChip = dd === null
      ? `<button class="dday" id="setDday">🗓️ Đặt ngày thi 시험일 설정</button>`
      : dd > 0 ? `<span class="dday">🗓️ Còn <b>${dd}</b> ngày đến ngày thi</span>`
      : dd === 0 ? `<span class="dday">🔥 HÔM NAY LÀ NGÀY THI! Cố lên!</span>`
      : `<span class="dday">✅ Đã thi xong ${-dd} ngày trước</span>`;

    // ----- dự án 100 ngày -----
    const day = Store.planDay();
    const ph = Store.phaseOf(day);
    const doneN = Store.daysDone();
    const rec = Store.dayRec();
    const goal = Store.dailyGoal();
    const gpct = Math.min(100, Math.round(rec.n / goal * 100));
    const dayShown = Math.min(Math.max(day, 1), 100);
    const nm = s.name || 'KIEU';

    UI.topbar({ title: 'KINAT 귀화시험', action: { label: '⚙️', fn: settings } });

    UI.render(`
      <div style="margin-bottom:12px">
        <div class="h1">Chào ${E(nm)} 👋</div>
        <div class="sub">반갑습니다 ${E(nm)}님 — hôm nay học một chút nhé!</div>
      </div>
      <div style="margin-bottom:13px">${ddChip}</div>

      <button class="plan-hero" id="goPlan">
        <div class="ph-top">
          <span class="ph-tag">DỰ ÁN 100 NGÀY · 100일 프로젝트</span>
          <span class="ph-arrow">›</span>
        </div>
        <div class="ph-day">Ngày <b>${dayShown}</b><small>/ 100</small></div>
        <div class="ph-phase">${ph.em} ${E(ph.vi)} <span class="ko">${E(ph.ko)}</span></div>
        <div class="bar"><i style="width:${doneN}%"></i></div>
        <div class="hero-xp"><span>Đã hoàn thành <b>${doneN}</b>/100 ngày</span><span>${day > 100 ? 'Đã quá 100 ngày' : 'Còn ' + (100 - dayShown) + ' ngày'}</span></div>
      </button>

      <div class="card quest">
        <div class="spread">
          <b style="font-size:14.5px">${rec.done ? '✅' : '🎯'} Nhiệm vụ hôm nay <span class="ko">오늘의 목표</span></b>
          <b style="font-size:14px;color:${rec.done ? 'var(--ok)' : 'var(--tx2)'}">${rec.n} / ${goal} câu</b>
        </div>
        <div class="bar" style="margin-top:9px"><i style="width:${gpct}%;background:${rec.done ? 'linear-gradient(90deg,#22C55E,#4ADE80)' : 'linear-gradient(90deg,#4F7CFF,#8B5CF6)'}"></i></div>
        <div class="muted mt">${rec.done
          ? 'Xong nhiệm vụ hôm nay rồi! Học thêm vẫn được cộng XP 😎'
          : `Còn <b style="color:var(--tx)">${goal - rec.n} câu</b> nữa là xong nhiệm vụ — thưởng <b style="color:var(--gold)">+50 XP</b>`}</div>
      </div>

      <div class="hero">
        <div class="hero-rank">${rk.em} ${E(rk.vi)} · ${E(rk.ko)}</div>
        <div class="hero-lv">Lv.${li.lv}<small>${s.xp.toLocaleString()} XP</small></div>
        <div class="bar"><i style="width:${li.pct}%"></i></div>
        <div class="hero-xp"><span>${li.cur} / ${li.need} XP</span><span>Lv.${li.lv + 1}까지 ${li.need - li.cur} XP</span></div>
      </div>

      <div class="stat3">
        <div class="stat"><b style="color:var(--acc)">${s.streak}</b><i>🔥 Chuỗi ngày</i></div>
        <div class="stat"><b style="color:var(--ok)">${acc}%</b><i>✅ Tỉ lệ đúng</i></div>
        <div class="stat"><b>${studied}<span style="font-size:12px;color:var(--tx3)">/${total}</span></b><i>📚 Đã học</i></div>
      </div>

      <div class="card">
        <div class="spread">
          <b style="font-size:14.5px">📅 Điểm danh 7 ngày <span class="ko">출석</span></b>
          <span class="muted">+20~70 XP/ngày</span>
        </div>
        <div class="att">
          ${days.map(d => `<div class="${d.on ? 'on' : ''}${d.today ? ' today' : ''}">${d.on ? '✓' : d.lbl}</div>`).join('')}
        </div>
      </div>

      <div class="h2">🎯 Học ngay <span class="ko">바로 시작</span></div>
      <div class="menu">
        <button class="mi wide" data-go="today">
          <em>⚡</em><b>Học theo kế hoạch hôm nay</b><i>${ph.em} ${E(ph.ko)} — ${goal} câu đúng trọng tâm giai đoạn này</i>
        </button>
        <button class="mi" data-go="study">
          <em>📚</em><b>Theo lĩnh vực</b><i>영역별 학습</i>
        </button>
        <button class="mi" data-go="wrong">
          <em>🔁</em><b>Sổ tay câu sai</b><i>오답노트</i>
          ${wrong ? `<span class="badge">${wrong}</span>` : ''}
        </button>
        <button class="mi" data-go="exam">
          <em>📝</em><b>Thi thử</b><i>36문항 · 50분</i>
        </button>
        <button class="mi" data-go="writing">
          <em>✍️</em><b>Luyện viết</b><i>작문 · 10점</i>
        </button>
        <button class="mi" data-go="speaking">
          <em>🗣️</em><b>Luyện nói</b><i>구술 · 25점</i>
        </button>
        <button class="mi" data-go="fun">
          <em>😎</em><b>Người Hàn thật sự</b><i>Nghỉ giải lao & bị chọc quê</i>
        </button>
      </div>

      <div class="card mt2 muted" style="line-height:1.7">
        <b style="color:var(--tx2)">ℹ️ 귀화용 종합평가 (KINAT)</b><br>
        Tổng <b>45 câu · 70 phút · 100 điểm</b> — Trắc nghiệm 36 câu (65đ) ·
        Viết 4 câu gộp 1 đề 200 chữ (10đ) · Nói 5 câu (25đ).
        <b style="color:var(--ok)">Đậu từ 60 điểm.</b>
      </div>`);

    UI.app().querySelectorAll('[data-go]').forEach(b => {
      b.onclick = () => go(b.dataset.go);
    });
    const sd = document.getElementById('setDday');
    if (sd) sd.onclick = settings;
    document.getElementById('goPlan').onclick = plan;
  }

  /* bộ câu hỏi đúng trọng tâm giai đoạn hiện tại */
  function todaySet() {
    const ph = Store.phaseOf(Store.planDay());
    const goal = ph.goal;
    let pool = ph.doms.length
      ? Data.questions.filter(q => ph.doms.includes(q.domain))
      : [];
    // giai đoạn 4 (hoặc kho thiếu): ưu tiên câu sai + trộn toàn bộ
    if (pool.length < goal * 2) {
      const wrong = Store.wrongIds().map(Data.byId).filter(Boolean);
      pool = pool.concat(wrong, Data.questions);
    }
    const seen = new Set(); const uniq = [];
    for (const q of pool) if (!seen.has(q.id)) { seen.add(q.id); uniq.push(q); }
    return Data.pick(uniq, goal);
  }

  function go(k) {
    if (k === 'today') {
      const ph = Store.phaseOf(Store.planDay());
      Quiz.start(todaySet(), { title: ph.em + ' ' + ph.vi, back: () => tab('home') });
    }
    else if (k === 'study')    tab('study');
    else if (k === 'wrong')    wrongNote();
    else if (k === 'exam')     tab('exam');
    else if (k === 'writing')  writingList();
    else if (k === 'speaking') speakingList();
    else if (k === 'fun')      tab('fun');
  }

  /* ================= 100일 프로젝트 ================= */

  function plan() {
    UI.topbar({ title: 'Dự án 100 ngày', back: () => tab('home'),
                action: { label: '↺', fn: askResetPlan } });

    const day = Store.planDay();
    const dayShown = Math.min(Math.max(day, 1), 100);
    const doneN = Store.daysDone();
    const grid = Store.planGrid();
    const cur = Store.phaseOf(day);
    const s = Store.all();
    const start = s.planStart;
    const dd = Store.dday();

    // ngày kết thúc dự án
    const p0 = start.split('-').map(Number);
    const end = new Date(Date.UTC(p0[0], p0[1] - 1, p0[2] + 99));
    const endStr = `${end.getUTCFullYear()}.${end.getUTCMonth() + 1}.${end.getUTCDate()}`;
    const startStr = `${p0[0]}.${p0[1]}.${p0[2]}`;

    const cells = grid.map(g => {
      const ph = Store.phaseOf(g.i);
      const tip = `Ngày ${g.i} · ${g.key}`;
      return `<div class="pc ${g.st}" title="${tip}" data-ph="${ph.from}">${
        [10,25,50,75,100].includes(g.i) ? '★' : (g.st.includes('done') ? '' : g.i % 10 === 1 ? g.i : '')
      }</div>`;
    }).join('');

    const phaseCards = Store.phases().map(p => {
      const isCur = p === cur;
      const dn = grid.filter(g => g.i >= p.from && g.i <= p.to && g.st.includes('done')).length;
      const tot = p.to - p.from + 1;
      const doms = p.doms.map(d => {
        const m = Data.domainMeta(d);
        return `<span class="chip">${m.em} ${E(m.vi)}</span>`;
      }).join('') || '<span class="chip">📝 Thi thử + Sổ tay câu sai</span>';
      return `
      <div class="card${isCur ? ' cur' : ''}" style="${isCur ? 'border-color:var(--pri)' : ''}">
        <div class="spread">
          <b style="font-size:15px">${p.em} ${E(p.vi)} <span class="ko">${E(p.ko)}</span></b>
          <span class="chip${isCur ? ' pri' : ''}">Ngày ${p.from}~${p.to}</span>
        </div>
        <div class="muted mt" style="line-height:1.65">${E(p.desc_vi)}</div>
        <div class="exp-kw" style="margin-top:10px">${doms}</div>
        <div class="spread mt">
          <span class="muted">Mục tiêu <b style="color:var(--tx)">${p.goal} câu/ngày</b></span>
          <span class="muted"><b style="color:${dn === tot ? 'var(--ok)' : 'var(--tx)'}">${dn}</b>/${tot} ngày xong</span>
        </div>
        <div class="dbar"><i style="width:${Math.round(dn / tot * 100)}%;background:${UI.barColor(Math.round(dn / tot * 100))}"></i></div>
      </div>`;
    }).join('');

    const msRows = Store.milestones().map(m => {
      const got = (s.milestones || []).includes(m.d);
      return `<div class="ms ${got ? 'got' : ''}">
        <span class="me">${m.em}</span>
        <div class="mt2x"><b>${m.d} ngày</b><i>${E(m.vi)}</i></div>
        <span class="chip ${got ? 'ok' : 'gold'}">${got ? '✓ Đã nhận' : '+' + m.xp + ' XP'}</span>
      </div>`;
    }).join('');

    UI.render(`
      <div class="plan-top">
        <div class="pt-day">Ngày <b>${dayShown}</b> <small>/ 100</small></div>
        <div class="pt-sub">${startStr} → ${endStr}</div>
        <div class="bar" style="margin-top:12px"><i style="width:${doneN}%"></i></div>
        <div class="hero-xp"><span>Hoàn thành <b>${doneN}</b>/100 ngày</span><span>${doneN}%</span></div>
      </div>

      ${dd !== null && dd >= 0 ? `<div class="card center" style="border-color:rgba(251,191,36,.35)">
        <b style="color:var(--gold);font-size:15px">🗓️ Còn ${dd} ngày đến ngày thi thật</b>
        <div class="muted mt">${dd > 100 ? 'Dư thời gian — cứ theo kế hoạch là chắc ăn.'
          : dd > 60 ? 'Đúng nhịp. Giữ đều mỗi ngày là được.'
          : dd > 30 ? 'Nên tăng tốc phần 심화 và bắt đầu thi thử.'
          : 'Giai đoạn nước rút — thi thử liên tục và dọn sổ tay câu sai.'}</div>
      </div>` : ''}

      <div class="h2">📅 Bản đồ 100 ngày <span class="ko">100일 지도</span></div>
      <div class="pgrid">${cells}</div>
      <div class="plegend">
        <span><i class="pc done"></i> Xong mục tiêu</span>
        <span><i class="pc partial"></i> Có học</span>
        <span><i class="pc miss"></i> Nghỉ</span>
        <span><i class="pc future"></i> Sắp tới</span>
      </div>

      <div class="h2">🗺️ 4 giai đoạn <span class="ko">4단계 플랜</span></div>
      ${phaseCards}

      <div class="h2">🏅 Mốc thưởng <span class="ko">마일스톤</span></div>
      ${msRows}

      <div class="card muted mt2" style="line-height:1.7">
        💡 Mỗi ngày làm đủ số câu mục tiêu là ngày đó "sáng đèn" trên bản đồ và được <b style="color:var(--gold)">+50 XP</b>.
        Nghỉ một ngày cũng không sao — ô đó tối đi thôi, tiến độ không bị mất.
      </div>`);

    UI.app().querySelectorAll('.pc').forEach(() => {});
  }

  function askResetPlan() {
    UI.confirm('Bắt đầu lại 100 ngày?',
      'Ngày 1 sẽ được tính lại từ hôm nay. XP, cấp độ và câu đã học vẫn giữ nguyên — chỉ có bản đồ 100 ngày và mốc thưởng được làm mới.',
      'Bắt đầu lại', () => { Store.resetPlan(); UI.toast('Đã bắt đầu lại từ Ngày 1 🌱'); plan(); });
  }

  /* ================= STUDY ================= */

  function study() {
    UI.topbar({ title: 'Học theo lĩnh vực' });
    const s = Store.all();

    const groups = Data.GROUPS.map(g => {
      const doms = Data.activeDomains().filter(d => d.grp === g.id);
      if (!doms.length) return '';
      const rows = doms.map(d => {
        const qs = Data.inDomain(d.id);
        const done = qs.filter(q => (s.q[q.id] || {}).c >= 1).length;
        const p = UI.pct(done, qs.length);
        return `
        <button class="dom" data-dom="${d.id}">
          <em>${d.em}</em>
          <div class="dt">
            <b>${E(d.vi)}</b>
            <i>${E(d.ko)} · ${qs.length} câu</i>
            <div class="dbar"><i style="width:${p}%;background:${UI.barColor(p)}"></i></div>
          </div>
          <div class="dn"><b>${p}%</b><i>${done}/${qs.length}</i></div>
        </button>`;
      }).join('');
      return `<div class="h2">${E(g.vi)} <span class="ko">${E(g.ko)}</span></div>${rows}`;
    }).join('');

    UI.render(`
      <div class="sub" style="margin-bottom:6px">Chọn lĩnh vực bạn muốn luyện. Mỗi lượt 15 câu.</div>
      ${groups}
      <div class="qbtns mt2">
        <button class="btn ghost" id="bAll">🎲 Trộn tất cả lĩnh vực (25 câu)</button>
      </div>`);

    UI.app().querySelectorAll('[data-dom]').forEach(b => {
      b.onclick = () => {
        const d = Data.domainMeta(b.dataset.dom);
        const qs = Data.pick(Data.inDomain(b.dataset.dom), 15);
        Quiz.start(qs, { title: d.vi, back: () => tab('study') });
      };
    });
    document.getElementById('bAll').onclick = () => {
      Quiz.start(Data.pick(Data.questions, 25), { title: 'Trộn tất cả', back: () => tab('study') });
    };
  }

  /* ================= WRONG NOTE ================= */

  function wrongNote() {
    UI.topbar({ title: 'Sổ tay câu sai 오답노트', back: () => tab('home') });

    const ids = Store.wrongIds().filter(id => Data.byId(id));
    const grad = Store.graduatedIds().filter(id => Data.byId(id)).length;

    if (!ids.length) {
      UI.render(`
        <div class="empty">
          <em>🎉</em>
          <b>Không còn câu sai nào!</b>
          Làm sai câu nào thì nó sẽ tự động vào đây.<br>
          Trả lời đúng <b>3 lần liên tiếp</b> thì câu đó "tốt nghiệp".
        </div>
        ${grad ? `<div class="card center"><b style="color:var(--ok);font-size:22px">${grad}</b><br>
          <span class="muted">câu đã tốt nghiệp 🎓</span></div>` : ''}
        <div class="qbtns mt2"><button class="btn" id="bGo">Luyện tập ngay</button></div>`);
      document.getElementById('bGo').onclick = () => tab('study');
      return;
    }

    const byDom = {};
    ids.forEach(id => { const q = Data.byId(id); (byDom[q.domain] ||= []).push(q); });

    const rows = Object.entries(byDom).sort((a, b) => b[1].length - a[1].length).map(([d, qs]) => {
      const m = Data.domainMeta(d);
      return `<button class="dom" data-dom="${d}">
        <em>${m.em}</em>
        <div class="dt"><b>${E(m.vi)}</b><i>${E(m.ko)}</i></div>
        <div class="dn"><b style="color:var(--no)">${qs.length}</b><i>câu</i></div>
      </button>`;
    }).join('');

    UI.render(`
      <div class="card">
        <div class="spread">
          <div><b style="font-size:26px;color:var(--no)">${ids.length}</b>
            <span class="muted"> câu cần ôn lại</span></div>
          <div class="center"><b style="font-size:20px;color:var(--ok)">${grad}</b>
            <div class="muted">đã tốt nghiệp 🎓</div></div>
        </div>
        <div class="muted mt">Trả lời đúng <b>3 lần liên tiếp</b> → câu đó rời sổ tay.</div>
      </div>
      <div class="qbtns">
        <button class="btn acc" id="bAll">🔥 Ôn tất cả (${Math.min(ids.length, 20)} câu)</button>
      </div>
      <div class="h2">Theo lĩnh vực <span class="ko">영역별</span></div>
      ${rows}`);

    document.getElementById('bAll').onclick = () => {
      const qs = Data.shuffle(ids.map(Data.byId)).slice(0, 20);
      Quiz.start(qs, { title: 'Ôn câu sai', back: wrongNote });
    };
    UI.app().querySelectorAll('[data-dom]').forEach(b => {
      b.onclick = () => {
        const qs = Data.shuffle(byDom[b.dataset.dom]);
        Quiz.start(qs, { title: 'Ôn: ' + Data.domainMeta(b.dataset.dom).vi, back: wrongNote });
      };
    });
  }

  /* ================= EXAM ================= */

  function exam() {
    UI.topbar({ title: 'Thi thử 모의고사' });
    const ex = Store.get('exams') || [];
    const best = ex.length ? Math.max(...ex.map(e => e.score)) : 0;
    const passes = ex.filter(e => e.pass).length;

    const hist = ex.slice(0, 8).map(e => `
      <div class="spread" style="padding:9px 0;border-bottom:1px solid var(--line)">
        <span class="muted">${UI.fmtDate(e.ts)}</span>
        <span>${e.correct}/${e.total} câu</span>
        <b style="color:${e.pass ? 'var(--ok)' : 'var(--no)'}">${e.score}점 ${e.pass ? '✅' : '❌'}</b>
      </div>`).join('');

    UI.render(`
      <div class="card">
        <b style="font-size:15px">📝 Cấu trúc đề thật <span class="ko">실제 시험</span></b>
        <div class="muted mt" style="line-height:1.8">
          • Trắc nghiệm <b>36 câu / 50 phút / 65 điểm</b> (7 câu×1đ + 29 câu×2đ)<br>
          • Viết 작문 4 câu gộp 1 đề, 200 chữ / 10 phút / 10 điểm<br>
          • Nói 구술 5 câu / 10 phút / 25 điểm<br>
          • <b style="color:var(--ok)">Đậu từ 60/100 điểm</b>
        </div>
      </div>

      <div class="stat3">
        <div class="stat"><b>${ex.length}</b><i>Lần thi</i></div>
        <div class="stat"><b style="color:${best >= 60 ? 'var(--ok)' : 'var(--tx)'}">${best}</b><i>Cao nhất</i></div>
        <div class="stat"><b style="color:var(--ok)">${passes}</b><i>Lần đậu</i></div>
      </div>

      <div class="qbtns">
        <button class="btn" id="bGo">▶️ Bắt đầu thi thử (36 câu · 50 phút)</button>
      </div>
      <div class="muted center mt">Có đồng hồ đếm ngược. Hết giờ tự nộp bài.</div>

      ${ex.length ? `<div class="h2">📜 Lịch sử <span class="ko">기록</span></div><div class="card">${hist}</div>` : ''}`);

    document.getElementById('bGo').onclick = () => {
      if (Data.questions.length < 36) { UI.toast('Ngân hàng câu hỏi chưa đủ 36 câu'); return; }
      UI.confirm('Bắt đầu thi thử?',
        '36 câu trong 50 phút. Không xem được đáp án cho tới khi nộp bài. Sẵn sàng chưa?',
        'Bắt đầu', () => {
          Quiz.start(Data.makeExam(), {
            mode: 'exam', minutes: 50, title: '모의고사', back: () => tab('exam')
          });
        });
    };
  }

  /* ================= WRITING ================= */

  function writingList() {
    UI.topbar({ title: 'Luyện viết 작문', back: () => tab('home') });
    const done = Store.get('wrDone') || [];
    const ws = Data.writing;

    if (!ws.length) { UI.render(emptyBox('✍️', 'Chưa có đề viết')); return; }

    UI.render(`
      <div class="card muted" style="line-height:1.75">
        <b style="color:var(--tx2)">✍️ 작문형 · 10 điểm</b><br>
        4 câu hỏi nhỏ được gộp thành <b>1 đề duy nhất</b>. Viết <b>200 chữ</b> trên 1 tờ giấy ô vuông
        trong <b>10 phút</b>. <b style="color:var(--warn)">Không viết tiêu đề</b>, chỉ viết phần thân bài.
      </div>
      <div class="h2">${ws.length} đề luyện tập <span class="ko">${done.length}개 완료</span></div>
      ${ws.map(w => `
        <button class="dom" data-w="${E(w.id)}">
          <em>${done.includes(w.id) ? '✅' : '📝'}</em>
          <div class="dt"><b>${E(w.title)}</b><i>${(w.subquestions || []).length} câu hỏi nhỏ</i></div>
          <div class="dn"><b style="color:var(--tx3)">›</b></div>
        </button>`).join('')}`);

    UI.app().querySelectorAll('[data-w]').forEach(b => {
      b.onclick = () => Quiz.writing(ws.find(w => w.id === b.dataset.w));
    });
  }

  /* ================= SPEAKING ================= */

  function speakingList() {
    UI.topbar({ title: 'Luyện nói 구술', back: () => tab('home') });
    const done = Store.get('spDone') || [];
    const sp = Data.speaking;

    if (!sp.length) { UI.render(emptyBox('🗣️', 'Chưa có đề nói')); return; }

    UI.render(`
      <div class="card muted" style="line-height:1.75">
        <b style="color:var(--tx2)">🗣️ 구술형 · 25 điểm (phần nặng ký nhất!)</b><br>
        5 câu / 10 phút. <b>2 giám khảo chấm 2 thí sinh cùng lúc</b>.
        Câu 1~3 hỏi theo bài đọc, câu 4~5 là câu hỏi riêng về xã hội Hàn Quốc hoặc ý kiến cá nhân.<br>
        <b style="color:var(--warn)">Mẹo: đọc to thành tiếng, đừng chỉ đọc thầm.</b>
      </div>
      <div class="h2">${sp.length} bộ đề <span class="ko">${done.length}개 완료</span></div>
      ${sp.map(x => `
        <button class="dom" data-s="${E(x.id)}">
          <em>${done.includes(x.id) ? '✅' : '🎤'}</em>
          <div class="dt"><b>${E(x.topic)}</b><i>지문 + 질문 ${(x.questions || []).length}개</i></div>
          <div class="dn"><b style="color:var(--tx3)">›</b></div>
        </button>`).join('')}`);

    UI.app().querySelectorAll('[data-s]').forEach(b => {
      b.onclick = () => Quiz.speaking(sp.find(x => x.id === b.dataset.s));
    });
  }

  /* ================= FUN ================= */

  function fun() {
    UI.topbar({ title: '진짜 한국인 테스트' });
    const best = Store.get('funBest') || 0;
    const n = Data.fun.length;

    UI.render(`
      <div class="fun-hero">
        <em>😎</em>
        <b>Bài kiểm tra<br>NGƯỜI HÀN THẬT SỰ</b>
        <i>진짜 한국인 테스트</i>
      </div>

      <div class="card" style="line-height:1.75">
        Học mệt rồi hả? Nghỉ chút đi. 🍵<br><br>
        Ở đây toàn mấy câu <b>"người Hàn nào cũng biết"</b> — ăn gì ngày nóng,
        uống gì ngày lạnh, phép tắc rót rượu, tiếng lóng…<br><br>
        <b style="color:var(--ok)">Đúng thì được khen.</b>
        <b style="color:var(--acc)">Sai thì bị chọc quê không thương tiếc.</b> 😈
      </div>

      <div class="stat3">
        <div class="stat"><b style="color:var(--gold)">${best}<span style="font-size:12px;color:var(--tx3)">/10</span></b><i>🏆 Kỷ lục</i></div>
        <div class="stat"><b>${n}</b><i>Câu trong kho</i></div>
        <div class="stat"><b style="color:var(--pri)">+5</b><i>XP mỗi câu đúng</i></div>
      </div>

      <div class="qbtns">
        <button class="btn acc" id="bGo">🔥 Chơi 10 câu ngẫu nhiên</button>
      </div>
      <div class="muted center mt">Cảnh báo: chơi cái này vẫn được cộng XP nha 😏</div>`);

    document.getElementById('bGo').onclick = Quiz.funStart;
  }

  /* ================= STATS ================= */

  function stats() {
    UI.topbar({ title: 'Thống kê 통계' });
    const s = Store.all();
    const li = Store.levelInfo(s.xp);
    const acc = UI.pct(s.totalCorrect, s.totalAnswered);

    const rows = Data.activeDomains().map(d => {
      const qs = Data.inDomain(d.id);
      let seen = 0, right = 0;
      qs.forEach(q => {
        const r = s.q[q.id];
        if (r && r.seen) { seen++; if (r.c > 0) right++; }
      });
      const p = UI.pct(right, seen || 1);
      const cov = UI.pct(seen, qs.length);
      return { d, seen, right, p: seen ? p : 0, cov, n: qs.length };
    }).sort((a, b) => a.p - b.p);

    const weak = rows.filter(r => r.seen >= 3 && r.p < 70).slice(0, 3);

    UI.render(`
      <div class="stat3">
        <div class="stat"><b>${s.totalAnswered}</b><i>Câu đã làm</i></div>
        <div class="stat"><b style="color:var(--ok)">${acc}%</b><i>Tỉ lệ đúng</i></div>
        <div class="stat"><b style="color:var(--gold)">${s.xp.toLocaleString()}</b><i>Tổng XP</i></div>
      </div>
      <div class="stat3">
        <div class="stat"><b style="color:var(--pri)">Lv.${li.lv}</b><i>Cấp độ</i></div>
        <div class="stat"><b style="color:var(--acc)">${s.streak}</b><i>Chuỗi ngày</i></div>
        <div class="stat"><b>${s.days.length}</b><i>Tổng ngày học</i></div>
      </div>

      ${weak.length ? `
      <div class="card" style="border-color:rgba(239,68,68,.4)">
        <b style="color:var(--no);font-size:14.5px">⚠️ Lĩnh vực yếu nhất</b>
        <div class="muted mt">Nên tập trung vào: <b style="color:var(--tx)">${weak.map(w => E(w.d.vi)).join(' · ')}</b></div>
        <button class="btn acc sm mt" id="bWeak">Luyện ngay 15 câu</button>
      </div>` : ''}

      <div class="h2">📊 Tỉ lệ đúng theo lĩnh vực <span class="ko">영역별 정답률</span></div>
      ${rows.map(r => `
        <div class="sbar">
          <div class="sl">
            <b>${r.d.em} ${E(r.d.vi)} <span class="ko">${E(r.d.ko)}</span></b>
            <i>${r.seen ? r.p + '%' : '—'} · ${r.seen}/${r.n}</i>
          </div>
          <div class="st"><i style="width:${r.seen ? r.p : 0}%;background:${UI.barColor(r.seen ? r.p : 0)}"></i></div>
        </div>`).join('')}

      <div class="qbtns mt2">
        <button class="btn ghost" id="bReset">🗑️ Xóa toàn bộ dữ liệu học</button>
      </div>`);

    const bw = document.getElementById('bWeak');
    if (bw) bw.onclick = () => {
      const pool = weak.flatMap(w => Data.inDomain(w.d.id));
      Quiz.start(Data.pick(pool, 15), { title: 'Luyện điểm yếu', back: () => tab('stats') });
    };
    document.getElementById('bReset').onclick = () => {
      UI.confirm('Xóa toàn bộ dữ liệu?',
        'XP, cấp độ, chuỗi ngày, lịch sử làm bài — tất cả sẽ mất và KHÔNG khôi phục được.',
        'Xóa hết', () => { Store.reset(); UI.toast('Đã xóa xong'); tab('home'); });
    };
  }

  /* ================= SETTINGS ================= */

  /* Lịch 종합평가 chính thức 2026 (법무부 이민통합과, 25.12 공고) */
  const EXAM_2026 = [
    { r: 6, apply: '8.4(화)~8.8(토)',      date: '2026-08-22', label: '6차 · 8월 22일(토)' },
    { r: 7, apply: '9.29(화)~10.3(토)',    date: '2026-10-17', label: '7차 · 10월 17일(토)' },
    { r: 8, apply: '11.17(화)~11.21(토)',  date: '2026-12-05', label: '8차 · 12월 5일(토)' }
  ];

  function settings() {
    const s = Store.all();
    const t = Store.today();
    const opts = EXAM_2026.map(x =>
      `<button class="exopt${s.examDate === x.date ? ' on' : ''}${x.date < t ? ' past' : ''}" data-d="${x.date}">
         <b>${E(x.label)}</b><i>신청 ${E(x.apply)}${x.date < t ? ' · đã qua' : ''}</i>
       </button>`).join('');

    UI.modal(`
      <h3>⚙️ Cài đặt</h3>
      <label class="fl">Tên của bạn <span class="ko">이름</span></label>
      <input class="field" id="fName" value="${E(s.name || 'KIEU')}" placeholder="KIEU" maxlength="20">

      <label class="fl">Chọn kỳ thi 2026 <span class="ko">2026년 귀화용 종합평가</span></label>
      <div class="exopts">${opts}</div>

      <label class="fl">Hoặc nhập ngày khác <span class="ko">직접 입력</span></label>
      <input class="field" id="fDate" type="date" value="${E(s.examDate)}">
      <div class="muted mt">Lịch chính thức: <b>kiiptest.org</b>. Đăng ký phải làm trong đúng tuần nhận hồ sơ,
        trễ là phải đợi đợt sau.</div>

      <div class="row mt2" style="gap:9px">
        <button class="btn ghost sm" id="mNo">Đóng</button>
        <button class="btn sm" id="mYes">Lưu</button>
      </div>`, c => {
      const fd = c.querySelector('#fDate');
      c.querySelectorAll('[data-d]').forEach(b => b.onclick = () => {
        fd.value = b.dataset.d;
        c.querySelectorAll('[data-d]').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
      });
      c.querySelector('#mNo').onclick = UI.closeModal;
      c.querySelector('#mYes').onclick = () => {
        Store.set('name', c.querySelector('#fName').value.trim() || 'KIEU');
        Store.set('examDate', fd.value);
        UI.closeModal();
        UI.toast('Đã lưu ✅');
        tab('home');
      };
    });
  }

  function emptyBox(em, txt) {
    return `<div class="empty"><em>${em}</em><b>${E(txt)}</b>
      Dữ liệu chưa được nạp. Thử tải lại trang.</div>`;
  }

  /* ================= ROUTER ================= */

  const TABS = { home, study, exam, fun, stats };

  function tab(name) {
    curTab = name;
    document.querySelectorAll('.tab').forEach(b =>
      b.classList.toggle('on', b.dataset.tab === name));
    (TABS[name] || home)();
  }

  /* ================= BOOT ================= */

  /* Hiện lỗi thẳng lên màn hình — trên iPhone không mở được console */
  function fatal(msg) {
    const err = document.getElementById('splashErr');
    if (err) {
      err.hidden = false;
      err.innerHTML = E(msg) +
        '<br><br><button class="btn ghost sm" onclick="location.reload()">Tải lại / 새로고침</button>';
    }
    const sp = document.getElementById('splash');
    if (sp) sp.classList.remove('out');
  }

  async function boot() {
    window.addEventListener('error', e => {
      if (document.getElementById('splash')) fatal('Lỗi JS: ' + (e.message || e.error));
    });
    window.addEventListener('unhandledrejection', e => {
      if (document.getElementById('splash')) fatal('Lỗi: ' + (e.reason && e.reason.message || e.reason));
    });
    // nếu 15 giây mà vẫn ở màn hình chờ → báo lỗi thay vì treo mãi
    const guard = setTimeout(() => {
      if (document.getElementById('splash')) fatal('Quá lâu không nạp được dữ liệu. Kiểm tra mạng rồi thử lại.');
    }, 15000);

    const splash = document.getElementById('splash');
    let res;
    try {
      res = await Data.load();
    } catch (e) {
      clearTimeout(guard);
      fatal('Lỗi nạp dữ liệu: ' + e.message);
      return;
    }
    clearTimeout(guard);

    if (!res.n) {
      fatal('Không nạp được câu hỏi nào. ' +
        (location.protocol === 'file:'
          ? 'Bạn đang mở bằng file:// — cần mở qua link GitHub Pages.'
          : Data.errors.slice(0, 3).join(' / ')));
      return;
    }

    document.getElementById('topbar').hidden = false;
    document.getElementById('app').hidden = false;
    document.getElementById('tabbar').hidden = false;
    UI.closeModal();   // chắc chắn lớp phủ modal đang tắt

    document.querySelectorAll('.tab').forEach(b =>
      b.onclick = () => tab(b.dataset.tab));

    try { tab('home'); }
    catch (e) { fatal('Lỗi khi vẽ màn hình chính: ' + e.message); return; }

    splash.classList.add('out');
    setTimeout(() => { const s = document.getElementById('splash'); if (s) s.remove(); }, 400);

    // điểm danh
    const ci = Store.checkIn();
    if (ci) {
      setTimeout(() => {
        UI.toast(`📅 Điểm danh ngày ${ci.streak} · <b>+${ci.total} XP</b>`, 'xp', 3200);
        if (ci.milestone) setTimeout(() =>
          UI.toast(`🎉 Chuỗi ${ci.streak} ngày! Thưởng +${ci.milestone} XP`, 'lv', 3200), 900);
        if (ci.leveledTo) setTimeout(() => UI.levelUp(ci.leveledTo), 1500);
        tab('home');
      }, 600);
    }

    if (Data.errors.length) console.warn('data load warnings:', Data.errors);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  return { tab, boot, wrongNote, writingList, speakingList, settings, plan };
})();

document.addEventListener('DOMContentLoaded', App.boot);
