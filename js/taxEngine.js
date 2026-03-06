// FY 2025-26 New Regime Slabs (Budget 2025)
const NS=[[400000,0,'Up to ₹4L'],[800000,.05,'₹4L–₹8L'],[1200000,.10,'₹8L–₹12L'],[1600000,.15,'₹12L–₹16L'],[2000000,.20,'₹16L–₹20L'],[2400000,.25,'₹20L–₹24L'],[Infinity,.30,'Above ₹24L']];
// Old regime slabs are age-dependent
function getOS(age){
  if(age>=80)return[[500000,0,'Up to ₹5L'],[1000000,.20,'₹5L–₹10L'],[Infinity,.30,'Above ₹10L']];
  if(age>=60)return[[300000,0,'Up to ₹3L'],[500000,.05,'₹3L–₹5L'],[1000000,.20,'₹5L–₹10L'],[Infinity,.30,'Above ₹10L']];
  return[[250000,0,'Up to ₹2.5L'],[500000,.05,'₹2.5L–₹5L'],[1000000,.20,'₹5L–₹10L'],[Infinity,.30,'Above ₹10L']];
}

function slabs(tax,sl){
  let t=0,prev=0,bd=[];
  for(const[lim,rate,lbl]of sl){
    if(tax<=0)break;
    const band=lim===Infinity?tax:Math.min(tax,lim-prev);
    const tt=band*rate;t+=tt;
    if(band>0)bd.push({lbl,band,rate,tax:tt});
    tax-=band;prev=lim===Infinity?prev:lim;
  }
  return{tax:t,bd};
}
function cess(tax,gross,specialTax){
  // Surcharge on LTCG/STCG/crypto is capped at 15% per Finance Act
  // For gross > 2Cr: normal income gets higher surcharge, special income capped at 15%
  const normalTax=tax-(specialTax||0);
  let sNormal=0,sSpecial=0;
  if(gross>50000000)sNormal=.37;else if(gross>20000000)sNormal=.25;
  else if(gross>10000000)sNormal=.15;else if(gross>5000000)sNormal=.10;
  // Special income surcharge capped at 15% regardless of income level
  sSpecial=Math.min(sNormal,.15);
  const surcharge=normalTax*sNormal+(specialTax||0)*sSpecial;
  return tax+surcharge+(tax+surcharge)*.04;
}
function cessBreakdown(tax,gross,specialTax){
  let sRate=0;
  if(gross>50000000)sRate=.37;else if(gross>20000000)sRate=.25;
  else if(gross>10000000)sRate=.15;else if(gross>5000000)sRate=.10;
  const sRateSpecial=Math.min(sRate,.15);
  const normalTax=tax-(specialTax||0);
  const surcharge=Math.round(normalTax*sRate+(specialTax||0)*sRateSpecial);
  const cessAmt=Math.round((tax+surcharge)*.04);
  return {surcharge,cessAmt,sRate};
}
function calcHRA(b,da,hr,rp,metro){
  if(rp<=0||hr<=0)return 0;
  const bd=b+da;return Math.max(0,Math.min(hr,rp-.1*bd,(metro?.5:.4)*bd));
}
function gv(id){return parseFloat(document.getElementById(id).value)||0;}
function gs(id){return document.getElementById(id).value;}

window._o=null; window._n=null; window._i=null;
// local aliases updated after each calculation
let _o,_n,_i; // local aliases — synced to window after each calc

