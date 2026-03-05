// SHAREABLE TAX CARD
// ══════════════════════════════════════════════════════════════════════
let _taxCardData = null;

function openTaxCard() {
  if (!_o || !_i) { alert('Please generate your tax report first.'); return; }
  const win = _o.tax <= _n.tax ? 'old' : 'new';
  const best = Math.min(_o.tax, _n.tax);
  const sav = Math.abs(_o.tax - _n.tax);
  const tds = _i.tds_deducted || 0;
  const bal = tds - best;
  const name = document.getElementById('name').value || 'Taxpayer';
  const effRate = _i.gross > 0 ? (_o.tax <= _n.tax ? _o.tax : _n.tax) / _i.gross * 100 : 0;

  _taxCardData = { win, best, sav, tds, bal, name, effRate,
    gross: _i.gross, taxable: win==='new' ? _n.taxable : _o.taxable };

  renderTaxCard();
  document.getElementById('tax-card-modal').classList.add('open');
  try { if(typeof gtag==='function') gtag('event','tax_card_opened',{event_category:'sharing'}); } catch(e){}
}

function closeTaxCard() {
  document.getElementById('tax-card-modal').classList.remove('open');
}

function renderTaxCard() {
  const d = _taxCardData;
  if (!d) return;
  const isNew = d.win === 'new';
  const accentColor = isNew ? '#c8f04a' : '#f0c84a';
  const regimeLabel = isNew ? 'New Regime' : 'Old Regime';
  const balLabel = d.bal >= 0 ? '↑ Refund' : '↓ Tax Due';
  const balVal = d.bal >= 0 ? fmt(d.bal, true) : fmt(Math.abs(d.bal), true);

  const card = document.getElementById('tax-card-render');
  card.innerHTML = `
    <div class="tax-card-preview ${isNew ? '' : 'old-regime'}" id="tc-preview" onclick="copyTaxCardText()">
      <div class="tc-logo">TaxSmart India · FY 2025–26</div>
      <div class="tc-name">${escHtml(d.name)}</div>
      <div class="tc-fy">Tax Year 2025–26 · Filed under Income Tax Act 1961</div>
      <div class="tc-regime-badge">✓ ${regimeLabel}</div>
      <div class="tc-stats">
        <div>
          <span class="tc-stat-val ${isNew ? 'new-regime-color' : 'old-regime-color'}">${fmt(d.best, true)}</span>
          <span class="tc-stat-lbl">Tax Paid</span>
        </div>
        <div>
          <span class="tc-stat-val ${isNew ? 'new-regime-color' : 'old-regime-color'}">${d.effRate.toFixed(1)}%</span>
          <span class="tc-stat-lbl">Effective Rate</span>
        </div>
        <div>
          <span class="tc-stat-val ${isNew ? 'new-regime-color' : 'old-regime-color'}" style="font-size:14px;">${balLabel}<br>${balVal}</span>
          <span class="tc-stat-lbl">TDS Balance</span>
        </div>
      </div>
      <div class="tc-divider"></div>
      ${d.sav > 500 ? `<div class="tc-saving ${isNew ? '' : 'old-regime-saving'}">
        Chose ${regimeLabel} — saved <span>${fmt(d.sav, true)}</span> vs the alternative ✓
      </div>` : `<div class="tc-saving">Both regimes gave similar results for my income profile.</div>`}
      <div class="tc-watermark">taxsmart.vedant4557-dev.github.io · free · no CA needed</div>
    </div>
  `;
}

function buildTaxCardShareText() {
  const d = _taxCardData;
  if (!d) return '';
  const isNew = d.win === 'new';
  const regime = isNew ? 'New Regime' : 'Old Regime';
  const otherRegime = isNew ? 'Old Regime' : 'New Regime';

  // Lead with the savings hook — this is what gets shared
  if (d.sav > 5000) {
    const balLine = d.bal >= 0
      ? `Getting a refund of ${fmt(d.bal, true)} 💰`
      : `Balance tax due: ${fmt(Math.abs(d.bal), true)}`;
    return `I saved ${fmt(d.sav, true)} in tax by switching to ${regime} 🎉

This free AI tool found it in 30 seconds — just uploaded my Form 16.

• Gross income: ${fmt(d.gross, true)}
• Total tax: ${fmt(d.best, true)} (effective ${d.effRate.toFixed(1)}%)
• ${regime} saves ${fmt(d.sav, true)} vs ${otherRegime}
• ${balLine}

Check yours free → vedant4557-dev.github.io/taxai/
#TaxSmart #IncomeTax #SaveTax #India`;
  } else {
    // No big savings — lead with refund or risk angle
    const balLine = d.bal >= 0
      ? `Getting a refund of ${fmt(d.bal, true)}`
      : `Need to pay ${fmt(Math.abs(d.bal), true)} more`;
    return `Just ran my FY 2025–26 tax check — took 30 seconds 🧾

• Gross: ${fmt(d.gross, true)} | Tax: ${fmt(d.best, true)}
• Best regime: ${regime} | Rate: ${d.effRate.toFixed(1)}%
• ${balLine}

Free AI tool — no login, no CA needed
→ vedant4557-dev.github.io/taxai/
#TaxSmart #IncomeTax #India`;
  }
}

function copyTaxCardText() {
  const text = buildTaxCardShareText();
  navigator.clipboard.writeText(text).then(() => {
    const preview = document.getElementById('tc-preview');
    if (preview) {
      preview.style.outline = '2px solid #c8f04a';
      setTimeout(() => preview.style.outline = '', 1200);
    }
  }).catch(() => {});
}

