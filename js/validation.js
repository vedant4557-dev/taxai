// VALIDATION — runs only at Calculate time, not on step nav
// Hard blocks: gross=0, basic>gross, age invalid
// Soft fixes: auto-cap 80C, prof_tax silently
// ═══════════════════════════════════════════════════════════════

function validateAndCalculate() {
  // ── collect raw values ──
  const gross  = window.gv('gross');
  const basic  = window.gv('basic');
  const age    = document.getElementById('age').value.trim();
  const ageNum = parseInt(age);

  const hardErrors = [];

  // Hard block 1: no gross salary
  if (gross <= 0) {
    hardErrors.push('Gross annual salary is required. Please go back to Step 2 and enter it.');
  }

  // Hard block 2: basic > gross
  if (gross > 0 && basic > 0 && basic > gross) {
    hardErrors.push('Basic salary (₹' + window.toIN(basic) + ') cannot be more than Gross salary (₹' + window.toIN(gross) + '). Please fix Step 2.');
  }

  // Hard block 3: age is not a number
  if (age && (isNaN(ageNum) || ageNum < 1 || ageNum > 120)) {
    hardErrors.push('Age "' + age + '" doesn\'t look right. Please enter a number between 1 and 120 in Step 1.');
  }

  // Hard block 4: HRA > basic (impossible in real payroll)
  const hra_rcvd = window.gv('hra_received');
  if (basic > 0 && hra_rcvd > gross) {
    hardErrors.push('HRA received (₹' + window.toIN(hra_rcvd) + ') cannot exceed Gross salary. Please check Step 2.');
  }

  // Soft warnings (shown as visible notices, don't block calculation)
  const softWarns = [];
  const sec80c_raw = window.gv('sec80c');
  const nps_raw = window.gv('nps');
  const sec80d_self_raw = window.gv('sec80d_self');
  const sec80d_par_raw = window.gv('sec80d_parents');
  const hl_int_raw = window.gv('home_loan_interest');
  const enps_raw = window.gv('employer_nps');

  if (sec80c_raw > 150000) softWarns.push('80C: ₹' + window.toIN(sec80c_raw) + ' entered — capped at ₹1,50,000 in calculation');
  if (nps_raw > 50000) softWarns.push('NPS 80CCD(1B): ₹' + window.toIN(nps_raw) + ' entered — capped at ₹50,000');
  if (sec80d_self_raw > 50000) softWarns.push('80D (self): ₹' + window.toIN(sec80d_self_raw) + ' entered — max ₹25,000 (₹50,000 for seniors)');
  if (sec80d_par_raw > 50000) softWarns.push('80D (parents): ₹' + window.toIN(sec80d_par_raw) + ' entered — max ₹50,000');
  if (hl_int_raw > 200000) softWarns.push('Home loan interest: ₹' + window.toIN(hl_int_raw) + ' entered — capped at ₹2,00,000 for self-occupied');
  if (basic > 0 && enps_raw > basic * 0.10) softWarns.push('Employer NPS: ₹' + window.toIN(enps_raw) + ' entered — capped at 10% of Basic (₹' + window.toIN(Math.round(basic*0.10)) + ')');

  // Show soft warnings as a non-blocking notice
  let swBox = document.getElementById('soft-warn-box');
  if (softWarns.length > 0) {
    if (!swBox) {
      swBox = document.createElement('div');
      swBox.id = 'soft-warn-box';
      swBox.style.cssText = 'background:#fdf3e3;border:1.5px solid #c17f24;border-radius:10px;padding:14px 18px;margin-bottom:16px;font-size:12.5px;color:#7a4f08;line-height:1.7;';
      const navRow = document.querySelector('#step-6 .nav-row');
      if (navRow) navRow.parentNode.insertBefore(swBox, navRow);
    }
    swBox.innerHTML = '<strong>📋 Limits applied automatically:</strong><ul style="margin:6px 0 0 16px">' +
      softWarns.map(w => '<li>' + w + '</li>').join('') +
      '</ul><div style="margin-top:6px;font-size:11.5px;opacity:.8;">Your result is still correct — we apply the legal caps for you.</div>';
  } else {
    if (swBox) swBox.remove();
  }

  if (hardErrors.length > 0) {
    // Show a clean error above the calculate button
    let box = document.getElementById('calc-err-box');
    if (!box) {
      box = document.createElement('div');
      box.id = 'calc-err-box';
      box.style.cssText = 'background:#fdf0ee;border:1.5px solid #c0392b;border-radius:10px;padding:14px 18px;margin-bottom:16px;font-size:13px;color:#c0392b;line-height:1.6;';
      const calcBtn = document.getElementById('calc-btn') || document.querySelector('[onclick*="calculate"]');
      if (calcBtn) calcBtn.parentNode.insertBefore(box, calcBtn);
    }
    box.innerHTML = '<strong>⚠ Please fix before calculating:</strong><ul style="margin:6px 0 0 16px">' + hardErrors.map(e => '<li>' + e + '</li>').join('') + '</ul>';
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return; // stop — don't calculate
  }

  // ── Soft auto-fixes (silent, no friction) ──
  // These are just clamped during compOld/compNew anyway, but let's also
  // silently clamp the hidden inputs so displayed values stay consistent
  const profTax = window.gv('prof_tax');
  if (profTax > 2500) {
    document.getElementById('prof_tax').value = 2500;
  }

  // Clear any previous error box
  const box = document.getElementById('calc-err-box');
  if (box) box.remove();

  // All good — run the real calculate
  window.calculate();
}