function compOld(i){
  const{gross,basic,da,hra_received,rent_paid,is_metro,prof_tax,has_lta,lta_received,lta_claimed,has_cea,cea,hostel_allowance,sec80c,nps,employer_nps,sec80d_self,sec80d_parents,home_loan_interest,home_loan_principal,sec80e,sec80tta,sec80g,sec80u,epf_employee,has_gratuity,gratuity,other_exempt,has_vrs,vrs_amount,has_retrench,retrench_amount,retrench_years,has_leave_enc,leave_enc_amount,interest_income,rental_income,stcg,ltcg,freelance,crypto,savings_interest,gaming_income,sec89_relief,age}=i;
  const OS=getOS(age||0);
  const std=50000,hra=calcHRA(basic,da,hra_received,rent_paid,is_metro);
  const lta=has_lta==='yes'?Math.min(lta_received,lta_claimed):0;
  const cea_ex=has_cea==='yes'?Math.min(cea,2400):0;
  const hos=has_cea==='yes'?Math.min(hostel_allowance,7200):0;
  const grat=has_gratuity==='yes'?Math.min(gratuity,2000000):0;
  // Sec 10(10C): VRS — exempt up to ₹5L under approved scheme
  const vrs_ex=has_vrs==='yes'?Math.min(vrs_amount||0,500000):0;
  // Sec 10(10B): Retrenchment — exempt up to lower of ₹5L or avg3yr salary × yrs
  const rtr_avg3=(gross/1)*.5; // approx: use basic*3yrs as proxy, capped at 5L
  const retrench_ex=has_retrench==='yes'?Math.min(retrench_amount||0,500000,rtr_avg3*(retrench_years||0)):0;
  // Sec 10(10AA): Leave encashment on retirement — exempt up to ₹25L (non-govt)
  const leave_ex=has_leave_enc==='yes'?Math.min(leave_enc_amount||0,2500000):0;
  const c80c=Math.min(sec80c+epf_employee+home_loan_principal,150000);
  const cnps=Math.min(nps,50000),cenps=Math.min(employer_nps,.1*(basic+da));
  const c80d=Math.min(sec80d_self,(age||0)>=60?50000:25000)+Math.min(sec80d_parents,50000);
  const c24b=Math.min(home_loan_interest,200000),c80e_v=sec80e;
  const c80tta=Math.min(sec80tta,(age||0)>=60?50000:10000); // 80TTB for seniors
  const c80g_v=sec80g*.5,c80u_v=Math.min(sec80u||0,125000); // 80U: max ₹75K normal, ₹1.25L severe
  const exempts=std+hra+lta+cea_ex+hos+prof_tax+other_exempt+grat+vrs_ex+retrench_ex+leave_ex;
  const deds=c80c+cnps+cenps+c80d+c24b+c80e_v+c80tta+c80g_v+c80u_v;
  const rnet=rental_income*.7,ltcg_t=Math.max(0,ltcg-125000);
  // Savings interest: net of 80TTA/80TTB exemption (already in c80tta above, so just add gross here)
  const sav_int=savings_interest||0;
  const gaming_t=(gaming_income||0)*.30;  // Sec 115BBJ: flat 30%, no deductions
  const ti=Math.max(0,gross-exempts)+interest_income+sav_int+rnet+freelance;
  const taxable=Math.max(0,ti-deds);
  const{tax:base,bd}=slabs(taxable,OS);
  const crypto_t=(crypto||0)*.30;  // VDA flat 30%, no deductions
  const specialTaxOld=ltcg_t*.125+stcg*.2+crypto_t+gaming_t;
  let tot=base+specialTaxOld;
  if(taxable<=500000&&(age||0)<60)tot=Math.max(0,tot-Math.min(base,12500));
  // Sec 89 relief — deduct from final tax
  const relief89=Math.min(sec89_relief||0,tot);
  tot=Math.max(0,tot-relief89);
  const final=cess(tot,gross,specialTaxOld);
  return{tax:Math.round(final),bd,taxable,gaming_t:Math.round(gaming_t*1.04),relief89,age:age||0,deds:{std,hra,lta,cea_ex,hos,prof_tax,other_exempt,grat,vrs_ex,retrench_ex,leave_ex,c80c,cnps,cenps,c80d,c24b,c80e_v,c80tta,c80g_v,c80u_v,exempts,totalDed:deds}};
}
function compNew(i){
  const{gross,basic,da,employer_nps,interest_income,rental_income,stcg,ltcg,freelance,crypto,savings_interest,gaming_income,sec89_relief}=i;
  const std=75000,cenps=Math.min(employer_nps,.1*(basic+da));
  const rnet=rental_income*.7,ltcg_t=Math.max(0,ltcg-125000);
  const sav_int=savings_interest||0;
  const gaming_t=(gaming_income||0)*.30;
  const ti=gross+(interest_income||0)+sav_int+rnet+freelance;
  const taxable=Math.max(0,ti-std-cenps);
  const{tax:base,bd}=slabs(taxable,NS);
  const crypto_t=(crypto||0)*.30;  // VDA flat 30%, no deductions
  // Special income tax (LTCG/STCG/crypto/gaming) — NOT eligible for 87A rebate
  const specialTax=ltcg_t*.125+stcg*.2+crypto_t+gaming_t;
  let slabTax=base;

  // FY 2025-26: 87A rebate — applies ONLY to slab tax, NOT to special rate income
  // Gross 12,75,000 - 75,000 std = 12,00,000 taxable → zero SLAB tax ✓
  // But LTCG/STCG/crypto tax still applies even if salary income ≤ ₹12L
  if(taxable<=1200000){
    slabTax=0; // Full rebate on slab tax only
  } else if(taxable<=1275000){
    // Marginal relief: slab tax capped at amount exceeding 12L taxable
    slabTax=Math.min(slabTax,taxable-1200000);
  }
  let tot=slabTax+specialTax;

  // Sec 89 relief
  const relief89=Math.min(sec89_relief||0,tot);
  tot=Math.max(0,tot-relief89);
  const final=cess(tot,gross,specialTax);
  return{tax:Math.round(final),bd,taxable,gaming_t:Math.round(gaming_t*1.04),relief89,ti};
}

