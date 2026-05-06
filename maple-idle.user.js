// ==UserScript==
// @name         MapleStory Idle Auto Redeemer Pro
// @namespace    maple-idle-redeem-pro
// @version      3.0.0
// @description  MapleStory Idle 官方頁批次自動兌換，美化 UI，自動儲存 UID/序號
// @match        https://mcoupon.nexon.com/maplestoryidle*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = 'maple_idle_auto_redeemer_v3';
  let running = false;
  let stopRequested = false;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const $ = s => document.querySelector(s);

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      coupon: $('#mapleCoupon')?.value || '',
      uids: $('#mapleUids')?.value || '',
      delay: $('#mapleDelay')?.value || '6',
      autoConfirm: $('#mapleAutoConfirm')?.checked ?? true,
      autoClose: $('#mapleAutoClose')?.checked ?? true
    }));
  }

  function parseUIDs(text) {
    return text.split(/[\n,;，；]+/).map(x => x.trim()).filter(Boolean);
  }

  function log(msg, type = 'info') {
    const box = $('#mapleLog');
    if (!box) return;
    const div = document.createElement('div');
    div.className = `log-line ${type}`;
    div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    box.prepend(div);
  }

  function status(msg) {
    $('#mapleStatus').textContent = msg;
  }

  function progress(now, total) {
    $('#mapleProgressText').textContent = `${now}/${total}`;
    $('#mapleProgressBar').style.width = total ? `${Math.round(now / total * 100)}%` : '0%';
  }

  function setValue(el, val) {
    el.focus();
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
  }

  async function closePopup() {
    const btn =
      $('#popAlert .btn_confirm_pop') ||
      $('#popAlert .close_pop') ||
      $('.btn_confirm_pop.close_pop');

    if (btn) {
      btn.click();
      await sleep(500);
    }
  }

  async function run() {
    if (running) return;

    save();

    const coupon = $('#mapleCoupon').value.trim().toUpperCase();
    const uids = parseUIDs($('#mapleUids').value);
    const delay = Math.max(2, Number($('#mapleDelay').value || 6));
    const autoConfirm = $('#mapleAutoConfirm').checked;
    const autoClose = $('#mapleAutoClose').checked;

    if (!coupon) return alert('請輸入序號');
    if (!uids.length) return alert('請輸入 UID');

    const uidInput = $('#eRedeemNpaCode');
    const couponInput = $('#eRedeemCoupon');
    const redeemBtn = $('.kd-redeem-coupon');

    if (!uidInput || !couponInput || !redeemBtn) {
      return alert('找不到官方兌換欄位，請確認在「兌換序號」頁面');
    }

    running = true;
    stopRequested = false;
    status('執行中');
    progress(0, uids.length);
    log(`開始批次，共 ${uids.length} 筆`, 'ok');

    for (let i = 0; i < uids.length; i++) {
      if (stopRequested) {
        log('已停止', 'warn');
        break;
      }

      const uid = uids[i];

      status(`處理第 ${i + 1} 筆`);
      progress(i, uids.length);
      log(`處理 UID：${uid}`);

      setValue(uidInput, uid);
      setValue(couponInput, coupon);

      await sleep(600);

      redeemBtn.click();
      log('已點擊兌換');

      await sleep(1200);

      const confirmBtn = $('.e-redeem-coupon');
      if (autoConfirm && confirmBtn) {
        confirmBtn.click();
        log('已點擊確認', 'ok');
      }

      await sleep(delay * 1000);

      const msg = ($('#popAlert .pop_msg')?.innerText || $('.system2')?.innerText || '').trim();
      if (msg) log(`官方訊息：${msg}`, /成功|完成|success/i.test(msg) ? 'ok' : 'warn');

      if (autoClose) await closePopup();

      progress(i + 1, uids.length);
      log(`第 ${i + 1} 筆完成`, 'ok');

      await sleep(800);
    }

    running = false;
    status(stopRequested ? '已停止' : '完成');
    log('批次流程結束', 'ok');
  }

  function stop() {
    stopRequested = true;
    status('停止中');
    log('停止中，會在目前這筆完成後停止', 'warn');
  }

  function createPanel() {
    if ($('#maplePanel')) return;

    const saved = load();

    const panel = document.createElement('div');
    panel.id = 'maplePanel';
    panel.innerHTML = `
      <div class="card">
        <div class="header">
          <div>
            <div class="title">🍁 Maple Idle</div>
            <div class="subtitle">Auto Redeemer Pro</div>
          </div>
          <button id="mapleMin">－</button>
        </div>

        <div id="mapleBody">
          <label>序號 Coupon</label>
          <input id="mapleCoupon" placeholder="例如 HALFANNIV" value="${saved.coupon || ''}">

          <label>UID / 會員編號</label>
          <textarea id="mapleUids" placeholder="每行一個 UID，也支援逗號分隔">${saved.uids || ''}</textarea>

          <div class="row">
            <div>
              <label>等待秒數</label>
              <input id="mapleDelay" type="number" min="2" value="${saved.delay || 6}">
            </div>

            <div class="checks">
              <label><input id="mapleAutoConfirm" type="checkbox" ${(saved.autoConfirm ?? true) ? 'checked' : ''}> 自動確認</label>
              <label><input id="mapleAutoClose" type="checkbox" ${(saved.autoClose ?? true) ? 'checked' : ''}> 自動關閉</label>
            </div>
          </div>

          <div class="progress">
            <div class="progressTop">
              <span>進度</span>
              <span id="mapleProgressText">0/0</span>
            </div>
            <div class="track">
              <div id="mapleProgressBar"></div>
            </div>
          </div>

          <div class="actions">
            <button id="mapleStart" class="start">開始</button>
            <button id="mapleStop" class="stop">停止</button>
          </div>

          <div class="state">狀態：<span id="mapleStatus">待命</span></div>
          <div id="mapleLog"></div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    const style = document.createElement('style');
    style.textContent = `
      #maplePanel {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 999999;
        width: 390px;
        font-family: Inter, "Noto Sans TC", Arial, sans-serif;
      }

      #maplePanel * {
        box-sizing: border-box;
      }

      #maplePanel .card {
        background: rgba(15,23,42,.88);
        backdrop-filter: blur(18px);
        color: white;
        border-radius: 28px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,.1);
        box-shadow: 0 24px 80px rgba(0,0,0,.45);
      }

      #maplePanel .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 22px;
        background:
          radial-gradient(circle at top left, rgba(249,115,22,.35), transparent 35%),
          radial-gradient(circle at top right, rgba(236,72,153,.25), transparent 35%),
          rgba(255,255,255,.04);
        border-bottom: 1px solid rgba(255,255,255,.08);
      }

      #maplePanel .title {
        font-size: 26px;
        font-weight: 900;
        letter-spacing: -.5px;
      }

      #maplePanel .subtitle {
        font-size: 13px;
        color: rgba(255,255,255,.7);
        margin-top: 5px;
      }

      #mapleMin {
        width: 34px;
        height: 34px;
        border: 0;
        border-radius: 12px;
        background: rgba(255,255,255,.12);
        color: white;
        font-weight: 900;
        cursor: pointer;
      }

      #mapleBody {
        padding: 20px;
        max-height: 86vh;
        overflow: auto;
      }

      #maplePanel label {
        display: block;
        margin: 14px 0 8px;
        font-size: 13px;
        font-weight: 800;
        color: rgba(255,255,255,.9);
      }

      #maplePanel input,
      #maplePanel textarea {
        width: 100%;
        border: 1px solid rgba(255,255,255,.1);
        background: rgba(255,255,255,.07);
        color: white;
        border-radius: 18px;
        padding: 14px 16px;
        font-size: 14px;
        outline: none;
      }

      #maplePanel textarea {
        min-height: 150px;
        resize: vertical;
      }

      #maplePanel input:focus,
      #maplePanel textarea:focus {
        border-color: rgba(249,115,22,.85);
        box-shadow: 0 0 0 4px rgba(249,115,22,.15);
      }

      #maplePanel input::placeholder,
      #maplePanel textarea::placeholder {
        color: rgba(255,255,255,.35);
      }

      #maplePanel .row {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
      }

      #maplePanel .checks {
        display: flex;
        gap: 18px;
        flex-wrap: wrap;
      }

      #maplePanel .checks label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 !important;
        font-weight: 600;
      }

      #maplePanel .checks input {
        width: auto;
        transform: scale(1.15);
      }

      #maplePanel .progress {
        margin-top: 18px;
        padding: 16px;
        border-radius: 18px;
        background: rgba(255,255,255,.05);
        border: 1px solid rgba(255,255,255,.06);
      }

      #maplePanel .progressTop {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        font-size: 13px;
        color: rgba(255,255,255,.78);
      }

      #maplePanel .track {
        height: 12px;
        background: rgba(255,255,255,.08);
        border-radius: 999px;
        overflow: hidden;
      }

      #mapleProgressBar {
        width: 0%;
        height: 100%;
        background: linear-gradient(90deg, #f97316, #ec4899);
        border-radius: inherit;
        transition: width .25s ease;
      }

      #maplePanel .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
        margin-top: 18px;
      }

      #maplePanel .actions button {
        border: 0;
        border-radius: 18px;
        padding: 15px;
        color: white;
        font-size: 15px;
        font-weight: 900;
        cursor: pointer;
        transition: .18s ease;
      }

      #maplePanel .actions button:hover {
        transform: translateY(-1px);
      }

      #maplePanel .start {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        box-shadow: 0 10px 30px rgba(34,197,94,.25);
      }

      #maplePanel .stop {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        box-shadow: 0 10px 30px rgba(239,68,68,.25);
      }

      #maplePanel .state {
        margin-top: 18px;
        background: rgba(255,255,255,.06);
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 18px;
        padding: 14px 16px;
        font-size: 14px;
        color: rgba(255,255,255,.9);
      }

      #mapleLog {
        margin-top: 16px;
        height: 200px;
        overflow: auto;
        background: rgba(0,0,0,.28);
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 20px;
        padding: 14px;
        font-size: 12px;
        line-height: 1.7;
      }

      .log-line.ok { color: #4ade80; }
      .log-line.warn { color: #facc15; }
      .log-line.error { color: #f87171; }
    `;

    document.head.appendChild(style);

    $('#mapleStart').onclick = run;
    $('#mapleStop').onclick = stop;

    $('#mapleMin').onclick = () => {
      const body = $('#mapleBody');
      body.style.display = body.style.display === 'none' ? 'block' : 'none';
      $('#mapleMin').textContent = body.style.display === 'none' ? '＋' : '－';
    };

    ['#mapleCoupon', '#mapleUids', '#mapleDelay', '#mapleAutoConfirm', '#mapleAutoClose'].forEach(sel => {
      const el = $(sel);
      if (el) {
        el.addEventListener('input', save);
        el.addEventListener('change', save);
      }
    });

    progress(0, parseUIDs(saved.uids || '').length);
    log('面板已載入，UID 與設定會自動儲存。', 'ok');
  }

  window.addEventListener('load', () => {
    setTimeout(createPanel, 1000);
  });
})();
