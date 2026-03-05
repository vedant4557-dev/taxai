// RESULT BUILDERS
// =====================================================================================================================================================================
function buildUtil(){
  const d=window._o.deds;
  const bars=[
    {ico:'💰',lbl:'80C',used:d.c80c,max:150000},
    {ico:'🏦',lbl:'NPS (80CCD 1B)',used:d.cnps,max:50000},
    {ico:'🏥',lbl:'80D Health',used:d.c80d,max:75000},
    {ico:'🏠',lbl:'Home Loan 24b',used:d.c24b,max:200000},
    {ico:'🏡',lbl:'HRA Exemption',used:d.hra,max:window._i.hra_received||1},
  ];
  document.getElementById('util-bars').innerHTML=bars.map(b=>{
    const p=b.max>0?Math.min(100,b.used/b.max*100):0,unused=Math.max(0,b.max-b.used);
    return`<div class="pot-row">
      <div class="pot-ico">${b.ico}</div>
      <div class="pot-lbl">${b.lbl}</div>
      <div class="pot-bar">
        <div class="pot-bar-lbl"><span>${fmt(b.used)}</span><span>${p.toFixed(0)}% of ${fmt(b.max)}</span></div>
        <div class="pot-track"><div class="pot-used" style="width:${p}%"></div></div>
        ${unused>1000&&b.lbl!=='HRA Exemption'?`<div style="font-size:10px;color:var(--a2);margin-top:2px;">↑ ${fmt(unused)} more available</div>`:''}
      </div>
    </div>`;
  }).join('');
}

function buildComp(){
  const d=window._o.deds;
  // Surcharge breakdown for both regimes
  const _o_sur=cessBreakdown(Math.round(window._o.tax/1.04),window._i.gross);
  const _n_sur=cessBreakdown(Math.round(window._n.tax/1.04),window._i.gross);
  // Factor = 1 + sRate + 0.04*(1+sRate) used to back-calc base tax
  const _o_fac=(1+_o_sur.sRate)*1.04;
  const _n_fac=(1+_n_sur.sRate)*1.04;
  const ltcg_t=Math.max(0,(window._i.ltcg||0)-125000);
  const stcg_tax=(window._i.stcg||0)*.20;
  const ltcg_tax=ltcg_t*.125;
  const crypto_tax=(window._i.crypto||0)*.30;
  const hasSpecialIncome=(window._i.stcg||0)+(window._i.ltcg||0)+(window._i.crypto||0)>0;
  const rows=[
    ['Gross Salary Income',window._i.gross,window._i.gross,false],
    ['Exemptions (HRA,LTA etc.)',d.hra+d.lta+d.cea_ex+d.hos+d.prof_tax+d.grat,0,false],
    ...((d.vrs_ex||0)+(d.retrench_ex||0)+(d.leave_ex||0)>0?[
      ['  VRS Exemption [Sec 10(10C)]',(d.vrs_ex||0),0,false],
      ['  Retrenchment Exempt [Sec 10(10B)]',(d.retrench_ex||0),0,false],
      ['  Leave Encashment Exempt [Sec 10(10AA)]',(d.leave_ex||0),0,false],
    ]:[]),
    ['Standard Deduction',d.std,75000,false],
    ['Chapter VI-A Deductions',d.c80c+d.cnps+d.c80d+d.c24b+d.c80e_v+d.c80tta+d.c80g_v+d.c80u_v,0,false],
    ['Employer NPS [80CCD(2)]',d.cenps,d.cenps,false],
    ['Taxable Salary Income',window._o.taxable,window._n.taxable,true],
    ['Tax on Salary (incl. cess)',Math.round((window._o.tax-(ltcg_tax+stcg_tax+crypto_tax)*1.04)),Math.round((window._n.tax-(ltcg_tax+stcg_tax+crypto_tax)*1.04)),false],
    ...(hasSpecialIncome?[
      ['─── Capital & Other Income ───','','',false],
      ...(window._i.stcg>0?[['STCG (equity <1yr) @ 20%',Math.round(stcg_tax*1.04),Math.round(stcg_tax*1.04),false]]: []),
      ...(window._i.ltcg>0?[['LTCG (equity 1yr+) @ 12.5%',Math.round(ltcg_tax*1.04),Math.round(ltcg_tax*1.04),false]]: []),
      ...(window._i.ltcg>0?[['  (First ₹1.25L exempt)','—','—',false]]:[]),
      ...(window._i.crypto>0?[['Crypto/VDA @ 30% (flat)',Math.round(crypto_tax*1.04),Math.round(crypto_tax*1.04),false]]:[]),
    ]:[]),
    ...((_o_sur.surcharge>0||_n_sur.surcharge>0)?[
      ['─── Tax Components ───','','',false],
      ['Base Tax (before surcharge)',Math.round(window._o.tax/_o_fac),Math.round(window._n.tax/_n_fac),false],
      ['Surcharge ('+(_o_sur.sRate*100).toFixed(0)+'% / '+(_n_sur.sRate*100).toFixed(0)+'%)',_o_sur.surcharge,_n_sur.surcharge,false],
      ['Health & Education Cess (4%)',_o_sur.cessAmt,_n_sur.cessAmt,false],
    ]:[
      ['Health & Education Cess (4%)',_o_sur.cessAmt,_n_sur.cessAmt,false],
    ]),
    ...((window._i.gaming_income||0)>0?[['Online Gaming / Lottery (30%)',window._o.gaming_t||0,window._n.gaming_t||0,false]]:[]),
    ...(((window._o.relief89||0)>0||(window._n.relief89||0)>0)?[['Sec 89(1) Arrears Relief',-((window._o.relief89||0)),-((window._n.relief89||0)),false]]:[]),
    ['Total Tax (incl. cess)',window._o.tax,window._n.tax,true],
    ['TDS Deducted',window._i.tds_deducted,window._i.tds_deducted,false],
    ['Balance (Refund/Due)',window._o.tax-window._i.tds_deducted,window._n.tax-window._i.tds_deducted,true],
  ];
  document.getElementById('comp-tbl').innerHTML=
    '<thead><tr><th>Particulars</th><th style="text-align:right">Old Regime</th><th style="text-align:right">New Regime</th></tr></thead><tbody>'+
    rows.map(r=>`<tr>
      <td style="color:${r[3]?'var(--ink)':'var(--ink2)'};font-weight:${r[3]?700:400}">${r[0]}</td>
      <td style="color:${r[3]?'var(--accent)':'var(--ink2)'};font-weight:${r[3]?600:400}">${r[3]&&r[1]<0?'<span style="color:var(--accent)">'+fmt(Math.abs(r[1]))+' refund</span>':fmt(r[1])}</td>
      <td style="color:${r[3]?'var(--accent)':'var(--ink2)'};font-weight:${r[3]?600:400}">${r[3]&&r[2]<0?'<span style="color:var(--accent)">'+fmt(Math.abs(r[2]))+' refund</span>':fmt(r[2])}</td>
    </tr>`).join('')+'</tbody>';
}