function downloadTaxCard() {
  // Build a self-contained HTML card and open for screenshot/save
  const d = _taxCardData;
  if (!d) return;
  const isNew = d.win === 'new';
  const accentColor = isNew ? '#c8f04a' : '#f0c84a';
  const bg = isNew
    ? 'linear-gradient(135deg,#1a472a 0%,#0f2d1a 60%,#162d1a 100%)'
    : 'linear-gradient(135deg,#7a5010 0%,#4a2f08 60%,#3a2006 100%)';
  const regime = isNew ? 'New Regime' : 'Old Regime';
  const balLabel = d.bal >= 0 ? '↑ Refund' : '↓ Tax Due';
  const balVal = d.bal >= 0 ? fmt(d.bal, true) : fmt(Math.abs(d.bal), true);
  const savLine = d.sav > 500
    ? `Chose ${regime} — saved ${fmt(d.sav, true)} vs the alternative ✓`
    : 'Both regimes gave similar results.';

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Crimson+Pro:wght@600&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#f7f5f0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Sora',sans-serif;padding:20px;}
.card{background:${bg};border-radius:24px;padding:36px 32px;color:#fff;width:480px;position:relative;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3);}
.card::before{content:'';position:absolute;top:-80px;right:-80px;width:280px;height:280px;border-radius:50%;background:rgba(255,255,255,.04);}
.logo{font-size:10px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;opacity:.4;margin-bottom:24px;}
.name{font-family:'Crimson Pro',serif;font-size:34px;font-weight:600;line-height:1;margin-bottom:5px;}
.fy{font-size:11px;opacity:.45;margin-bottom:24px;letter-spacing:.5px;}
.badge{display:inline-block;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:100px;padding:5px 16px;font-size:12px;font-weight:700;letter-spacing:.5px;margin-bottom:24px;}
.stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:24px;}
.sv{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;color:${accentColor};display:block;margin-bottom:3px;}
.sl{font-size:9px;opacity:.5;text-transform:uppercase;letter-spacing:1px;}
.divider{height:1px;background:rgba(255,255,255,.1);margin-bottom:18px;}
.saving{font-size:13px;font-weight:700;opacity:.9;line-height:1.4;}
.saving span{color:${accentColor};}
.wm{font-size:9px;opacity:.25;text-align:right;margin-top:18px;letter-spacing:.5px;text-transform:uppercase;}
</style>
</head><body>
<div class="card">
  <div class="logo">TaxSmart India · FY 2025–26</div>
  <div class="name">${escHtml(d.name)}</div>
  <div class="fy">Tax Year 2025–26 · Income Tax Act 1961</div>
  <div class="badge">✓ ${regime}</div>
  <div class="stats">
    <div><span class="sv">${fmt(d.best, true)}</span><span class="sl">Tax Paid</span></div>
    <div><span class="sv">${d.effRate.toFixed(1)}%</span><span class="sl">Effective Rate</span></div>
    <div><span class="sv" style="font-size:16px;">${balLabel}<br>${balVal}</span><span class="sl">TDS Balance</span></div>
  </div>
  <div class="divider"></div>
  <div class="saving">${savLine.replace(fmt(d.sav, true), `<span>${fmt(d.sav, true)}</span>`)}</div>
  <div class="wm">taxsmart · free · no ca needed</div>
</div>
<\x73cript>window.onload=()=>{setTimeout(()=>window.print(),400)}<\/script>
</body></html>`;

  const blob = new Blob([html], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TaxSmart_Card_${(_taxCardData.name||'').replace(/\s+/g,'_')}_FY2025-26.html`;
  a.style.display='none';document.body.appendChild(a);a.click();
  setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},300);
  try { if(typeof gtag==='function') gtag('event','tax_card_downloaded',{event_category:'sharing'}); } catch(e){}
}

function shareTaxCardWhatsApp() {
  const text = buildTaxCardShareText();
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  try { if(typeof gtag==='function') gtag('event','tax_card_whatsapp',{event_category:'sharing'}); } catch(e){}
}

function shareTaxCardLinkedIn() {
  const url = 'https://vedant4557-dev.github.io/taxai/';
  const d = _taxCardData;
  const text = `Just calculated my FY 2025-26 taxes using TaxSmart — ${fmt(d.best,true)} total tax, ${d.effRate.toFixed(1)}% effective rate. Used the ${d.win==='new'?'New':'Old'} Regime${d.sav>500?' and saved '+fmt(d.sav,true)+' vs the alternative':''}.\n\nFree tool, no CA needed, 5 minutes: ${url}`;
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`, '_blank');
  try { if(typeof gtag==='function') gtag('event','tax_card_linkedin',{event_category:'sharing'}); } catch(e){}
}

function escHtml(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ══════════════════════════════════════════════════════════════════════

// ── Window exports (required for HTML onclick= attributes with ES modules) ──
if(typeof openTaxCard!=="undefined") window.openTaxCard=openTaxCard;
if(typeof closeTaxCard!=="undefined") window.closeTaxCard=closeTaxCard;
if(typeof downloadTaxCard!=="undefined") window.downloadTaxCard=downloadTaxCard;
if(typeof copyTaxCardText!=="undefined") window.copyTaxCardText=copyTaxCardText;
if(typeof shareTaxCardWhatsApp!=="undefined") window.shareTaxCardWhatsApp=shareTaxCardWhatsApp;
if(typeof shareTaxCardLinkedIn!=="undefined") window.shareTaxCardLinkedIn=shareTaxCardLinkedIn;
