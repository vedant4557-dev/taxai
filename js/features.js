// FEATURE: Onboarding Education
// ══════════════════════════════════════════════════════════════════════
function dismissOnboard(){
  const b=document.getElementById('onboard-banner');
  if(b){b.style.transition='all .3s';b.style.opacity='0';b.style.maxHeight='0';b.style.padding='0';b.style.margin='0';setTimeout(()=>b.style.display='none',300);}
  try{localStorage.setItem('ts_onboard_dismissed','1');}catch(e){}
}
(function initOnboard(){
  try{if(localStorage.getItem('ts_onboard_dismissed')==='1'){const b=document.getElementById('onboard-banner');if(b)b.style.display='none';}}catch(e){}
})();

// ══════════════════════════════════════════════════════════════════════
// FEATURE: Extraction Confirmation Screen
// ══════════════════════════════════════════════════════════════════════
let _pendingExtractedData = null;

function showConfirmationScreen(data, f16Data, as26Data, aisData) {
  _pendingExtractedData = data;

  const screen = document.getElementById('confirm-screen');
  screen.classList.add('show');

  // Scroll to it
  setTimeout(()=>screen.scrollIntoView({behavior:'smooth',block:'nearest'}), 100);

  // Partial banner if some docs failed
  const failed = [];
  if(window._files.f16 && Object.keys(f16Data).length <= 2) failed.push('Form 16');
  if(window._files['26as'] && Object.keys(as26Data).length <= 2) failed.push('Form 26AS');
  if(window._files.ais && Object.keys(aisData).length <= 2) failed.push('AIS');

  const partialBanner = document.getElementById('confirm-partial-banner');
  if(failed.length > 0) {
    partialBanner.innerHTML = `<div class="confirm-partial-banner">⚠️ <div><strong>Partial extraction:</strong> We couldn't fully read your ${failed.join(', ')}. Fields from these documents are shown in red — please fill them manually. All other values were extracted successfully.</div></div>`;
  } else {
    partialBanner.innerHTML = '';
  }

  // Build field list
  const fields = [
    { key:'gross_salary',        label:'Gross Salary',          icon:'💰', src:'Form 16' },
    { key:'basic_salary',        label:'Basic Salary',          icon:'📋', src:'Form 16' },
    { key:'hra_received',        label:'HRA Received',          icon:'🏠', src:'Form 16' },
    { key:'tds_deducted_form16', label:'TDS (Form 16)',         icon:'🏦', src:'Form 16' },
    { key:'total_tds_26as',      label:'TDS (Form 26AS)',       icon:'🏦', src:'26AS' },
    { key:'sec80c',              label:'80C Deductions',        icon:'📈', src:'Form 16' },
    { key:'sec80d_self',         label:'80D Health Insurance',  icon:'❤️', src:'Form 16' },
    { key:'interest_income_ais', label:'Interest Income',       icon:'💵', src:'AIS' },
    { key:'ltcg_ais',            label:'LTCG',                  icon:'📊', src:'AIS' },
    { key:'stcg_ais',            label:'STCG',                  icon:'📊', src:'AIS' },
  ];

  const tds26as = data.total_tds_26as || 0;
  const tdsAis  = data.tds_total_ais || 0;
  const tdsF16  = data.tds_deducted_form16 || 0;
  const bestTds = tds26as > 0 ? tds26as : tdsAis > 0 ? tdsAis : tdsF16;

  // Sanity checks
  const gross = data.gross_salary || 0;
  const tds   = bestTds;
  const c80c  = data.sec80c || 0;

  const fieldsHtml = fields.map(f => {
    const val = data[f.key];
    if(!val || val === 0) return ''; // skip empty

    // Confidence based on sanity checks
    let confClass = 'conf-high', confLabel = '✓ High', cardClass = 'ok';

    // TDS > gross is impossible
    if(f.key === 'tds_deducted_form16' && gross > 0 && val > gross) {
      confClass='conf-low'; confLabel='⚠ Check'; cardClass='err';
    }
    // 80C > 150000 is impossible (legal max)
    if(f.key === 'sec80c' && val > 150000) {
      confClass='conf-low'; confLabel='⚠ Exceeds limit'; cardClass='err';
    }
    // Large values flag as medium confidence
    if(val > 5000000) { confClass='conf-med'; confLabel='~ Verify'; cardClass='warn'; }
    // TDS mismatch between F16 and 26AS
    if(f.key === 'tds_deducted_form16' && tds26as > 0 && Math.abs(val - tds26as) > 5000) {
      confClass='conf-med'; confLabel='~ Mismatch'; cardClass='warn';
    }

    return `<div class="confirm-field ${cardClass}">
      <span class="confirm-field-icon">${f.icon}</span>
      <span class="confirm-field-label">${f.label}</span>
      <span class="confirm-field-val">₹${Math.round(val).toLocaleString('en-IN')}</span>
      <span class="confirm-field-conf ${confClass}">${confLabel}</span>
    </div>`;
  }).filter(Boolean).join('');

  document.getElementById('confirm-fields').innerHTML = fieldsHtml ||
    '<div style="color:var(--muted);font-size:13px;text-align:center;padding:12px;">No values extracted — please fill manually.</div>';
}

