// IT NOTICE RESPONSE GENERATOR — AI-drafted formal response
// Uses Anthropic API to generate a tailored response based on user's tax data
// ══════════════════════════════════════════════════════════════════════════════
let _selectedNoticeType = null;

function openNoticeModal(){
  document.getElementById('notice-modal').classList.add('open');
  document.getElementById('notice-output').style.display='none';
  document.getElementById('notice-loading').style.display='none';
  document.getElementById('notice-actions').style.display='none';
  _selectedNoticeType = null;
  document.querySelectorAll('.notice-type-btn').forEach(b=>b.classList.remove('sel'));
}
function closeNoticeModal(){
  document.getElementById('notice-modal').classList.remove('open');
}
function selNoticeType(type){
  _selectedNoticeType = type;
  document.querySelectorAll('.notice-type-btn').forEach(b=>b.classList.remove('sel'));
  document.getElementById('nb-'+type)?.classList.add('sel');
}

async function generateNoticeResponse(){
  if(!_selectedNoticeType){
    alert('Please select the type of notice you received.');
    return;
  }
  if(!window._o||!window._i){
    alert('No tax data available. Please complete the tax calculation first.');
    return;
  }

  const noticeLabels = {
    tds: 'TDS Mismatch (Form 26AS vs Filed ITR)',
    ais: 'AIS Income Discrepancy (Unreported Income)',
    verify: 'Verification Notice under Section 143(1)',
    deduction: 'Deduction Query (80C/80D/HRA proof required)'
  };

  // Build tax data summary using correct window._i field names
  const win = window._o.tax <= window._n.tax ? 'New' : 'Old';
  const bestTax = Math.min(window._o.tax, window._n.tax);
  const f16tds = (window._f16 && window._f16.tds_deducted_form16) || 0;
  const as26tds = (window._as26 && window._as26.total_tds_26as) || 0;
  const aisSalary = (window._ais && window._ais.salary_ais) || 0;
  const errList = window._errors?.map(e=>e.title).join(', ') || 'None detected';

  const prompt = `You are a senior Indian Chartered Accountant drafting a formal response to an Income Tax Department notice on behalf of a taxpayer.

NOTICE TYPE: ${noticeLabels[_selectedNoticeType]}

TAXPAYER'S TAX DATA (FY 2025-26):
- Gross Salary: ₹${(window._i.gross||0).toLocaleString('en-IN')}
- TDS per Form 16: ₹${f16tds.toLocaleString('en-IN')}
- TDS per 26AS: ₹${as26tds.toLocaleString('en-IN')}
- Salary per AIS: ₹${aisSalary.toLocaleString('en-IN')}
- Final Tax Payable (${win} Regime): ₹${bestTax.toLocaleString('en-IN')}
- TDS Already Deducted: ₹${(window._i.tds_deducted||0).toLocaleString('en-IN')}
- Discrepancies detected: ${errList}

Write a professional, formal response letter to the Income Tax Officer. Include:
1. Formal salutation and reference to the notice type
2. Clear explanation of the taxpayer's position with specific numbers
3. Explanation of any discrepancies and their legitimate cause
4. List of documents the taxpayer can provide
5. Respectful closing

Keep it factual, professional, and under 350 words. Use Indian English. Include placeholders [ASSESSMENT YEAR], [PAN], [NAME], [DATE] for the taxpayer to fill in.`;

  // Show loading
  document.getElementById('notice-gen-btn').style.display='none';
  document.getElementById('notice-loading').style.display='block';
  document.getElementById('notice-output').style.display='none';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || 'Could not generate response. Please try again.';

    document.getElementById('notice-output').textContent = text;
    document.getElementById('notice-output').style.display='block';
    document.getElementById('notice-actions').style.display='flex';
    window._noticeDraftText = text;
  } catch(e){
    document.getElementById('notice-output').textContent = 'Error generating response: ' + e.message + '\n\nPlease try again or consult a CA directly.';
    document.getElementById('notice-output').style.display='block';
  } finally {
    document.getElementById('notice-loading').style.display='none';
    document.getElementById('notice-gen-btn').style.display='block';
  }
}

