// STICKY ACTION BAR — persists as user scrolls through results
// ══════════════════════════════════════════════════════════════════════════════
function initStickyBar(){
  const resultsEl = document.getElementById('results');
  const stickyBar = document.getElementById('sticky-bar');
  if(!resultsEl || !stickyBar) return;

  const observer = new IntersectionObserver((entries) => {
    // Show sticky bar when hero-result scrolls out of view
    const heroVisible = entries[0].isIntersecting;
    if(heroVisible){
      stickyBar.classList.remove('visible');
    } else if(_o && _i){
      stickyBar.classList.add('visible');
    }
  }, { threshold: 0.1 });

  const heroEl = document.getElementById('hero-result');
  if(heroEl) observer.observe(heroEl);
}

function updateStickyBar(){
  if(!_o || !_i) return;
  const win = _o.tax <= _n.tax ? 'Old' : 'New';
  const best = Math.min(_o.tax, _n.tax);
  const tds = _i.tds_deducted || 0;
  const bal = tds - best;

  document.getElementById('sticky-regime-label').textContent = `✓ ${win} Regime recommended`;
  document.getElementById('sticky-numbers').textContent =
    `Tax: ${fmt(best)} · ${bal>=0?'Refund: '+fmt(bal):'Due: '+fmt(Math.abs(bal))}`;

  const primaryBtn = document.getElementById('sticky-primary-btn');
  if(bal > 1000){
    primaryBtn.textContent = `📄 Claim ₹${fmt(bal)} Refund`;
    primaryBtn.style.background = '#2d6a4f';
  } else if(bal < -1000){
    primaryBtn.textContent = `💳 Pay ₹${fmt(Math.abs(bal))}`;
    primaryBtn.style.background = '#c0392b';
  } else {
    primaryBtn.textContent = '📄 File ITR-1';
    primaryBtn.style.background = 'var(--a2)';
  }

  document.getElementById('sticky-bar').style.display = '';
  initStickyBar();
}

function stickyPrimaryAction(){
  if(!_o || !_i) return;
  const best = Math.min(_o.tax, _n.tax);
  const bal = (_i.tds_deducted||0) - best;
  if(bal < -1000){
    window.open('https://onlineservices.tin.egov-nsdl.com/etaxnew/tdsnontds.jsp','_blank');
  } else {
    window.open('https://www.incometax.gov.in/iec/foportal','_blank');
  }
  try{ gtag('event','sticky_cta_click',{event_category:'conversion',action:bal>1000?'file_refund':bal<-1000?'pay_challan':'file_itr'}); }catch(e){}
}

// ══════════════════════════════════════════════════════════════════════════════
// CA SHARE BRIEF — professional tax summary for Chartered Accountants
// ══════════════════════════════════════════════════════════════════════════════
function buildCABrief(){
  if(!_o||!_i||!_n) return '';
  const win = _o.tax<=_n.tax?'Old Regime':'New Regime';
  const best = Math.min(_o.tax,_n.tax);
  const sav = Math.abs(_o.tax-_n.tax);
  const tds = _i.tds_deducted||0;
  const bal = tds-best;
  const name = document.getElementById('name')?.value||'Client';
  const pan = document.getElementById('pan_number')?.value||'[PAN]';
  const errLines = (_errors&&_errors.length)
    ? _errors.map(function(e){ return '  - '+(e.title||'')+(e.desc?': '+e.desc:''); }).join('\n')
    : '  None detected';
  const dedLines = (_o&&_o.deds) ? [
    '  Standard Deduction: Rs 50,000',
    _o.deds.c80c>0 ? '  80C: Rs '+Math.round(_o.deds.c80c).toLocaleString('en-IN') : '',
    _o.deds.cnps>0 ? '  NPS 80CCD(1B): Rs '+Math.round(_o.deds.cnps).toLocaleString('en-IN') : '',
    _o.deds.c80d>0 ? '  80D Health: Rs '+Math.round(_o.deds.c80d).toLocaleString('en-IN') : '',
    _o.deds.chl>0  ? '  Home Loan Sec24: Rs '+Math.round(_o.deds.chl).toLocaleString('en-IN') : ''
  ].filter(Boolean).join('\n') : '  As per Form 16';
  const itrForm = ((_i.ltcg_ais||0)+(_i.stcg_ais||0)>100000||(_i.foreign_income||0)>0)?'ITR-2':'ITR-1';
  const balLine = bal>=0
    ? 'REFUND DUE: Rs '+Math.round(bal).toLocaleString('en-IN')
    : 'BALANCE TAX DUE: Rs '+Math.round(Math.abs(bal)).toLocaleString('en-IN');
  const actionLine = bal<0
    ? 'Pay via Challan 280 before filing'
    : 'Claim via ITR filing before July 31, 2026';
  const today = new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});

  return [
    'TAXSMART - CLIENT TAX BRIEF',
    'Assessment Year: AY 2026-27 (FY 2025-26)',
    'Generated: '+today,
    '-----------------------------------------',
    '',
    'CLIENT DETAILS',
    'Name: '+name,
    'PAN: '+pan,
    '',
    'INCOME SUMMARY',
    '  Gross Salary: Rs '+Math.round(_i.gross||0).toLocaleString('en-IN'),
    '  Taxable Income (New Regime): Rs '+Math.round(_n.ti||0).toLocaleString('en-IN'),
    '  Taxable Income (Old Regime): Rs '+Math.round(_o.ti||0).toLocaleString('en-IN'),
    '',
    'TAX COMPUTATION',
    '  New Regime Tax: Rs '+Math.round(_n.tax||0).toLocaleString('en-IN'),
    '  Old Regime Tax: Rs '+Math.round(_o.tax||0).toLocaleString('en-IN'),
    '  RECOMMENDED: '+win+' (saves Rs '+Math.round(sav).toLocaleString('en-IN')+')',
    '  Final Tax Payable: Rs '+Math.round(best).toLocaleString('en-IN'),
    '',
    'TDS & REFUND STATUS',
    '  TDS Deducted: Rs '+Math.round(tds).toLocaleString('en-IN'),
    '  '+balLine,
    '  Action: '+actionLine,
    '',
    'DEDUCTIONS (Old Regime)',
    dedLines,
    '',
    'DISCREPANCIES & FLAGS',
    errLines,
    '',
    'RECOMMENDED ITR FORM: '+itrForm,
    '',
    '-----------------------------------------',
    'Generated by TaxSmart | For CA use only. Verify before filing.'
  ].join('\n');
}