function confirmAndProceed() {
  if(_pendingExtractedData) {
    autoFillForm(_pendingExtractedData);
    setTimeout(()=>applyFieldConfidence(_pendingExtractedData, window._f16||{}, window._as26||{}, window._ais||{}), 200);
  }
  document.getElementById('confirm-screen').classList.remove('show');
  window.cur=1; showStep(1);
  ['autofill-banner-1','autofill-banner-2','autofill-banner-3','autofill-banner-5']
    .forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='flex';});
  try{if(typeof gtag==='function') gtag('event','extraction_confirmed',{event_category:'funnel'});}catch(e){}
  try{ plausible('Extraction Confirmed'); }catch(e){}
}

// ══════════════════════════════════════════════════════════════════════
// FEATURE: AI Validation Layer — sanity checks with visible warnings
// ══════════════════════════════════════════════════════════════════════
const _validationRules = [
  {
    id: 'tds_vs_gross',
    check: (i) => i.tds_deducted > 0 && i.gross > 0 && i.tds_deducted > i.gross,
    level: 'err',
    msg: (i) => `TDS of ₹${Math.round(i.tds_deducted).toLocaleString('en-IN')} cannot exceed gross salary of ₹${Math.round(i.gross).toLocaleString('en-IN')}. Please re-check your TDS figure.`
  },
  {
    id: 'c80c_limit',
    check: (i) => i.sec80c > 150000,
    level: 'warn',
    msg: (i) => `80C deductions of ₹${Math.round(i.sec80c).toLocaleString('en-IN')} exceed the legal limit of ₹1,50,000. Only ₹1,50,000 will be considered — excess is ignored automatically.`
  },
  {
    id: 'hra_vs_basic',
    check: (i) => i.hra_received > 0 && i.basic > 0 && i.hra_received > i.gross,
    level: 'err',
    msg: (i) => `HRA received (₹${Math.round(i.hra_received).toLocaleString('en-IN')}) seems higher than gross salary. Please verify.`
  },
  {
    id: 'basic_vs_gross',
    check: (i) => i.basic > 0 && i.gross > 0 && i.basic > i.gross,
    level: 'err',
    msg: (i) => `Basic salary (₹${Math.round(i.basic).toLocaleString('en-IN')}) cannot exceed gross salary (₹${Math.round(i.gross).toLocaleString('en-IN')}). Please re-check.`
  },
  {
    id: 'epf_vs_basic',
    check: (i) => i.epf_employee > 0 && i.basic > 0 && i.epf_employee > i.basic * 0.12 * 1.2,
    level: 'warn',
    msg: (i) => `EPF contribution of ₹${Math.round(i.epf_employee).toLocaleString('en-IN')} seems high relative to basic salary. Standard EPF is 12% of basic.`
  },
  {
    id: 'gross_zero',
    check: (i) => !i.gross || i.gross === 0,
    level: 'err',
    msg: () => `Gross salary cannot be zero. Please enter your annual gross salary to calculate tax.`
  },
];

