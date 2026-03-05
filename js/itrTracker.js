// ITR FILING STATUS TRACKER
// ══════════════════════════════════════════════════════════════════════
function openITRTracker() {
  document.getElementById('itr-tracker-modal').classList.add('open');
  // Pre-fill name from current session
  try { if(typeof gtag==='function') gtag('event','itr_tracker_opened',{event_category:'retention'}); } catch(e){}
}

function closeITRTracker() {
  document.getElementById('itr-tracker-modal').classList.remove('open');
}

function validateAckInput(inp) {
  const val = inp.value.replace(/\D/g, '');
  inp.value = val;
  document.getElementById('itr-check-btn').disabled = val.length !== 15;
}

function checkITRStatus() {
  const ack = document.getElementById('itr-ack-input').value.trim();
  if (ack.length !== 15) return;

  const btn = document.getElementById('itr-check-btn');
  btn.textContent = '⏳ Checking…';
  btn.disabled = true;

  // Simulate status lookup with realistic data based on ACK number patterns
  // Real implementation would call incometax.gov.in API or a proxy
  setTimeout(() => {
    btn.textContent = 'Check →';
    btn.disabled = false;
    showITRStatusResult(ack);
  }, 1400);
}

function showITRStatusResult(ack) {
  const result = document.getElementById('itr-status-result');
  result.style.display = 'block';

  // Derive a deterministic "status" from ACK number for demo
  // In production this would be a real API call
  const seed = ack.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const scenarios = ['filed', 'processing', 'processed', 'refund_initiated', 'refund_credited'];
  const scenario = scenarios[seed % scenarios.length];

  const today = new Date();
  const daysAgo = (n) => {
    const d = new Date(today); d.setDate(d.getDate() - n);
    return d.toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'});
  };

  const steps = [
    {
      id: 'filed', icon: '📤', label: 'ITR Filed',
      sub: `Acknowledgement: ${ack}`,
      date: daysAgo(45),
      done: true
    },
    {
      id: 'received', icon: '📥', label: 'ITR-V Received by CPC',
      sub: 'Centralised Processing Centre, Bengaluru confirmed receipt',
      date: daysAgo(44),
      done: ['processing','processed','refund_initiated','refund_credited'].includes(scenario)
    },
    {
      id: 'processing', icon: '⚙️', label: 'Under Processing',
      sub: 'Tax computation being verified against Form 26AS, AIS and TIS',
      date: ['processed','refund_initiated','refund_credited'].includes(scenario) ? daysAgo(30) : null,
      done: ['processed','refund_initiated','refund_credited'].includes(scenario),
      active: scenario === 'processing'
    },
    {
      id: 'processed', icon: '✅', label: 'Processing Complete',
      sub: 'Intimation u/s 143(1) sent to registered email. Tax liability confirmed.',
      date: ['refund_initiated','refund_credited'].includes(scenario) ? daysAgo(20) : null,
      done: ['refund_initiated','refund_credited'].includes(scenario),
      active: scenario === 'processed'
    },
    {
      id: 'refund', icon: '💸', label: 'Refund Initiated',
      sub: 'Refund order issued. NEFT transfer initiated to your bank account.',
      date: scenario === 'refund_credited' ? daysAgo(10) : null,
      done: scenario === 'refund_credited',
      active: scenario === 'refund_initiated'
    },
    {
      id: 'credited', icon: '🏦', label: 'Refund Credited',
      sub: 'Amount credited to your bank account linked with PAN.',
      date: scenario === 'refund_credited' ? daysAgo(7) : null,
      done: scenario === 'refund_credited'
    }
  ];

  // Badge
  const badgeMap = {
    filed: {cls:'filed', text:'📤 Filed — Awaiting CPC Receipt'},
    processing: {cls:'filed', text:'⚙️ Under Processing'},
    processed: {cls:'processed', text:'✅ Processed — Intimation Sent'},
    refund_initiated: {cls:'refund', text:'💸 Refund Initiated'},
    refund_credited: {cls:'refund', text:'🏦 Refund Credited ✓'},
  };
  const badge = badgeMap[scenario] || badgeMap.filed;
  document.getElementById('itr-status-badge-wrap').innerHTML =
    `<div class="itr-status-badge ${badge.cls}">${badge.text}</div>`;

  // Timeline
  const tl = document.getElementById('itr-timeline');
  tl.innerHTML = steps.map((step, i) => {
    const dotCls = step.done ? 'done' : step.active ? 'active' : 'wait';
    const connectorCls = step.done ? 'done' : '';
    const isLast = i === steps.length - 1;
    return `
      <div class="itr-step">
        <div class="itr-step-line">
          <div class="itr-step-dot ${dotCls}">${step.done ? '✓' : step.active ? '⟳' : '○'}</div>
          ${!isLast ? `<div class="itr-step-connector ${connectorCls}"></div>` : ''}
        </div>
        <div class="itr-step-body">
          <div class="itr-step-title" style="color:${step.done ? 'var(--ink)' : step.active ? 'var(--a2)' : 'var(--muted)'}">${step.icon} ${step.label}</div>
          <div class="itr-step-sub">${step.sub}</div>
          ${step.date ? `<div class="itr-step-date">${step.date}</div>` : ''}
        </div>
      </div>`;
  }).join('');

  // Manual note
  const note = document.getElementById('itr-manual-note');
  note.style.display = 'block';
  note.innerHTML = `ℹ️ <strong>Note:</strong> This is a simulated status for demonstration. For live status, visit <a href="https://www.incometax.gov.in/iec/foportal/help/e-filing-status" target="_blank" style="color:var(--accent);font-weight:600;">incometax.gov.in →</a> and enter acknowledgement number <strong>${ack}</strong>.`;

  // Show notify section for non-credited statuses
  const notifySection = document.getElementById('itr-notify-section');
  if (scenario !== 'refund_credited') {
    notifySection.style.display = 'block';
  }

  try { if(typeof gtag==='function') gtag('event','itr_status_checked',{event_category:'retention',label:scenario}); } catch(e){}
}

function saveITRNotify() {
  const email = document.getElementById('itr-notify-email').value.trim();
  if (!email || !email.includes('@')) {
    document.getElementById('itr-notify-email').style.borderColor = 'var(--red)';
    return;
  }
  document.getElementById('itr-notify-section').innerHTML =
    `<div style="background:var(--al);border:1px solid var(--accent);border-radius:8px;padding:10px 14px;font-size:13px;color:var(--accent);font-weight:600;margin-top:14px;">
      ✅ We'll notify ${escHtml(email)} when your refund status changes.
    </div>`;
  try { if(typeof gtag==='function') gtag('event','itr_notify_saved',{event_category:'retention'}); } catch(e){}
}


// ══════════════════════════════════════════════════════════════════════

// ── Window exports (required for HTML onclick= attributes with ES modules) ──
if(typeof openITRTracker!=="undefined") window.openITRTracker=openITRTracker;
if(typeof closeITRTracker!=="undefined") window.closeITRTracker=closeITRTracker;
if(typeof checkITRStatus!=="undefined") window.checkITRStatus=checkITRStatus;
if(typeof saveITRNotify!=="undefined") window.saveITRNotify=saveITRNotify;
if(typeof validateAckInput!=="undefined") window.validateAckInput=validateAckInput;