function copyNoticeText(){
  if(window._noticeDraftText){
    navigator.clipboard.writeText(window._noticeDraftText)
      .then(()=>{ const b=document.querySelector('#notice-actions .modal-btn'); const orig=b.textContent; b.textContent='✓ Copied!'; setTimeout(()=>b.textContent=orig,2000); })
      .catch(()=>alert('Copy failed — select text manually'));
  }
}

function downloadNoticeDraft(){
  if(!window._noticeDraftText) return;
  const blob = new Blob([window._noticeDraftText], {type:'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'TaxSmart_IT_Notice_Response_Draft.txt';
  a.style.display='none';document.body.appendChild(a);a.click();
  setTimeout(()=>document.body.removeChild(a),300);
}

function buildAuditTrail(){
  const panel=document.getElementById('audit-trail');
  const items=document.getElementById('audit-trail-items');
  if(!panel||!items)return;
  if(window._auditTrail.length===0){panel.style.display='none';return;}
  panel.style.display='block';
  items.innerHTML=window._auditTrail.map((e,i)=>{
    const t=e.time;
    const timeStr=t.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
    const vNum=`v${i+1}`;
    return`<div style="display:flex;align-items:flex-start;gap:12px;padding:10px 12px;background:var(--bg);border-radius:10px;">
      <span style="font-size:18px;flex-shrink:0;">${e.icon}</span>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="background:var(--accent);color:#fff;font-size:9px;font-weight:800;padding:2px 7px;border-radius:100px;letter-spacing:.5px;">${vNum}</span>
          <span style="font-size:13px;font-weight:700;color:var(--ink);">${e.event}</span>
          <span style="font-size:11px;color:var(--muted);margin-left:auto;">${timeStr}</span>
        </div>
        ${e.detail?`<div style="font-size:11px;color:var(--ink2);margin-top:3px;">${e.detail}</div>`:''}
      </div>
    </div>`;
  }).join('');
}

function buildWhatsNext(){
  const panel=document.getElementById('whats-next');
  const list=document.getElementById('next-steps-list');
  if(!panel||!list||!window._o||!window._n||!window._i) return;

  const win=window._o.tax<window._n.tax?'old':'new';
  const bestTax=Math.min(window._o.tax,window._n.tax);
  const tds=window._i.tds_deducted||0;
  const bal=tds-bestTax;
  const steps=[];

  // Step 1: Always — regime decision
  steps.push({
    num:'1',
    color:'#2d6a4f',
    bg:'#e8f5ec',
    title:`Confirm ${win==='new'?'New':'Old'} Regime with your employer`,
    desc:`Submit a declaration to your HR/payroll before April 1. Once declared, it applies for the whole year.`,
    cta:null
  });

  // Step 2: Refund or pay
  if(bal>0){
    steps.push({
      num:'2',color:'#1a6fa3',bg:'#e3f2fd',
      title:`File ITR to claim ₹${fmt(bal)} refund`,
      desc:`File your ITR-1 or ITR-2 before July 31, 2025. Refund is deposited directly to your bank within 2-4 weeks.`,
      cta:{label:'→ File on Income Tax Portal',url:'https://eportal.incometax.gov.in'}
    });
  } else if(bal<0){
    steps.push({
      num:'2',color:'#c0392b',bg:'#fdf0ee',
      title:`Pay ₹${fmt(Math.abs(bal))} Self-Assessment Tax now`,
      desc:`Pay via Challan 280 before filing your ITR to avoid interest under Sections 234B and 234C.`,
      cta:{label:'→ Pay via Challan 280',url:'https://onlineservices.tin.egov-nsdl.com/etaxnew/tdsnontds.jsp'}
    });
  }

  // Step 3: Invest to save more (if old regime and deduction room exists)
  if(win==='old'&&window._o.deds){
    const unused=Math.max(0,150000-(window._o.deds.c80c||0));
    if(unused>5000){
      steps.push({
        num:'3',color:'#7b5ea7',bg:'#f3eeff',
        title:`Invest ₹${fmt(unused)} more to max your 80C`,
        desc:`You have ₹${fmt(unused)} of unused 80C room. PPF, ELSS mutual funds, or NPS contributions qualify.`,
        cta:null
      });
    }
  }

  // Step 4: Download report
  steps.push({
    num:steps.length+1+'',color:'#555',bg:'#f5f5f5',
    title:'Download this report for your CA or records',
    desc:`Save a copy for reference when filing. Your CA may need the regime recommendation and deduction breakdown.`,
    cta:{label:'⬇ Download Report',action:'downloadReport()'}
  });

  list.innerHTML=steps.map(s=>`
    <div style="display:flex;gap:12px;align-items:flex-start;padding:12px 14px;background:${s.bg};border-radius:10px;">
      <div style="width:24px;height:24px;border-radius:50%;background:${s.color};color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${s.num}</div>
      <div style="flex:1;">
        <div style="font-weight:700;font-size:13px;color:${s.color};margin-bottom:2px;">${s.title}</div>
        <div style="font-size:12px;color:var(--ink2);line-height:1.5;">${s.desc}</div>
        ${s.cta?s.cta.url?`<a href="${s.cta.url}" target="_blank" rel="noopener" style="display:inline-block;margin-top:6px;font-size:11.5px;font-weight:700;color:${s.color};text-decoration:none;">${s.cta.label}</a>`:`<button onclick="${s.cta.action}" style="margin-top:6px;background:${s.color};color:#fff;border:none;border-radius:6px;padding:5px 14px;font-size:11.5px;font-weight:700;cursor:pointer;">${s.cta.label}</button>`:''}
      </div>
    </div>`).join('');

  // Append edge-case warnings if any complex scenarios detected
  const edgeFlags = detectEdgeCases();
  if(edgeFlags.length > 0){
    const flagDiv = document.createElement('div');
    flagDiv.style.cssText = 'margin-top:10px;padding-top:10px;border-top:1px solid var(--border);';
    flagDiv.innerHTML = '<div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);font-weight:700;margin-bottom:8px;">⚠️ Complex Scenarios Detected</div>' +
      edgeFlags.map(f=>`<div style="display:flex;gap:8px;align-items:flex-start;padding:8px 10px;border-radius:8px;background:${f.sev==='red'?'#fdf0ee':f.sev==='amber'?'#fef9ec':'#e3f2fd'};margin-bottom:6px;font-size:12px;color:#333;line-height:1.5;"><span style="flex-shrink:0;">${f.icon}</span><span>${f.msg}</span></div>`).join('');
    list.appendChild(flagDiv);
  }

  panel.style.display='';
}

// ── Simple / Advanced mode toggle ────────────────────────────────────────────
// Simple: show only hero card + what's next. 80% of users just want tax + regime.
// Advanced: everything expanded via accordions.
let currentMode = 'simple';

function setMode(mode) {
  currentMode = mode;
  document.getElementById('mode-simple').classList.toggle('active', mode === 'simple');
  document.getElementById('mode-advanced').classList.toggle('active', mode === 'advanced');

  // Advanced panels — only show in advanced mode
  const advancedPanels = document.querySelectorAll('.accord, .insight-box, .sim-card, #recon-section');
  advancedPanels.forEach(el => {
    if (el.id === 'accord-errors' || el.id === 'accord-risk') {
      // Always show these if they have content — critical info
      const hasContent = el.style.display !== 'none';
      el.style.display = hasContent ? '' : 'none';
    } else {
      el.style.display = mode === 'advanced' ? '' : 'none';
    }
  });

  // What's next — always visible
  const wn = document.getElementById('whats-next');
  if (wn) wn.style.display = '';

  // Action row — always visible
  const ar = document.querySelector('.act-row');
  if (ar) ar.style.display = '';
}

// ── Accordion toggle ─────────────────────────────────────────────────────────
function toggleAccord(hdr){
  hdr.classList.toggle('open');
  const body=hdr.nextElementSibling;
  body.classList.toggle('open');
}
function toggleAccordById(id){
  const el=document.getElementById(id);
  if(!el)return;
  const hdr=el.querySelector('.accord-hdr');
  if(hdr)toggleAccord(hdr);
}

// ── Hero Result panel ─────────────────────────────────────────────────────────
function buildHeroResult(){
  const panel=document.getElementById('hero-result');
  if(!panel||!window._o||!window._n||!window._i) return;

  const win=window._o.tax<window._n.tax?'old':'new';
  const bestTax=Math.min(window._o.tax,window._n.tax);
  const sav=Math.abs(window._o.tax-window._n.tax);
  const tds=window._i.tds_deducted||0;
  const bal=tds-bestTax;
  const eff=window._i.gross>0?((bestTax/window._i.gross)*100).toFixed(1):'0';

  // Generate 3 actionable tips based on user's actual situation
  const tips=[];

  // Tip 1: Refund/due status
  if(bal>0){
    tips.push({ico:'💚',text:`You have a <strong>refund of ${fmt(bal)}</strong>. File ITR before July 31 to claim it — deposited directly to your bank.`});
  } else if(bal<0){
    tips.push({ico:'🔴',text:`<strong>${fmt(Math.abs(bal))} additional tax due</strong>. Pay via Challan 280 on incometax.gov.in before filing to avoid interest under Sec 234B.`});
  } else {
    tips.push({ico:'✅',text:`TDS exactly matches tax liability. No refund or extra payment needed.`});
  }

  // Tip 2: Regime switch opportunity
  if(sav>2000){
    const loser=win==='new'?'Old':'New';
    tips.push({ico:'💡',text:`Switch to <strong>${win==='new'?'New':'Old'} Regime saves ₹${fmt(sav)}</strong>. ${loser} Regime costs more for your income profile.`});
  } else {
    tips.push({ico:'⚖️',text:`Both regimes are almost identical for you (diff: ${fmt(sav)}). Stick with ${win==='new'?'New':'Old'} Regime.`});
  }

  // Tip 3: Biggest deduction opportunity
  const d=win==='old'?window._o.deds:null;
  if(d){
    const unused80c=Math.max(0,150000-d.c80c);
    const unusedNps=Math.max(0,50000-d.cnps);
    if(unused80c>10000) tips.push({ico:'📈',text:`You have <strong>₹${fmt(unused80c)} unused 80C room</strong>. Invest in PPF, ELSS or NPS to reduce taxable income further.`});
    else if(unusedNps>10000) tips.push({ico:'📈',text:`<strong>₹${fmt(unusedNps)} unused NPS 80CCD(1B) room</strong>. Extra ₹50K deduction separate from 80C.`});
    else tips.push({ico:'✅',text:`Your deductions are well-optimized for the Old Regime.`});
  } else {
    // New regime: tip on employer NPS
    const cenps=window._n&&window._n.deds?window._n.deds.cenps:0;
    if((window._i.employer_nps||0)<(window._i.basic*0.05)) tips.push({ico:'💡',text:`Ask HR to increase <strong>Employer NPS contribution</strong> (Sec 80CCD(2)) — it's deductible in New Regime and reduces your taxable salary.`});
    else tips.push({ico:'✅',text:`New Regime is optimized for your income — no Chapter VI-A deductions needed.`});
  }

  const regimeLabel=win==='new'?'New Regime':'Old Regime';

  // Emotional state — determines headline tone
  // "You're All Good" when no errors, refund coming, optimal regime
  const hasErrors = window._errors && window._errors.filter(e=>e.severity==='red').length > 0;
  const bigRefund = bal > 5000;
  const bigSaving = sav > 5000;

  let emotionalHeadline, emotionalSub, emotionalColor;
  if(!hasErrors && bigRefund && !bal<0){
    emotionalHeadline = `🎉 You're getting ₹${fmt(bal)} back!`;
    emotionalSub = `File ITR before July 31 and the refund goes straight to your bank.`;
    emotionalColor = '#2d6a4f';
  } else if(!hasErrors && bestTax === 0){
    emotionalHeadline = `✅ Zero Tax! You're fully covered.`;
    emotionalSub = `Your TDS covers everything. Just file your ITR to claim your refund.`;
    emotionalColor = '#2d6a4f';
  } else if(!hasErrors && bal >= -1000 && bal <= 1000){
    emotionalHeadline = `✓ You're all good — taxes are settled.`;
    emotionalSub = `TDS matches your liability. No surprise payments needed.`;
    emotionalColor = '#2d6a4f';
  } else if(hasErrors){
    emotionalHeadline = `⚠️ Action needed before filing`;
    emotionalSub = `A few issues found in your documents. Review the alerts below.`;
    emotionalColor = '#c17f24';
  } else if(bal < -5000){
    emotionalHeadline = `Tax due: ₹${fmt(Math.abs(bal))}`;
    emotionalSub = `Pay via Challan 280 before filing to avoid interest charges.`;
    emotionalColor = '#c0392b';
  } else {
    emotionalHeadline = `✓ ${regimeLabel} recommended`;
    emotionalSub = bigSaving ? `Saves you ₹${fmt(sav)} vs the other regime.` : `Both regimes are similar for your income.`;
    emotionalColor = '#2d6a4f';
  }

  panel.innerHTML=`
    <div class="mb14">
      <div style="font-size:19px;font-weight:800;color:${emotionalColor};margin-bottom:4px;line-height:1.3;">${emotionalHeadline}</div>
      <div style="font-size:13px;color:var(--muted);line-height:1.5;">${emotionalSub}</div>
    </div>
    <div class="hero-winner mb14">
      <div class="hero-regime-badge">✓ ${regimeLabel}</div>
      <div class="hero-saves">${sav>1000?`Saves ₹${fmt(sav)} vs ${win==='new'?'Old':'New'} Regime`:'Both regimes are close'}</div>
    </div>
    <div class="hero-numbers">
      <div class="hero-num">
        <div class="hn-val">${fmt(bestTax)}</div>
        <div class="hn-lbl">Tax Payable</div>
      </div>
      <div class="hero-num">
        <div class="hn-val">${eff}%</div>
        <div class="hn-lbl">Effective Rate</div>
      </div>
      <div class="hero-num ${bal>=0?'refund':'due'}">
        <div class="hn-val">${bal>=0?'+':'-'}${fmt(Math.abs(bal))}</div>
        <div class="hn-lbl">${bal>=0?'🟢 Refund':'🔴 Tax Due'}</div>
      </div>
    </div>
    <div class="hero-tips">
      ${tips.map(t=>`<div class="hero-tip"><span class="ht-ico">${t.ico}</span><span>${t.text}</span></div>`).join('')}
    </div>`;

  // Show/hide accordions based on content
  const riskPanel=document.getElementById('accord-risk');
  const riskContent=document.getElementById('risk-score-panel');
  if(riskPanel&&riskContent&&riskContent.innerHTML) riskPanel.style.display='';

  // Show errors accordion if there are errors
  const errPanel=document.getElementById('accord-errors');
  const errContent=document.getElementById('error-panel');
  if(errPanel&&errContent&&errContent.innerHTML.trim()) errPanel.style.display='';

  // Show ITR accordion
  const itrPanel=document.getElementById('accord-itr');
  if(itrPanel) itrPanel.style.display='';

  // Show interest accordion if has content
  const intPanel=document.getElementById('accord-interest');
  const intContent=document.getElementById('interest-panel');
  if(intPanel&&intContent&&intContent.innerHTML.trim()) intPanel.style.display='';

  // Build primary CTA
  buildPrimaryCTA(bal, bestTax, win);
}

// ── Primary CTA builder — ONE clear action after results ─────────────────────
// The single most important thing for this user to do next.
// No option paralysis — one big button, one supporting action.
function buildPrimaryCTA(bal, bestTax, win){
  const bar = document.getElementById('primary-cta-bar');
  if(!bar) return;

  let primary, primaryAction, secondary, secondaryAction, bg;

  if(bal > 1000){
    // Refund coming — file ITR is the clear win
    primary = `📄 File ITR-1 to claim ₹${fmt(bal)} refund`;
    primaryAction = "window.open('https://www.incometax.gov.in/iec/foportal','_blank')";
    secondary = '⬇ Download your tax summary first';
    secondaryAction = 'downloadReport()';
    bg = 'linear-gradient(135deg,#2d6a4f,#40916c)';
  } else if(bal < -1000){
    // Tax due — pay is the clear action
    primary = `💳 Pay ₹${fmt(Math.abs(bal))} via Challan 280`;
    primaryAction = "window.open('https://onlineservices.tin.egov-nsdl.com/etaxnew/tdsnontds.jsp','_blank')";
    secondary = '⬇ Download summary to share with CA';
    secondaryAction = 'downloadReport()';
    bg = 'linear-gradient(135deg,#c0392b,#e74c3c)';
  } else if(bestTax === 0){
    // Zero tax — just file
    primary = '📄 File ITR-1 — Zero Tax, Quick Filing';
    primaryAction = "window.open('https://www.incometax.gov.in/iec/foportal','_blank')";
    secondary = '📧 Save report & remind next year';
    secondaryAction = 'openRetentionModal()';
    bg = 'linear-gradient(135deg,#2d6a4f,#40916c)';
  } else {
    // Neutral — download is a low-commitment primary
    primary = '⬇ Download your tax summary';
    primaryAction = 'downloadReport()';
    secondary = '📄 Export ITR-1 JSON for auto-fill';
    secondaryAction = 'exportITRJson()';
    bg = 'linear-gradient(135deg,#495057,#343a40)';
  }

  bar.style.display = '';
  bar.innerHTML = `
    <div style="background:${bg};border-radius:14px;padding:16px 18px;">
      <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.7);font-weight:700;margin-bottom:10px;">YOUR NEXT STEP</div>
      <button onclick="${primaryAction}" style="width:100%;padding:14px;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.4);border-radius:10px;color:#fff;font-size:15px;font-weight:800;cursor:pointer;margin-bottom:8px;transition:all .2s;text-align:left;">
        ${primary}
      </button>
      <button onclick="${secondaryAction}" style="width:100%;padding:10px;background:transparent;border:1.5px solid rgba(255,255,255,.25);border-radius:10px;color:rgba(255,255,255,.85);font-size:13px;font-weight:600;cursor:pointer;text-align:left;">
        ${secondary}
      </button>
    </div>`;
}

// ── Inline cap warnings ──────────────────────────────────────────────────────
function capWarn(inputId, warnId, cap, msg){
  const inp = document.getElementById(inputId);
  const warn = document.getElementById(warnId);
  if(!inp || !warn) return;
  const val = parseFloat(inp.value.replace(/,/g,'')) || 0;
  if(val > cap){
    inp.classList.add('over-cap');
    warn.textContent = '⚠ ' + msg;
    warn.classList.add('show');
  } else {
    inp.classList.remove('over-cap');
    warn.classList.remove('show');
  }
}
function capWarnPct(inputId, warnId, basicFieldId, msg){
  const inp = document.getElementById(inputId);
  const warn = document.getElementById(warnId);
  const basicEl = document.getElementById(basicFieldId);
  if(!inp || !warn) return;
  const val = parseFloat(inp.value.replace(/,/g,'')) || 0;
  const basic = basicEl ? (parseFloat(basicEl.value)||0) : 0;
  const cap = basic * 0.10;
  if(val > cap && cap > 0){
    inp.classList.add('over-cap');
    warn.textContent = '⚠ ' + msg + ' (limit: ₹' + Math.round(cap).toLocaleString('en-IN') + ')';
    warn.classList.add('show');
  } else {
    inp.classList.remove('over-cap');
    warn.classList.remove('show');
  }
}

// ── Multi-employer live summary ──────────────────────────────────────────────
function updateEmpSummary(){
  const e1=parseInt(document.getElementById('salary_emp1')?.value)||0;
  const e2=parseInt(document.getElementById('salary_emp2')?.value)||0;
  const total=e1+e2;
  const s1=document.getElementById('emp1-show');
  const s2=document.getElementById('emp2-show');
  const st=document.getElementById('emp-total-show');
  if(s1)s1.textContent=fmt(e1);
  if(s2)s2.textContent=fmt(e2);
  if(st){
    st.textContent=fmt(total);
    st.style.color=total>0?'var(--accent)':'var(--muted)';
  }
}
// Hook into the fa() oninput calls for emp salary fields
document.addEventListener('input',function(e){
  if(e.target.id==='salary_emp1_d'||e.target.id==='salary_emp2_d') updateEmpSummary();
});


// ══════════════════════════════════════════════════════════════════════

// ── Window exports (required for HTML onclick= attributes with ES modules) ──
if(typeof openNoticeModal!=="undefined") window.openNoticeModal=openNoticeModal;
if(typeof closeNoticeModal!=="undefined") window.closeNoticeModal=closeNoticeModal;
if(typeof selNoticeType!=="undefined") window.selNoticeType=selNoticeType;
if(typeof setMode!=="undefined") window.setMode=setMode;
if(typeof generateNoticeResponse!=="undefined") window.generateNoticeResponse=generateNoticeResponse;
if(typeof copyNoticeText!=="undefined") window.copyNoticeText=copyNoticeText;
if(typeof downloadNoticeDraft!=="undefined") window.downloadNoticeDraft=downloadNoticeDraft;
if(typeof toggleAccord!=="undefined") window.toggleAccord=toggleAccord;
if(typeof toggleAccordById!=="undefined") window.toggleAccordById=toggleAccordById;