function runValidationWarnings(inputData) {
  // Remove old warnings
  document.querySelectorAll('.val-warn,.val-err').forEach(el => el.remove());

  _validationRules.forEach(rule => {
    if(rule.check(inputData)) {
      const msg = rule.msg(inputData);
      const cls = rule.level === 'err' ? 'val-err' : 'val-warn';
      const icon = rule.level === 'err' ? '🔴' : '⚠️';
      const warn = document.createElement('div');
      warn.className = `val-warn ${cls}`;
      warn.dataset.ruleId = rule.id;
      warn.innerHTML = `<span>${icon}</span><span>${msg}</span>`;

      // Insert after the relevant input field if possible
      const fieldMap = {
        tds_vs_gross: 'tds_deducted_d',
        c80c_limit: 'sec80c_d',
        hra_vs_basic: 'hra_received_d',
        basic_vs_gross: 'basic_d',
        epf_vs_basic: 'epf_employee_d',
        gross_zero: 'gross_d',
      };
      const targetId = fieldMap[rule.id];
      const targetEl = targetId ? document.getElementById(targetId) : null;
      if(targetEl && targetEl.parentNode) {
        targetEl.parentNode.insertBefore(warn, targetEl.nextSibling);
      }
    }
  });
}

// ══════════════════════════════════════════════════════════════════════
// FEATURE 1: Confidence badges carried through to form fields
// ══════════════════════════════════════════════════════════════════════
function applyFieldConfidence(data, f16Data, as26Data, aisData) {
  // Fields that need special confidence treatment
  const fieldChecks = [
    { formId:'gross_d',    val: data.gross_salary,        maxSane: 10000000 },
    { formId:'basic_d',    val: data.basic_salary,        maxSane: 8000000  },
    { formId:'sec80c_d',   val: data.sec80c,              maxSane: 150000   },
    { formId:'tds_deducted_d', val: data.tds_deducted_form16 || data.total_tds_26as, maxSane: null },
  ];

  const gross = data.gross_salary || 0;
  const tds26 = data.total_tds_26as || 0;
  const tdsF16 = data.tds_deducted_form16 || 0;

  fieldChecks.forEach(fc => {
    const el = document.getElementById(fc.formId);
    if(!el || !fc.val) return;
    el.classList.remove('conf-low','conf-med');

    // Remove old conf tags
    const existing = el.parentNode.querySelector('.conf-tag');
    if(existing) existing.remove();

    let level = null;
    if(fc.maxSane && fc.val > fc.maxSane) level = 'low';
    else if(fc.formId === 'tds_deducted_d' && tds26 > 0 && tdsF16 > 0 && Math.abs(tds26 - tdsF16) > 5000) level = 'med';
    else if(fc.val > 5000000) level = 'med';

    if(level) {
      el.classList.add('conf-' + level);
      const tag = document.createElement('span');
      tag.className = `conf-tag ${level}`;
      tag.textContent = level === 'low' ? '⚠ Verify' : '~ Check';
      el.parentNode.insertBefore(tag, el.nextSibling);
    }
  });
}

// ══════════════════════════════════════════════════════════════════════
// FEATURE 2: Document format detection (client-side pre-check)
// ══════════════════════════════════════════════════════════════════════
async function checkDocumentFormat(file, expectedType) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result.toLowerCase();
      const hints = {
        f16:   ['form 16','employer','tds certificate','salary','deductor','pan of deductee'],
        '26as':['form 26as','annual tax statement','traces','tds/tcs credit','deductor name'],
        ais:   ['annual information statement','ais','sft','interest received','dividend'],
      };
      const keywords = hints[expectedType] || [];
      const matched = keywords.filter(kw => text.includes(kw)).length;
      resolve({ ok: matched >= 1, matched, total: keywords.length });
    };
    reader.onerror = () => resolve({ ok: true }); // if can't read, allow
    // Read first 8KB of text (PDFs embed readable text)
    reader.readAsText(file.slice(0, 8000));
  });
}

async function validateDocumentBeforeUpload(file, type) {
  if(!file || file.type !== 'application/pdf') return true; // non-PDF already handled
  const result = await checkDocumentFormat(file, type);
  if(!result.ok) {
    const typeNames = { f16:'Form 16', '26as':'Form 26AS', ais:'AIS' };
    const confirmed = confirm(
      `⚠️ This file doesn't look like a ${typeNames[type]}.\n\n` +
      `It may be a bank statement, payslip, or other document.\n\n` +
      `Upload anyway? (AI extraction may fail or return wrong values)`
    );
    return confirmed;
  }
  return true;
}