// ── Tax Risk Score ───────────────────────────────────────────────────────────
function buildRiskScore(){
  const panel=document.getElementById('risk-score-panel');
  if(!panel||!window._i) return;

  const flags=[];
  let score=0;

  // ── Flag 1: TDS Mismatch (Form 16 vs 26AS)
  const f16tds=window._f16&&window._f16.tds_deducted_form16||0;
  const as26tds=window._as26&&window._as26.total_tds_26as||0;
  if(f16tds>0&&as26tds>0){
    const diff=Math.abs(f16tds-as26tds);
    if(diff>5000){
      score+=3;
      flags.push({level:'red',icon:'🔴',text:`TDS mismatch: Form 16 shows ${window.fmt(f16tds)}, 26AS shows ${window.fmt(as26tds)} (diff: ${window.fmt(diff)}). IT Dept computers auto-detect this.`});
    } else if(diff>1000){
      score+=1;
      flags.push({level:'amber',icon:'🟡',text:`Minor TDS difference of ${window.fmt(diff)} between Form 16 and 26AS. Usually fine but worth checking.`});
    }
  }

  // ── Flag 2: AIS income not declared in ITR
  const aisInt=window._ais&&window._ais.interest_income_ais||0;
  const declaredInt=window._i.interest_income||0;
  if(aisInt>0&&declaredInt<aisInt*0.7){
    score+=3;
    flags.push({level:'red',icon:'🔴',text:`AIS shows interest income of ${window.fmt(aisInt)} but you've declared only ${window.fmt(declaredInt)}. IT Dept gets AIS from all banks — undeclared interest is a common scrutiny trigger.`});
  }

  // ── Flag 3: Large 80G donations vs income
  const donations=window._i.sec80g||0;
  if(donations>0&&donations>window._i.gross*0.3){
    score+=2;
    flags.push({level:'red',icon:'🔴',text:`80G donations of ${window.fmt(donations)} are ${Math.round(donations/window._i.gross*100)}% of your gross income. Unusually large donation claims frequently trigger scrutiny.`});
  } else if(donations>100000){
    score+=1;
    flags.push({level:'amber',icon:'🟡',text:`80G donations of ${window.fmt(donations)} — keep donation receipts and Form 10BE ready in case of notice.`});
  }

  // ── Flag 4: HRA claimed but no rent paid
  const hraClaimed=window._o.deds&&window._o.deds.hra||0;
  if(hraClaimed>0&&(window._i.rent_paid||0)<1000){
    score+=2;
    flags.push({level:'red',icon:'🔴',text:`HRA exemption claimed (${window.fmt(hraClaimed)}) but rent paid appears to be ₹0. Landlord PAN required for rent >₹1L/year. False HRA claims are heavily scrutinised.`});
  }

  // ── Flag 5: High TDS but low declared salary (potential income suppression)
  if(as26tds>0&&window._i.gross>0&&as26tds>window._i.gross*0.35){
    score+=2;
    flags.push({level:'amber',icon:'🟡',text:`TDS (${window.fmt(as26tds)}) is very high relative to declared salary (${window.fmt(window._i.gross)}). Ensure all income sources are included.`});
  }

  // ── Flag 6: Crypto income declared (high scrutiny sector)
  if((window._i.crypto||0)>50000){
    score+=1;
    flags.push({level:'amber',icon:'🟡',text:`Crypto/VDA income of ${window.fmt(window._i.crypto)} declared. IT Dept receives data from exchanges — ensure you've declared ALL VDA transactions, not just profitable ones.`});
  }

  // ── Flag 7: Job change — under-deducted TDS
  if(window._i.changed_jobs==='yes'){
    const tdsEmp=(window._i.tds_emp1||0)+(window._i.tds_emp2||0);
    const totalTax=Math.min(window._o.tax,window._n.tax);
    if(tdsEmp>0&&tdsEmp<totalTax*0.7){
      score+=2;
      flags.push({level:'amber',icon:'🟡',text:`Job change detected with combined TDS of ${window.fmt(tdsEmp)} against total tax of ${window.fmt(totalTax)}. Large balance due increases scrutiny probability.`});
    }
  }

  // ── Flag 8: Online gaming income (new high-scrutiny category)
  if((window._i.gaming_income||0)>10000){
    score+=1;
    flags.push({level:'amber',icon:'🟡',text:`Online gaming/lottery income of ${window.fmt(window._i.gaming_income)} declared. IT Dept gets platform data under Sec 285BA — match your declared amount against your gaming app's tax statement.`});
  }

  // ── Positive signals (reduce perception of risk)
  if(flags.length===0){
    flags.push({level:'green',icon:'🟢',text:'No major risk flags found. Your return looks clean and consistent.'});
  }
  if(f16tds>0&&as26tds>0&&Math.abs(f16tds-as26tds)<500){
    flags.push({level:'green',icon:'🟢',text:'TDS matches perfectly between Form 16 and 26AS. ✓'});
  }
  if(window._i.tds_deducted>0&&Math.abs(window._i.tds_deducted-Math.min(window._o.tax,window._n.tax))<10000){
    flags.push({level:'green',icon:'🟢',text:'TDS closely matches tax liability — minimal chance of demand notice.'});
  }

  // ── Score contributions for transparency (Fix 4)
  const contributions=[];
  if(f16tds>0&&as26tds>0&&Math.abs(f16tds-as26tds)>5000)contributions.push({label:'TDS mismatch',pts:'+3',color:'#c0392b'});
  else if(f16tds>0&&as26tds>0&&Math.abs(f16tds-as26tds)>1000)contributions.push({label:'Minor TDS diff',pts:'+1',color:'#c17f24'});
  const aisInt2=window._ais&&window._ais.interest_income_ais||0;
  if(aisInt2>0&&(window._i.interest_income||0)<aisInt2*0.7)contributions.push({label:'Undeclared interest income',pts:'+3',color:'#c0392b'});
  const donations2=window._i.sec80g||0;
  if(donations2>window._i.gross*0.3)contributions.push({label:'High 80G donations',pts:'+2',color:'#c0392b'});
  else if(donations2>100000)contributions.push({label:'Large donations',pts:'+1',color:'#c17f24'});
  if((window._o.deds&&window._o.deds.hra||0)>0&&(window._i.rent_paid||0)<1000)contributions.push({label:'HRA without rent',pts:'+2',color:'#c0392b'});
  if((window._i.crypto||0)>50000)contributions.push({label:'Crypto income',pts:'+1',color:'#c17f24'});
  if(window._i.changed_jobs==='yes'){const te=(window._i.tds_emp1||0)+(window._i.tds_emp2||0);if(te>0&&te<Math.min(window._o.tax,window._n.tax)*0.7)contributions.push({label:'Job change TDS gap',pts:'+2',color:'#c17f24'});}
  if((window._i.gaming_income||0)>10000)contributions.push({label:'Gaming income',pts:'+1',color:'#c17f24'});
  if(f16tds>0&&as26tds>0&&Math.abs(f16tds-as26tds)<500)contributions.push({label:'TDS match',pts:'−1',color:'#2d6a4f'});
  if(window._i.tds_deducted>0&&Math.abs(window._i.tds_deducted-Math.min(window._o.tax,window._n.tax))<10000)contributions.push({label:'TDS matches liability',pts:'−1',color:'#2d6a4f'});
  const contribHtml=contributions.length>0
    ?'<div style="display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 4px;"><span style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;align-self:center;">Score factors:</span>'+contributions.map(c=>`<span style="background:${c.color}18;color:${c.color};border:1px solid ${c.color}40;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700;">${c.label} <strong>${c.pts}</strong></span>`).join('')+'</div>':'';
  score=Math.min(score,10);
  const label=score<=2?'Low Risk':score<=5?'Moderate Risk':'High Scrutiny Risk';
  const color=score<=2?'#2d6a4f':score<=5?'#c17f24':'#c0392b';
  const panelClass=score<=2?'low':score<=5?'med':'high';
  const fillPct=Math.round(score/10*100);
  const advice=score<=2
    ?'Your return looks clean. File with confidence.'
    :score<=5
    ?'A few items worth double-checking before filing.'
    :'Multiple risk factors detected — review each flag carefully and ensure documents are ready.';

  panel.innerHTML=`
    <div class="risk-panel ${panelClass}">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);margin-bottom:2px;">IT Scrutiny Risk Score</div>
          <div style="font-size:22px;font-weight:800;color:${color};">${score}/10 — ${label}</div>
        </div>
        <div style="font-size:28px;">${score<=2?'✅':score<=5?'⚠️':'🚨'}</div>
      </div>
      <div class="risk-meter"><div class="risk-meter-fill" style="width:${fillPct}%;background:${color};"></div></div>
      ${contribHtml}
      <div style="font-size:12.5px;color:var(--ink2);margin-bottom:14px;">${advice}</div>
      <div class="risk-flags">${flags.map(f=>`<div class="risk-flag ${f.level}"><span style="flex-shrink:0;font-size:15px;">${f.icon}</span><span>${f.text}</span></div>`).join('')}</div>
      <div style="margin-top:12px;font-size:11px;color:var(--muted);border-top:1px solid var(--border);padding-top:8px;">Score based on common IT Dept scrutiny triggers. This is a planning guide — not legal advice. Consult a CA if score is 6+.</div>
    </div>`;
}