function buildSlabViz(){
  const make=({bd,taxable})=>{
    const mx=Math.max(...bd.map(b=>b.tax),1);
    return bd.map(b=>`<div class="slab-item">
      <div class="slab-head"><span class="slab-nm">${b.lbl}</span><span class="slab-amt">${fmt(b.tax)}</span></div>
      <div class="slab-tr"><div class="slab-fl" style="width:${Math.min(100,b.tax/mx*100)}%"></div></div>
      <div class="slab-rt">${(b.rate*100).toFixed(0)}% on ${fmt(b.band)}</div>
    </div>`).join('')+`<div style="border-top:1px solid var(--border);padding-top:8px;margin-top:4px;font-size:11px;color:var(--muted)">Taxable: <strong style="color:var(--accent)">${fmt(taxable)}</strong></div>`;
  };
  document.getElementById('slab-sec').innerHTML=
    `<div><div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:12px;font-weight:700">Old Regime</div>${make(window._o)}</div>`+
    `<div><div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:12px;font-weight:700">New Regime</div>${make(window._n)}</div>`;
}

function buildDeds(){
  const d=window._o.deds;
  const rows=[
    {n:'Standard Deduction',v:d.std,s:'Section 16(ia)',e:'Flat deduction every salaried person gets automatically. ₹50K old / ₹75K new regime.'},
    {n:'HRA Exemption',v:d.hra,s:'Section 10(13A)',e:'Tax-free portion of HRA based on rent paid, HRA received & city type. Old regime only.'},
    {n:'LTA Exemption',v:d.lta,s:'Section 10(5)',e:'Tax-free travel reimbursement from employer for domestic travel. Old regime only.'},
    {n:'CEA + Hostel Allowance',v:d.cea_ex+d.hos,s:'Section 10(14)',e:'₹100/month CEA + ₹300/month hostel per child, max 2 children. Old regime only.'},
    {n:'Professional Tax',v:d.prof_tax,s:'Section 16(iii)',e:'State tax deducted from salary. Fully deductible in old regime.'},
    {n:'Gratuity Exempt',v:d.grat,s:'Section 10(10)',e:'Tax-free gratuity when leaving after 5+ years. Up to ₹20 lakh completely exempt.'},
    {n:'80C Investments',v:d.c80c,s:'Section 80C',e:'PPF, ELSS, LIC, EPF contribution, NSC, home loan principal, tuition fees — cap ₹1.5L.'},
    {n:'NPS Extra Deduction',v:d.cnps,s:'Section 80CCD(1B)',e:'Additional ₹50,000 deduction for NPS Tier 1 — completely separate from 80C.'},
    {n:'Employer NPS',v:d.cenps,s:'Section 80CCD(2)',e:"Employer's NPS up to 10% of Basic+DA. Works in BOTH regimes!"},
    {n:'Health Insurance',v:d.c80d,s:'Section 80D',e:'Self/family ₹25K + parents ₹25K. Preventive health checkup ₹5K included.'},
    {n:'Home Loan Interest',v:d.c24b,s:'Section 24(b)',e:'Interest on home loan. Max ₹2 lakh for self-occupied. Get interest certificate from bank.'},
    {n:'Education Loan Interest',v:d.c80e_v,s:'Section 80E',e:'Full interest deductible — no upper limit! Applies for 8 years from repayment start.'},
    {n:'Savings A/c Interest',v:d.c80tta,s:'Section 80TTA',e:'Savings account interest — ₹10,000 tax-free. ₹50K for senior citizens (80TTB).'},
    {n:'Donations (80G)',v:d.c80g_v,s:'Section 80G',e:'50–100% of donations to approved charities. Keep receipt with 80G number.'},
    {n:'Disability Deduction',v:d.c80u_v,s:'Section 80U/DD',e:'₹75K for self with disability (40%+), ₹1.25L for severe. Medical certificate needed.'},
  ].filter(r=>r.v>0);
  const tot=rows.reduce((s,r)=>s+r.v,0);
  document.getElementById('ded-list').innerHTML=rows.map(r=>`
    <div class="ded-row">
      <div><div class="ded-name">${r.n}</div><div class="ded-sec">${r.s}</div><div class="ded-exp">${r.e}</div></div>
      <div class="ded-val">+${fmt(r.v)}</div>
    </div>`).join('')+
    `<div style="display:flex;justify-content:space-between;background:var(--al);border-radius:10px;padding:14px;margin-top:8px;">
      <div style="font-weight:700;font-size:14px;">Total</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:var(--accent);">+${fmt(tot)}</div>
    </div>`;
}