// ══════════════════════════════════════════════════════════════════════
// FEATURE 3: Salary Tax Optimiser
// ══════════════════════════════════════════════════════════════════════
function initOptimiser() {
  if(!window._i || !window._o || !window._n) return;
  const panel = document.getElementById('optimiser-panel');
  if(panel) panel.style.display = 'block';

  // Set sliders to current values
  document.getElementById('opt-80c').value = Math.min(window._i.sec80c || 0, 150000);
  document.getElementById('opt-nps').value = Math.min(window._i.nps || 0, 50000);
  document.getElementById('opt-80d').value = Math.min(window._i.sec80d_self || 0, 50000);
  updateOptimiser();
}

function toggleOptimiser() {
  const body = document.getElementById('optimiser-body');
  const chev = document.getElementById('optimiser-chevron');
  const isOpen = body.classList.toggle('open');
  chev.textContent = isOpen ? '▲' : '▼';
  if(isOpen) updateOptimiser();
}

function updateOptimiser() {
  if(!window._i || !window._o || !window._n) return;

  const new80c  = parseInt(document.getElementById('opt-80c').value) || 0;
  const newNps  = parseInt(document.getElementById('opt-nps').value) || 0;
  const new80d  = parseInt(document.getElementById('opt-80d').value) || 0;

  document.getElementById('opt-80c-val').textContent = '₹' + new80c.toLocaleString('en-IN');
  document.getElementById('opt-nps-val').textContent  = '₹' + newNps.toLocaleString('en-IN');
  document.getElementById('opt-80d-val').textContent  = '₹' + new80d.toLocaleString('en-IN');

  // Current best tax
  const currentBest = Math.min(window._o.tax, window._n.tax);

  // What-if calculation with modified inputs
  const modInputs = {..._i, sec80c: new80c, nps: newNps, sec80d_self: new80d};
  const modOld = compOld(modInputs);
  const modNew = compNew(modInputs);
  const modBest = Math.min(modOld.tax, modNew.tax);

  // Per-slider savings (marginal)
  function sliderSaving(fieldKey, newVal) {
    const base = {..._i};
    const mod  = {..._i, [fieldKey]: newVal};
    const baseBest = Math.min(compOld(base).tax, compNew(base).tax);
    const modBest2 = Math.min(compOld(mod).tax, compNew(mod).tax);
    return Math.max(0, Math.round(baseBest - modBest2));
  }

  const save80c = sliderSaving('sec80c', new80c);
  const saveNps  = sliderSaving('nps', newNps);
  const save80d  = sliderSaving('sec80d_self', new80d);
  const totalSaving = Math.max(0, Math.round(currentBest - modBest));

  const savingEl = (id, saving, extra80c) => {
    const el = document.getElementById(id);
    if(!el) return;
    if(saving > 0) {
      el.className = 'opt-saving';
      el.textContent = `✓ Saves ₹${saving.toLocaleString('en-IN')} in tax`;
    } else {
      el.className = 'opt-saving none';
      el.textContent = extra80c ? 'Already at maximum — no additional saving' : 'No additional saving at this level';
    }
  };

  savingEl('opt-80c-save', save80c, new80c >= 150000);
  savingEl('opt-nps-save', saveNps, newNps >= 50000);
  savingEl('opt-80d-save', save80d, new80d >= 50000);

  document.getElementById('opt-total-saving').textContent = '₹' + totalSaving.toLocaleString('en-IN');
  document.getElementById('opt-total-sub').textContent = totalSaving > 0
    ? `You could save ₹${totalSaving.toLocaleString('en-IN')} more by optimising these investments`
    : 'Your investments are already well-optimised — great job!';
}

