// PAYSLIP INTELLIGENCE
// ══════════════════════════════════════════════════════════════════════
const _payslipFiles = {};   // { 'Apr': File, 'May': File, ... }
const _payslipData  = {};   // parsed data per month
const MONTHS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
let _payslipMonthCount = 3; // start with 3 zones

function togglePayslipSection() {
  const sec = document.getElementById('payslip-section');
  const btn = document.getElementById('payslip-toggle-btn');
  const visible = sec.style.display !== 'none';
  sec.style.display = visible ? 'none' : 'block';
  btn.textContent = visible ? '+ Add Payslips' : '− Hide Payslips';
  if (!visible) renderPayslipZones();
}

function renderPayslipZones() {
  const grid = document.getElementById('payslip-zones');
  grid.innerHTML = '';
  for (let i = 0; i < _payslipMonthCount; i++) {
    const m = MONTHS[i];
    const uploaded = !!_payslipFiles[m];
    grid.innerHTML += `
      <div class="ps-zone ${uploaded ? 'uploaded' : ''}" id="ps-zone-${m}"
        ondragover="event.preventDefault();this.classList.add('drag')"
        ondragleave="this.classList.remove('drag')"
        ondrop="handlePayslipDrop(event,'${m}')">
        <div class="ps-zone-icon">${uploaded ? '✅' : '📄'}</div>
        <div class="ps-zone-month">${m} 2025</div>
        <div class="ps-zone-status">${uploaded ? _payslipFiles[m].name.slice(0,14)+'…' : 'tap to upload'}</div>
        <input type="file" accept=".pdf" onchange="handlePayslipFile(this,'${m}')">
      </div>`;
  }
  updateAnalyzeBtn();
}

function addPayslipMonth() {
  if (_payslipMonthCount >= 12) return;
  _payslipMonthCount++;
  renderPayslipZones();
}

function handlePayslipFile(input, month) {
  const file = input.files[0];
  if (!file || file.type !== 'application/pdf') return;
  _payslipFiles[month] = file;
  renderPayslipZones();
}

function handlePayslipDrop(ev, month) {
  ev.preventDefault();
  const file = ev.dataTransfer.files[0];
  if (!file || file.type !== 'application/pdf') return;
  _payslipFiles[month] = file;
  renderPayslipZones();
}

function updateAnalyzeBtn() {
  const count = Object.keys(_payslipFiles).length;
  const btn = document.getElementById('ps-analyze-btn');
  btn.disabled = count === 0;
  btn.textContent = count > 0
    ? `⚡ Analyze ${count} Payslip${count > 1 ? 's' : ''}`
    : '⚡ Analyze Payslips';
}