function openCAShareModal(){
  const brief = buildCABrief();
  if(!brief){ alert('Please complete your tax calculation first.'); return; }
  document.getElementById('ca-brief-text').textContent = brief;
  window._caBriefText = brief;
  document.getElementById('ca-modal').classList.add('open');
  try{ gtag('event','ca_share_opened',{event_category:'retention'}); }catch(e){}
}

function copyCABrief(){
  if(!window._caBriefText) return;
  navigator.clipboard.writeText(window._caBriefText)
    .then(()=>{
      const b = document.querySelector('#ca-modal .modal-btn');
      const orig = b.textContent; b.textContent='✓ Copied!';
      setTimeout(()=>b.textContent=orig, 2000);
    }).catch(()=>alert('Select text manually to copy'));
}

function sendCAWhatsApp(){
  if(!window._caBriefText) return;
  const intro = 'Hi, please find my FY 2025-26 tax brief below for filing assistance:\n\n';
  const footer = '\n\n[Full brief copied to clipboard]';
  window.open('https://wa.me/?text='+encodeURIComponent(intro+window._caBriefText.substring(0,800)+footer), '_blank');
  try{ navigator.clipboard.writeText(window._caBriefText); }catch(e){}
  try{ gtag('event','ca_share_whatsapp',{event_category:'retention'}); }catch(e){}
}

function emailCABrief(){
  if(!window._caBriefText) return;
  const name = document.getElementById('name')?.value||'';
  const subject = encodeURIComponent(`Tax Brief FY 2025-26 — ${name}`);
  const body = encodeURIComponent(window._caBriefText);
  window.open(`mailto:?subject=${subject}&body=${body}`);
  try{ gtag('event','ca_share_email',{event_category:'retention'}); }catch(e){}
}