// ══════════════════════════════════════════════════════════════════════
// FEATURE 4: Refund Prediction with Timeline
// ══════════════════════════════════════════════════════════════════════
function buildRefundPrediction(tdsBalance) {
  const panel = document.getElementById('refund-predict');
  if(!panel) return;

  if(tdsBalance <= 0) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  document.getElementById('refund-predict-amount').textContent = '₹' + Math.round(tdsBalance).toLocaleString('en-IN');
  document.getElementById('refund-predict-sub').textContent = 'expected refund after filing ITR';

  const today = new Date();
  const deadline = new Date(2026, 6, 31); // Jul 31 2026
  const daysToDeadline = Math.ceil((deadline - today) / (24*3600*1000));
  const isBeforeDeadline = today < deadline;

  // Timeline steps
  const steps = [
    { label:'File ITR', date:'by Jul 31', dot: today < deadline ? 'active' : 'done' },
    { label:'ITR Verified', date:'+7–15 days', dot:'future' },
    { label:'Processing', date:'+15–30 days', dot:'future' },
    { label:'Refund Credit', date:'+30–45 days', dot:'future' },
  ];

  document.getElementById('refund-timeline').innerHTML = steps.map(s => `
    <div class="refund-step">
      <div class="refund-step-dot ${s.dot}"></div>
      <div class="refund-step-label">${s.label}</div>
      <div class="refund-step-date">${s.date}</div>
    </div>`).join('');

  const dueEl = document.getElementById('refund-due-alert');
  if(isBeforeDeadline) {
    dueEl.innerHTML = `⏰ <strong>${daysToDeadline} days until Jul 31 deadline.</strong> File now to get your ₹${Math.round(tdsBalance).toLocaleString('en-IN')} refund by ~September 2026. Late filing after Jul 31 incurs ₹5,000 penalty (Sec 234F) and delays refund.`;
  } else {
    dueEl.innerHTML = `⚠️ Deadline passed. You can still file a belated return before Dec 31 with a ₹5,000 penalty. File ASAP to claim your refund — the longer you wait, the longer the IT Dept holds your money.`;
  }
}

// ══════════════════════════════════════════════════════════════════════
// FEATURE 5: Employer TDS Deposit Alert
// ══════════════════════════════════════════════════════════════════════
function buildEmployerTDSAlert() {
  const alert = document.getElementById('tds-employer-alert');
  if(!alert || !window._i) return;

  // Get TDS values from extraction
  const tdsF16  = window._f16 ? (window._f16.tds_deducted_form16 || 0) : 0;
  const tds26as = window._as26 ? (window._as26.total_tds_26as || 0) : 0;

  // Only show if both documents were uploaded and there's a meaningful mismatch
  if(tdsF16 <= 0 || tds26as <= 0) {
    alert.style.display = 'none';
    return;
  }

  const diff = tdsF16 - tds26as; // positive = F16 says more was deducted than 26AS shows
  const pct  = Math.abs(diff) / tdsF16 * 100;

  if(diff > 1000) {
    // F16 shows more TDS than 26AS — employer deducted but didn't deposit
    alert.style.display = 'block';
    document.getElementById('tds-employer-alert-body').innerHTML =
      `Your Form 16 says your employer deducted <strong>₹${Math.round(tdsF16).toLocaleString('en-IN')}</strong> as TDS from your salary. But Form 26AS — which is the government's official record — only shows <strong>₹${Math.round(tds26as).toLocaleString('en-IN')}</strong>. This <strong>₹${Math.round(diff).toLocaleString('en-IN')} gap (${Math.round(pct)}%)</strong> means your employer deducted TDS from your salary but may NOT have deposited it with the government. You will only get credit for what's in 26AS — the missing amount could trigger an IT notice.`;
    try{if(typeof gtag==='function') gtag('event','employer_tds_mismatch_shown',{event_category:'alert',value:Math.round(diff)});}catch(e){}
  } else if(diff < -1000) {
    // 26AS shows MORE than F16 — extra TDS credit (good for user, but worth noting)
    alert.style.display = 'none'; // Don't alarm user for a good surprise
  } else {
    alert.style.display = 'none';
  }
}

// ══════════════════════════════════════════════════════════════════════
// FEATURE: Enhanced Email Report Delivery
// ══════════════════════════════════════════════════════════════════════

