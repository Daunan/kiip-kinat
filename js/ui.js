/* ============================================================
   ui.js — helper hiển thị: toast, modal, level-up, escape
   ============================================================ */

const UI = (() => {
  const app = () => document.getElementById('app');

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function render(html, opts = {}) {
    const m = app();
    m.innerHTML = html;
    m.className = opts.plain ? 'plain' : '';
    m.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  /* ---------- topbar ---------- */
  function topbar({ title, back, action }) {
    const tb = document.getElementById('topbar');
    const bBack = document.getElementById('tbBack');
    const bAct = document.getElementById('tbAct');
    tb.hidden = false;
    document.getElementById('tbTitle').textContent = title || 'KINAT';

    bBack.hidden = !back;
    bBack.onclick = back || null;

    if (action) {
      bAct.hidden = false;
      bAct.textContent = action.label;
      bAct.onclick = action.fn;
    } else {
      bAct.hidden = true;
      bAct.onclick = null;
    }
  }

  /* ---------- toast ---------- */
  function toast(msg, kind = '', ms = 2000) {
    const wrap = document.getElementById('toastWrap');
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.innerHTML = msg;
    wrap.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 320);
    }, ms);
  }
  function xpToast(n) { if (n > 0) toast('+' + n + ' XP', 'xp', 1400); }

  /* ---------- level up ---------- */
  function levelUp(lv) {
    const r = Store.rank(lv);
    const el = document.createElement('div');
    el.className = 'lvup';
    el.innerHTML =
      `<em>${r.em}</em>
       <div class="t">LEVEL UP</div>
       <div class="n">Lv.${lv}</div>
       <div class="r">${esc(r.vi)} · ${esc(r.ko)}</div>`;
    document.body.appendChild(el);
    el.onclick = () => el.remove();
    setTimeout(() => el.remove(), 2600);
  }

  /* ---------- hoàn thành mục tiêu ngày / mốc 100 ngày ---------- */
  function dailyDone(d) {
    if (!d) return;
    if (d.goalJustMet) {
      const day = Store.planDay();
      toast(`🎯 Xong mục tiêu ngày ${day}/100! <b>+${d.xp} XP</b>`, 'xp', 3200);
    }
    if (d.milestone) {
      setTimeout(() => {
        const m = d.milestone;
        const el = document.createElement('div');
        el.className = 'lvup';
        el.innerHTML =
          `<em>${m.em}</em>
           <div class="t">MỐC ${m.d} NGÀY</div>
           <div class="n">${esc(m.vi)}</div>
           <div class="r">+${m.xp} XP</div>`;
        document.body.appendChild(el);
        el.onclick = () => el.remove();
        setTimeout(() => el.remove(), 3600);
      }, 800);
    }
    if (d.leveledTo) setTimeout(() => levelUp(d.leveledTo), 1600);
  }

  /* ---------- modal ---------- */
  function modal(html, onOpen) {
    const m = document.getElementById('modal');
    const c = document.getElementById('modalCard');
    c.innerHTML = html;
    m.hidden = false;
    m.style.display = 'flex';          // đề phòng CSS bị ghi đè
    m.onclick = e => { if (e.target === m) closeModal(); };
    if (onOpen) onOpen(c);
  }
  function closeModal() {
    const m = document.getElementById('modal');
    m.hidden = true;
    m.style.display = 'none';          // KHÔNG được để lớp phủ chặn thao tác chạm
    document.getElementById('modalCard').innerHTML = '';
  }

  function confirm(title, text, okLabel, onOk) {
    modal(
      `<h3>${esc(title)}</h3><p>${esc(text)}</p>
       <div class="row" style="gap:9px">
         <button class="btn ghost sm" id="mNo">Hủy</button>
         <button class="btn acc sm" id="mYes">${esc(okLabel)}</button>
       </div>`,
      c => {
        c.querySelector('#mNo').onclick = closeModal;
        c.querySelector('#mYes').onclick = () => { closeModal(); onOk(); };
      });
  }

  /* ---------- misc ---------- */
  const CIRC = ['①', '②', '③', '④'];

  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }

  function barColor(p) {
    if (p >= 80) return 'var(--ok)';
    if (p >= 60) return 'var(--warn)';
    if (p > 0)   return 'var(--no)';
    return 'var(--line)';
  }

  function fmtDate(ts) {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  /* đếm ký tự không tính khoảng trắng — dùng cho 작문 200자 */
  function countChars(s) {
    return [...String(s).replace(/\s/g, '')].length;
  }

  return { app, esc, render, topbar, toast, xpToast, levelUp, dailyDone,
           modal, closeModal, confirm, CIRC, pct, barColor, fmtDate, countChars };
})();