// ── Schedule CG Preview — shown when capital gains are detected ──────────────
function buildScheduleCG(){
  const card=document.getElementById('schedule-cg-card');
  const panel=document.getElementById('schedule-cg-panel');
  if(!card||!panel||!window._i)return;
  const ltcg=window._i.ltcg||0, stcg=window._i.stcg||0;
  if(ltcg+stcg<1){card.style.display='none';return;}
  card.style.display='block';
  const ltcgExempt=Math.min(ltcg,125000);
  const ltcgTaxable=Math.max(0,ltcg-125000);
  const ltcgTax=Math.round(ltcgTaxable*0.125*1.04);
  const stcgTax=Math.round(stcg*0.20*1.04);
  const totalCgTax=ltcgTax+stcgTax;
  const ltcgRow=ltcg>0?`<tr><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);font-size:12px;">LTCG &mdash; Equity/MF (held 1yr+)<br><span style="font-size:10px;color:var(--muted);">Section 112A</span></td><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;">`+window.fmt(ltcg,true)+`</td><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--accent);">`+window.fmt(ltcgExempt,true)+`</td><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;">`+window.fmt(ltcgTaxable,true)+`</td><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);text-align:right;font-size:12px;">12.5%</td><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:var(--ink);">`+window.fmt(ltcgTax,true)+`</td></tr>`:'';
  const stcgRow=stcg>0?`<tr><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);font-size:12px;">STCG &mdash; Equity/MF (held &lt;1yr)<br><span style="font-size:10px;color:var(--muted);">Section 111A</span></td><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;">`+window.fmt(stcg,true)+`</td><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);">&#8212;</td><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;">`+window.fmt(stcg,true)+`</td><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);text-align:right;font-size:12px;">20%</td><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:var(--ink);">`+window.fmt(stcgTax,true)+`</td></tr>`:'';
  panel.innerHTML=`<div style="background:var(--bluel);border-radius:12px;padding:16px 18px;margin-bottom:14px;"><div style="font-size:11px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;">Auto-generated from your AIS data</div><table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr><th style="text-align:left;padding:6px 0;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);border-bottom:1.5px solid var(--border);">Type</th><th style="text-align:right;padding:6px 0;font-size:10px;text-transform:uppercase;color:var(--muted);border-bottom:1.5px solid var(--border);">Gains</th><th style="text-align:right;padding:6px 0;font-size:10px;text-transform:uppercase;color:var(--muted);border-bottom:1.5px solid var(--border);">Exempt</th><th style="text-align:right;padding:6px 0;font-size:10px;text-transform:uppercase;color:var(--muted);border-bottom:1.5px solid var(--border);">Taxable</th><th style="text-align:right;padding:6px 0;font-size:10px;text-transform:uppercase;color:var(--muted);border-bottom:1.5px solid var(--border);">Rate</th><th style="text-align:right;padding:6px 0;font-size:10px;text-transform:uppercase;color:var(--muted);border-bottom:1.5px solid var(--border);">Tax (incl. cess)</th></tr></thead><tbody>`+ltcgRow+stcgRow+`<tr><td style="padding:9px 0;font-size:12px;font-weight:700;">Total Capital Gains Tax</td><td style="padding:9px 0;text-align:right;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;">`+window.fmt(ltcg+stcg,true)+`</td><td style="padding:9px 0;text-align:right;font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--accent);">`+window.fmt(ltcgExempt,true)+`</td><td style="padding:9px 0;text-align:right;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;">`+window.fmt(ltcgTaxable+stcg,true)+`</td><td></td><td style="padding:9px 0;text-align:right;font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:800;color:var(--red);">`+window.fmt(totalCgTax,true)+`</td></tr></tbody></table></div><div style="font-size:12px;color:var(--ink2);line-height:1.7;">`+(ltcg>0?'<strong>LTCG tip:</strong> First &#8377;1,25,000 of gains is tax-free each year. Consider tax harvesting (sell and rebuy) to use the full exemption. ':'')+' '+`⚠️ You need to file <strong>ITR-2</strong> (not ITR-1) due to capital gains. Verify these figures against your broker's capital gains statement.</div>`;
}