function buildEmailReportText(name) {
  if(!window._i || !window._o || !window._n) return { subject:'', body:'' };
  const best   = Math.min(window._o.tax, window._n.tax);
  const win    = window._o.tax <= window._n.tax ? 'Old Regime' : 'New Regime';
  const sav    = Math.abs(window._o.tax - window._n.tax);
  const tds    = window._i.tds_deducted || 0;
  const bal    = tds - best;
  const gross  = window._i.gross || 0;
  const eff    = gross > 0 ? ((best/gross)*100).toFixed(1) : '0.0';
  const nameLine = name ? `Hi ${name},\n\n` : '';
  const balLine  = bal >= 0
    ? `✅ You have a REFUND of ₹${Math.round(bal).toLocaleString('en-IN')} coming!`
    : `⚠️  You have a balance tax due of ₹${Math.round(Math.abs(bal)).toLocaleString('en-IN')}`;

  const savLine = sav > 500
    ? `💡 Switching to ${win} saves you ₹${Math.round(sav).toLocaleString('en-IN')} vs the other regime.`
    : `⚖️  Both regimes are nearly equal for your income profile.`;

  const checklist = bal >= 0
    ? `FILING CHECKLIST:\n□ File ITR-1 before July 31, 2026 to claim your refund\n□ Verify bank account + IFSC on income tax portal\n□ E-verify ITR within 30 days of filing\n□ Refund typically credited within 30-45 days of e-verification`
    : `FILING CHECKLIST:\n□ Pay Self-Assessment Tax via Challan 280 BEFORE filing\n□ File ITR-1 before July 31, 2026 to avoid ₹5,000 penalty\n□ E-verify ITR within 30 days of filing\n□ Keep receipts for all deductions claimed`;

  const body = [
    `${nameLine}Here is your TaxSmart tax summary for FY 2025-26:`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `YOUR TAX SUMMARY — FY 2025-26`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Gross Income:   ₹${Math.round(gross).toLocaleString('en-IN')}`,
    `Best Regime:    ${win}`,
    `Tax Payable:    ₹${Math.round(best).toLocaleString('en-IN')} (${eff}% effective rate)`,
    `TDS Deducted:   ₹${Math.round(tds).toLocaleString('en-IN')}`,
    ``,
    balLine,
    ``,
    savLine,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    checklist,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `USEFUL LINKS:`,
    `• Income Tax Portal: https://www.incometax.gov.in`,
    `• Pay Challan 280:   https://www.incometax.gov.in/iec/foportal/help/how-to-pay-taxes-online`,
    `• Check Refund:      https://tin.tin.nsdl.com/oltas/refundstatuslogin.html`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `REMINDER: Save this email. Use TaxSmart again in April 2027 for FY 2026-27.`,
    `→ https://vedant4557-dev.github.io/taxai/`,
    ``,
    `Generated by TaxSmart — AI-powered tax calculator. For planning purposes only.`,
    `Always verify figures with your CA before filing.`
  ].join('\n');

  const subject = `My Tax Summary FY 2025-26 — ${win} — ${bal >= 0 ? 'Refund ₹'+Math.round(bal).toLocaleString('en-IN') : 'Due ₹'+Math.round(Math.abs(bal)).toLocaleString('en-IN')}`;
  return { subject, body };
}

function populateEmailPreview() {
  const previewBox = document.getElementById('email-preview-box');
  if(!previewBox || !window._i || !window._o || !window._n) return;
  const best  = Math.min(window._o.tax, window._n.tax);
  const win   = window._o.tax <= window._n.tax ? 'Old Regime' : 'New Regime';
  const tds   = window._i.tds_deducted || 0;
  const bal   = tds - best;
  const balHtml = bal >= 0
    ? `<span style="color:var(--accent);font-weight:700;">Refund: ₹${Math.round(bal).toLocaleString('en-IN')}</span>`
    : `<span style="color:var(--red);font-weight:700;">Due: ₹${Math.round(Math.abs(bal)).toLocaleString('en-IN')}</span>`;
  previewBox.innerHTML = `
    <div style="font-weight:700;color:var(--ink);margin-bottom:6px;">📨 What you'll receive:</div>
    • Tax summary: ₹${Math.round(best).toLocaleString('en-IN')} payable · ${win}<br>
    • ${balHtml}<br>
    • Personalised filing checklist<br>
    • Important deadlines & payment links<br>
    • Reminder note for FY 2026-27`;
}

// Called when modal opens
const _origOpenRetention = typeof openRetentionModal === 'function' ? openRetentionModal : null;
function openRetentionModal() {
  document.getElementById('retention-modal').classList.add('open');
  document.getElementById('retention-body').style.display = 'block';
  document.getElementById('retention-success').style.display = 'none';
  setTimeout(populateEmailPreview, 50);
}