function calculate(){
  try{
  window._i={
    gross:gv('gross'),basic:gv('basic'),da:gv('da'),
    hra_received:gv('hra_received'),rent_paid:gv('rent_paid'),
    is_metro:gs('city')==='metro',prof_tax:gv('prof_tax'),
    has_lta:gs('has_lta'),lta_received:gv('lta_received'),lta_claimed:gv('lta_claimed'),
    has_cea:gs('has_cea'),cea:gv('cea'),hostel_allowance:gv('hostel_allowance'),
    sec80c:gv('sec80c'),nps:gv('nps'),employer_nps:gv('employer_nps'),
    sec80d_self:gv('sec80d_self'),sec80d_parents:gv('sec80d_parents'),
    home_loan_interest:gv('home_loan_interest'),home_loan_principal:gv('home_loan_principal'),
    sec80e:gv('sec80e'),sec80tta:gv('sec80tta'),sec80g:gv('sec80g'),sec80u:gv('sec80u'),
    epf_employee:gv('epf_employee'),epf_employer:gv('epf_employer'),
    has_gratuity:gs('has_gratuity'),gratuity:gv('gratuity'),other_exempt:gv('other_exempt'),
    has_vrs:gs('has_vrs'),vrs_amount:gv('vrs_amount'),
    has_retrench:gs('has_retrench'),retrench_amount:gv('retrench_amount'),retrench_years:gv('retrench_years'),
    has_leave_enc:gs('has_leave_enc'),leave_enc_amount:gv('leave_enc_amount'),
    interest_income:gv('interest_income'),rental_income:gv('rental_income'),
    stcg:gv('stcg'),ltcg:gv('ltcg'),freelance:gv('freelance'),crypto:gv('crypto'),
    savings_interest:gv('savings_interest'),gaming_income:gv('gaming_income'),
    changed_jobs:gs('changed_jobs'),salary_emp1:gv('salary_emp1'),salary_emp2:gv('salary_emp2'),
    tds_emp1:gv('tds_emp1'),tds_emp2:gv('tds_emp2'),
    has_arrears:gs('has_arrears'),arrears_amount:gv('arrears_amount'),sec89_relief:gv('sec89_relief'),
    tds_deducted:gv('tds_deducted'),
    age:parseInt(document.getElementById('age').value)||0,
    gross_salary:gv('gross'),
  };
  window.runValidationWarnings(window._i);
  if(window._i.gross===0){window.showStep(2);return;}
  window._o=compOld(window._i);window._n=compNew(window._i);
  window._o=window._o; window._n=window._n; window._i=window._i;
  const win=window._o.tax<=window._n.tax?'old':'new',sav=Math.abs(window._o.tax-window._n.tax),best=Math.min(window._o.tax,window._n.tax);
  const name=document.getElementById('name').value||'Your';
  const tdsBalance=window._i.tds_deducted-best;

  document.getElementById('rh-name').textContent=name+"'s Tax Report";
  document.getElementById('rh-regime').textContent=win==='new'?'New Regime ✓':'Old Regime ✓';
  document.getElementById('rh-saving').textContent=sav>0?'Saves '+window.fmt(sav)+' vs other regime':'Both regimes equal';
  document.getElementById('res-hdr').style.background=win==='new'
    ?'linear-gradient(135deg,#1a472a,#0f2d1a)':'linear-gradient(135deg,#7a5010,#4a2f08)';
  document.getElementById('st-tax').textContent=window.fmt(best);
  const _stb=cessBreakdown(Math.round(best/1.04),window._i.gross);
  const stSub=document.getElementById('st-tax-sub');
  if(stSub) stSub.textContent=_stb.surcharge>0?'incl. '+(_stb.sRate*100).toFixed(0)+'% surcharge + 4% cess':'incl. 4% cess';
  // Effective rate = Tax / Gross income (what % of total income goes to tax)
  // Marginal rate = top slab rate (what you pay on the next ₹1 earned)
  const effRate = window.pct(best, window._i.gross);
  const taxableInc = win==='new' ? window._n.taxable : window._o.taxable;
  // Determine marginal rate from taxable income (new regime slabs)
  const marginalRate = win==='new'
    ? (taxableInc>2400000?30:taxableInc>2000000?25:taxableInc>1600000?20:taxableInc>1200000?15:taxableInc>800000?10:taxableInc>400000?5:0)
    : (taxableInc>1000000?30:taxableInc>500000?20:taxableInc>250000?5:0);
  document.getElementById('st-eff').textContent = effRate;
  document.getElementById('st-marginal').textContent = marginalRate + '%';
  document.getElementById('st-tds').textContent=window.fmt(Math.abs(tdsBalance));
  document.getElementById('st-tds-sub').textContent=tdsBalance>=0?'refund due →':'balance due ↑';

  // Surcharge callout
  const surWarn = document.getElementById('surcharge-warn');
  if(surWarn){
    const bd=cessBreakdown(Math.round(best/1.04),window._i.gross);
    if(bd.surcharge>0){
      const pct=Math.round(bd.sRate*100);
      surWarn.style.display='block';
      surWarn.innerHTML='💡 <strong>Surcharge applies ('+pct+'%):</strong> Because your income exceeds '+
        (pct===10?'₹50L':pct===15?'₹1Cr':pct===25?'₹2Cr':'₹5Cr')+
        ', a '+pct+'% surcharge of <strong>'+window.fmt(bd.surcharge)+'</strong> is added to your base tax, '+
        'plus 4% Health & Education Cess of <strong>'+window.fmt(bd.cessAmt)+'</strong>. '+
        'This is shown as a separate line in your tax breakdown below.';
    } else {
      surWarn.style.display='none';
    }
  }
  // 87A Rebate banner
  const rebateBanner = document.getElementById('rebate-banner');
  if(rebateBanner){
    // New regime: full rebate if taxable <= 12L
    if(window._n.taxable<=1200000 && win==='new'){
      rebateBanner.style.display='block';
      rebateBanner.innerHTML='🎉 <strong>Section 87A Rebate Applied!</strong> Your taxable income is ₹'+
        (window._n.taxable/100000).toFixed(2)+'L — under the ₹12L threshold. '+
        '<strong>Zero tax under the New Regime</strong> before cess. Your final tax is only the 4% cess on any special income (LTCG/STCG/Crypto).';
    // Marginal relief band
    } else if(window._n.taxable<=1275000 && win==='new'){
      const saved=Math.round((window._n.taxable*0.1)-(window._n.taxable-1200000));
      rebateBanner.style.display='block';
      rebateBanner.innerHTML='💡 <strong>Marginal Relief Applied (Sec 87A):</strong> Your income is just above ₹12L. '+
        'Instead of paying full slab tax, your tax is capped at ₹'+(window._n.taxable-1200000).toLocaleString('en-IN')+
        ' (the amount exceeding ₹12L). You saved ~'+window.fmt(Math.max(0,saved))+'.';
    // Old regime 87A: if taxable <= 5L
    } else if(window._o.taxable<=500000 && win==='old'){
      rebateBanner.style.display='block';
      rebateBanner.innerHTML='🎉 <strong>Section 87A Rebate Applied (Old Regime)!</strong> Your taxable income is under ₹5L. '+
        'Tax rebate of up to ₹12,500 applied — effectively zero income tax.';
    } else {
      rebateBanner.style.display='none';
    }
  }
  // Belated return warning (after July 31, Old Regime not available)
  const belatedWarn = document.getElementById('belated-warn');
  if(belatedWarn){
    const today=new Date();
    const filingDeadline=new Date('2025-07-31');
    if(today>filingDeadline && win==='old'){
      belatedWarn.style.display='block';
      belatedWarn.innerHTML='🚨 <strong>Belated Return Warning:</strong> The ITR filing deadline (July 31, 2025) has passed. '+
        'As per Income Tax rules, you <strong>cannot opt for the Old Regime in a Belated Return</strong>. '+
        'Your tax will be computed under the New Regime only. '+
        '<strong>Tax due under New Regime: '+window.fmt(window._n.tax)+'</strong>';
    } else if(today>filingDeadline){
      belatedWarn.style.display='block';
      belatedWarn.innerHTML='⚠️ <strong>Filing after July 31:</strong> You are filing a Belated Return (Sec 139(4)). '+
        'A penalty of ₹5,000 (₹1,000 if income ≤ ₹5L) applies. Old Regime is not available for belated returns.';
    } else {
      belatedWarn.style.display='none';
    }
  }

  // Multiple employer warning + duplicate standard deduction check
  if(window._i.changed_jobs==='yes'){
    const emp1=window._i.salary_emp1||0, emp2=window._i.salary_emp2||0;
    const tdsEmp=(window._i.tds_emp1||0)+(window._i.tds_emp2||0);
    const errP=document.getElementById('error-panel');

    // Check 1: Consolidated salary mismatch
    if(emp1+emp2>0 && Math.abs((emp1+emp2)-window._i.gross)>10000 && errP){
      errP.innerHTML=`<div class="error-panel warn mb14">
        <div class="ep-heading">⚠️ Multiple Employer — Salary Mismatch</div>
        <div class="err-desc">
          Employer 1: ${window.fmt(emp1)}<br>
          Employer 2: ${window.fmt(emp2)}<br>
          <strong>Consolidated: ${window.fmt(emp1+emp2)}</strong><br>
          Your Gross Salary entry: ${window.fmt(window._i.gross)} — difference of ${window.fmt(Math.abs((emp1+emp2)-window._i.gross))}.
        </div>
        <div class="err-action amber">→ Update Gross Salary in Step 2 to ${window.fmt(emp1+emp2)} (total of both)</div>
      </div>`+errP.innerHTML;
    }

    // Check 2: Duplicate standard deduction — each Form 16 includes ₹50K std deduction
    // but ITR allows only ONE std deduction regardless of number of employers
    // If user entered gross salary that already had std deduction subtracted from each employer
    // this is caught by warning them explicitly
    if(emp1>0 && emp2>0 && errP){
      const stdOld=50000, stdNew=75000;
      errP.innerHTML=`<div class="error-panel warn mb14">
        <div class="ep-heading">⚠️ Duplicate Standard Deduction Risk</div>
        <div class="err-desc">
          Each employer's Form 16 shows a ₹50,000 standard deduction (old) or ₹75,000 (new) separately.
          But you are entitled to only <strong>ONE standard deduction</strong> across all employers.
          Make sure your Gross Salary is the <strong>total gross from both employers before any deductions</strong> — not the taxable salary from each Form 16.
        </div>
        <div class="err-action amber">→ Use "Gross Salary" from Part B of each Form 16, then add them. Do NOT use "Income chargeable under Salaries".</div>
      </div>`+errP.innerHTML;
    }

    // Check 3: TDS under-deduction warning (very common in job change)
    if(tdsEmp>0 && Math.abs(tdsEmp-window._i.tds_deducted)>5000 && errP){
      errP.innerHTML=`<div class="error-panel warn mb14">
        <div class="ep-heading">⚠️ TDS Under-Deduction — Job Change</div>
        <div class="err-desc">
          TDS by Employer 1: ${window.fmt(window._i.tds_emp1||0)} + Employer 2: ${window.fmt(window._i.tds_emp2||0)} = ${window.fmt(tdsEmp)}<br>
          But total TDS entered above: ${window.fmt(window._i.tds_deducted)}. Difference: ${window.fmt(Math.abs(tdsEmp-window._i.tds_deducted))}<br>
          Each employer only taxes their portion — combined salary pushes you into a higher slab.
        </div>
        <div class="err-action amber">→ You likely have additional tax due. Pay Self-Assessment Tax via Challan 280 before filing.</div>
      </div>`+errP.innerHTML;
    }
  }

  // 234B/C now handled by window.buildInterestPanel() called below

  const oc=document.getElementById('old-card'),nc=document.getElementById('new-card');
  oc.classList.toggle('winner',win==='old');nc.classList.toggle('winner',win==='new');
  oc.innerHTML=(win==='old'?'<div class="rc-badge">✓ Recommended</div>':'')+'<div class="rc-lbl">Old Regime</div><div class="rc-tax">'+window.fmt(window._o.tax)+'</div><div class="rc-eff">Effective: '+window.pct(window._o.tax,window._i.gross)+'</div>';
  nc.innerHTML=(win==='new'?'<div class="rc-badge">✓ Recommended</div>':'')+'<div class="rc-lbl">New Regime</div><div class="rc-tax">'+window.fmt(window._n.tax)+'</div><div class="rc-eff">Effective: '+window.pct(window._n.tax,window._i.gross)+'</div>';

  window.buildErrorPanel();
  window.buildRecon();
  window.buildUtil();
  window.buildComp();
  window.buildSlabViz();
  window.buildDeds();
  window.buildTips(win);
  window.buildInsight(win,sav,name,tdsBalance);
  window.buildITRPanel();
  window.buildScheduleAL();
  window.buildRiskScore();
  window.buildInterestPanel();
  window.buildScheduleCG();
  window.buildHeroResult();
  window.buildWhatsNext();
  window.buildRefundPrediction(tdsBalance);
  window.buildEmployerTDSAlert();
  window.initOptimiser();
  // Fix 3: show context note on deductions accordion when new regime wins
  const dedNote=document.getElementById('ded-regime-note');
  if(dedNote)dedNote.style.display=win==='new'?'block':'none';
  const dedTitle=document.getElementById('accord-ded-title');
  if(dedTitle)dedTitle.textContent=win==='new'?'📊 Old Regime Deductions (for reference)':'📊 Deduction Breakdown & Utilization';
  // Fix 7: Record audit event
  window._auditTrail.push({time:new Date(),event:'Tax report generated',detail:`${win==='new'?'New':'Old'} Regime · Tax ${window.fmt(Math.min(window._o.tax,window._n.tax),true)} · ${window._i.tds_deducted>0?(Math.min(window._o.tax,window._n.tax)-window._i.tds_deducted>=0?'Due '+window.fmt(Math.abs(Math.min(window._o.tax,window._n.tax)-window._i.tds_deducted),true):'Refund '+window.fmt(Math.abs(Math.min(window._o.tax,window._n.tax)-window._i.tds_deducted),true)):''}`,icon:'🧾'});
  window.buildAuditTrail();
  // Apply simple mode by default — user can switch to advanced
  setTimeout(() => window.setMode(currentMode), 50);

  // ── Update sticky bar with results ────────────────────────────────────────
  window.updateStickyBar();

  // ── GA funnel tracking ────────────────────────────────────────────────────
  // These events persist in GA even when server restarts
  try {
    const win2=window._o.tax<window._n.tax?'old':'new';
    const bestTax2=Math.min(window._o.tax,window._n.tax);
    const tds2=window._i.tds_deducted||0;
    const bal2=tds2-bestTax2;
    // Salary bracket (anonymised — ranges only, no exact number)
    const gross=window._i.gross||0;
    const bracket = gross<300000?'<3L':gross<500000?'3-5L':gross<700000?'5-7L':gross<1000000?'7-10L':gross<1500000?'10-15L':'15L+';
    if(typeof gtag==='function'){
      gtag('event','tax_calculated',{
        event_category:'funnel',
        regime_winner: win2,
        refund_or_due: bal2>=0?'refund':'due',
        salary_bracket: bracket,
        has_errors: (window._errors&&window._errors.length>0)?'yes':'no',
        extraction_used: (window._i.tds_deducted_form16>0)?'yes':'no'
      });
    }
  } catch(e){}

  document.querySelectorAll('.card').forEach(c=>c.classList.remove('active'));
  document.getElementById('prog-wrap').style.display='none';
  document.getElementById('results').style.display='block';
  try{ plausible('Report Generated', {props:{regime:win,saving:Math.round(sav)}}); }catch(e){}
  window.scrollTo({top:0,behavior:'smooth'});
  setTimeout(initSim, 100);
  } catch(err) { alert('Error in calculation: ' + err.message + '\n\nPlease check the console for details.'); console.error(err); }
}

// =====================================================================================================================================================================

// ── Window exports (required for HTML onclick= attributes with ES modules) ──
if(typeof compOld!=="undefined") window.compOld=compOld;
if(typeof compNew!=="undefined") window.compNew=compNew;

if(typeof gv!=="undefined") window.gv=gv;
if(typeof cessBreakdown!=="undefined") window.cessBreakdown=cessBreakdown;
if(typeof calculate!=="undefined") window.calculate=calculate;