function buildScheduleAL(){
  const panel=document.getElementById('schedule-al-panel');
  if(!panel||!window._i) return;
  if(window._i.gross<=5000000){panel.innerHTML='';return;}

  panel.innerHTML=`
    <div class="itr-panel" style="border-color:var(--a2);">
      <div class="itr-badge" style="background:var(--a2)">📊 Schedule AL Required</div>
      <div class="itr-title">You must file Schedule AL this year</div>
      <div class="itr-desc">Your income exceeds ₹50L. Schedule AL (Assets &amp; Liabilities) is <strong>mandatory</strong> in your ITR. You must disclose the value of all assets and liabilities as of March 31, 2026.</div>
      <div class="itr-reasons">
        <div class="itr-reason"><span>📋</span>Immovable property — land, house, flat (cost of acquisition)</div>
        <div class="itr-reason"><span>📋</span>Movable assets — vehicles, jewellery, bullion, artwork</div>
        <div class="itr-reason"><span>📋</span>Financial assets — bank balances, shares, MF units, EPF, NSC</div>
        <div class="itr-reason"><span>📋</span>Liabilities — home loan, personal loan, credit card outstanding</div>
        <div class="itr-reason"><span>⚠️</span>Non-disclosure attracts penalty under Sec 271FA (₹500/day)</div>
      </div>
      <div style="margin-top:12px;font-size:12px;color:var(--muted);">Schedule AL is filed as part of ITR-2 or ITR-3. Have your property purchase documents, bank statements, and loan statements ready.</div>
    </div>`;
}