function sendEmailReport() {
  const email  = document.getElementById('retention-email').value.trim();
  const name   = document.getElementById('retention-name').value.trim();
  const { subject, body } = buildEmailReportText(name);

  // Open mailto — works on all devices, no backend needed
  const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoUrl);

  // Show success
  document.getElementById('retention-body').style.display = 'none';
  document.getElementById('retention-success').style.display = 'block';

  // Save email locally for reminder tracking
  try {
    const saves = JSON.parse(localStorage.getItem('ts_saves') || '[]');
    saves.push({ email, name, savedAt: new Date().toISOString(), fy:'2025-26' });
    localStorage.setItem('ts_saves', JSON.stringify(saves.slice(-5)));
  } catch(e){}

  try{if(typeof gtag==='function') gtag('event','email_report_sent',{event_category:'retention'});}catch(e){}
  try{ plausible('Email Report Sent'); }catch(e){}
  setTimeout(closeRetentionModal, 4000);
}
// ── Tooltip: click/touch toggle (works on mobile) ──────────────────────────
(function(){
  let activeBtn=null, activeBox=null;

  function positionBox(btn, box){
    const r=btn.getBoundingClientRect();
    const bw=260;
    // Place above the button
    let left=r.left+r.width/2-bw/2;
    let top=r.top-8; // will subtract box height below
    // Clamp horizontally so it doesn't bleed off screen
    left=Math.max(8, Math.min(left, window.innerWidth-bw-8));
    box.style.width=bw+'px';
    box.style.left=left+'px';
    // Temporarily show to measure height
    box.style.visibility='hidden';
    box.classList.add('open');
    const bh=box.offsetHeight;
    box.classList.remove('open');
    box.style.visibility='';
    top=r.top-bh-8;
    // If no room above, flip below
    if(top<8){
      top=r.bottom+8;
      box.style.setProperty('--arrow-dir','bottom');
    }
    box.style.top=top+'px';
  }

  function closeActive(){
    if(activeBox){activeBox.classList.remove('open');}
    if(activeBtn){activeBtn.classList.remove('active');}
    activeBtn=null; activeBox=null;
  }

  let tooltipEverOpened = false;
  document.addEventListener('click',function(e){
    const btn=e.target.closest('.tip-btn');
    if(btn){
      e.stopPropagation();
      const box=btn.closest('.tip-wrap').querySelector('.tip-box');
      if(!box) return;
      // Toggle: clicking same button closes it
      if(activeBtn===btn){closeActive();return;}
      closeActive();
      positionBox(btn,box);
      box.classList.add('open');
      btn.classList.add('active');
      activeBtn=btn; activeBox=box;
      // First-time discovery: fade out hint label + remove pulses after first use
      if(!tooltipEverOpened){
        tooltipEverOpened = true;
        const hint = document.getElementById('tip-hint-label');
        if(hint){ hint.style.opacity='0'; setTimeout(()=>hint.remove(),600); }
        document.querySelectorAll('.tip-btn.pulse').forEach(b=>b.classList.remove('pulse'));
        try{ if(typeof gtag==='function') gtag('event','tooltip_first_use',{event_category:'ux'}); }catch(e){}
      }
      return;
    }
    // Click outside closes
    if(!e.target.closest('.tip-box')) closeActive();
  });

  // Close on scroll/resize so box doesn't drift
  window.addEventListener('scroll',closeActive,true);
  window.addEventListener('resize',closeActive);
})();



// ── Window exports (required for HTML onclick= attributes with ES modules) ──
if(typeof dismissOnboard!=="undefined") window.dismissOnboard=dismissOnboard;
if(typeof confirmAndProceed!=="undefined") window.confirmAndProceed=confirmAndProceed;
if(typeof toggleOptimiser!=="undefined") window.toggleOptimiser=toggleOptimiser;
if(typeof updateOptimiser!=="undefined") window.updateOptimiser=updateOptimiser;
if(typeof applyFieldConfidence!=="undefined") window.applyFieldConfidence=applyFieldConfidence;
if(typeof buildRefundPrediction!=="undefined") window.buildRefundPrediction=buildRefundPrediction;
if(typeof buildEmployerTDSAlert!=="undefined") window.buildEmployerTDSAlert=buildEmployerTDSAlert;
if(typeof initOptimiser!=="undefined") window.initOptimiser=initOptimiser;

window.sendEmailReport = sendEmailReport;
