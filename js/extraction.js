// EXTRACTION ENGINE
// =====================================================================================================================================================================
window._extractedData={};
window._errors=[];
window._auditTrail=[];

async function fileToBase64(file){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>res(r.result.split(',')[1]);
    r.onerror=()=>rej(new Error('Read failed'));
    r.readAsDataURL(file);
  });
}

function setEpState(id,state,sub){
  const icon=document.getElementById('ep-'+id+'-icon');
  const subEl=document.getElementById('ep-'+id+'-sub');
  icon.className='ep-icon '+state;
  if(state==='spin')icon.textContent='⟳';
  else if(state==='done')icon.textContent='✓';
  else if(state==='err')icon.textContent='✗';
  if(sub)subEl.textContent=sub;
}

async function runExtraction(){
  const BACKEND_URL='https://taxsmart-api.onrender.com';
  const MAX_RETRIES=2;
  const TIMEOUT_MS=90000;

  document.getElementById('extract-btn').disabled=true;
  document.getElementById('extract-progress').classList.add('show');
  try{ if(typeof gtag==='function') gtag('event','upload_started',{event_category:'funnel'}); }catch(ga_e){}
  try{ plausible('Upload Started'); }catch(e){}

  function getWm(){ return document.getElementById('warmup-msg'); }

  // Show warmup message if first attempt takes >5s
  const warmupTimer=setTimeout(()=>{
    const wm=getWm();
    if(wm){wm.style.display='flex';wm.innerHTML='⏳ <span>Server is waking up (Render free tier cold start — usually 20–30s). Hang tight…</span>';}
  },5000);

  // Convert a File to base64 string
  async function fileToB64(file){
    return new Promise((resolve, reject)=>{
      const reader = new FileReader();
      reader.onload = ()=> resolve(reader.result.split(',')[1]);
      reader.onerror = ()=> reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  // Build FormData payload
  function buildFormData(){
    const fd = new FormData();
    if(window._files.f16)     fd.append('f16',   window._files.f16);
    if(window._files['26as']) fd.append('as26',  window._files['26as']);
    if(window._files.ais)     fd.append('ais',   window._files.ais);
    return fd;
  }

  // Build JSON+base64 payload (for sandboxed environments)
  async function buildJsonPayload(){
    const payload={};
    if(window._files.f16)     payload.f16  = await fileToB64(window._files.f16);
    if(window._files['26as']) payload.as26 = await fileToB64(window._files['26as']);
    if(window._files.ais)     payload.ais  = await fileToB64(window._files.ais);
    return payload;
  }

  async function attemptFetch(){
    const ctrl=new AbortController();
    const tout=setTimeout(()=>ctrl.abort(),TIMEOUT_MS);

    // Strategy: Try JSON+base64 first (works in sandboxed iframes like Claude artifacts)
    // If server returns 400 "upload at least one" (old server only accepts FormData),
    // fall back to FormData (works on live site github.io, not in Claude artifact sandbox)
    async function tryRequest(useJson){
      const opts = { method:'POST', signal:ctrl.signal };
      if(useJson){
        const payload = await buildJsonPayload();
        opts.headers = {'Content-Type':'application/json'};
        opts.body = JSON.stringify(payload);
      } else {
        opts.body = buildFormData(); // no Content-Type header - browser sets multipart boundary
      }
      return fetch(BACKEND_URL+'/extract', opts);
    }

    try{
      // First attempt: JSON+base64
      let res = await tryRequest(true);

      // If old server doesn't understand JSON (returns 400 with "upload" message), retry with FormData
      if(res.status === 400){
        const errBody = await res.json().catch(()=>({}));
        const errMsg = (errBody.error||'').toLowerCase();
        if(errMsg.includes('upload') || errMsg.includes('document')){
          // Old server - retry with FormData
          res = await tryRequest(false);
        } else {
          clearTimeout(tout);
          throw new Error(errBody.error||'Server error 400');
        }
      }

      clearTimeout(tout);
      if(!res.ok){
        const errBody=await res.json().catch(()=>({error:'Server error '+res.status}));
        throw new Error(errBody.error||'Server error '+res.status);
      }
      return await res.json();
    }catch(e){
      clearTimeout(tout);
      if(e.name==='AbortError') throw new Error('timeout');
      throw e;
    }
  }

  try{
    if(window._files.f16)    setEpState('f16',  'spin','Reading salary breakup and TDS…');
    if(window._files['26as'])setEpState('26as','spin','Reading TDS credits…');
    if(window._files.ais)    setEpState('ais',  'spin','Reading full income picture…');
    setEpState('cross','spin','Checking for errors and mismatches…');

    let data, lastErr;
    for(let attempt=1;attempt<=MAX_RETRIES;attempt++){
      try{
        if(attempt>1){
          setEpState('cross','spin',`Retry ${attempt-1} of ${MAX_RETRIES-1} — server may have been sleeping…`);
          await new Promise(r=>setTimeout(r,3000));
        }
        data=await attemptFetch();
        break;
      }catch(e){
        lastErr=e;
        if(attempt===MAX_RETRIES) throw e;
      }
    }
    if(!data) throw lastErr;

    clearTimeout(warmupTimer);
    const wmEl=getWm(); if(wmEl) wmEl.style.display='none';

    const f16Data=data.f16Data||{}, as26Data=data.as26Data||{}, aisData=data.aisData||{};

    if(window._files.f16)    setEpState('f16',  Object.keys(f16Data).length>2?'done':'err',
      Object.keys(f16Data).length>2?'Extracted: salary, deductions, TDS paid':'Could not read — fill manually');
    if(window._files['26as'])setEpState('26as', Object.keys(as26Data).length>2?'done':'err',
      Object.keys(as26Data).length>2?'Extracted: TDS from all deductors':'Could not read — fill manually');
    if(window._files.ais)    setEpState('ais',  Object.keys(aisData).length>2?'done':'err',
      Object.keys(aisData).length>2?'Extracted: interest, capital gains, rental':'Could not read — fill manually');

    window._errors=data.errors||[];
    setEpState('cross','done',`Found ${window._errors.length} item(s) to review`);
    window._extractedData={...f16Data,...as26Data,...aisData};
    window._f16=f16Data; window._as26=as26Data; window._ais=aisData;
    // Audit trail entry
    const docNames=[window._files.f16?'Form 16':'',window._files['26as']?'Form 26AS':'',window._files.ais?'AIS':''].filter(Boolean).join(', ');
    window._auditTrail.push({time:new Date(),event:'Documents uploaded & extracted',detail:docNames,icon:'📄'});

    // Fix 6: Compute and store data confidence indicator
    const totalExpectedFields=['gross_salary','tds_deducted_form16','sec80c','basic_salary','hra_received','total_tds_26as','salary_income_26as','interest_income_ais','ltcg_ais','stcg_ais'];
    const filledFields=totalExpectedFields.filter(f=>window._extractedData[f]&&window._extractedData[f]>0);
    const confidencePct=Math.round(filledFields.length/totalExpectedFields.length*100);
    const manualCount=Math.max(0,totalExpectedFields.length-filledFields.length);
    window._extractionConfidence={pct:confidencePct,filled:filledFields.length,total:totalExpectedFields.length,manual:manualCount};

    setTimeout(()=>{
      showConfirmationScreen(window._extractedData, f16Data, as26Data, aisData);
      if(Object.keys(as26Data).length>2||Object.keys(aisData).length>2){
        const b=document.getElementById('autofill-banner-6');if(b)b.style.display='flex';
      }
    },600);

  }catch(err){
    clearTimeout(warmupTimer);
    console.error('Extraction error:',err);
    const wmEl=getWm(); if(wmEl) wmEl.style.display='none';

    let userMsg, hint;
    if(err.message==='timeout'||err.name==='AbortError'){
      userMsg='Request timed out after 90 seconds.';
      hint='The server may be cold-starting. Wait 30 seconds and try again — it usually works on the second attempt.';
    } else if(err.message&&err.message.includes('fetch')){
      userMsg='Could not reach the extraction server.';
      hint='Check your internet connection, or try again in a moment. Your documents are safe — nothing was uploaded.';
    } else if(err.message&&(err.message.includes('quota')||err.message.includes('429')||err.message.includes('Daily AI'))){
      userMsg='AI extraction limit reached for today.';
      hint='The free AI tier is fully used up for today — resets at midnight. Fill the form manually now (3 minutes) — all fields have ⓘ tooltips to guide you.';
    } else if(err.message&&(err.message.includes('circuit')||err.message.includes('temporarily unavailable'))){
      userMsg='AI service is temporarily down.';
      hint='Gemini is having issues. Please try again in 60 seconds, or fill the form manually — it only takes 3 minutes.';
    } else if(err.message&&(err.message.includes('busy')||err.message.includes('503'))){
      userMsg='Server is currently busy.';
      hint='Too many users are uploading at once. Please wait 20-30 seconds and try again — or fill the form manually now.';
    } else if(err.message&&err.message.includes('413')){
      userMsg='File too large.';
      hint='Try compressing your PDF before uploading, or fill the form manually — it only takes 3 minutes.';
    } else {
      userMsg='Extraction failed: '+(err.message||'Unknown error');
      hint='Please fill the form manually — it only takes 3 minutes. All fields have tooltips (?) to guide you.';
    }

    ['f16','26as','ais'].forEach(k=>{if(window._files[k])setEpState(k,'err','Could not read — please fill manually');});
    setEpState('cross','err',userMsg);

    // Partial autofill fallback — fill whatever was extracted before failure
    if(window._extractedData && Object.keys(window._extractedData).length > 0){
      autoFillForm(window._extractedData);
      const partialCount = Object.keys(window._extractedData).filter(k=>window._extractedData[k]>0).length;
      if(partialCount > 0){
        const pb = document.createElement('div');
        pb.className='confirm-partial-banner';
        pb.style.marginTop='12px';
        pb.innerHTML=`⚠️ <div><strong>Partial extraction saved ${partialCount} fields.</strong> We filled what we could — highlighted fields below were auto-filled. Please verify and complete the red/empty fields manually.</div>`;
        document.getElementById('extract-progress').appendChild(pb);
      }
    }

    const warnBox=getWm();
    if(warnBox){
      warnBox.style.display='flex';
      warnBox.style.background='#fdf3e3';
      warnBox.style.borderColor='#c17f24';
      warnBox.style.color='#7a4f08';
      warnBox.innerHTML=`⚠️ <span><strong>${userMsg}</strong> ${hint}<br><br>
        <button onclick="showStep(1);document.getElementById('warmup-msg').style.display='none'" style="margin-top:4px;padding:8px 18px;background:var(--a2);color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;">
          Fill manually instead →
        </button>
      </span>`;
    }
    document.getElementById('extract-btn').disabled=false;
  }
}

function runErrorChecks(f16,as26,ais){
  const errors=[];
  // 1. TDS Mismatch: Form 16 vs 26AS
  if(f16.tds_deducted_form16>0&&as26.total_tds_26as>0){
    const diff=Math.abs(f16.tds_deducted_form16-as26.total_tds_26as);
    if(diff>1000){
      errors.push({
        type:'crit',icon:'⚠️',
        title:'TDS Mismatch: Form 16 vs 26AS',
        desc:`Form 16 shows TDS of ${fmt(f16.tds_deducted_form16,true)}, but Form 26AS shows ${fmt(as26.total_tds_26as,true)}. Difference of ${fmt(diff,true)}. This means your employer may NOT have deposited your TDS with the government.`,
        action:'Immediately contact your employer HR/payroll team and ask them to reconcile and deposit the TDS. You cannot claim credit for TDS not reflected in 26AS.',
        severity:'red'
      });
    }
  }
  // 2. Income mismatch: Form 16 vs AIS
  if(f16.gross_salary>0&&ais.salary_ais>0){
    const diff=Math.abs(f16.gross_salary-ais.salary_ais);
    if(diff>5000){
      errors.push({
        type:'warn',icon:'🔶',
        title:'Salary Mismatch: Form 16 vs AIS',
        desc:`Form 16 shows gross salary of ${fmt(f16.gross_salary,true)}, but AIS shows ${fmt(ais.salary_ais,true)}. Difference of ${fmt(diff,true)}. The Income Tax Department has flagged a discrepancy.`,
        action:'Cross-check with your employer. AIS may include perquisites or arrears not in Form 16. Ensure you declare the correct income in your ITR.',
        severity:'amber'
      });
    }
  }
  // 3. Missing PAN check
  if(as26.tds_entries&&as26.tds_entries.length>0){
    const missingPan=as26.tds_entries.filter(e=>!e.pan_deductor||e.pan_deductor==='PANNOTAVBL'||e.pan_deductor==='');
    if(missingPan.length>0){
      errors.push({
        type:'warn',icon:'🪪',
        title:`Missing PAN in ${missingPan.length} TDS Entr${missingPan.length>1?'ies':'y'}`,
        desc:`${missingPan.length} deductor(s) in your 26AS have missing or invalid PAN. TDS credit for these entries may not be reflected in your account, and you cannot claim this as credit while filing.`,
        action:'Contact the respective deductors and ask them to update their PAN details with the Income Tax Department (file TDS correction).',
        severity:'amber'
      });
    }
  }
  // 4. Undeclared interest income
  if(ais.interest_income_ais>0&&as26.interest_income_26as>0){
    const aisInt=ais.interest_income_ais,asInt=as26.interest_income_26as;
    const diff=Math.abs(aisInt-asInt);
    if(diff>2000){
      errors.push({
        type:'warn',icon:'💰',
        title:'Interest Income Discrepancy',
        desc:`AIS shows ₹${fmt(aisInt)} interest income, but 26AS shows ${fmt(asInt)}. The higher AIS figure is what the Income Tax Department sees. Undeclared interest income is a common reason for tax notices.`,
        action:'Use the higher of the two figures in your tax return to avoid a notice from the department.',
        severity:'amber'
      });
    }
  }
  // 5. Capital gains in AIS
  if((ais.ltcg_ais>0||ais.stcg_ais>0)&&ais.ltcg_ais+ais.stcg_ais>10000){
    errors.push({
      type:'info',icon:'📈',
      title:'Capital Gains Found in AIS',
      desc:`AIS shows capital gains of ${fmt((ais.ltcg_ais||0)+(ais.stcg_ais||0))} (LTCG: ${fmt(ais.ltcg_ais||0)}, STCG: ${fmt(ais.stcg_ais||0)}). These have been auto-filled. Verify against your broker's capital gains statement.`,
      action:'Cross-check with your broker\'s P&L report or capital gains statement. Report only the net gains after indexation (for debt) or as shown for equity.',
      severity:'blue'
    });
  }
  // 6. Dividend income
  if(ais.dividend_ais>5000){
    errors.push({
      type:'info',icon:'🏢',
      title:'Dividend Income Detected in AIS',
      desc:`AIS shows dividend income of ${fmt(ais.dividend_ais)}. Dividends from Indian companies are fully taxable at slab rate from FY 2020-21 onwards. This needs to be declared in your ITR.`,
      action:'Report this under "Income from Other Sources" in your ITR. Check if TDS was deducted (10% above ₹5,000).',
      severity:'blue'
    });
  }
  return errors;
}

function autoFillForm(data){
  const fieldMap={
    gross_salary:'gross',basic_salary:'basic',hra_received:'hra_received',
    prof_tax:'prof_tax',epf_employee:'epf_employee',epf_employer:'epf_employer',
    sec80c:'sec80c',nps:'nps',employer_nps:'employer_nps',
    sec80d_self:'sec80d_self',home_loan_interest:'home_loan_interest',
    sec80e:'sec80e',interest_income_ais:'interest_income',
    rental_income_ais:'rental_income',ltcg_ais:'ltcg',stcg_ais:'stcg',
  };

  // ── TDS: use best available source (26AS > AIS > Form 16) ──
  // 26AS total_tds is the most reliable — it's what IT dept sees
  const tds26as = data.total_tds_26as || 0;
  const tdsAis  = data.tds_total_ais || 0;
  const tdsF16  = data.tds_deducted_form16 || 0;
  // Prefer 26AS, then AIS, then Form 16
  const bestTds = tds26as > 0 ? tds26as : tdsAis > 0 ? tdsAis : tdsF16;
  if(bestTds > 0){
    const dispEl=document.getElementById('tds_deducted_d');
    const hidEl=document.getElementById('tds_deducted');
    if(dispEl&&hidEl){
      dispEl.value=toIN(bestTds);
      hidEl.value=bestTds;
      dispEl.classList.add('autofilled');
      const wEl=document.getElementById('tds_deducted_w');
      if(wEl)wEl.textContent='= ₹'+toWords(bestTds);
      const badge=document.getElementById('af-tds_deducted');
      if(badge)badge.style.display='inline-flex';
    }
  }

  for(const[src,tgt]of Object.entries(fieldMap)){
    const val=data[src];
    if(val&&val>0){
      const dispEl=document.getElementById(tgt+'_d');
      const hidEl=document.getElementById(tgt);
      if(dispEl&&hidEl){
        dispEl.value=toIN(val);
        hidEl.value=val;
        dispEl.classList.add('autofilled');
        const wEl=document.getElementById(tgt+'_w');
        if(wEl)wEl.textContent='= ₹'+toWords(val);
        const badge=document.getElementById('af-'+tgt);
        if(badge)badge.style.display='inline-flex';
      }
    }
  }
  if(data.name){const n=document.getElementById('name');if(n)n.value=data.name;}
}

// =====================================================================================================================================================================
// ── ITR-1 JSON Export ────────────────────────────────────────────────────────
// Generates a pre-filled ITR-1 JSON structure matching IT Dept schema
// User can review and upload to income tax portal or share with CA
function exportITRJson(){
  if(!window._i||!window._o||!window._n){alert('Please generate your tax report first.');return;}

  const win=window._o.tax<window._n.tax?'old':'new';
  const best=win==='old'?window._o:window._n;
  const bestTax=best.tax;
  const tds=window._i.tds_deducted||0;
  const refund=Math.max(0,tds-bestTax);
  const balDue=Math.max(0,bestTax-tds);

  // ITR-1 JSON structure (simplified, based on IT Dept schema)
  const itr1 = {
    "_comment": "Pre-filled ITR-1 data generated by TaxSmart India — verify all values before submission",
    "_generated_by": "TaxSmart India (taxai) — FY 2025-26",
    "_generated_on": new Date().toISOString().split('T')[0],
    "_disclaimer": "This is a planning aid, NOT a legally valid ITR file. Cross-check all figures with your Form 16 and consult a CA before filing.",

    "AssessmentYear": "2025-26",
    "FilingStatus": {
      "ReturnType": "Original",
      "DueDate": "2025-07-31",
      "BelatedReturn": false
    },

    "PersonalInfo": {
      "Name": window._i.name || "",
      "PAN": "",  // Do not pre-fill PAN in exported file for security
      "AssesseeType": "Individual",
      "ResidentialStatus": "Resident",
      "DateOfBirth": "",
      "MobileNo": "",
      "EmailID": ""
    },

    "FilingRegime": {
      "SelectedRegime": win === 'new' ? "NewTaxRegime" : "OldTaxRegime",
      "RecommendedBy": "TaxSmart",
      "TaxSavingVsAlternative": Math.abs(window._o.tax - window._n.tax)
    },

    "IncomeDetails": {
      "IncomeFromSalary": {
        "GrossSalary": window._i.gross || 0,
        "BasicSalary": window._i.basic || 0,
        "HRAReceived": window._i.hra_received || 0,
        "HRAExemptClaimed": win==='old' ? (window._o.deds?.hra||0) : 0,
        "StandardDeduction": win==='new' ? 75000 : 50000,
        "ProfessionalTax": win==='old' ? (window._i.prof_tax||0) : 0,
        "NetSalaryIncome": best.taxable + (win==='old' ? (best.deds?.totalDed||0) : 0)
      },
      "IncomeFromHouseProperty": {
        "RentalIncome": window._i.rental_income||0,
        "StandardDeduction30Pct": Math.round((window._i.rental_income||0)*0.3),
        "NetHousePropertyIncome": Math.round((window._i.rental_income||0)*0.7)
      },
      "IncomeFromOtherSources": {
        "InterestFromSavings": window._i.savings_interest||0,
        "InterestFromFD": window._i.interest_income||0,
        "DividendIncome": 0,
        "GamingIncome": window._i.gaming_income||0
      },
      "CapitalGains": {
        "LTCG_112A": window._i.ltcg||0,
        "LTCG_Exempt": 125000,
        "LTCG_Taxable": Math.max(0,(window._i.ltcg||0)-125000),
        "STCG_111A": window._i.stcg||0,
        "CryptoVDA": window._i.crypto||0
      }
    },

    "DeductionsChapterVIA": win==='old' ? {
      "Sec80C": Math.min((window._i.sec80c||0)+(window._i.epf_employee||0)+(window._i.home_loan_principal||0), 150000),
      "Sec80CCD_1B_NPS": Math.min(window._i.nps||0, 50000),
      "Sec80CCD_2_EmployerNPS": Math.min(window._i.employer_nps||0, (window._i.basic||0)*0.1),
      "Sec80D_Self": Math.min(window._i.sec80d_self||0, (window._i.age||0)>=60?50000:25000),
      "Sec80D_Parents": Math.min(window._i.sec80d_parents||0, 50000),
      "Sec80E_EducationLoan": window._i.sec80e||0,
      "Sec80TTA_SavingsInterest": Math.min(window._i.savings_interest||0, (window._i.age||0)>=60?50000:10000),
      "Sec80G_Donations": Math.round((window._i.sec80g||0)*0.5),
      "Sec80U_Disability": Math.min(window._i.sec80u||0, 125000),
      "Sec24B_HomeLoanInterest": Math.min(window._i.home_loan_interest||0, 200000),
      "TotalDeductions": best.deds?.totalDed||0
    } : {
      "Sec80CCD_2_EmployerNPS": Math.min(window._i.employer_nps||0, (window._i.basic||0)*0.1),
      "Note": "New Regime: Chapter VI-A deductions not applicable (except 80CCD(2))"
    },

    "TaxComputation": {
      "GrossTotalIncome": window._i.gross||0,
      "TotalTaxableIncome": best.taxable||0,
      "TaxOnTotalIncome": bestTax,
      "EffectiveRatePct": window._i.gross>0 ? parseFloat(((bestTax/window._i.gross)*100).toFixed(2)) : 0,
      "Rebate87A": best.taxable<=500000&&win==='old' ? Math.min(12500,bestTax) : (best.taxable<=1200000&&win==='new' ? bestTax : 0),
      "Surcharge": 0,  // see cessBreakdown for actual value
      "HealthAndEducationCess4Pct": Math.round(bestTax*0.04),
      "TotalTaxLiability": bestTax
    },

    "TaxPayments": {
      "TDSFromSalary": tds,
      "AdvanceTax": 0,
      "SelfAssessmentTax": balDue > 0 ? balDue : 0,
      "TotalTaxPaid": tds
    },

    "RefundOrDue": {
      "TaxRefundable": refund,
      "TaxDue": balDue,
      "Status": refund > 0 ? "REFUND" : balDue > 0 ? "TAX_DUE" : "NIL"
    },

    "BankAccount": {
      "Note": "Add your bank IFSC and account number in the IT portal for refund credit"
    },

    "NextSteps": [
      refund>0 ? "File ITR-1 before July 31 to claim ₹"+Math.round(refund).toLocaleString('en-IN')+" refund" : "Pay Self-Assessment Tax of ₹"+Math.round(balDue).toLocaleString('en-IN')+" via Challan 280 before filing",
      "Upload to: https://eportal.incometax.gov.in",
      "Verify all pre-filled data against your Form 16 before submission",
      "E-verify ITR within 30 days of filing using Aadhaar OTP or net banking"
    ]
  };

  const jsonStr = JSON.stringify(itr1, null, 2);
  const blob = new Blob([jsonStr], {type: 'application/octet-stream'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TaxSmart_ITR1_FY2025-26_${new Date().toISOString().split('T')[0]}.json`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);

  // Show confirmation
  const btn = event?.target || document.querySelector('[onclick*="exportITRJson"]');
  if(btn){ const orig=btn.textContent; btn.textContent='✓ Downloaded!'; btn.style.background='#1a472a'; setTimeout(()=>{btn.textContent=orig;btn.style.background='#2d6a4f';},2500); }
}

// ── Keep-alive ping (prevents Render cold start) ────────────────────────────
// Pings server every 10 minutes silently — user never sees this
(function keepAlive(){
  const API = 'https://taxsmart-api.onrender.com';
  function ping(){ fetch(API+'/ping',{method:'GET',mode:'cors'}).catch(()=>{}); }
  ping(); // immediate on load
  setInterval(ping, 10 * 60 * 1000); // then every 10 min
})();

// TAX ENGINE
// =====================================================================================================================================================================

// ── Window exports (required for HTML onclick= attributes with ES modules) ──
if(typeof runExtraction!=="undefined") window.runExtraction=runExtraction;
if(typeof autoFillForm!=="undefined") window.autoFillForm=autoFillForm;
if(typeof exportITRJson!=="undefined") window.exportITRJson=exportITRJson;