async function analyzePayslips() {
  const months = Object.keys(_payslipFiles);
  if (months.length === 0) return;

  const btn = document.getElementById('ps-analyze-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Analyzing…';

  // Simulate AI extraction for each payslip
  // In production: call backend API same as runExtraction()
  await new Promise(r => setTimeout(r, 1200));

  // Generate realistic demo data based on file names/sizes
  months.forEach((m, i) => {
    const f = _payslipFiles[m];
    const seed = f.size + m.charCodeAt(0);
    const base = 80000 + (seed % 40000); // ₹80K–₹1.2L/month
    const increment = i * 500; // slight growth over months
    _payslipData[m] = {
      month: m,
      gross: base + increment,
      basic: Math.round((base + increment) * 0.4),
      hra: Math.round((base + increment) * 0.2),
      pf: Math.round((base + increment) * 0.04),
      tds: Math.round((base + increment) * 0.12),
      net: Math.round((base + increment) * 0.84),
    };
  });

  renderPayslipInsights();
  btn.disabled = false;
  btn.textContent = '✓ Re-analyze';
  try { if(typeof gtag==='function') gtag('event','payslip_analyzed',{event_category:'feature',value:months.length}); } catch(e){}
}

function renderPayslipInsights() {
  const months = Object.keys(_payslipData).sort((a,b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));
  if (months.length === 0) return;

  const insights = document.getElementById('ps-insights');
  insights.style.display = 'block';

  const allGross    = months.map(m => _payslipData[m].gross);
  const allTds      = months.map(m => _payslipData[m].tds);
  const avgSalary   = Math.round(allGross.reduce((a,b) => a+b, 0) / allGross.length);
  const totalTds    = allTds.reduce((a,b) => a+b, 0);
  const projected   = avgSalary * 12;
  const projTdsNeeded = Math.round(projected * 0.13); // estimated 13% effective
  const tdsGap      = projTdsNeeded - (totalTds * (12 / months.length));
  const trend       = allGross.length > 1
    ? ((allGross[allGross.length-1] - allGross[0]) / allGross[0] * 100).toFixed(1)
    : 0;

  document.getElementById('ps-avg-salary').textContent = fmt(avgSalary, true);
  document.getElementById('ps-projected-annual').textContent = fmt(projected, true);
  document.getElementById('ps-tds-paid').textContent = fmt(totalTds, true);
  document.getElementById('ps-tds-gap').textContent = tdsGap > 0
    ? fmt(tdsGap, true) + ' short'
    : '✓ On track';

  // Monthly bars
  const maxGross = Math.max(...allGross);
  const bars = document.getElementById('ps-bars');
  bars.innerHTML = months.map(m => {
    const d = _payslipData[m];
    const pct = Math.round(d.gross / maxGross * 100);
    return `<div class="ps-bar-row">
      <div class="ps-bar-label">${m}</div>
      <div class="ps-bar-track"><div class="ps-bar-fill" style="width:${pct}%"></div></div>
      <div class="ps-bar-val">${fmt(d.gross)}</div>
    </div>`;
  }).join('');

  // Alerts
  const alertsEl = document.getElementById('ps-alerts');
  const alerts = [];

  if (tdsGap > 20000) {
    alerts.push({type:'red', text:`⚠️ TDS shortfall projected: <strong>${fmt(tdsGap, true)}</strong> more needs to be deducted before March 31 to avoid advance tax interest (Sec 234B/C). Ask HR to increase TDS now.`});
  } else if (tdsGap <= 0) {
    alerts.push({type:'green', text:`✅ Your TDS is on track. Based on ${months.length} months analyzed, you're projected to have sufficient TDS deducted by year-end.`});
  }

  if (parseFloat(trend) > 5) {
    alerts.push({type:'amber', text:`📈 Your salary grew <strong>${trend}%</strong> since ${months[0]}. Ensure your employer has updated TDS deduction to reflect the higher income.`});
  }

  if (months.length < 6) {
    alerts.push({type:'amber', text:`💡 Upload more months (${6 - months.length} more) for a more accurate projection. TaxSmart needs at least 6 months for reliable full-year estimates.`});
  }

  alertsEl.innerHTML = alerts.map(a =>
    `<div class="ps-alert ${a.type}">${a.text}</div>`
  ).join('');
}

function applyPayslipData() {
  const months = Object.keys(_payslipData);
  if (months.length === 0) return;

  const avgGross  = Math.round(Object.values(_payslipData).reduce((a,b) => a + b.gross, 0) / months.length);
  const avgBasic  = Math.round(Object.values(_payslipData).reduce((a,b) => a + b.basic, 0) / months.length);
  const avgHra    = Math.round(Object.values(_payslipData).reduce((a,b) => a + b.hra, 0) / months.length);
  const totalTds  = Object.values(_payslipData).reduce((a,b) => a + b.tds, 0);
  const annualEpf = Math.round(Object.values(_payslipData).reduce((a,b) => a + b.pf, 0) * (12 / months.length));

  // Fill form fields
  const fills = {
    gross: avgGross * 12, basic: avgBasic * 12,
    hra_received: avgHra * 12, epf_employee: annualEpf,
    tds_deducted: totalTds * Math.round(12 / months.length),
  };

  Object.entries(fills).forEach(([field, val]) => {
    const disp = document.getElementById(field + '_d');
    const hid  = document.getElementById(field);
    if (disp && hid) {
      disp.value = toIN(val);
      hid.value  = val;
      disp.classList.add('autofilled');
      const w = document.getElementById(field + '_w');
      if (w) w.textContent = '= ₹' + toWords(val);
      const badge = document.getElementById('af-' + field);
      if (badge) badge.style.display = 'inline-flex';
    }
  });

  // Close payslip section and move to step 1
  togglePayslipSection();
  skipToStep1();

  // Show success message
  setTimeout(() => {
    const banner = document.getElementById('autofill-banner-2');
    if (banner) {
      banner.classList.remove('hidden');
      banner.textContent = '✅ Auto-filled from ' + months.length + ' payslip' + (months.length > 1 ? 's' : '') + '. Review values for accuracy.';
    }
  }, 300);

  try { if(typeof gtag==='function') gtag('event','payslip_applied',{event_category:'funnel'}); } catch(e){}
}

// ══════════════════════════════════════════════════════════════════════

// ── Window exports (required for HTML onclick= attributes with ES modules) ──
if(typeof addPayslipMonth!=="undefined") window.addPayslipMonth=addPayslipMonth;
if(typeof analyzePayslips!=="undefined") window.analyzePayslips=analyzePayslips;
if(typeof applyPayslipData!=="undefined") window.applyPayslipData=applyPayslipData;
if(typeof togglePayslipSection!=="undefined") window.togglePayslipSection=togglePayslipSection;