// ══════════════════════════════════════════════════════════════════════════════
// ENHANCED EMAIL RETENTION — sends report to self via mailto (no backend needed)
// ══════════════════════════════════════════════════════════════════════════════
function shareWithSelf(){
  if(!_o||!_i) return;
  const name = document.getElementById('name')?.value||'';
  const { subject, body } = buildEmailReportText(name);
  window.open('mailto:?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body));
  try{ if(typeof gtag==='function') gtag('event','email_to_self',{event_category:'retention'}); }catch(e){}
}

function shareWhatsApp() {
  if (!_i || !_o || !_n) return;
  const best = Math.min(_o.tax, _n.tax);
  const win = _o.tax <= _n.tax ? 'Old' : 'New';
  const sav = Math.abs(_o.tax - _n.tax);
  const tds = _i.tds_deducted || 0;
  const bal = tds - best;
  const name = document.getElementById('name')?.value || '';

  const balLine = bal >= 0
    ? `✅ Refund coming: ${fmt(bal)}`
    : `⚠️ Balance due: ${fmt(Math.abs(bal))}`;

  const msg =
`🧾 *TaxSmart Report — FY 2025–26*${name ? ' · ' + name : ''}

💰 Tax Payable: *${fmt(best)}*
🏆 Best Regime: *${win} Regime* (saves ${fmt(sav)})
${balLine}

📊 Old Regime: ${fmt(_o.tax)}
📊 New Regime: ${fmt(_n.tax)}

_Calculated using TaxSmart — Free Indian Tax Calculator_
🔗 https://vedant4557-dev.github.io/taxai/`;

  const url = 'https://wa.me/?text=' + encodeURIComponent(msg);
  window.open(url, '_blank');
}

// ── What's Next CTA Bar ──────────────────────────────────────────────────────
// ── Edge case scenario detector (frontend) ───────────────────────────────────
// Detects complex situations from the input data and warns users before they start filing
function detectEdgeCases(){
  if(!_i) return [];
  const flags = [];
  if((_i.foreign_income||0) > 0)
    flags.push({ icon:'🌍', sev:'red', msg:'Foreign income detected — you need ITR-2, not ITR-1. Consult a CA.' });
  if((_i.ltcg||0) + (_i.stcg||0) > 1_00_000)
    flags.push({ icon:'📈', sev:'amber', msg:`Capital gains ₹${fmtL((_i.ltcg||0)+(_i.stcg||0))} — likely requires ITR-2.` });
  if((_i.crypto||0) > 0)
    flags.push({ icon:'₿', sev:'amber', msg:`Crypto/VDA income ₹${fmtL(_i.crypto)} taxed at 30% flat. Use Schedule VDA in ITR-2.` });
  if((_i.rental_income||0) > 0)
    flags.push({ icon:'🏠', sev:'blue', msg:`Rental income declared — ensure TDS deducted by tenant (if >₹50K/month) is in your 26AS.` });
  return flags;
}

function fmtL(n){ return n>=100000?'₹'+(n/100000).toFixed(1)+'L':'₹'+Math.round(n).toLocaleString('en-IN'); }

// ══════════════════════════════════════════════════════════════════════════════
// RETENTION HOOK — Email capture + "Remind next year"
// ══════════════════════════════════════════════════════════════════════════════
function openRetentionModal(){
  document.getElementById('retention-modal').classList.add('open');
  document.getElementById('retention-email').focus();
}
function closeRetentionModal(){
  document.getElementById('retention-modal').classList.remove('open');
}

async function submitRetention(){
  const email = document.getElementById('retention-email').value.trim();
  const name = document.getElementById('retention-name').value.trim();
  if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    document.getElementById('retention-email').style.borderColor='#e74c3c';
    document.getElementById('retention-email').focus();
    return;
  }
  document.getElementById('retention-email').style.borderColor='var(--border)';

  // Build a compact summary to "save"
  const summary = {
    fy: 'FY 2025-26',
    name: name || 'TaxSmart User',
    email,
    regime: _o?.recommended_regime === 'new' ? 'New Regime' : 'Old Regime',
    tax: _o?.new_regime?.tax_payable ?? 0,
    refund: (_o?.new_regime?.tds_credit ?? 0) - (_o?.new_regime?.tax_payable ?? 0),
    savedAt: new Date().toISOString()
  };

  // Store in localStorage so user can see their summary if they return
  try {
    const prev = JSON.parse(localStorage.getItem('ts_saves') || '[]');
    prev.push(summary);
    localStorage.setItem('ts_saves', JSON.stringify(prev.slice(-5)));
  } catch(e){}

  // In a real product, POST to a backend /subscribe endpoint
  // For now: log and show success (backend endpoint to be built)
  console.log('[Retention] Captured:', email, summary);

  // Show success state
  document.getElementById('retention-body').style.display='none';
  document.getElementById('retention-success').style.display='block';

  // Auto-close after 3 seconds
  setTimeout(closeRetentionModal, 3000);
}

// ══════════════════════════════════════════════════════════════════════════════

// ── Window exports (required for HTML onclick= attributes with ES modules) ──
if(typeof stickyPrimaryAction!=="undefined") window.stickyPrimaryAction=stickyPrimaryAction;
if(typeof openCAShareModal!=="undefined") window.openCAShareModal=openCAShareModal;
if(typeof copyCABrief!=="undefined") window.copyCABrief=copyCABrief;
if(typeof emailCABrief!=="undefined") window.emailCABrief=emailCABrief;
if(typeof sendCAWhatsApp!=="undefined") window.sendCAWhatsApp=sendCAWhatsApp;
if(typeof shareWhatsApp!=="undefined") window.shareWhatsApp=shareWhatsApp;
if(typeof openRetentionModal!=="undefined") window.openRetentionModal=openRetentionModal;
if(typeof closeRetentionModal!=="undefined") window.closeRetentionModal=closeRetentionModal;
if(typeof submitRetention!=="undefined") window.submitRetention=submitRetention;
// window.sendEmailReport — not found in ui.js, check definition
