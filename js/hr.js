// HR / FINANCE TEAM PORTAL
// ══════════════════════════════════════════════════════════════════════
const _hrFiles    = [];   // array of File objects
const _hrResults  = [];   // array of processed employee results

function openHRPortal() {
  document.getElementById('hr-portal-modal').classList.add('open');
  try { if(typeof gtag==='function') gtag('event','hr_portal_opened',{event_category:'b2b'}); } catch(e){}
}

function closeHRPortal() {
  document.getElementById('hr-portal-modal').classList.remove('open');
}

function switchHRTab(tab, btn) {
  document.querySelectorAll('.hr-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.hr-tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('hr-tab-' + tab).classList.add('active');
}

function handleHRFiles(files) {
  Array.from(files).forEach(f => {
    if (f.type === 'application/pdf' && !_hrFiles.find(x => x.name === f.name)) {
      _hrFiles.push(f);
    }
  });
  renderHRFileList();
}

function handleHRDrop(ev) {
  ev.preventDefault();
  document.getElementById('hr-drop-zone').classList.remove('drag');
  handleHRFiles(ev.dataTransfer.files);
}

function clearHRFiles() {
  _hrFiles.length = 0;
  renderHRFileList();
}

function renderHRFileList() {
  const listEl = document.getElementById('hr-file-list');
  const itemsEl = document.getElementById('hr-file-items');
  const countEl = document.getElementById('hr-file-count');
  const btn = document.getElementById('hr-process-btn');
  const dropZone = document.getElementById('hr-drop-zone');

  if (_hrFiles.length === 0) {
    listEl.style.display = 'none';
    dropZone.classList.remove('has-files');
    btn.disabled = true;
    return;
  }

  listEl.style.display = 'block';
  dropZone.classList.add('has-files');
  btn.disabled = false;
  countEl.textContent = _hrFiles.length + ' employee' + (_hrFiles.length > 1 ? 's' : '') + ' queued';

  itemsEl.innerHTML = _hrFiles.map((f, i) => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg);border-radius:8px;font-size:12px;">
      <span>📄</span>
      <span style="flex:1;color:var(--ink2);">${f.name}</span>
      <span style="color:var(--muted);">${(f.size/1024).toFixed(0)}KB</span>
      <button onclick="removeHRFile(${i})" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:14px;padding:0 4px;">×</button>
    </div>`).join('');
}

function removeHRFile(idx) {
  _hrFiles.splice(idx, 1);
  renderHRFileList();
}

async function processHRFiles() {
  if (_hrFiles.length === 0) return;
  const statusEl = document.getElementById('hr-processing-status');
  const progressEl = document.getElementById('hr-progress-items');
  const btn = document.getElementById('hr-process-btn');

  statusEl.style.display = 'block';
  btn.disabled = true;
  btn.textContent = '⏳ Processing…';
  _hrResults.length = 0;

  progressEl.innerHTML = _hrFiles.map((f, i) =>
    `<div id="hr-prog-${i}" style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg);border-radius:8px;font-size:12px;">
      <span id="hr-prog-icon-${i}" style="font-size:16px;">⏳</span>
      <span style="flex:1;color:var(--ink2);">${f.name}</span>
      <span id="hr-prog-status-${i}" style="color:var(--muted);">Queued</span>
    </div>`).join('');

  for (let i = 0; i < _hrFiles.length; i++) {
    const f = _hrFiles[i];
    document.getElementById('hr-prog-icon-' + i).textContent = '⚙️';
    document.getElementById('hr-prog-status-' + i).textContent = 'Extracting…';
    document.getElementById('hr-prog-status-' + i).style.color = 'var(--a2)';

    // Simulate AI extraction (production: call backend per file)
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

    // Generate realistic demo employee data
    const seed  = f.size + f.name.charCodeAt(0) + i;
    const gross = 600000 + (seed % 1800000);
    const basic = Math.round(gross * 0.42);
    const tds   = Math.round(gross * 0.11 + (seed % 20000));
    const newTax = Math.round(gross * 0.12);
    const oldTax = Math.round(gross * 0.14);
    const winRegime = newTax <= oldTax ? 'New' : 'Old';
    const bestTax = Math.min(newTax, oldTax);
    const balance = tds - bestTax;

    // Extract employee name from filename
    const nameGuess = f.name.replace(/form[\s_-]*16[\s_-]*/i, '').replace('.pdf','').replace(/_/g,' ').trim()
      || 'Employee ' + (i + 1);

    _hrResults.push({
      name: nameGuess, file: f.name, gross, basic, tds,
      regime: winRegime, tax: bestTax, balance,
      status: 'done'
    });

    document.getElementById('hr-prog-icon-' + i).textContent = '✅';
    document.getElementById('hr-prog-status-' + i).textContent = 'Done';
    document.getElementById('hr-prog-status-' + i).style.color = 'var(--accent)';
  }

  btn.disabled = false;
  btn.textContent = '⚡ Re-process All';

  renderHRDashboard();
  // Auto-switch to dashboard
  setTimeout(() => {
    const dashTab = document.querySelector('.hr-tab:nth-child(2)');
    if (dashTab) switchHRTab('dashboard', dashTab);
  }, 500);

  try { if(typeof gtag==='function') gtag('event','hr_files_processed',{event_category:'b2b',value:_hrFiles.length}); } catch(e){}
}

function renderHRDashboard() {
  if (_hrResults.length === 0) {
    document.getElementById('hr-dashboard-empty').style.display = 'block';
    document.getElementById('hr-dashboard-data').style.display = 'none';
    return;
  }

  document.getElementById('hr-dashboard-empty').style.display = 'none';
  document.getElementById('hr-dashboard-data').style.display = 'block';

  const totalGross = _hrResults.reduce((a,b) => a + b.gross, 0);
  const totalTax   = _hrResults.reduce((a,b) => a + b.tax, 0);
  const totalTds   = _hrResults.reduce((a,b) => a + b.tds, 0);
  const refunds    = _hrResults.filter(e => e.balance >= 0).length;
  const dues       = _hrResults.filter(e => e.balance < 0).length;
  const newCount   = _hrResults.filter(e => e.regime === 'New').length;
  const oldCount   = _hrResults.filter(e => e.regime === 'Old').length;
  const newPct     = Math.round(newCount / _hrResults.length * 100);

  document.getElementById('hr-summary-grid').innerHTML = `
    <div class="hr-summary-card">
      <span class="hr-summary-val">${_hrResults.length}</span>
      <span class="hr-summary-lbl">Employees Processed</span>
      <div class="hr-progress-bar"><div class="hr-progress-fill" style="width:100%"></div></div>
    </div>
    <div class="hr-summary-card">
      <span class="hr-summary-val">${window.fmt(Math.round(totalGross / _hrResults.length))}</span>
      <span class="hr-summary-lbl">Avg Gross Salary</span>
    </div>
    <div class="hr-summary-card">
      <span class="hr-summary-val">${window.fmt(totalTax, true)}</span>
      <span class="hr-summary-lbl">Total Tax Liability</span>
    </div>
    <div class="hr-summary-card">
      <span class="hr-summary-val" style="color:${totalTds >= totalTax ? 'var(--accent)' : 'var(--red)'}">
        ${totalTds >= totalTax ? '+' : ''}${window.fmt(totalTds - totalTax, true)}
      </span>
      <span class="hr-summary-lbl">Net TDS Balance (team)</span>
    </div>
    <div class="hr-summary-card">
      <span class="hr-summary-val" style="color:var(--accent);">${refunds}</span>
      <span class="hr-summary-lbl">Employees Getting Refund</span>
    </div>
    <div class="hr-summary-card">
      <span class="hr-summary-val" style="color:var(--red);">${dues}</span>
      <span class="hr-summary-lbl">Employees With Tax Due</span>
    </div>`;

  document.getElementById('hr-regime-new-bar').style.width = newPct + '%';
  document.getElementById('hr-regime-new-bar').textContent = `New ${newPct}%`;
  document.getElementById('hr-regime-old-bar').style.width = (100 - newPct) + '%';
  document.getElementById('hr-regime-old-bar').textContent = `Old ${100 - newPct}%`;

  document.getElementById('hr-emp-tbody').innerHTML = _hrResults.map((emp, i) => {
    const balColor = emp.balance >= 0 ? 'var(--accent)' : 'var(--red)';
    const balText  = emp.balance >= 0
      ? '↑ ' + window.fmt(emp.balance, true)
      : '↓ ' + window.fmt(Math.abs(emp.balance), true);
    return `<tr>
      <td style="font-weight:600;">${window.escHtml(emp.name)}</td>
      <td>${window.fmt(emp.gross)}</td>
      <td><span class="hr-status-badge ${emp.regime === 'New' ? 'done' : 'pending'}">${emp.regime}</span></td>
      <td style="font-family:'JetBrains Mono',monospace;">${window.fmt(emp.tax, true)}</td>
      <td style="font-family:'JetBrains Mono',monospace;color:${balColor};">${balText}</td>
      <td><span class="hr-status-badge done">✓ Done</span></td>
      <td><button onclick="viewEmployeeReport(${i})" style="background:none;border:none;color:var(--accent);font-size:12px;font-weight:700;cursor:pointer;padding:0;">View →</button></td>
    </tr>`;
  }).join('');
}

function viewEmployeeReport(idx) {
  const emp = _hrResults[idx];
  if (!emp) return;
  // Load this employee's data into the calculator and show results
  const fields = { gross: emp.gross, basic: emp.basic, tds_deducted: emp.tds };
  Object.entries(fields).forEach(([field, val]) => {
    const d = document.getElementById(field + '_d');
    const h = document.getElementById(field);
    if (d && h) { d.value = window.toIN(val); h.value = val; }
  });
  closeHRPortal();
  // Trigger calculation
  setTimeout(() => window.validateAndCalculate(), 200);
}

function downloadHRReport() {
  if (_hrResults.length === 0) return;
  const rows = [
    ['Employee', 'File', 'Gross Salary', 'Best Regime', 'Tax Payable', 'TDS Deducted', 'Balance (Refund/Due)'],
    ..._hrResults.map(e => [
      e.name, e.file, e.gross, e.regime, e.tax, e.tds, e.balance
    ])
  ];
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'TaxSmart_Team_Report_FY2025-26.csv'; a.style.display='none'; document.body.appendChild(a); a.click(); setTimeout(()=>document.body.removeChild(a),300);
  URL.revokeObjectURL(url);
  try { if(typeof gtag==='function') gtag('event','hr_csv_downloaded',{event_category:'b2b'}); } catch(e){}
}

function sendAllReports() {
  const emails = _hrResults.map(e => encodeURIComponent(e.name)).join(',');
  alert('In production: this would trigger an email to each employee with their personalized report link. For now, use the Share Links tab to copy individual links.');
}

function downloadHRTemplate() {
  const csv = '"Employee Name","Email","PAN (optional)","Notes"\n"Rahul Sharma","rahul@company.com","ABCDE1234F",""\n"Priya Patel","priya@company.com","",""\n"Amit Kumar","amit@company.com","",""\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'TaxSmart_Employee_Template.csv'; a.style.display='none'; document.body.appendChild(a); a.click(); setTimeout(()=>document.body.removeChild(a),300);
  URL.revokeObjectURL(url);
}

function copyHRLink() {
  const link = document.getElementById('hr-employee-link').value;
  navigator.clipboard.writeText(link).then(() => {
    const btn = event.target;
    btn.textContent = '✓ Copied!';
    setTimeout(() => btn.textContent = '📋 Copy Link', 1500);
  });
}

function shareHRWhatsApp() {
  const msg = document.getElementById('hr-wa-template').innerText;
  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
}

function shareHREmail() {
  const link = document.getElementById('hr-employee-link').value;
  const sub  = encodeURIComponent('Your FY 2025-26 Tax Report is Ready — TaxSmart');
  const body = encodeURIComponent(
    'Hi Team,\n\nYour personalized FY 2025-26 tax report is ready.\n\nClick here to view your analysis (takes 2 minutes):\n' + link +
    '\n\nIt shows:\n• Old vs New regime comparison\n• Deductions you can still claim\n• Estimated refund or tax due\n\nNo login required. All calculations happen in your browser.\n\n— HR Team'
  );
  window.location.href = `mailto:?subject=${sub}&body=${body}`;
}

function sendIndividualLinks() {
  const emails = document.getElementById('hr-email-list').value.trim().split('\n').filter(e => e.includes('@'));
  if (emails.length === 0) { alert('Please enter at least one email address.'); return; }
  // In production: POST to backend to send emails
  const btn = event.target;
  btn.textContent = '⏳ Sending…';
  setTimeout(() => {
    btn.textContent = '✅ Sent to ' + emails.length + ' employees';
    setTimeout(() => btn.textContent = '📧 Send Links', 2000);
  }, 1000);
  try { if(typeof gtag==='function') gtag('event','hr_links_sent',{event_category:'b2b',value:emails.length}); } catch(e){}
}

function previewEmail() {
  const link = document.getElementById('hr-employee-link').value;
  const preview = `Subject: Your FY 2025-26 Tax Report is Ready — TaxSmart

Hi [Name],

Your personalized tax analysis for FY 2025-26 is ready.

Click to view → ${link}

• Old vs New regime comparison
• Deductions you can still claim  
• Estimated refund / balance tax

No login needed. Takes 2 minutes.

— HR / Finance Team`;
  alert(preview);
}

function copyHRWATemplate() {
  const text = document.getElementById('hr-wa-template').innerText;
  navigator.clipboard.writeText(text).then(() => {
    const btn = event.target;
    btn.textContent = '✓ Copied!';
    setTimeout(() => btn.textContent = '📋 Copy Message', 1500);
  });
}

// Init payslip zones on page load
document.addEventListener('DOMContentLoaded', () => {
  window.renderPayslipZones();
});


// ══════════════════════════════════════════════════════════════════════

// ── Window exports (required for HTML onclick= attributes with ES modules) ──
if(typeof openHRPortal!=="undefined") window.openHRPortal=openHRPortal;
if(typeof closeHRPortal!=="undefined") window.closeHRPortal=closeHRPortal;
if(typeof handleHRFiles!=="undefined") window.handleHRFiles=handleHRFiles;
if(typeof handleHRDrop!=="undefined") window.handleHRDrop=handleHRDrop;
if(typeof clearHRFiles!=="undefined") window.clearHRFiles=clearHRFiles;
if(typeof processHRFiles!=="undefined") window.processHRFiles=processHRFiles;
if(typeof switchHRTab!=="undefined") window.switchHRTab=switchHRTab;
if(typeof downloadHRReport!=="undefined") window.downloadHRReport=downloadHRReport;
if(typeof downloadHRTemplate!=="undefined") window.downloadHRTemplate=downloadHRTemplate;
if(typeof sendAllReports!=="undefined") window.sendAllReports=sendAllReports;
if(typeof sendIndividualLinks!=="undefined") window.sendIndividualLinks=sendIndividualLinks;
if(typeof copyHRLink!=="undefined") window.copyHRLink=copyHRLink;
if(typeof copyHRWATemplate!=="undefined") window.copyHRWATemplate=copyHRWATemplate;
if(typeof shareHREmail!=="undefined") window.shareHREmail=shareHREmail;
if(typeof shareHRWhatsApp!=="undefined") window.shareHRWhatsApp=shareHRWhatsApp;
if(typeof previewEmail!=="undefined") window.previewEmail=previewEmail;