function buildTips(win){
  const d=window._o.deds,tips=[];
  const u80c=Math.max(0,150000-d.c80c);
  if(u80c>5000)tips.push({ico:'💰',t:`Invest ${fmt(u80c)} more in 80C`,d:`You have unused 80C capacity. Best: ELSS (3-year lock-in, market returns) or PPF (safe, guaranteed, tax-free maturity).`,c:`Save ~${fmt(u80c*.20)} more in old regime`});
  if(d.cnps<50000&&window._i.nps<50000){const g=50000-window._i.nps;tips.push({ico:'🏦',t:`Add ${fmt(g)} more to NPS`,d:`Section 80CCD(1B) gives ₹50K EXTRA deduction separate from 80C. Open NPS Tier 1 on your bank app.`,c:`Potential saving: ~${fmt(g*.20)}`});}
  if(window._i.employer_nps===0)tips.push({ico:'💼',t:'Ask HR about Employer NPS (80CCD 2)',d:`Employer NPS up to 10% of Basic is deductible in BOTH regimes. Ask HR to restructure your CTC.`,c:'Works in New Regime too! ✅'});
  if(d.c80d<50000)tips.push({ico:'🏥',t:'Get health insurance for you and parents',d:`₹25K self + ₹25K parents = ₹50K total deduction. A family floater costs ₹12–20K/year.`,c:`Save up to ${fmt((50000-d.c80d)*.20)} in tax`});
  if(win==='new')tips.push({ico:'📊',t:'What would flip you to Old Regime?',d:`Currently better in New Regime. Try maxing 80C (₹1.5L) + NPS (₹50K) + 80D (₹50K) and recalculate.`,c:'Recalculate after maxing deductions'});
  tips.push({ico:'📅',t:'Tell HR your regime choice in April',d:`Employer TDS is based on declared regime. New Regime is default. Declare Old if better — avoids surprises at year end.`,c:'Deadline: April of FY start'});
  tips.push({ico:'📈',t:'Use ₹1.25L LTCG exemption every year',d:`Profit from equity MFs/stocks held 1+ year is tax-free up to ₹1.25L. Sell and rebuy to reset cost price (tax harvesting).`,c:'First ₹1.25L gains = zero tax'});
  document.getElementById('tips-list').innerHTML=tips.map(t=>`<div class="tip-item"><div class="tip-ico">${t.ico}</div><div><div class="tip-title">${t.t}</div><div class="tip-desc">${t.d}</div><div class="tip-chip">${t.c}</div></div></div>`).join('');
}