// ── ITR Form Recommender ────────────────────────────────────────────────────
function buildITRPanel() {
  const i = window._i, panel = document.getElementById('itr-panel');
  if (!panel) return;

  const reasons = [];
  let form = 'ITR-1';

  // ITR-2 triggers
  if ((i.ltcg || 0) > 0 || (i.stcg || 0) > 0) {
    form = 'ITR-2';
    reasons.push('You have capital gains income (LTCG/STCG) — ITR-1 does not support Schedule CG');
  }
  if ((i.rental_income || 0) > 0) {
    form = 'ITR-2';
    reasons.push('You have rental income — ITR-2 required for income from house property');
  }
  if ((i.freelance || 0) > 0) {
    form = 'ITR-3';
    reasons.push('You have freelance/business income — ITR-3 required for business/profession income');
  }
  if ((i.crypto || 0) > 0) {
    form = form === 'ITR-3' ? 'ITR-3' : 'ITR-2';
    reasons.push('You have crypto/VDA income — requires Schedule VDA, not available in ITR-1');
  }
  if (i.gross > 5000000) {
    if (form === 'ITR-1') {
      form = 'ITR-2';
      reasons.push('Income above ₹50L — ITR-1 is only for income up to ₹50L');
    }
  }

  // ITR-1 reasons if no upgrade triggered
  if (form === 'ITR-1') {
    reasons.push('Salary is your only major income source');
    reasons.push('No capital gains, rental, or freelance income detected');
    if (i.gross <= 5000000) reasons.push('Total income is within the ₹50L ITR-1 limit');
  }

  const colors = { 'ITR-1': 'var(--accent)', 'ITR-2': '#1a3a72', 'ITR-3': '#7a1010' };
  const descs = {
    'ITR-1': 'The simplest form — designed for salaried individuals with one house property and no complex income. Most likely pre-filled on the Income Tax portal.',
    'ITR-2': 'For individuals with salary plus capital gains, multiple properties, or foreign income. Slightly more detailed but fully manageable online.',
    'ITR-3': 'Required if you have freelance, consulting, or business income alongside salary. You may want CA assistance for this one.'
  };
  const links = {
    'ITR-1': 'https://eportal.incometax.gov.in/iec/foservices/#/pre-login/bl-link?lang=en',
    'ITR-2': 'https://eportal.incometax.gov.in/iec/foservices/#/pre-login/bl-link?lang=en',
    'ITR-3': 'https://eportal.incometax.gov.in/iec/foservices/#/pre-login/bl-link?lang=en'
  };

  panel.innerHTML = `
    <div class="itr-panel">
      <div class="itr-badge" style="background:${colors[form]}">📋 File ${form}</div>
      <div class="itr-title">You should file ${form} this year</div>
      <div class="itr-desc">${descs[form]}</div>
      <div class="itr-reasons">
        ${reasons.map(r => `<div class="itr-reason"><span>✓</span>${r}</div>`).join('')}
      </div>
      <a class="itr-link" href="${links[form]}" target="_blank">→ File on Income Tax Portal</a>
    </div>`;
}