function buildInsight(win,sav,name,tdsBalance){
  const d=window._o.deds,regime=win==='new'?'New Regime':'Old Regime';
  const eff=pct(Math.min(window._o.tax,window._n.tax),window._i.gross);
  const tot=d.c80c+d.cnps+d.c80d+d.c24b;
  let t=`Based on a gross income of <span class="hl">${fmt(window._i.gross)}</span>, the <span class="hl">${regime}</span> saves <span class="hl">${fmt(sav)}</span> this year. Your effective tax rate is <span class="hl">${eff}</span>.`;
  if(win==='new'){t+=` Your deductions of <span class="hl">${fmt(tot)}</span> aren't sufficient to make old regime better.`;}
  else{t+=` Your strong deductions including HRA <span class="hl">${fmt(d.hra)}</span> make Old Regime the winner.`;}
  if(window._i.tds_deducted>0){
    if(tdsBalance>=0)t+=` You have a <span class="hl">refund of ${fmt(tdsBalance)}</span> — file your ITR before July 31 to claim it.`;
    else t+=` You have <span class="hl">balance tax of ${fmt(Math.abs(tdsBalance))}</span> to pay before filing your ITR.`;
  }
  if(window._errors.length>0)t+=` ⚠️ We found <span class="hl">${window._errors.length} issue(s)</span> in your documents — review the error panel above.`;
  // Fix 6: Show confidence indicator if extraction was used
  if(window._extractionConfidence){
    const c=window._extractionConfidence;
    const confColor=c.pct>=80?'#2d6a4f':c.pct>=50?'#c17f24':'#c0392b';
    t+=`<div style="margin-top:12px;padding:8px 12px;background:rgba(255,255,255,.1);border-radius:8px;font-size:11px;opacity:.85;display:flex;align-items:center;gap:8px;"><span style="color:${confColor};font-weight:700;">●</span> AI extraction confidence: <strong>${c.pct}%</strong> &nbsp;·&nbsp; ${c.filled} of ${c.total} key fields auto-filled &nbsp;·&nbsp; ${c.manual>0?c.manual+' fields manually verified':' all fields verified'}</div>`;
  }
  document.getElementById('ai-text').innerHTML=t;
}

async function fetchAIQuestion(topic){
  const el=document.getElementById('ai-text');
  const btns=document.getElementById('ai-question-btns');
  el.textContent='Generating personalized insight…';
  if(btns)btns.style.opacity='0.5';
  const win=window._o.tax<=window._n.tax?'OLD':'NEW',sav=Math.abs(window._o.tax-window._n.tax);
  const name=document.getElementById('name').value||'the user';
  const d=window._o.deds,tds=window._i.tds_deducted,best=Math.min(window._o.tax,window._n.tax),bal=tds-best;
  const errSummary=window._errors.length>0?`Issues found: ${window._errors.map(e=>e.title).join('; ')}`:'No document issues found.';
  const ctx=`User: ${name}. Income: ₹${window._i.gross.toLocaleString()} gross. ${win} Regime better, saves ₹${sav.toLocaleString()}. TDS: ₹${tds.toLocaleString()}, balance: ₹${Math.abs(bal).toLocaleString()} ${bal>=0?'refund':'due'}. 80C: ₹${d.c80c.toLocaleString()}, NPS: ₹${d.cnps.toLocaleString()}, HRA: ₹${d.hra.toLocaleString()}, 80D: ₹${d.c80d.toLocaleString()}. ${errSummary}`;
  const prompts={
    scrutiny:`You are an expert Indian CA. Based on this tax profile, explain in 3–4 plain English sentences why the scrutiny risk score is what it is, what specific triggers exist, and the single most important action to reduce risk. ${ctx}`,
    deductions:`You are an expert Indian CA. In 3–4 plain English sentences, explain this person's top 2 unused deduction opportunities with specific rupee amounts and the section numbers. ${ctx}`,
    mismatch:`You are an expert Indian CA. In 3–4 plain English sentences, explain what happens if a TDS mismatch is ignored — the timeline, penalties (cite section numbers), and the single easiest fix. ${ctx}`
  };
  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:400,messages:[{role:'user',content:prompts[topic]||prompts.deductions}]})});
    const data=await res.json();
    if(data.content?.[0]?.text){el.innerHTML=data.content[0].text.replace(/(₹[\d,]+(?:\s?(?:lakh|crore|L|Cr))?|Section \d+[\w()\d]*|80[A-Z\d()]+|Old Regime|New Regime)/gi,'<span class="hl">$1</span>');}
    else el.textContent='Could not generate insight at this time.';
  }catch(e){el.textContent='Error generating insight. Please try again shortly.';}
  if(btns)btns.style.opacity='1';
}
// Legacy stub — no longer used
function fetchAI(){fetchAIQuestion('deductions');}