// ── Section 234B / 234C Interest Calculator ─────────────────────────────────
function buildInterestPanel() {
  const panel = document.getElementById('interest-panel');
  if (!panel || !window._i || !window._o || !window._n) return;

  const best = Math.min(window._o.tax, window._n.tax);
  const tds = window._i.tds_deducted || 0;
  const advanceTaxPaid = window._i.advance_tax || 0;
  const balDue = best - tds - advanceTaxPaid;

  if (balDue <= 10000) {
    // No significant liability — show green OK
    if (tds >= best) {
      panel.innerHTML = `<div class="interest-panel">
        <div class="int-title">✅ Section 234B/234C — No Interest Due</div>
        <div class="int-sub">Your TDS covers your full tax liability. No advance tax penalty applies.</div>
        <div class="int-ok">Your employer has already deducted sufficient TDS. You're in the clear!</div>
      </div>`;
    }
    return;
  }

  // 234B: Interest for not paying advance tax (if >10% of tax unpaid during year)
  // Simple formula: 1% per month from April 1 to date of filing (assume July 31)
  // April→July = 4 months
  const months234B = 4;
  const interest234B = Math.round(balDue * 0.01 * months234B);

  // 234C: Interest for short payment of each installment
  // Simplified: assume all advance tax was skipped, 1% × 3 months on 30% due by Dec, etc.
  // Conservative estimate: ~1% × 3 months on full amount
  const interest234C = Math.round(balDue * 0.01 * 3);

  const totalInterest = interest234B + interest234C;
  const totalPayable = balDue + totalInterest;

  panel.innerHTML = `
    <div class="interest-panel">
      <div class="int-title">⚠️ Section 234B/234C — Advance Tax Interest</div>
      <div class="int-sub">You have a balance due of ${window.fmt(balDue)}. Estimated interest penalty if you pay only at filing time (July 31).</div>
      <div class="int-grid">
        <div class="int-box">
          <div class="int-box-label">Sec 234B Interest</div>
          <div class="int-box-val">${window.fmt(interest234B)}</div>
          <div class="int-box-note">~1%/month × 4 months<br>(Apr–Jul on unpaid tax)</div>
        </div>
        <div class="int-box">
          <div class="int-box-label">Sec 234C Interest</div>
          <div class="int-box-val">${window.fmt(interest234C)}</div>
          <div class="int-box-note">~1%/month × 3 months<br>(missed installments)</div>
        </div>
      </div>
      <div class="int-steps">
        <strong>Total tax due:</strong> ${window.fmt(best)}<br>
        <strong>TDS already deducted:</strong> ${window.fmt(tds)}<br>
        <strong>Balance to pay:</strong> ${window.fmt(balDue)}<br>
        <strong>Estimated interest penalty:</strong> ${window.fmt(totalInterest)}<br>
        <strong style="color:var(--a2)">Total payable by July 31:</strong> <strong style="color:var(--a2)">${window.fmt(totalPayable)}</strong>
      </div>
      <div style="margin-top:12px;font-size:12px;color:var(--muted);">
        Pay now as Self-Assessment Tax to stop interest from accumulating. →
        <a href="https://www.incometax.gov.in/iec/foportal/help/e-payment-of-taxes" target="_blank" style="color:var(--a2);font-weight:700;">Pay via Challan 280</a>
      </div>
    </div>`;
}

// ── WhatsApp Share ───────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// ── Window exports (required for HTML onclick= attributes with ES modules) ──
if(typeof validateAndCalculate!=="undefined") window.validateAndCalculate=validateAndCalculate;
// window.runValidationWarnings — not found in validation.js, check definition

if(typeof buildITRPanel!=="undefined") window.buildITRPanel=buildITRPanel;
if(typeof buildRiskScore!=="undefined") window.buildRiskScore=buildRiskScore;
if(typeof buildInterestPanel!=="undefined") window.buildInterestPanel=buildInterestPanel;
if(typeof buildScheduleCG!=="undefined") window.buildScheduleCG=buildScheduleCG;
if(typeof buildScheduleAL!=="undefined") window.buildScheduleAL=buildScheduleAL;