function downloadReport(){
  const name=document.getElementById('name').value||'Tax';
  const win=window._o.tax<=window._n.tax?'Old':'New';
  const sav=Math.abs(window._o.tax-window._n.tax),d=window._o.deds;
  const tds=window._i.tds_deducted,best=Math.min(window._o.tax,window._n.tax),bal=tds-best;
  const errorHTML=window._errors.length>0?`<div style="background:#fdf0ee;border:1.5px solid #c0392b;border-radius:12px;padding:20px;margin-bottom:20px;">
    <h2 style="color:#c0392b;margin-bottom:12px;font-size:14px;">⚠️ ${window._errors.length} Issue(s) Found in Your Documents</h2>
    ${window._errors.map(e=>`<div style="margin-bottom:10px;padding:12px;background:white;border-radius:8px;">
      <strong>${e.icon} ${e.title}</strong><br>
      <span style="font-size:12px;color:#555">${e.desc}</span><br>
      <span style="font-size:11px;font-weight:700;color:#c0392b;margin-top:4px;display:block">${e.action}</span>
    </div>`).join('')}
  </div>`:''  ;
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>TaxSmart — ${name}</title>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>body{font-family:'Sora',sans-serif;max-width:720px;margin:0 auto;padding:40px 32px;color:#1a1814;font-size:14px;}
.hdr{background:${win==='New'?'#1a472a':'#7a5010'};color:#fff;padding:30px;border-radius:16px;margin-bottom:24px;}
.hdr h1{font-size:28px;margin-bottom:6px;}.hdr .sub{opacity:.7;font-size:12px;margin-bottom:14px;}
.verdict{background:rgba(255,255,255,.15);padding:9px 16px;border-radius:8px;font-size:16px;font-weight:700;display:inline-block;margin-bottom:14px;}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
.stat{background:rgba(255,255,255,.12);border-radius:9px;padding:11px 13px;}
.sl{font-size:9px;opacity:.6;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px;}
.sv{font-size:17px;font-weight:600;}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:20px 0;}
.box{border:2px solid #e2ddd6;border-radius:12px;padding:18px;}
.box.w{border-color:${win==='New'?'#1a472a':'#7a5010'};background:${win==='New'?'#e8f5ec':'#fdf3e3'};}
.box label{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#8c8880;display:block;margin-bottom:7px;}
.box .tx{font-family:'JetBrains Mono',monospace;font-size:24px;}
.box.w .tx{color:${win==='New'?'#1a472a':'#7a5010'};}
h2{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8c8880;border-bottom:1px solid #e2ddd6;padding-bottom:7px;margin:20px 0 14px;}
table{width:100%;border-collapse:collapse;font-size:12px;}
th{text-align:left;padding:7px 0;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#8c8880;border-bottom:1.5px solid #e2ddd6;}
th:last-child,th:nth-child(2){text-align:right;}
td{padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);vertical-align:top;}
td:last-child,td:nth-child(2){text-align:right;font-family:'JetBrains Mono',monospace;font-size:11px;}
.footer{margin-top:36px;font-size:10px;color:#8c8880;text-align:center;border-top:1px solid #e2ddd6;padding-top:16px;line-height:1.8;}
</style></head><body>
<div class="hdr">
  <div class="sub">TaxSmart India · FY 2025–26 · ${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>
  <h1>${name}'s Tax Report</h1>
  <div class="verdict">✓ ${win} Regime — Saves ${fmt(sav)}</div>
  <div class="stats">
    <div class="stat"><div class="sl">Tax Payable</div><div class="sv">${fmt(best)}</div></div>
    <div class="stat"><div class="sl">Effective Rate</div><div class="sv">${pct(best,window._i.gross)}</div></div>
    <div class="stat"><div class="sl">${bal>=0?'Refund':'Tax Due'}</div><div class="sv">${fmt(Math.abs(bal))}</div></div>
  </div>
</div>
${errorHTML}
<div class="grid">
  <div class="box ${win==='Old'?'w':''}"><label>Old Regime</label><div class="tx">${fmt(window._o.tax)}</div><div style="font-size:11px;color:#8c8880;margin-top:3px">Effective: ${pct(window._o.tax,window._i.gross)}</div>${win==='Old'?'<div style="font-size:10px;font-weight:800;margin-top:7px;color:#7a5010">✓ RECOMMENDED</div>':''}</div>
  <div class="box ${win==='New'?'w':''}"><label>New Regime</label><div class="tx">${fmt(window._n.tax)}</div><div style="font-size:11px;color:#8c8880;margin-top:3px">Effective: ${pct(window._n.tax,window._i.gross)}</div>${win==='New'?'<div style="font-size:10px;font-weight:800;margin-top:7px;color:#1a472a">✓ RECOMMENDED</div>':''}</div>
</div>
<h2>Income & Tax Summary</h2>
<table><thead><tr><th>Particulars</th><th>Old Regime</th><th>New Regime</th></tr></thead><tbody>
<tr><td>Gross Income</td><td>${fmt(window._i.gross)}</td><td>${fmt(window._i.gross)}</td></tr>
<tr><td>Total Exemptions</td><td>${fmt(d.exempts)}</td><td>${fmt(75000)}</td></tr>
<tr><td>Chapter VI-A</td><td>${fmt(d.totalDed)}</td><td>₹0</td></tr>
<tr><td><strong>Taxable Income</strong></td><td><strong>${fmt(window._o.taxable)}</strong></td><td><strong>${fmt(window._n.taxable)}</strong></td></tr>
<tr><td><strong>Final Tax</strong></td><td><strong>${fmt(window._o.tax)}</strong></td><td><strong>${fmt(window._n.tax)}</strong></td></tr>
<tr><td>TDS Deducted</td><td>${fmt(tds)}</td><td>${fmt(tds)}</td></tr>
<tr><td><strong>${bal>=0?'Refund Due':'Balance Due'}</strong></td><td><strong style="color:${bal>=0?'#1a472a':'#c0392b'}">${fmt(Math.abs(window._o.tax-tds))}</strong></td><td><strong style="color:${bal>=0?'#1a472a':'#c0392b'}">${fmt(Math.abs(window._n.tax-tds))}</strong></td></tr>
</tbody></table>
<div class="footer">TaxSmart India · For planning purposes only · Consult a CA for actual filing<br>Based on Income Tax Act & Union Budget 2025 · Documents processed via Gemini API, never stored on our servers · DPDP Act 2023 compliant · No PAN or financial data retained</div>


</body></html>`;
  const blob=new Blob([html],{type:'text/html'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download=`TaxSmart_${name.replace(/\s+/g,'_')}_FY2025-26.html`;
  a.style.display='none';document.body.appendChild(a);a.click();
  setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},300);
}
// ═══════════════════════════════════════════════════════════════

// ── Window exports (required for HTML onclick= attributes with ES modules) ──
if(typeof buildComp!=="undefined") window.buildComp=buildComp;
if(typeof buildSlabViz!=="undefined") window.buildSlabViz=buildSlabViz;
if(typeof buildDeds!=="undefined") window.buildDeds=buildDeds;
if(typeof buildTips!=="undefined") window.buildTips=buildTips;
if(typeof buildInsight!=="undefined") window.buildInsight=buildInsight;
if(typeof downloadReport!=="undefined") window.downloadReport=downloadReport;
// window.buildITRPanel — not found in results.js, check definition
// window.buildRiskScore — not found in results.js, check definition
// window.buildInterestPanel — not found in results.js, check definition
// window.buildScheduleCG — not found in results.js, check definition
// window.buildHeroResult — not found in results.js, check definition
// window.buildWhatsNext — not found in results.js, check definition
if(typeof fetchAIQuestion!=="undefined") window.fetchAIQuestion=fetchAIQuestion;
if(typeof buildUtil!=="undefined") window.buildUtil=buildUtil;
// window.buildScheduleAL — not found in results.js, check definition
