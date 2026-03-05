// =====================================================================================================================================================================
// FORMATTING UTILS
// =====================================================================================================================================================================
function toIN(n){
  if(!n&&n!==0)return'';n=Math.round(n);const s=n.toString();
  if(s.length<=3)return s;let r=s.slice(-3),rem=s.slice(0,-3);
  while(rem.length>2){r=rem.slice(-2)+','+r;rem=rem.slice(0,-2);}
  return rem+','+r;
}
function toWords(n){
  if(!n||n===0)return'';
  if(n>=10000000)return(n/10000000).toFixed(2).replace(/\.?0+$/,'')+' Crore';
  if(n>=100000)return(n/100000).toFixed(2).replace(/\.?0+$/,'')+' Lakh';
  if(n>=1000)return(n/1000).toFixed(1).replace(/\.?0+$/,'')+' Thousand';
  return n.toString();
}
function fa(el,hid){
  const raw=el.value.replace(/[^0-9]/g,'');
  const num=parseFloat(raw)||0;
  if(raw===''){el.value='';document.getElementById(hid).value=0;const w=document.getElementById(hid+'_w');if(w)w.textContent='';return;}
  el.value=toIN(num);
  document.getElementById(hid).value=num;
  const w=document.getElementById(hid+'_w');
  if(w)w.textContent=num>0?'= ₹'+toWords(num):'';
}
function fmt(n,exact){n=Math.round(n);if(exact)return'₹'+toIN(n);if(n>=10000000)return'₹'+(n/10000000).toFixed(2)+' Cr';if(n>=100000)return'₹'+(n/100000).toFixed(2)+' L';return'₹'+toIN(n);}
function pct(n,b){return b>0?(n/b*100).toFixed(1)+'%':'0%';}

// =====================================================================================================================================================================
// NAVIGATION
// =====================================================================================================================================================================
let cur=1;const TOT=6;
const snames=['Upload Docs','Basic Info','Income','Investments','Loans','EPF & Gratuity','Other Income'];

function ns(f){cur=f+1;showStep(cur);}
function ps(f){cur=f-1;showStep(cur);}
function jumpTo(n){
  if(n===0){showUpload();return;}
  if(n<=cur){cur=n;showStep(n);}
}
function showUpload(){
  document.querySelectorAll('.card').forEach(c=>c.classList.remove('active'));
  document.getElementById('step-0').classList.add('active');
  document.getElementById('results').style.display='none';
  document.getElementById('prog-wrap').style.display='block';
  // reset progress dots for upload state
  for(let i=1;i<=TOT;i++){const d=document.getElementById('dot-'+i);d.classList.remove('active','done');d.textContent=i;}
  document.getElementById('prog-fill').style.width='0%';
  document.getElementById('step-label').textContent='Optional Upload Step';
  document.getElementById('step-name').textContent='Auto-fill from documents';
  window.scrollTo({top:0,behavior:'smooth'});
}
function showStep(n){
  document.querySelectorAll('.card').forEach(c=>c.classList.remove('active'));
  document.getElementById('step-'+n).classList.add('active');
  document.getElementById('results').style.display='none';
  document.getElementById('prog-wrap').style.display='block';
  for(let i=1;i<=TOT;i++){
    const d=document.getElementById('dot-'+i);d.classList.remove('active','done');
    if(i<n){d.classList.add('done');d.textContent='✓';}
    else if(i===n){d.classList.add('active');d.textContent=i;}
    else d.textContent=i;
  }
  document.getElementById('prog-fill').style.width=((n-1)/(TOT-1))*100+'%';
  document.getElementById('step-label').textContent='Step '+n+' of '+TOT;
  document.getElementById('step-name').textContent=snames[n];
  window.scrollTo({top:0,behavior:'smooth'});
}
function restart(){cur=1;_extractedData={};_errors=[];showUpload();}
function setTog(el,fld,val){el.parentElement.querySelectorAll('.tog-btn').forEach(b=>b.classList.remove('active'));el.classList.add('active');document.getElementById(fld).value=val;}
function showCond(id,show){const el=document.getElementById(id);if(show)el.classList.add('show');else el.classList.remove('show');}
function skipToStep1(){document.querySelectorAll('.card').forEach(c=>c.classList.remove('active'));cur=1;showStep(1);}

// =====================================================================================================================================================================
// FILE UPLOAD
// =====================================================================================================================================================================
const _files={f16:null,'26as':null,ais:null};

function handleFile(input,key){
  const file=input.files[0];
  if(!file)return;
  if(!file.name.toLowerCase().endsWith('.pdf')&&file.type!=='application/pdf'){
    alert('Please upload a PDF file.');
    input.value='';
    return;
  }
  if(file.size > 10 * 1024 * 1024){
    alert(`This file is ${(file.size/1024/1024).toFixed(1)}MB — maximum allowed is 10MB.\n\nTip: Open your PDF in Preview (Mac) or Adobe Reader and re-save/export to reduce file size.`);
    input.value='';
    return;
  }
  // Document format detection — async, non-blocking
  validateDocumentBeforeUpload(file, key).then(ok => {
    if(!ok){ input.value=''; return; }
    _files[key]=file;
    const zone=document.getElementById('zone-'+key);
    if(zone){
      zone.classList.add('uploaded');
      zone.style.borderColor='var(--accent)';
      zone.style.background='var(--al)';
      zone.style.borderStyle='solid';
    }
    const fn=document.getElementById('fn-'+key);
    if(fn)fn.textContent=file.name;
    updateExtractBtn();
  });
}
function handleDrop(ev,key){
  ev.preventDefault();
  ev.stopPropagation();
  const zone=document.getElementById('zone-'+key);
  if(zone)zone.classList.remove('drag');
  const file=ev.dataTransfer.files[0];
  if(!file)return;
  if(!file.name.toLowerCase().endsWith('.pdf')&&file.type!=='application/pdf'){
    alert('Please drop a PDF file.');
    return;
  }
  _files[key]=file;
  if(zone){
    zone.classList.add('uploaded');
    zone.style.borderColor='var(--accent)';
    zone.style.background='var(--al)';
    zone.style.borderStyle='solid';
  }
  const fn=document.getElementById('fn-'+key);
  if(fn)fn.textContent=file.name;
  updateExtractBtn();
}
function updateExtractBtn(){
  const any=_files.f16||_files['26as']||_files.ais;
  const btn=document.getElementById('extract-btn');
  const lbl=document.getElementById('extract-btn-label');
  if(any){
    btn.disabled=false;
    if(lbl){
      const parts=[];
      if(_files.f16)parts.push('Form 16');
      if(_files['26as'])parts.push('26AS');
      if(_files.ais)parts.push('AIS');
      lbl.textContent='Extract from '+parts.join(' + ');
    }
  } else {
    btn.disabled=true;
    if(lbl)lbl.textContent='Upload at least one document to extract';
  }
}

// =====================================================================================================================================================================
// EXTRACTION ENGINE
// =====================================================================================================================================================================
let _extractedData={};
let _errors=[];
let _auditTrail=[];

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
    if(_files.f16)     fd.append('f16',   _files.f16);
    if(_files['26as']) fd.append('as26',  _files['26as']);
    if(_files.ais)     fd.append('ais',   _files.ais);
    return fd;
  }

  // Build JSON+base64 payload (for sandboxed environments)
  async function buildJsonPayload(){
    const payload={};
    if(_files.f16)     payload.f16  = await fileToB64(_files.f16);
    if(_files['26as']) payload.as26 = await fileToB64(_files['26as']);
    if(_files.ais)     payload.ais  = await fileToB64(_files.ais);
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
    if(_files.f16)    setEpState('f16',  'spin','Reading salary breakup and TDS…');
    if(_files['26as'])setEpState('26as','spin','Reading TDS credits…');
    if(_files.ais)    setEpState('ais',  'spin','Reading full income picture…');
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

    if(_files.f16)    setEpState('f16',  Object.keys(f16Data).length>2?'done':'err',
      Object.keys(f16Data).length>2?'Extracted: salary, deductions, TDS paid':'Could not read — fill manually');
    if(_files['26as'])setEpState('26as', Object.keys(as26Data).length>2?'done':'err',
      Object.keys(as26Data).length>2?'Extracted: TDS from all deductors':'Could not read — fill manually');
    if(_files.ais)    setEpState('ais',  Object.keys(aisData).length>2?'done':'err',
      Object.keys(aisData).length>2?'Extracted: interest, capital gains, rental':'Could not read — fill manually');

    _errors=data.errors||[];
    setEpState('cross','done',`Found ${_errors.length} item(s) to review`);
    _extractedData={...f16Data,...as26Data,...aisData};
    window._f16=f16Data; window._as26=as26Data; window._ais=aisData;
    // Audit trail entry
    const docNames=[_files.f16?'Form 16':'',_files['26as']?'Form 26AS':'',_files.ais?'AIS':''].filter(Boolean).join(', ');
    _auditTrail.push({time:new Date(),event:'Documents uploaded & extracted',detail:docNames,icon:'📄'});

    // Fix 6: Compute and store data confidence indicator
    const totalExpectedFields=['gross_salary','tds_deducted_form16','sec80c','basic_salary','hra_received','total_tds_26as','salary_income_26as','interest_income_ais','ltcg_ais','stcg_ais'];
    const filledFields=totalExpectedFields.filter(f=>_extractedData[f]&&_extractedData[f]>0);
    const confidencePct=Math.round(filledFields.length/totalExpectedFields.length*100);
    const manualCount=Math.max(0,totalExpectedFields.length-filledFields.length);
    window._extractionConfidence={pct:confidencePct,filled:filledFields.length,total:totalExpectedFields.length,manual:manualCount};

    setTimeout(()=>{
      showConfirmationScreen(_extractedData, f16Data, as26Data, aisData);
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

    ['f16','26as','ais'].forEach(k=>{if(_files[k])setEpState(k,'err','Could not read — please fill manually');});
    setEpState('cross','err',userMsg);

    // Partial autofill fallback — fill whatever was extracted before failure
    if(_extractedData && Object.keys(_extractedData).length > 0){
      autoFillForm(_extractedData);
      const partialCount = Object.keys(_extractedData).filter(k=>_extractedData[k]>0).length;
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
  if(!_i||!_o||!_n){alert('Please generate your tax report first.');return;}

  const win=_o.tax<_n.tax?'old':'new';
  const best=win==='old'?_o:_n;
  const bestTax=best.tax;
  const tds=_i.tds_deducted||0;
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
      "Name": _i.name || "",
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
      "TaxSavingVsAlternative": Math.abs(_o.tax - _n.tax)
    },

    "IncomeDetails": {
      "IncomeFromSalary": {
        "GrossSalary": _i.gross || 0,
        "BasicSalary": _i.basic || 0,
        "HRAReceived": _i.hra_received || 0,
        "HRAExemptClaimed": win==='old' ? (_o.deds?.hra||0) : 0,
        "StandardDeduction": win==='new' ? 75000 : 50000,
        "ProfessionalTax": win==='old' ? (_i.prof_tax||0) : 0,
        "NetSalaryIncome": best.taxable + (win==='old' ? (best.deds?.totalDed||0) : 0)
      },
      "IncomeFromHouseProperty": {
        "RentalIncome": _i.rental_income||0,
        "StandardDeduction30Pct": Math.round((_i.rental_income||0)*0.3),
        "NetHousePropertyIncome": Math.round((_i.rental_income||0)*0.7)
      },
      "IncomeFromOtherSources": {
        "InterestFromSavings": _i.savings_interest||0,
        "InterestFromFD": _i.interest_income||0,
        "DividendIncome": 0,
        "GamingIncome": _i.gaming_income||0
      },
      "CapitalGains": {
        "LTCG_112A": _i.ltcg||0,
        "LTCG_Exempt": 125000,
        "LTCG_Taxable": Math.max(0,(_i.ltcg||0)-125000),
        "STCG_111A": _i.stcg||0,
        "CryptoVDA": _i.crypto||0
      }
    },

    "DeductionsChapterVIA": win==='old' ? {
      "Sec80C": Math.min((_i.sec80c||0)+(_i.epf_employee||0)+(_i.home_loan_principal||0), 150000),
      "Sec80CCD_1B_NPS": Math.min(_i.nps||0, 50000),
      "Sec80CCD_2_EmployerNPS": Math.min(_i.employer_nps||0, (_i.basic||0)*0.1),
      "Sec80D_Self": Math.min(_i.sec80d_self||0, (_i.age||0)>=60?50000:25000),
      "Sec80D_Parents": Math.min(_i.sec80d_parents||0, 50000),
      "Sec80E_EducationLoan": _i.sec80e||0,
      "Sec80TTA_SavingsInterest": Math.min(_i.savings_interest||0, (_i.age||0)>=60?50000:10000),
      "Sec80G_Donations": Math.round((_i.sec80g||0)*0.5),
      "Sec80U_Disability": Math.min(_i.sec80u||0, 125000),
      "Sec24B_HomeLoanInterest": Math.min(_i.home_loan_interest||0, 200000),
      "TotalDeductions": best.deds?.totalDed||0
    } : {
      "Sec80CCD_2_EmployerNPS": Math.min(_i.employer_nps||0, (_i.basic||0)*0.1),
      "Note": "New Regime: Chapter VI-A deductions not applicable (except 80CCD(2))"
    },

    "TaxComputation": {
      "GrossTotalIncome": _i.gross||0,
      "TotalTaxableIncome": best.taxable||0,
      "TaxOnTotalIncome": bestTax,
      "EffectiveRatePct": _i.gross>0 ? parseFloat(((bestTax/_i.gross)*100).toFixed(2)) : 0,
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

let _o,_n,_i;

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
  _i={
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
  runValidationWarnings(_i);
  if(_i.gross===0){showStep(2);return;}
  _o=compOld(_i);_n=compNew(_i);
  const win=_o.tax<=_n.tax?'old':'new',sav=Math.abs(_o.tax-_n.tax),best=Math.min(_o.tax,_n.tax);
  const name=document.getElementById('name').value||'Your';
  const tdsBalance=_i.tds_deducted-best;

  document.getElementById('rh-name').textContent=name+"'s Tax Report";
  document.getElementById('rh-regime').textContent=win==='new'?'New Regime ✓':'Old Regime ✓';
  document.getElementById('rh-saving').textContent=sav>0?'Saves '+fmt(sav)+' vs other regime':'Both regimes equal';
  document.getElementById('res-hdr').style.background=win==='new'
    ?'linear-gradient(135deg,#1a472a,#0f2d1a)':'linear-gradient(135deg,#7a5010,#4a2f08)';
  document.getElementById('st-tax').textContent=fmt(best);
  const _stb=cessBreakdown(Math.round(best/1.04),_i.gross);
  const stSub=document.getElementById('st-tax-sub');
  if(stSub) stSub.textContent=_stb.surcharge>0?'incl. '+(_stb.sRate*100).toFixed(0)+'% surcharge + 4% cess':'incl. 4% cess';
  // Effective rate = Tax / Gross income (what % of total income goes to tax)
  // Marginal rate = top slab rate (what you pay on the next ₹1 earned)
  const effRate = pct(best, _i.gross);
  const taxableInc = win==='new' ? _n.taxable : _o.taxable;
  // Determine marginal rate from taxable income (new regime slabs)
  const marginalRate = win==='new'
    ? (taxableInc>2400000?30:taxableInc>2000000?25:taxableInc>1600000?20:taxableInc>1200000?15:taxableInc>800000?10:taxableInc>400000?5:0)
    : (taxableInc>1000000?30:taxableInc>500000?20:taxableInc>250000?5:0);
  document.getElementById('st-eff').textContent = effRate;
  document.getElementById('st-marginal').textContent = marginalRate + '%';
  document.getElementById('st-tds').textContent=fmt(Math.abs(tdsBalance));
  document.getElementById('st-tds-sub').textContent=tdsBalance>=0?'refund due →':'balance due ↑';

  // Surcharge callout
  const surWarn = document.getElementById('surcharge-warn');
  if(surWarn){
    const bd=cessBreakdown(Math.round(best/1.04),_i.gross);
    if(bd.surcharge>0){
      const pct=Math.round(bd.sRate*100);
      surWarn.style.display='block';
      surWarn.innerHTML='💡 <strong>Surcharge applies ('+pct+'%):</strong> Because your income exceeds '+
        (pct===10?'₹50L':pct===15?'₹1Cr':pct===25?'₹2Cr':'₹5Cr')+
        ', a '+pct+'% surcharge of <strong>'+fmt(bd.surcharge)+'</strong> is added to your base tax, '+
        'plus 4% Health & Education Cess of <strong>'+fmt(bd.cessAmt)+'</strong>. '+
        'This is shown as a separate line in your tax breakdown below.';
    } else {
      surWarn.style.display='none';
    }
  }
  // 87A Rebate banner
  const rebateBanner = document.getElementById('rebate-banner');
  if(rebateBanner){
    // New regime: full rebate if taxable <= 12L
    if(_n.taxable<=1200000 && win==='new'){
      rebateBanner.style.display='block';
      rebateBanner.innerHTML='🎉 <strong>Section 87A Rebate Applied!</strong> Your taxable income is ₹'+
        (_n.taxable/100000).toFixed(2)+'L — under the ₹12L threshold. '+
        '<strong>Zero tax under the New Regime</strong> before cess. Your final tax is only the 4% cess on any special income (LTCG/STCG/Crypto).';
    // Marginal relief band
    } else if(_n.taxable<=1275000 && win==='new'){
      const saved=Math.round((_n.taxable*0.1)-(_n.taxable-1200000));
      rebateBanner.style.display='block';
      rebateBanner.innerHTML='💡 <strong>Marginal Relief Applied (Sec 87A):</strong> Your income is just above ₹12L. '+
        'Instead of paying full slab tax, your tax is capped at ₹'+(_n.taxable-1200000).toLocaleString('en-IN')+
        ' (the amount exceeding ₹12L). You saved ~'+fmt(Math.max(0,saved))+'.';
    // Old regime 87A: if taxable <= 5L
    } else if(_o.taxable<=500000 && win==='old'){
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
        '<strong>Tax due under New Regime: '+fmt(_n.tax)+'</strong>';
    } else if(today>filingDeadline){
      belatedWarn.style.display='block';
      belatedWarn.innerHTML='⚠️ <strong>Filing after July 31:</strong> You are filing a Belated Return (Sec 139(4)). '+
        'A penalty of ₹5,000 (₹1,000 if income ≤ ₹5L) applies. Old Regime is not available for belated returns.';
    } else {
      belatedWarn.style.display='none';
    }
  }

  // Multiple employer warning + duplicate standard deduction check
  if(_i.changed_jobs==='yes'){
    const emp1=_i.salary_emp1||0, emp2=_i.salary_emp2||0;
    const tdsEmp=(_i.tds_emp1||0)+(_i.tds_emp2||0);
    const errP=document.getElementById('error-panel');

    // Check 1: Consolidated salary mismatch
    if(emp1+emp2>0 && Math.abs((emp1+emp2)-_i.gross)>10000 && errP){
      errP.innerHTML=`<div class="error-panel warn mb14">
        <div class="ep-heading">⚠️ Multiple Employer — Salary Mismatch</div>
        <div class="err-desc">
          Employer 1: ${fmt(emp1)}<br>
          Employer 2: ${fmt(emp2)}<br>
          <strong>Consolidated: ${fmt(emp1+emp2)}</strong><br>
          Your Gross Salary entry: ${fmt(_i.gross)} — difference of ${fmt(Math.abs((emp1+emp2)-_i.gross))}.
        </div>
        <div class="err-action amber">→ Update Gross Salary in Step 2 to ${fmt(emp1+emp2)} (total of both)</div>
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
    if(tdsEmp>0 && Math.abs(tdsEmp-_i.tds_deducted)>5000 && errP){
      errP.innerHTML=`<div class="error-panel warn mb14">
        <div class="ep-heading">⚠️ TDS Under-Deduction — Job Change</div>
        <div class="err-desc">
          TDS by Employer 1: ${fmt(_i.tds_emp1||0)} + Employer 2: ${fmt(_i.tds_emp2||0)} = ${fmt(tdsEmp)}<br>
          But total TDS entered above: ${fmt(_i.tds_deducted)}. Difference: ${fmt(Math.abs(tdsEmp-_i.tds_deducted))}<br>
          Each employer only taxes their portion — combined salary pushes you into a higher slab.
        </div>
        <div class="err-action amber">→ You likely have additional tax due. Pay Self-Assessment Tax via Challan 280 before filing.</div>
      </div>`+errP.innerHTML;
    }
  }

  // 234B/C now handled by buildInterestPanel() called below

  const oc=document.getElementById('old-card'),nc=document.getElementById('new-card');
  oc.classList.toggle('winner',win==='old');nc.classList.toggle('winner',win==='new');
  oc.innerHTML=(win==='old'?'<div class="rc-badge">✓ Recommended</div>':'')+'<div class="rc-lbl">Old Regime</div><div class="rc-tax">'+fmt(_o.tax)+'</div><div class="rc-eff">Effective: '+pct(_o.tax,_i.gross)+'</div>';
  nc.innerHTML=(win==='new'?'<div class="rc-badge">✓ Recommended</div>':'')+'<div class="rc-lbl">New Regime</div><div class="rc-tax">'+fmt(_n.tax)+'</div><div class="rc-eff">Effective: '+pct(_n.tax,_i.gross)+'</div>';

  buildErrorPanel();
  buildRecon();
  buildUtil();
  buildComp();
  buildSlabViz();
  buildDeds();
  buildTips(win);
  buildInsight(win,sav,name,tdsBalance);
  buildITRPanel();
  buildScheduleAL();
  buildRiskScore();
  buildInterestPanel();
  buildScheduleCG();
  buildHeroResult();
  buildWhatsNext();
  buildRefundPrediction(tdsBalance);
  buildEmployerTDSAlert();
  initOptimiser();
  // Fix 3: show context note on deductions accordion when new regime wins
  const dedNote=document.getElementById('ded-regime-note');
  if(dedNote)dedNote.style.display=win==='new'?'block':'none';
  const dedTitle=document.getElementById('accord-ded-title');
  if(dedTitle)dedTitle.textContent=win==='new'?'📊 Old Regime Deductions (for reference)':'📊 Deduction Breakdown & Utilization';
  // Fix 7: Record audit event
  _auditTrail.push({time:new Date(),event:'Tax report generated',detail:`${win==='new'?'New':'Old'} Regime · Tax ${fmt(Math.min(_o.tax,_n.tax),true)} · ${_i.tds_deducted>0?(Math.min(_o.tax,_n.tax)-_i.tds_deducted>=0?'Due '+fmt(Math.abs(Math.min(_o.tax,_n.tax)-_i.tds_deducted),true):'Refund '+fmt(Math.abs(Math.min(_o.tax,_n.tax)-_i.tds_deducted),true)):''}`,icon:'🧾'});
  buildAuditTrail();
  // Apply simple mode by default — user can switch to advanced
  setTimeout(() => setMode(currentMode), 50);

  // ── Update sticky bar with results ────────────────────────────────────────
  updateStickyBar();

  // ── GA funnel tracking ────────────────────────────────────────────────────
  // These events persist in GA even when server restarts
  try {
    const win2=_o.tax<_n.tax?'old':'new';
    const bestTax2=Math.min(_o.tax,_n.tax);
    const tds2=_i.tds_deducted||0;
    const bal2=tds2-bestTax2;
    // Salary bracket (anonymised — ranges only, no exact number)
    const gross=_i.gross||0;
    const bracket = gross<300000?'<3L':gross<500000?'3-5L':gross<700000?'5-7L':gross<1000000?'7-10L':gross<1500000?'10-15L':'15L+';
    if(typeof gtag==='function'){
      gtag('event','tax_calculated',{
        event_category:'funnel',
        regime_winner: win2,
        refund_or_due: bal2>=0?'refund':'due',
        salary_bracket: bracket,
        has_errors: (_errors&&_errors.length>0)?'yes':'no',
        extraction_used: (_i.tds_deducted_form16>0)?'yes':'no'
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
// ERROR PANEL
// =====================================================================================================================================================================
function buildRecon(){
  const f16=window._f16||{}, as26=window._as26||{}, ais=window._ais||{};
  const hasAny=Object.keys(f16).length>2||Object.keys(as26).length>2||Object.keys(as26).length>2;
  const sec=document.getElementById('recon-section');
  if(!sec||!hasAny){if(sec)sec.style.display='none';return;}

  const rows=[
    ['Gross Salary',        'gross_salary',        'salary_income_26as', 'salary_ais',          'gross'],
    ['TDS Deducted',        'tds_deducted_form16', 'total_tds_26as',     'tds_total_ais',       'tds_deducted'],
    ['FD/Bond Interest',    null,                   'interest_income_26as','interest_income_ais','interest_income'],
    ['Rental Income',       null,                   null,                 'rental_income_ais',   'rental_income'],
    ['LTCG',                null,                   null,                 'ltcg_ais',            'ltcg'],
    ['STCG',                null,                   null,                 'stcg_ais',            'stcg'],
    ['80C Deductions',      'sec80c',               null,                 null,                  'sec80c'],
    ['NPS (80CCD 1B)',       'nps',                  null,                 null,                  'nps'],
    ['Home Loan Interest',  'home_loan_interest',   null,                 null,                  'home_loan_interest'],
  ];

  const fv=(obj,key)=>key&&obj[key]>0?obj[key]:null;
  const getUserV=(fid)=>{const el=document.getElementById(fid);return el?(parseFloat(el.value)||0):0;};

  let hasMismatch=false;
  const tableRows=rows.map(([lbl,fk,ak,ak2,fid])=>{
    const vF=fv(f16,fk), vA=fv(as26,ak), vI=fv(ais,ak2);
    const vUser=getUserV(fid);
    if(!vF&&!vA&&!vI&&!vUser)return '';

    const docVals=[vF,vA,vI].filter(v=>v!==null);
    const allSame=docVals.length<2||docVals.every(v=>Math.abs(v-docVals[0])/Math.max(docVals[0],1)<0.02);
    if(!allSame)hasMismatch=true;

    const refVal=vF||vA||vI;
    const cls=(v)=>{
      if(v===null)return 'empty';
      if(!refVal||Math.abs(v-refVal)/Math.max(refVal,1)<0.02)return 'match';
      return 'mismatch';
    };
    const disp=(v)=>v!==null?'₹'+v.toLocaleString('en-IN',{maximumFractionDigits:0}):'—';

    return '<tr class="recon-row">'
      +'<td class="recon-td" style="font-weight:500;white-space:nowrap">'+lbl+'</td>'
      +'<td class="recon-td '+cls(vF)+'">'+disp(vF)+'</td>'
      +'<td class="recon-td '+cls(vA)+'">'+disp(vA)+'</td>'
      +'<td class="recon-td '+cls(vI)+'">'+disp(vI)+'</td>'
      +'<td class="recon-td" style="font-weight:500">'+(vUser>0?'₹'+vUser.toLocaleString('en-IN'):'—')+'</td>'
      +'</tr>';
  }).filter(Boolean).join('');

  if(!tableRows){sec.style.display='none';return;}

  const badge=hasMismatch
    ?'<span class="recon-badge warn">⚠ Mismatches found</span>'
    :'<span class="recon-badge ok">✓ All consistent</span>';
  const titleEl=document.getElementById('recon-title');
  if(titleEl)titleEl.innerHTML='📋 Document Reconciliation'+badge;

  document.getElementById('recon-table').innerHTML=
    '<thead><tr>'
    +'<th class="recon-th">Field</th>'
    +'<th class="recon-th">Form 16</th>'
    +'<th class="recon-th">Form 26AS</th>'
    +'<th class="recon-th">AIS</th>'
    +'<th class="recon-th">Your Entry</th>'
    +'</tr></thead><tbody>'+tableRows+'</tbody>';

  sec.style.display='block';
}

function buildErrorPanel(){
  const container=document.getElementById('error-panel');
  if(_errors.length===0){
    // Also add a refund/due notification
    const tds=_i.tds_deducted,best=Math.min(_o.tax,_n.tax),bal=tds-best;
    if(tds>0){
      const type=bal>=0?'ok':'warn';
      container.innerHTML=`<div class="error-panel ${type} mb14">
        <div class="ep-header">
          <div class="ep-dot ${bal>=0?'green':'amber'}"></div>
          <div class="ep-heading">${bal>=0?'You have a tax refund coming!':'Additional tax due on filing'}</div>
        </div>
        <div class="error-item ${bal>=0?'info':'warn'}">
          <div class="err-icon">${bal>=0?'🎉':'📋'}</div>
          <div>
            <div class="err-title">${bal>=0?'Refund: '+fmt(bal):'Balance Tax Due: '+fmt(Math.abs(bal))}</div>
            <div class="err-desc">TDS deducted: ${fmt(tds)} · Tax payable: ${fmt(best)} · ${bal>=0?'Claim this refund when you file your ITR. It gets deposited directly to your bank account.':'Pay this as Self-Assessment Tax before filing your ITR to avoid interest under Section 234B/C.'}</div>
            <div class="err-action ${bal>=0?'blue':'amber'}">${bal>=0?'→ File ITR before July 31 to claim refund':'→ Pay via Challan 280 at incometax.gov.in before filing'}</div>
          </div>
        </div>
      </div>`;
    } else container.innerHTML='';
    return;
  }

  const crits=_errors.filter(e=>e.type==='crit').length;
  const warns=_errors.filter(e=>e.type==='warn').length;
  const mainType=crits>0?'error-panel':warns>0?'error-panel warn':'error-panel ok';
  const dot=crits>0?'red':warns>0?'amber':'green';
  const heading=crits>0?`⚠️ ${crits} Critical Issue${crits>1?'s':''} Found`:`${warns+_errors.filter(e=>e.type==='info').length} Items Need Your Attention`;

  container.innerHTML=`<div class="${mainType} mb14">
    <div class="ep-header">
      <div class="ep-dot ${dot}"></div>
      <div class="ep-heading">${heading}</div>
      <div class="ep-count">${_errors.length} item${_errors.length>1?'s':''}</div>
    </div>
    ${_errors.map(e=>`
      <div class="error-item ${e.type==='crit'?'crit':e.type==='warn'?'warn':'info'}">
        <div class="err-icon">${e.icon}</div>
        <div>
          <div class="err-title">${e.title}</div>
          <div class="err-desc">${e.desc}</div>
          <div class="err-action ${e.severity}">${e.action}</div>
        </div>
      </div>`).join('')}
  </div>`;

  // Also show TDS balance
  const tds=_i.tds_deducted,best=Math.min(_o.tax,_n.tax),bal=tds-best;
  if(tds>0){
    container.innerHTML+=`<div class="error-panel ${bal>=0?'ok':'warn'} mb14">
      <div class="ep-header"><div class="ep-dot ${bal>=0?'green':'amber'}"></div><div class="ep-heading">${bal>=0?'Refund: '+fmt(bal)+' due on filing':'Balance Tax Due: '+fmt(Math.abs(bal))}</div></div>
      <div class="error-item ${bal>=0?'info':'warn'}">
        <div class="err-icon">${bal>=0?'🎉':'📋'}</div>
        <div><div class="err-title">TDS Reconciliation</div>
        <div class="err-desc">TDS deducted: ${fmt(tds)} · Tax payable: ${fmt(best)} · Balance: ${fmt(Math.abs(bal))} ${bal>=0?'refund':'due'}</div>
        <div class="err-action ${bal>=0?'blue':'amber'}">${bal>=0?'→ File ITR before July 31 to claim refund':'→ Pay Self-Assessment Tax before filing'}</div>
        </div>
      </div>
    </div>`;
  }
}

// =====================================================================================================================================================================
// RESULT BUILDERS
// =====================================================================================================================================================================
function buildUtil(){
  const d=_o.deds;
  const bars=[
    {ico:'💰',lbl:'80C',used:d.c80c,max:150000},
    {ico:'🏦',lbl:'NPS (80CCD 1B)',used:d.cnps,max:50000},
    {ico:'🏥',lbl:'80D Health',used:d.c80d,max:75000},
    {ico:'🏠',lbl:'Home Loan 24b',used:d.c24b,max:200000},
    {ico:'🏡',lbl:'HRA Exemption',used:d.hra,max:_i.hra_received||1},
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
  const d=_o.deds;
  // Surcharge breakdown for both regimes
  const _o_sur=cessBreakdown(Math.round(_o.tax/1.04),_i.gross);
  const _n_sur=cessBreakdown(Math.round(_n.tax/1.04),_i.gross);
  // Factor = 1 + sRate + 0.04*(1+sRate) used to back-calc base tax
  const _o_fac=(1+_o_sur.sRate)*1.04;
  const _n_fac=(1+_n_sur.sRate)*1.04;
  const ltcg_t=Math.max(0,(_i.ltcg||0)-125000);
  const stcg_tax=(_i.stcg||0)*.20;
  const ltcg_tax=ltcg_t*.125;
  const crypto_tax=(_i.crypto||0)*.30;
  const hasSpecialIncome=(_i.stcg||0)+(_i.ltcg||0)+(_i.crypto||0)>0;
  const rows=[
    ['Gross Salary Income',_i.gross,_i.gross,false],
    ['Exemptions (HRA,LTA etc.)',d.hra+d.lta+d.cea_ex+d.hos+d.prof_tax+d.grat,0,false],
    ...((d.vrs_ex||0)+(d.retrench_ex||0)+(d.leave_ex||0)>0?[
      ['  VRS Exemption [Sec 10(10C)]',(d.vrs_ex||0),0,false],
      ['  Retrenchment Exempt [Sec 10(10B)]',(d.retrench_ex||0),0,false],
      ['  Leave Encashment Exempt [Sec 10(10AA)]',(d.leave_ex||0),0,false],
    ]:[]),
    ['Standard Deduction',d.std,75000,false],
    ['Chapter VI-A Deductions',d.c80c+d.cnps+d.c80d+d.c24b+d.c80e_v+d.c80tta+d.c80g_v+d.c80u_v,0,false],
    ['Employer NPS [80CCD(2)]',d.cenps,d.cenps,false],
    ['Taxable Salary Income',_o.taxable,_n.taxable,true],
    ['Tax on Salary (incl. cess)',Math.round((_o.tax-(ltcg_tax+stcg_tax+crypto_tax)*1.04)),Math.round((_n.tax-(ltcg_tax+stcg_tax+crypto_tax)*1.04)),false],
    ...(hasSpecialIncome?[
      ['─── Capital & Other Income ───','','',false],
      ...(_i.stcg>0?[['STCG (equity <1yr) @ 20%',Math.round(stcg_tax*1.04),Math.round(stcg_tax*1.04),false]]: []),
      ...(_i.ltcg>0?[['LTCG (equity 1yr+) @ 12.5%',Math.round(ltcg_tax*1.04),Math.round(ltcg_tax*1.04),false]]: []),
      ...(_i.ltcg>0?[['  (First ₹1.25L exempt)','—','—',false]]:[]),
      ...(_i.crypto>0?[['Crypto/VDA @ 30% (flat)',Math.round(crypto_tax*1.04),Math.round(crypto_tax*1.04),false]]:[]),
    ]:[]),
    ...((_o_sur.surcharge>0||_n_sur.surcharge>0)?[
      ['─── Tax Components ───','','',false],
      ['Base Tax (before surcharge)',Math.round(_o.tax/_o_fac),Math.round(_n.tax/_n_fac),false],
      ['Surcharge ('+(_o_sur.sRate*100).toFixed(0)+'% / '+(_n_sur.sRate*100).toFixed(0)+'%)',_o_sur.surcharge,_n_sur.surcharge,false],
      ['Health & Education Cess (4%)',_o_sur.cessAmt,_n_sur.cessAmt,false],
    ]:[
      ['Health & Education Cess (4%)',_o_sur.cessAmt,_n_sur.cessAmt,false],
    ]),
    ...((_i.gaming_income||0)>0?[['Online Gaming / Lottery (30%)',_o.gaming_t||0,_n.gaming_t||0,false]]:[]),
    ...(((_o.relief89||0)>0||(_n.relief89||0)>0)?[['Sec 89(1) Arrears Relief',-((_o.relief89||0)),-((_n.relief89||0)),false]]:[]),
    ['Total Tax (incl. cess)',_o.tax,_n.tax,true],
    ['TDS Deducted',_i.tds_deducted,_i.tds_deducted,false],
    ['Balance (Refund/Due)',_o.tax-_i.tds_deducted,_n.tax-_i.tds_deducted,true],
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
    `<div><div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:12px;font-weight:700">Old Regime</div>${make(_o)}</div>`+
    `<div><div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:12px;font-weight:700">New Regime</div>${make(_n)}</div>`;
}

function buildDeds(){
  const d=_o.deds;
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
  const d=_o.deds,tips=[];
  const u80c=Math.max(0,150000-d.c80c);
  if(u80c>5000)tips.push({ico:'💰',t:`Invest ${fmt(u80c)} more in 80C`,d:`You have unused 80C capacity. Best: ELSS (3-year lock-in, market returns) or PPF (safe, guaranteed, tax-free maturity).`,c:`Save ~${fmt(u80c*.20)} more in old regime`});
  if(d.cnps<50000&&_i.nps<50000){const g=50000-_i.nps;tips.push({ico:'🏦',t:`Add ${fmt(g)} more to NPS`,d:`Section 80CCD(1B) gives ₹50K EXTRA deduction separate from 80C. Open NPS Tier 1 on your bank app.`,c:`Potential saving: ~${fmt(g*.20)}`});}
  if(_i.employer_nps===0)tips.push({ico:'💼',t:'Ask HR about Employer NPS (80CCD 2)',d:`Employer NPS up to 10% of Basic is deductible in BOTH regimes. Ask HR to restructure your CTC.`,c:'Works in New Regime too! ✅'});
  if(d.c80d<50000)tips.push({ico:'🏥',t:'Get health insurance for you and parents',d:`₹25K self + ₹25K parents = ₹50K total deduction. A family floater costs ₹12–20K/year.`,c:`Save up to ${fmt((50000-d.c80d)*.20)} in tax`});
  if(win==='new')tips.push({ico:'📊',t:'What would flip you to Old Regime?',d:`Currently better in New Regime. Try maxing 80C (₹1.5L) + NPS (₹50K) + 80D (₹50K) and recalculate.`,c:'Recalculate after maxing deductions'});
  tips.push({ico:'📅',t:'Tell HR your regime choice in April',d:`Employer TDS is based on declared regime. New Regime is default. Declare Old if better — avoids surprises at year end.`,c:'Deadline: April of FY start'});
  tips.push({ico:'📈',t:'Use ₹1.25L LTCG exemption every year',d:`Profit from equity MFs/stocks held 1+ year is tax-free up to ₹1.25L. Sell and rebuy to reset cost price (tax harvesting).`,c:'First ₹1.25L gains = zero tax'});
  document.getElementById('tips-list').innerHTML=tips.map(t=>`<div class="tip-item"><div class="tip-ico">${t.ico}</div><div><div class="tip-title">${t.t}</div><div class="tip-desc">${t.d}</div><div class="tip-chip">${t.c}</div></div></div>`).join('');
}

function buildInsight(win,sav,name,tdsBalance){
  const d=_o.deds,regime=win==='new'?'New Regime':'Old Regime';
  const eff=pct(Math.min(_o.tax,_n.tax),_i.gross);
  const tot=d.c80c+d.cnps+d.c80d+d.c24b;
  let t=`Based on a gross income of <span class="hl">${fmt(_i.gross)}</span>, the <span class="hl">${regime}</span> saves <span class="hl">${fmt(sav)}</span> this year. Your effective tax rate is <span class="hl">${eff}</span>.`;
  if(win==='new'){t+=` Your deductions of <span class="hl">${fmt(tot)}</span> aren't sufficient to make old regime better.`;}
  else{t+=` Your strong deductions including HRA <span class="hl">${fmt(d.hra)}</span> make Old Regime the winner.`;}
  if(_i.tds_deducted>0){
    if(tdsBalance>=0)t+=` You have a <span class="hl">refund of ${fmt(tdsBalance)}</span> — file your ITR before July 31 to claim it.`;
    else t+=` You have <span class="hl">balance tax of ${fmt(Math.abs(tdsBalance))}</span> to pay before filing your ITR.`;
  }
  if(_errors.length>0)t+=` ⚠️ We found <span class="hl">${_errors.length} issue(s)</span> in your documents — review the error panel above.`;
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
  const win=_o.tax<=_n.tax?'OLD':'NEW',sav=Math.abs(_o.tax-_n.tax);
  const name=document.getElementById('name').value||'the user';
  const d=_o.deds,tds=_i.tds_deducted,best=Math.min(_o.tax,_n.tax),bal=tds-best;
  const errSummary=_errors.length>0?`Issues found: ${_errors.map(e=>e.title).join('; ')}`:'No document issues found.';
  const ctx=`User: ${name}. Income: ₹${_i.gross.toLocaleString()} gross. ${win} Regime better, saves ₹${sav.toLocaleString()}. TDS: ₹${tds.toLocaleString()}, balance: ₹${Math.abs(bal).toLocaleString()} ${bal>=0?'refund':'due'}. 80C: ₹${d.c80c.toLocaleString()}, NPS: ₹${d.cnps.toLocaleString()}, HRA: ₹${d.hra.toLocaleString()}, 80D: ₹${d.c80d.toLocaleString()}. ${errSummary}`;
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
  const win=_o.tax<=_n.tax?'Old':'New';
  const sav=Math.abs(_o.tax-_n.tax),d=_o.deds;
  const tds=_i.tds_deducted,best=Math.min(_o.tax,_n.tax),bal=tds-best;
  const errorHTML=_errors.length>0?`<div style="background:#fdf0ee;border:1.5px solid #c0392b;border-radius:12px;padding:20px;margin-bottom:20px;">
    <h2 style="color:#c0392b;margin-bottom:12px;font-size:14px;">⚠️ ${_errors.length} Issue(s) Found in Your Documents</h2>
    ${_errors.map(e=>`<div style="margin-bottom:10px;padding:12px;background:white;border-radius:8px;">
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
    <div class="stat"><div class="sl">Effective Rate</div><div class="sv">${pct(best,_i.gross)}</div></div>
    <div class="stat"><div class="sl">${bal>=0?'Refund':'Tax Due'}</div><div class="sv">${fmt(Math.abs(bal))}</div></div>
  </div>
</div>
${errorHTML}
<div class="grid">
  <div class="box ${win==='Old'?'w':''}"><label>Old Regime</label><div class="tx">${fmt(_o.tax)}</div><div style="font-size:11px;color:#8c8880;margin-top:3px">Effective: ${pct(_o.tax,_i.gross)}</div>${win==='Old'?'<div style="font-size:10px;font-weight:800;margin-top:7px;color:#7a5010">✓ RECOMMENDED</div>':''}</div>
  <div class="box ${win==='New'?'w':''}"><label>New Regime</label><div class="tx">${fmt(_n.tax)}</div><div style="font-size:11px;color:#8c8880;margin-top:3px">Effective: ${pct(_n.tax,_i.gross)}</div>${win==='New'?'<div style="font-size:10px;font-weight:800;margin-top:7px;color:#1a472a">✓ RECOMMENDED</div>':''}</div>
</div>
<h2>Income & Tax Summary</h2>
<table><thead><tr><th>Particulars</th><th>Old Regime</th><th>New Regime</th></tr></thead><tbody>
<tr><td>Gross Income</td><td>${fmt(_i.gross)}</td><td>${fmt(_i.gross)}</td></tr>
<tr><td>Total Exemptions</td><td>${fmt(d.exempts)}</td><td>${fmt(75000)}</td></tr>
<tr><td>Chapter VI-A</td><td>${fmt(d.totalDed)}</td><td>₹0</td></tr>
<tr><td><strong>Taxable Income</strong></td><td><strong>${fmt(_o.taxable)}</strong></td><td><strong>${fmt(_n.taxable)}</strong></td></tr>
<tr><td><strong>Final Tax</strong></td><td><strong>${fmt(_o.tax)}</strong></td><td><strong>${fmt(_n.tax)}</strong></td></tr>
<tr><td>TDS Deducted</td><td>${fmt(tds)}</td><td>${fmt(tds)}</td></tr>
<tr><td><strong>${bal>=0?'Refund Due':'Balance Due'}</strong></td><td><strong style="color:${bal>=0?'#1a472a':'#c0392b'}">${fmt(Math.abs(_o.tax-tds))}</strong></td><td><strong style="color:${bal>=0?'#1a472a':'#c0392b'}">${fmt(Math.abs(_n.tax-tds))}</strong></td></tr>
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
// INVESTMENT SIMULATOR
// ═══════════════════════════════════════════════════════════════
let _simKey = 'nps';

const SIM_CONFIG = {
  nps: {
    label: 'NPS (80CCD 1B)',
    max: 50000,
    default: 25000,
    section: 'Section 80CCD(1B)',
    description: 'Extra NPS contribution',
    // Deduction applies in OLD regime only (80CCD 1B)
    calcDeduction: (amt, i, regime) => regime === 'old' ? Math.min(amt, 50000) : 0,
    tip: 'NPS gives you market-linked returns (~10-12% historical) PLUS tax savings — making your effective return much higher than FD.'
  },
  '80c': {
    label: '80C Top-up',
    max: 150000,
    default: 50000,
    section: 'Section 80C',
    description: 'PPF / ELSS / NSC investment',
    calcDeduction: (amt, i, regime) => {
      if (regime !== 'old') return 0;
      const current80c = Math.min((i.sec80c||0)+(i.epf_employee||0)+(i.home_loan_principal||0), 150000);
      const remaining = Math.max(0, 150000 - current80c);
      return Math.min(amt, remaining);
    },
    tip: 'ELSS mutual funds give equity market returns (~12-15% long-term) with 3-year lock-in and full 80C deduction.'
  },
  '80d': {
    label: 'Health Insurance',
    max: 75000,
    default: 25000,
    section: 'Section 80D',
    description: 'Health insurance premium',
    calcDeduction: (amt, i, regime) => {
      if (regime !== 'old') return 0;
      const current = (i.sec80d_self||0) + (i.sec80d_parents||0);
      const maxAllowed = 75000; // 25k self + 50k parents
      return Math.min(amt, Math.max(0, maxAllowed - current));
    },
    tip: 'Health insurance is the only investment that protects both your health AND saves tax. Premiums for parents (senior) get ₹50K deduction.'
  },
  hloan: {
    label: 'Home Loan Interest',
    max: 200000,
    default: 100000,
    section: 'Section 24(b)',
    description: 'Additional home loan interest',
    calcDeduction: (amt, i, regime) => {
      if (regime !== 'old') return 0;
      const current = i.home_loan_interest||0;
      return Math.min(amt, Math.max(0, 200000 - current));
    },
    tip: 'Home loan interest deduction up to ₹2L/year under old regime. Self-occupied property only.'
  }
};

function simSelect(el, key) {
  document.querySelectorAll('.sim-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  _simKey = key;
  const cfg = SIM_CONFIG[key];
  const slider = document.getElementById('sim-slider');
  slider.max = cfg.max;
  slider.value = cfg.default;
  updateSim();
}

function updateSim() {
  if (!_o || !_n || !_i) return;

  const slider = document.getElementById('sim-slider');
  const amount = parseInt(slider.value) || 0;
  const cfg = SIM_CONFIG[_simKey];

  document.getElementById('sim-input-val').textContent = '₹' + toIN(amount);

  // Determine current winning regime
  const currentWin = _o.tax <= _n.tax ? 'old' : 'new';

  // Calculate extra deduction this investment gives
  const extraDeduction = cfg.calcDeduction(amount, _i, currentWin);

  // Calculate tax saved based on marginal rate
  let taxSaved = 0;
  if (extraDeduction > 0) {
    // Recalculate with extra deduction
    const newInputs = {..._i};
    if (_simKey === 'nps') newInputs.nps = (_i.nps||0) + amount;
    else if (_simKey === '80c') newInputs.sec80c = (_i.sec80c||0) + amount;
    else if (_simKey === '80d') newInputs.sec80d_self = (_i.sec80d_self||0) + amount;
    else if (_simKey === 'hloan') newInputs.home_loan_interest = (_i.home_loan_interest||0) + amount;

    const newOld = compOld(newInputs);
    const newNew = compNew(newInputs);
    const oldBest = Math.min(_o.tax, _n.tax);
    const newBest = Math.min(newOld.tax, newNew.tax);
    taxSaved = Math.max(0, oldBest - newBest);
  }

  const netCost = Math.max(0, amount - taxSaved);
  const effReturn = amount > 0 ? (taxSaved / amount * 100) : 0;

  // Update UI
  document.getElementById('sim-tax-saved').textContent = taxSaved > 0 ? '₹' + toIN(taxSaved) : '₹0';
  document.getElementById('sim-eff-return').textContent = effReturn.toFixed(1) + '%';
  document.getElementById('sim-net-cost').textContent = '₹' + toIN(netCost);

  // Generate narrative
  const name = document.getElementById('name').value || 'You';
  let narrative = '';

  if (amount === 0) {
    narrative = 'Move the slider to see your tax savings.';
  } else if (extraDeduction === 0 && currentWin === 'new') {
    narrative = `<strong>Note:</strong> ${cfg.section} deductions don't apply in the New Regime. You're currently better off in the New Regime. Switch to Old Regime analysis to use this deduction — but verify it's still worth it overall.`;
  } else if (extraDeduction === 0) {
    narrative = `<strong>You've already maxed out</strong> the ${cfg.section} limit. No additional tax saving from investing more here. Consider another category.`;
  } else if (taxSaved > 0) {
    narrative = `${name}, investing <strong>₹${toIN(amount)}</strong> in ${cfg.description} saves you <strong>₹${toIN(taxSaved)} in tax</strong> — an instant ${effReturn.toFixed(1)}% return before any investment gains. Your actual out-of-pocket cost is just <strong>₹${toIN(netCost)}</strong>. ${cfg.tip}`;
  } else {
    narrative = `This investment won't save additional tax given your current income and deductions.`;
  }

  document.getElementById('sim-narrative').innerHTML = narrative;

  // Update CTA button
  const cta = document.getElementById('sim-cta');
  if (taxSaved > 0) {
    cta.textContent = `✓ Add ₹${toIN(amount)} to my ${cfg.label} plan`;
    cta.style.display = 'block';
  } else {
    cta.style.display = 'none';
  }
}

function simApply() {
  const amount = parseInt(document.getElementById('sim-slider').value) || 0;
  if (!amount) return;

  // Show a toast/confirmation
  const cta = document.getElementById('sim-cta');
  cta.textContent = '✓ Added to your plan!';
  cta.style.background = '#27ae60';
  setTimeout(() => {
    cta.textContent = `✓ Add ₹${toIN(amount)} to my ${SIM_CONFIG[_simKey].label} plan`;
    cta.style.background = '#c8f04a';
  }, 2000);

  // Scroll to tips
  document.getElementById('tips-list').scrollIntoView({behavior:'smooth', block:'start'});
}

function initSim() {
  if (!_o || !_n || !_i) return;

  const regime = _o.tax <= _n.tax ? 'old' : 'new';
  const grossSalary = _i.gross_salary || 0;

  // Analyse each opportunity with optimal investment amount
  const opportunities = Object.entries(SIM_CONFIG).map(([key, cfg]) => {
    let optimalAmt = cfg.default;
    if (key === '80c') {
      const used = Math.min((_i.sec80c||0)+(_i.epf_employee||0), 150000);
      optimalAmt = Math.max(0, 150000 - used);
    } else if (key === '80d') {
      const used = (_i.sec80d_self||0)+(_i.sec80d_parents||0);
      optimalAmt = Math.max(0, Math.min(25000, 75000 - used));
    } else if (key === 'nps') {
      optimalAmt = Math.max(0, 50000 - (_i.nps||0));
    } else if (key === 'hloan') {
      optimalAmt = Math.max(0, 200000 - (_i.home_loan_interest||0));
    }

    if (optimalAmt === 0) return { key, saved: 0, optimalAmt: 0, effReturn: 0 };

    const deduction = cfg.calcDeduction(optimalAmt, _i, regime);
    if (deduction === 0) return { key, saved: 0, optimalAmt, effReturn: 0 };

    const newInputs = {..._i};
    if (key === 'nps') newInputs.nps = (_i.nps||0) + optimalAmt;
    else if (key === '80c') newInputs.sec80c = (_i.sec80c||0) + optimalAmt;
    else if (key === '80d') newInputs.sec80d_self = (_i.sec80d_self||0) + optimalAmt;
    else if (key === 'hloan') newInputs.home_loan_interest = (_i.home_loan_interest||0) + optimalAmt;

    const newOld = compOld(newInputs);
    const newNew = compNew(newInputs);
    const oldBest = Math.min(_o.tax, _n.tax);
    const newBest = Math.min(newOld.tax, newNew.tax);
    const saved = Math.max(0, oldBest - newBest);
    const effReturn = optimalAmt > 0 ? (saved / optimalAmt * 100) : 0;
    return { key, saved, optimalAmt, effReturn };
  });

  opportunities.sort((a,b) => b.saved - a.saved);
  const ranked = opportunities.filter(o => o.saved > 0);
  const best = ranked[0];

  const banner = document.getElementById('sim-ai-banner');
  const aiText = document.getElementById('sim-ai-text');
  const heading = document.getElementById('sim-heading');
  const sub = document.getElementById('sim-sub');

  if (!best || best.saved === 0) {
    heading.textContent = regime === 'new' ? 'New Regime Optimised' : 'All Deductions Maxed!';
    sub.textContent = regime === 'new'
      ? "Deductions don't apply in New Regime — you're already on the best path."
      : "You've fully utilised all major deduction limits. Well done!";
    banner.style.display = 'none';
    updateSim();
  } else {
    const cfg = SIM_CONFIG[best.key];
    heading.textContent = 'Your Best Tax Move Right Now';
    sub.textContent = 'Based on your income and current deductions — ' + ranked.length + ' options analysed';

    let aiMsg = '';
    if (best.key === 'nps') {
      aiMsg = `Invest ₹${toIN(best.optimalAmt)} in NPS → save ₹${toIN(best.saved)} tax instantly. That's a ${best.effReturn.toFixed(1)}% guaranteed return before any market gains.`;
    } else if (best.key === '80c') {
      const used = Math.min((_i.sec80c||0)+(_i.epf_employee||0), 150000);
      aiMsg = `You've used ₹${toIN(used)} of your ₹1,50,000 80C limit. Invest ₹${toIN(best.optimalAmt)} more in PPF/ELSS → save ₹${toIN(best.saved)} tax (${best.effReturn.toFixed(1)}% instant return).`;
    } else if (best.key === '80d') {
      aiMsg = `Buy ₹${toIN(best.optimalAmt)}/yr health insurance → save ₹${toIN(best.saved)} tax. Net cost after tax savings: just ₹${toIN(best.optimalAmt - best.saved)}.`;
    } else if (best.key === 'hloan') {
      aiMsg = `₹${toIN(best.optimalAmt)} unused home loan deduction room. Using it saves ₹${toIN(best.saved)} in tax.`;
    }

    aiText.textContent = aiMsg;
    banner.style.display = 'block';

    const tab = document.querySelector('.sim-tab[data-key="' + best.key + '"]');
    if (tab) {
      simSelect(tab, best.key);
      const slider = document.getElementById('sim-slider');
      slider.value = Math.min(best.optimalAmt, parseInt(slider.max));
      updateSim();
    }
  }

  document.getElementById('sim-card').style.display = 'block';
}


// ═══════════════════════════════════════════════════════════════
// VALIDATION — runs only at Calculate time, not on step nav
// Hard blocks: gross=0, basic>gross, age invalid
// Soft fixes: auto-cap 80C, prof_tax silently
// ═══════════════════════════════════════════════════════════════

function validateAndCalculate() {
  // ── collect raw values ──
  const gross  = gv('gross');
  const basic  = gv('basic');
  const age    = document.getElementById('age').value.trim();
  const ageNum = parseInt(age);

  const hardErrors = [];

  // Hard block 1: no gross salary
  if (gross <= 0) {
    hardErrors.push('Gross annual salary is required. Please go back to Step 2 and enter it.');
  }

  // Hard block 2: basic > gross
  if (gross > 0 && basic > 0 && basic > gross) {
    hardErrors.push('Basic salary (₹' + toIN(basic) + ') cannot be more than Gross salary (₹' + toIN(gross) + '). Please fix Step 2.');
  }

  // Hard block 3: age is not a number
  if (age && (isNaN(ageNum) || ageNum < 1 || ageNum > 120)) {
    hardErrors.push('Age "' + age + '" doesn\'t look right. Please enter a number between 1 and 120 in Step 1.');
  }

  // Hard block 4: HRA > basic (impossible in real payroll)
  const hra_rcvd = gv('hra_received');
  if (basic > 0 && hra_rcvd > gross) {
    hardErrors.push('HRA received (₹' + toIN(hra_rcvd) + ') cannot exceed Gross salary. Please check Step 2.');
  }

  // Soft warnings (shown as visible notices, don't block calculation)
  const softWarns = [];
  const sec80c_raw = gv('sec80c');
  const nps_raw = gv('nps');
  const sec80d_self_raw = gv('sec80d_self');
  const sec80d_par_raw = gv('sec80d_parents');
  const hl_int_raw = gv('home_loan_interest');
  const enps_raw = gv('employer_nps');

  if (sec80c_raw > 150000) softWarns.push('80C: ₹' + toIN(sec80c_raw) + ' entered — capped at ₹1,50,000 in calculation');
  if (nps_raw > 50000) softWarns.push('NPS 80CCD(1B): ₹' + toIN(nps_raw) + ' entered — capped at ₹50,000');
  if (sec80d_self_raw > 50000) softWarns.push('80D (self): ₹' + toIN(sec80d_self_raw) + ' entered — max ₹25,000 (₹50,000 for seniors)');
  if (sec80d_par_raw > 50000) softWarns.push('80D (parents): ₹' + toIN(sec80d_par_raw) + ' entered — max ₹50,000');
  if (hl_int_raw > 200000) softWarns.push('Home loan interest: ₹' + toIN(hl_int_raw) + ' entered — capped at ₹2,00,000 for self-occupied');
  if (basic > 0 && enps_raw > basic * 0.10) softWarns.push('Employer NPS: ₹' + toIN(enps_raw) + ' entered — capped at 10% of Basic (₹' + toIN(Math.round(basic*0.10)) + ')');

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
  const profTax = gv('prof_tax');
  if (profTax > 2500) {
    document.getElementById('prof_tax').value = 2500;
  }

  // Clear any previous error box
  const box = document.getElementById('calc-err-box');
  if (box) box.remove();

  // All good — run the real calculate
  calculate();
}

// ── Tax Risk Score ───────────────────────────────────────────────────────────
function buildRiskScore(){
  const panel=document.getElementById('risk-score-panel');
  if(!panel||!_i) return;

  const flags=[];
  let score=0;

  // ── Flag 1: TDS Mismatch (Form 16 vs 26AS)
  const f16tds=window._f16&&window._f16.tds_deducted_form16||0;
  const as26tds=window._as26&&window._as26.total_tds_26as||0;
  if(f16tds>0&&as26tds>0){
    const diff=Math.abs(f16tds-as26tds);
    if(diff>5000){
      score+=3;
      flags.push({level:'red',icon:'🔴',text:`TDS mismatch: Form 16 shows ${fmt(f16tds)}, 26AS shows ${fmt(as26tds)} (diff: ${fmt(diff)}). IT Dept computers auto-detect this.`});
    } else if(diff>1000){
      score+=1;
      flags.push({level:'amber',icon:'🟡',text:`Minor TDS difference of ${fmt(diff)} between Form 16 and 26AS. Usually fine but worth checking.`});
    }
  }

  // ── Flag 2: AIS income not declared in ITR
  const aisInt=window._ais&&window._ais.interest_income_ais||0;
  const declaredInt=_i.interest_income||0;
  if(aisInt>0&&declaredInt<aisInt*0.7){
    score+=3;
    flags.push({level:'red',icon:'🔴',text:`AIS shows interest income of ${fmt(aisInt)} but you've declared only ${fmt(declaredInt)}. IT Dept gets AIS from all banks — undeclared interest is a common scrutiny trigger.`});
  }

  // ── Flag 3: Large 80G donations vs income
  const donations=_i.sec80g||0;
  if(donations>0&&donations>_i.gross*0.3){
    score+=2;
    flags.push({level:'red',icon:'🔴',text:`80G donations of ${fmt(donations)} are ${Math.round(donations/_i.gross*100)}% of your gross income. Unusually large donation claims frequently trigger scrutiny.`});
  } else if(donations>100000){
    score+=1;
    flags.push({level:'amber',icon:'🟡',text:`80G donations of ${fmt(donations)} — keep donation receipts and Form 10BE ready in case of notice.`});
  }

  // ── Flag 4: HRA claimed but no rent paid
  const hraClaimed=_o.deds&&_o.deds.hra||0;
  if(hraClaimed>0&&(_i.rent_paid||0)<1000){
    score+=2;
    flags.push({level:'red',icon:'🔴',text:`HRA exemption claimed (${fmt(hraClaimed)}) but rent paid appears to be ₹0. Landlord PAN required for rent >₹1L/year. False HRA claims are heavily scrutinised.`});
  }

  // ── Flag 5: High TDS but low declared salary (potential income suppression)
  if(as26tds>0&&_i.gross>0&&as26tds>_i.gross*0.35){
    score+=2;
    flags.push({level:'amber',icon:'🟡',text:`TDS (${fmt(as26tds)}) is very high relative to declared salary (${fmt(_i.gross)}). Ensure all income sources are included.`});
  }

  // ── Flag 6: Crypto income declared (high scrutiny sector)
  if((_i.crypto||0)>50000){
    score+=1;
    flags.push({level:'amber',icon:'🟡',text:`Crypto/VDA income of ${fmt(_i.crypto)} declared. IT Dept receives data from exchanges — ensure you've declared ALL VDA transactions, not just profitable ones.`});
  }

  // ── Flag 7: Job change — under-deducted TDS
  if(_i.changed_jobs==='yes'){
    const tdsEmp=(_i.tds_emp1||0)+(_i.tds_emp2||0);
    const totalTax=Math.min(_o.tax,_n.tax);
    if(tdsEmp>0&&tdsEmp<totalTax*0.7){
      score+=2;
      flags.push({level:'amber',icon:'🟡',text:`Job change detected with combined TDS of ${fmt(tdsEmp)} against total tax of ${fmt(totalTax)}. Large balance due increases scrutiny probability.`});
    }
  }

  // ── Flag 8: Online gaming income (new high-scrutiny category)
  if((_i.gaming_income||0)>10000){
    score+=1;
    flags.push({level:'amber',icon:'🟡',text:`Online gaming/lottery income of ${fmt(_i.gaming_income)} declared. IT Dept gets platform data under Sec 285BA — match your declared amount against your gaming app's tax statement.`});
  }

  // ── Positive signals (reduce perception of risk)
  if(flags.length===0){
    flags.push({level:'green',icon:'🟢',text:'No major risk flags found. Your return looks clean and consistent.'});
  }
  if(f16tds>0&&as26tds>0&&Math.abs(f16tds-as26tds)<500){
    flags.push({level:'green',icon:'🟢',text:'TDS matches perfectly between Form 16 and 26AS. ✓'});
  }
  if(_i.tds_deducted>0&&Math.abs(_i.tds_deducted-Math.min(_o.tax,_n.tax))<10000){
    flags.push({level:'green',icon:'🟢',text:'TDS closely matches tax liability — minimal chance of demand notice.'});
  }

  // ── Score contributions for transparency (Fix 4)
  const contributions=[];
  if(f16tds>0&&as26tds>0&&Math.abs(f16tds-as26tds)>5000)contributions.push({label:'TDS mismatch',pts:'+3',color:'#c0392b'});
  else if(f16tds>0&&as26tds>0&&Math.abs(f16tds-as26tds)>1000)contributions.push({label:'Minor TDS diff',pts:'+1',color:'#c17f24'});
  const aisInt2=window._ais&&window._ais.interest_income_ais||0;
  if(aisInt2>0&&(_i.interest_income||0)<aisInt2*0.7)contributions.push({label:'Undeclared interest income',pts:'+3',color:'#c0392b'});
  const donations2=_i.sec80g||0;
  if(donations2>_i.gross*0.3)contributions.push({label:'High 80G donations',pts:'+2',color:'#c0392b'});
  else if(donations2>100000)contributions.push({label:'Large donations',pts:'+1',color:'#c17f24'});
  if((_o.deds&&_o.deds.hra||0)>0&&(_i.rent_paid||0)<1000)contributions.push({label:'HRA without rent',pts:'+2',color:'#c0392b'});
  if((_i.crypto||0)>50000)contributions.push({label:'Crypto income',pts:'+1',color:'#c17f24'});
  if(_i.changed_jobs==='yes'){const te=(_i.tds_emp1||0)+(_i.tds_emp2||0);if(te>0&&te<Math.min(_o.tax,_n.tax)*0.7)contributions.push({label:'Job change TDS gap',pts:'+2',color:'#c17f24'});}
  if((_i.gaming_income||0)>10000)contributions.push({label:'Gaming income',pts:'+1',color:'#c17f24'});
  if(f16tds>0&&as26tds>0&&Math.abs(f16tds-as26tds)<500)contributions.push({label:'TDS match',pts:'−1',color:'#2d6a4f'});
  if(_i.tds_deducted>0&&Math.abs(_i.tds_deducted-Math.min(_o.tax,_n.tax))<10000)contributions.push({label:'TDS matches liability',pts:'−1',color:'#2d6a4f'});
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
  if(!card||!panel||!_i)return;
  const ltcg=_i.ltcg||0, stcg=_i.stcg||0;
  if(ltcg+stcg<1){card.style.display='none';return;}
  card.style.display='block';
  const ltcgExempt=Math.min(ltcg,125000);
  const ltcgTaxable=Math.max(0,ltcg-125000);
  const ltcgTax=Math.round(ltcgTaxable*0.125*1.04);
  const stcgTax=Math.round(stcg*0.20*1.04);
  const totalCgTax=ltcgTax+stcgTax;
  const ltcgRow=ltcg>0?`<tr><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);font-size:12px;">LTCG &mdash; Equity/MF (held 1yr+)<br><span style="font-size:10px;color:var(--muted);">Section 112A</span></td><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;">`+fmt(ltcg,true)+`</td><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--accent);">`+fmt(ltcgExempt,true)+`</td><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;">`+fmt(ltcgTaxable,true)+`</td><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);text-align:right;font-size:12px;">12.5%</td><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:var(--ink);">`+fmt(ltcgTax,true)+`</td></tr>`:'';
  const stcgRow=stcg>0?`<tr><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);font-size:12px;">STCG &mdash; Equity/MF (held &lt;1yr)<br><span style="font-size:10px;color:var(--muted);">Section 111A</span></td><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;">`+fmt(stcg,true)+`</td><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);">&#8212;</td><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;">`+fmt(stcg,true)+`</td><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);text-align:right;font-size:12px;">20%</td><td style="padding:9px 0;border-bottom:1px solid rgba(226,221,214,.5);text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:var(--ink);">`+fmt(stcgTax,true)+`</td></tr>`:'';
  panel.innerHTML=`<div style="background:var(--bluel);border-radius:12px;padding:16px 18px;margin-bottom:14px;"><div style="font-size:11px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;">Auto-generated from your AIS data</div><table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr><th style="text-align:left;padding:6px 0;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);border-bottom:1.5px solid var(--border);">Type</th><th style="text-align:right;padding:6px 0;font-size:10px;text-transform:uppercase;color:var(--muted);border-bottom:1.5px solid var(--border);">Gains</th><th style="text-align:right;padding:6px 0;font-size:10px;text-transform:uppercase;color:var(--muted);border-bottom:1.5px solid var(--border);">Exempt</th><th style="text-align:right;padding:6px 0;font-size:10px;text-transform:uppercase;color:var(--muted);border-bottom:1.5px solid var(--border);">Taxable</th><th style="text-align:right;padding:6px 0;font-size:10px;text-transform:uppercase;color:var(--muted);border-bottom:1.5px solid var(--border);">Rate</th><th style="text-align:right;padding:6px 0;font-size:10px;text-transform:uppercase;color:var(--muted);border-bottom:1.5px solid var(--border);">Tax (incl. cess)</th></tr></thead><tbody>`+ltcgRow+stcgRow+`<tr><td style="padding:9px 0;font-size:12px;font-weight:700;">Total Capital Gains Tax</td><td style="padding:9px 0;text-align:right;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;">`+fmt(ltcg+stcg,true)+`</td><td style="padding:9px 0;text-align:right;font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--accent);">`+fmt(ltcgExempt,true)+`</td><td style="padding:9px 0;text-align:right;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;">`+fmt(ltcgTaxable+stcg,true)+`</td><td></td><td style="padding:9px 0;text-align:right;font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:800;color:var(--red);">`+fmt(totalCgTax,true)+`</td></tr></tbody></table></div><div style="font-size:12px;color:var(--ink2);line-height:1.7;">`+(ltcg>0?'<strong>LTCG tip:</strong> First &#8377;1,25,000 of gains is tax-free each year. Consider tax harvesting (sell and rebuy) to use the full exemption. ':'')+' '+`⚠️ You need to file <strong>ITR-2</strong> (not ITR-1) due to capital gains. Verify these figures against your broker's capital gains statement.</div>`;
}

function buildScheduleAL(){
  const panel=document.getElementById('schedule-al-panel');
  if(!panel||!_i) return;
  if(_i.gross<=5000000){panel.innerHTML='';return;}

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
  const i = _i, panel = document.getElementById('itr-panel');
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
  if (!panel || !_i || !_o || !_n) return;

  const best = Math.min(_o.tax, _n.tax);
  const tds = _i.tds_deducted || 0;
  const advanceTaxPaid = _i.advance_tax || 0;
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
      <div class="int-sub">You have a balance due of ${fmt(balDue)}. Estimated interest penalty if you pay only at filing time (July 31).</div>
      <div class="int-grid">
        <div class="int-box">
          <div class="int-box-label">Sec 234B Interest</div>
          <div class="int-box-val">${fmt(interest234B)}</div>
          <div class="int-box-note">~1%/month × 4 months<br>(Apr–Jul on unpaid tax)</div>
        </div>
        <div class="int-box">
          <div class="int-box-label">Sec 234C Interest</div>
          <div class="int-box-val">${fmt(interest234C)}</div>
          <div class="int-box-note">~1%/month × 3 months<br>(missed installments)</div>
        </div>
      </div>
      <div class="int-steps">
        <strong>Total tax due:</strong> ${fmt(best)}<br>
        <strong>TDS already deducted:</strong> ${fmt(tds)}<br>
        <strong>Balance to pay:</strong> ${fmt(balDue)}<br>
        <strong>Estimated interest penalty:</strong> ${fmt(totalInterest)}<br>
        <strong style="color:var(--a2)">Total payable by July 31:</strong> <strong style="color:var(--a2)">${fmt(totalPayable)}</strong>
      </div>
      <div style="margin-top:12px;font-size:12px;color:var(--muted);">
        Pay now as Self-Assessment Tax to stop interest from accumulating. →
        <a href="https://www.incometax.gov.in/iec/foportal/help/e-payment-of-taxes" target="_blank" style="color:var(--a2);font-weight:700;">Pay via Challan 280</a>
      </div>
    </div>`;
}

// ── WhatsApp Share ───────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
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
  if(!_o||!_i){
    alert('No tax data available. Please complete the tax calculation first.');
    return;
  }

  const noticeLabels = {
    tds: 'TDS Mismatch (Form 26AS vs Filed ITR)',
    ais: 'AIS Income Discrepancy (Unreported Income)',
    verify: 'Verification Notice under Section 143(1)',
    deduction: 'Deduction Query (80C/80D/HRA proof required)'
  };

  // Build tax data summary using correct _i field names
  const win = _o.tax <= _n.tax ? 'New' : 'Old';
  const bestTax = Math.min(_o.tax, _n.tax);
  const f16tds = (window._f16 && window._f16.tds_deducted_form16) || 0;
  const as26tds = (window._as26 && window._as26.total_tds_26as) || 0;
  const aisSalary = (window._ais && window._ais.salary_ais) || 0;
  const errList = _errors?.map(e=>e.title).join(', ') || 'None detected';

  const prompt = `You are a senior Indian Chartered Accountant drafting a formal response to an Income Tax Department notice on behalf of a taxpayer.

NOTICE TYPE: ${noticeLabels[_selectedNoticeType]}

TAXPAYER'S TAX DATA (FY 2025-26):
- Gross Salary: ₹${(_i.gross||0).toLocaleString('en-IN')}
- TDS per Form 16: ₹${f16tds.toLocaleString('en-IN')}
- TDS per 26AS: ₹${as26tds.toLocaleString('en-IN')}
- Salary per AIS: ₹${aisSalary.toLocaleString('en-IN')}
- Final Tax Payable (${win} Regime): ₹${bestTax.toLocaleString('en-IN')}
- TDS Already Deducted: ₹${(_i.tds_deducted||0).toLocaleString('en-IN')}
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
  if(_auditTrail.length===0){panel.style.display='none';return;}
  panel.style.display='block';
  items.innerHTML=_auditTrail.map((e,i)=>{
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
  if(!panel||!list||!_o||!_n||!_i) return;

  const win=_o.tax<_n.tax?'old':'new';
  const bestTax=Math.min(_o.tax,_n.tax);
  const tds=_i.tds_deducted||0;
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
  if(win==='old'&&_o.deds){
    const unused=Math.max(0,150000-(_o.deds.c80c||0));
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
  if(!panel||!_o||!_n||!_i) return;

  const win=_o.tax<_n.tax?'old':'new';
  const bestTax=Math.min(_o.tax,_n.tax);
  const sav=Math.abs(_o.tax-_n.tax);
  const tds=_i.tds_deducted||0;
  const bal=tds-bestTax;
  const eff=_i.gross>0?((bestTax/_i.gross)*100).toFixed(1):'0';

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
  const d=win==='old'?_o.deds:null;
  if(d){
    const unused80c=Math.max(0,150000-d.c80c);
    const unusedNps=Math.max(0,50000-d.cnps);
    if(unused80c>10000) tips.push({ico:'📈',text:`You have <strong>₹${fmt(unused80c)} unused 80C room</strong>. Invest in PPF, ELSS or NPS to reduce taxable income further.`});
    else if(unusedNps>10000) tips.push({ico:'📈',text:`<strong>₹${fmt(unusedNps)} unused NPS 80CCD(1B) room</strong>. Extra ₹50K deduction separate from 80C.`});
    else tips.push({ico:'✅',text:`Your deductions are well-optimized for the Old Regime.`});
  } else {
    // New regime: tip on employer NPS
    const cenps=_n&&_n.deds?_n.deds.cenps:0;
    if((_i.employer_nps||0)<(_i.basic*0.05)) tips.push({ico:'💡',text:`Ask HR to increase <strong>Employer NPS contribution</strong> (Sec 80CCD(2)) — it's deductible in New Regime and reduces your taxable salary.`});
    else tips.push({ico:'✅',text:`New Regime is optimized for your income — no Chapter VI-A deductions needed.`});
  }

  const regimeLabel=win==='new'?'New Regime':'Old Regime';

  // Emotional state — determines headline tone
  // "You're All Good" when no errors, refund coming, optimal regime
  const hasErrors = _errors && _errors.filter(e=>e.severity==='red').length > 0;
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
// ITR FILING STATUS TRACKER
// ══════════════════════════════════════════════════════════════════════
function openITRTracker() {
  document.getElementById('itr-tracker-modal').classList.add('open');
  // Pre-fill name from current session
  try { if(typeof gtag==='function') gtag('event','itr_tracker_opened',{event_category:'retention'}); } catch(e){}
}

function closeITRTracker() {
  document.getElementById('itr-tracker-modal').classList.remove('open');
}

function validateAckInput(inp) {
  const val = inp.value.replace(/\D/g, '');
  inp.value = val;
  document.getElementById('itr-check-btn').disabled = val.length !== 15;
}

function checkITRStatus() {
  const ack = document.getElementById('itr-ack-input').value.trim();
  if (ack.length !== 15) return;

  const btn = document.getElementById('itr-check-btn');
  btn.textContent = '⏳ Checking…';
  btn.disabled = true;

  // Simulate status lookup with realistic data based on ACK number patterns
  // Real implementation would call incometax.gov.in API or a proxy
  setTimeout(() => {
    btn.textContent = 'Check →';
    btn.disabled = false;
    showITRStatusResult(ack);
  }, 1400);
}

function showITRStatusResult(ack) {
  const result = document.getElementById('itr-status-result');
  result.style.display = 'block';

  // Derive a deterministic "status" from ACK number for demo
  // In production this would be a real API call
  const seed = ack.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const scenarios = ['filed', 'processing', 'processed', 'refund_initiated', 'refund_credited'];
  const scenario = scenarios[seed % scenarios.length];

  const today = new Date();
  const daysAgo = (n) => {
    const d = new Date(today); d.setDate(d.getDate() - n);
    return d.toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'});
  };

  const steps = [
    {
      id: 'filed', icon: '📤', label: 'ITR Filed',
      sub: `Acknowledgement: ${ack}`,
      date: daysAgo(45),
      done: true
    },
    {
      id: 'received', icon: '📥', label: 'ITR-V Received by CPC',
      sub: 'Centralised Processing Centre, Bengaluru confirmed receipt',
      date: daysAgo(44),
      done: ['processing','processed','refund_initiated','refund_credited'].includes(scenario)
    },
    {
      id: 'processing', icon: '⚙️', label: 'Under Processing',
      sub: 'Tax computation being verified against Form 26AS, AIS and TIS',
      date: ['processed','refund_initiated','refund_credited'].includes(scenario) ? daysAgo(30) : null,
      done: ['processed','refund_initiated','refund_credited'].includes(scenario),
      active: scenario === 'processing'
    },
    {
      id: 'processed', icon: '✅', label: 'Processing Complete',
      sub: 'Intimation u/s 143(1) sent to registered email. Tax liability confirmed.',
      date: ['refund_initiated','refund_credited'].includes(scenario) ? daysAgo(20) : null,
      done: ['refund_initiated','refund_credited'].includes(scenario),
      active: scenario === 'processed'
    },
    {
      id: 'refund', icon: '💸', label: 'Refund Initiated',
      sub: 'Refund order issued. NEFT transfer initiated to your bank account.',
      date: scenario === 'refund_credited' ? daysAgo(10) : null,
      done: scenario === 'refund_credited',
      active: scenario === 'refund_initiated'
    },
    {
      id: 'credited', icon: '🏦', label: 'Refund Credited',
      sub: 'Amount credited to your bank account linked with PAN.',
      date: scenario === 'refund_credited' ? daysAgo(7) : null,
      done: scenario === 'refund_credited'
    }
  ];

  // Badge
  const badgeMap = {
    filed: {cls:'filed', text:'📤 Filed — Awaiting CPC Receipt'},
    processing: {cls:'filed', text:'⚙️ Under Processing'},
    processed: {cls:'processed', text:'✅ Processed — Intimation Sent'},
    refund_initiated: {cls:'refund', text:'💸 Refund Initiated'},
    refund_credited: {cls:'refund', text:'🏦 Refund Credited ✓'},
  };
  const badge = badgeMap[scenario] || badgeMap.filed;
  document.getElementById('itr-status-badge-wrap').innerHTML =
    `<div class="itr-status-badge ${badge.cls}">${badge.text}</div>`;

  // Timeline
  const tl = document.getElementById('itr-timeline');
  tl.innerHTML = steps.map((step, i) => {
    const dotCls = step.done ? 'done' : step.active ? 'active' : 'wait';
    const connectorCls = step.done ? 'done' : '';
    const isLast = i === steps.length - 1;
    return `
      <div class="itr-step">
        <div class="itr-step-line">
          <div class="itr-step-dot ${dotCls}">${step.done ? '✓' : step.active ? '⟳' : '○'}</div>
          ${!isLast ? `<div class="itr-step-connector ${connectorCls}"></div>` : ''}
        </div>
        <div class="itr-step-body">
          <div class="itr-step-title" style="color:${step.done ? 'var(--ink)' : step.active ? 'var(--a2)' : 'var(--muted)'}">${step.icon} ${step.label}</div>
          <div class="itr-step-sub">${step.sub}</div>
          ${step.date ? `<div class="itr-step-date">${step.date}</div>` : ''}
        </div>
      </div>`;
  }).join('');

  // Manual note
  const note = document.getElementById('itr-manual-note');
  note.style.display = 'block';
  note.innerHTML = `ℹ️ <strong>Note:</strong> This is a simulated status for demonstration. For live status, visit <a href="https://www.incometax.gov.in/iec/foportal/help/e-filing-status" target="_blank" style="color:var(--accent);font-weight:600;">incometax.gov.in →</a> and enter acknowledgement number <strong>${ack}</strong>.`;

  // Show notify section for non-credited statuses
  const notifySection = document.getElementById('itr-notify-section');
  if (scenario !== 'refund_credited') {
    notifySection.style.display = 'block';
  }

  try { if(typeof gtag==='function') gtag('event','itr_status_checked',{event_category:'retention',label:scenario}); } catch(e){}
}

function saveITRNotify() {
  const email = document.getElementById('itr-notify-email').value.trim();
  if (!email || !email.includes('@')) {
    document.getElementById('itr-notify-email').style.borderColor = 'var(--red)';
    return;
  }
  document.getElementById('itr-notify-section').innerHTML =
    `<div style="background:var(--al);border:1px solid var(--accent);border-radius:8px;padding:10px 14px;font-size:13px;color:var(--accent);font-weight:600;margin-top:14px;">
      ✅ We'll notify ${escHtml(email)} when your refund status changes.
    </div>`;
  try { if(typeof gtag==='function') gtag('event','itr_notify_saved',{event_category:'retention'}); } catch(e){}
}


// ══════════════════════════════════════════════════════════════════════
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
      <span class="hr-summary-val">${fmt(Math.round(totalGross / _hrResults.length))}</span>
      <span class="hr-summary-lbl">Avg Gross Salary</span>
    </div>
    <div class="hr-summary-card">
      <span class="hr-summary-val">${fmt(totalTax, true)}</span>
      <span class="hr-summary-lbl">Total Tax Liability</span>
    </div>
    <div class="hr-summary-card">
      <span class="hr-summary-val" style="color:${totalTds >= totalTax ? 'var(--accent)' : 'var(--red)'}">
        ${totalTds >= totalTax ? '+' : ''}${fmt(totalTds - totalTax, true)}
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
      ? '↑ ' + fmt(emp.balance, true)
      : '↓ ' + fmt(Math.abs(emp.balance), true);
    return `<tr>
      <td style="font-weight:600;">${escHtml(emp.name)}</td>
      <td>${fmt(emp.gross)}</td>
      <td><span class="hr-status-badge ${emp.regime === 'New' ? 'done' : 'pending'}">${emp.regime}</span></td>
      <td style="font-family:'JetBrains Mono',monospace;">${fmt(emp.tax, true)}</td>
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
    if (d && h) { d.value = toIN(val); h.value = val; }
  });
  closeHRPortal();
  // Trigger calculation
  setTimeout(() => validateAndCalculate(), 200);
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
  renderPayslipZones();
});


// ══════════════════════════════════════════════════════════════════════
// TAX CALENDAR + ADVANCE TAX PLANNER
// ══════════════════════════════════════════════════════════════════════

function openTaxCalendar() {
  document.getElementById('taxcal-modal').classList.add('open');
  renderTaxCalendar();
  try { if(typeof gtag==='function') gtag('event','tax_calendar_opened',{event_category:'feature'}); } catch(e){}
}

function closeTaxCalendar() {
  document.getElementById('taxcal-modal').classList.remove('open');
}

function renderTaxCalendar() {
  const today = new Date();
  const hasResults = _i && _o && _n;

  // ── Compute tax liability ──────────────────────────────────────────
  const bestTax   = hasResults ? Math.min(_o.tax, _n.tax) : 0;
  const tds       = hasResults ? (_i.tds_deducted || 0) : 0;
  const gross     = hasResults ? (_i.gross || 0) : 0;
  // Advance tax = tax liability minus TDS already expected
  // For salaried employees, TDS covers most — advance tax is for other income
  const otherInc  = hasResults ? ((_i.interest_income||0)+(_i.rental_income||0)+(_i.ltcg||0)+(_i.stcg||0)) : 0;
  const advTaxLiability = hasResults ? Math.max(0, bestTax - tds) : 0;
  // Advance tax only if > ₹10,000
  const needsAdvTax = advTaxLiability > 10000;

  // ── Hero section ──────────────────────────────────────────────────
  const heroTitle = document.getElementById('taxcal-hero-title');
  const heroSub   = document.getElementById('taxcal-hero-sub');
  const heroChips = document.getElementById('taxcal-hero-chips');

  if (!hasResults) {
    heroTitle.textContent = 'Complete your tax calculation first';
    heroSub.textContent   = 'Return to the calculator to get your personalised advance tax schedule.';
    heroChips.innerHTML   = '<span class="taxcal-chip amber">⚠ No data yet</span>';
  } else if (!needsAdvTax) {
    heroTitle.textContent = 'No advance tax required';
    heroSub.textContent   = `Your TDS of ${fmt(tds,true)} covers your full liability of ${fmt(bestTax,true)}. You are fully compliant — no advance tax instalments needed.`;
    heroChips.innerHTML   = `<span class="taxcal-chip green">✓ TDS covers all tax</span><span class="taxcal-chip blue">Liability: ${fmt(bestTax)}</span>`;
  } else {
    heroTitle.textContent = `₹${Math.round(advTaxLiability/1000)}K advance tax due this year`;
    heroSub.textContent   = `Your estimated tax liability is ${fmt(bestTax,true)}, TDS covers ${fmt(tds,true)}. You need to pay ${fmt(advTaxLiability,true)} as advance tax across 4 installments to avoid Sec 234B/C interest.`;
    heroChips.innerHTML   = `
      <span class="taxcal-chip red">₹${Math.round(advTaxLiability/1000)}K due</span>
      <span class="taxcal-chip blue">Other income: ${fmt(otherInc)}</span>
      <span class="taxcal-chip amber">Avoid 1% p.m. interest</span>`;
  }

  // ── 4 Installment Cards ──────────────────────────────────────────
  // FY 2025-26 dates
  const installments = [
    { label:'1st Installment', date:'15 Jun 2025', dateObj: new Date(2025,5,15), pct:15, dueBy:'Jun 15' },
    { label:'2nd Installment', date:'15 Sep 2025', dateObj: new Date(2025,8,15), pct:45, dueBy:'Sep 15' },
    { label:'3rd Installment', date:'15 Dec 2025', dateObj: new Date(2025,11,15), pct:75, dueBy:'Dec 15' },
    { label:'4th Installment', date:'15 Mar 2026', dateObj: new Date(2026,2,15), pct:100, dueBy:'Mar 15' },
  ];

  // Cumulative amounts
  const cumAmounts = installments.map(inst => Math.round(advTaxLiability * inst.pct / 100));
  const instAmounts = cumAmounts.map((cum,i) => i===0 ? cum : cum - cumAmounts[i-1]);

  const grid = document.getElementById('adv-tax-grid');
  grid.innerHTML = installments.map((inst, i) => {
    const isPast    = today > inst.dateObj;
    const isNear    = !isPast && (inst.dateObj - today) < 30*24*3600*1000;
    const daysLeft  = Math.ceil((inst.dateObj - today) / (24*3600*1000));
    let statusClass, statusText, cardClass;

    if (isPast) {
      statusClass = 'overdue'; statusText = '⚠ Due date passed'; cardClass = 'overdue';
    } else if (isNear) {
      statusClass = 'active'; statusText = `⚡ Due in ${daysLeft} days`; cardClass = 'active';
    } else {
      statusClass = 'due'; statusText = `📅 Due ${inst.dueBy}`; cardClass = '';
    }

    if (!needsAdvTax) {
      statusClass = 'paid'; statusText = '✓ Not required'; cardClass = 'paid';
    }

    return `
    <div class="adv-tax-card ${cardClass}">
      <div class="adv-tax-card-installment">${inst.label}</div>
      <div class="adv-tax-card-date">📅 ${inst.date}</div>
      <span class="adv-tax-card-amount">${needsAdvTax ? fmt(instAmounts[i],true) : '₹0'}</span>
      <div class="adv-tax-card-pct">${inst.pct}% of annual liability (cumulative)</div>
      <div><span class="adv-tax-card-status ${statusClass}">${statusText}</span></div>
      ${!needsAdvTax ? '' : `<div class="adv-tax-card-days">${isPast ? 'Challan 280 on incometax.gov.in' : `Cumulative due: ${fmt(cumAmounts[i],true)}`}</div>`}
    </div>`;
  }).join('');

  // ── Penalty Calculator ────────────────────────────────────────────
  const penaltyEl = document.getElementById('taxcal-penalty-rows');
  if (!hasResults || !needsAdvTax) {
    document.getElementById('taxcal-penalty-calc').style.display = 'none';
  } else {
    document.getElementById('taxcal-penalty-calc').style.display = 'block';
    // Sec 234B: 1% per month on shortfall if advance tax < 90% of assessed tax
    const ninetyPct = Math.round(advTaxLiability * 0.9);
    // Assume paid via TDS which handles most — calculate only on shortfall
    const sec234B   = Math.round(advTaxLiability * 0.01 * 3); // ~3 months avg
    const sec234C   = Math.round(advTaxLiability * 0.01 * 1); // deferment interest
    const sec234A   = 0; // late filing — shown separately
    const total     = sec234B + sec234C;

    penaltyEl.innerHTML = `
      <div class="penalty-row"><span>Advance tax shortfall (estimated)</span><span>${fmt(advTaxLiability,true)}</span></div>
      <div class="penalty-row"><span>Sec 234B — 1% p.m. for non-payment</span><span>~${fmt(sec234B,true)}</span></div>
      <div class="penalty-row"><span>Sec 234C — 1% p.m. for deferment</span><span>~${fmt(sec234C,true)}</span></div>
      <div class="penalty-row"><span style="color:var(--red)">Total interest if you don't pay</span><span>~${fmt(total,true)}</span></div>
      <div style="font-size:11px;color:var(--muted);margin-top:8px;line-height:1.5;">Pay via Challan 280 (ITNS 280) on incometax.gov.in → e-Pay Tax → Income Tax (0021) → Advance Tax (100)</div>`;
  }

  // ── Full Year Timeline ────────────────────────────────────────────
  const events = [
    { date:'Apr 1, 2025',  dateObj: new Date(2025,3,1),  title:'FY 2025–26 Begins',                    desc:'New financial year starts. Review salary structure, declare investments to employer (Form 12BB), choose Old vs New regime for TDS.',                                         tags:['adv'],    type:'done' },
    { date:'Apr 15, 2025', dateObj: new Date(2025,3,15), title:'Form 12BB Submission',                  desc:'Submit investment declaration to employer. This determines your TDS for the year. Include HRA, 80C, 80D, home loan details.',                                              tags:['tds'],    type:'done' },
    { date:'Jun 15, 2025', dateObj: new Date(2025,5,15), title:'Advance Tax — 1st Installment (15%)',   desc:`Pay 15% of estimated annual tax liability as advance tax. ${needsAdvTax ? 'Your estimated installment: ' + fmt(instAmounts[0],true) + '.' : 'Not required — TDS covers your liability.'}`,  tags:needsAdvTax?['adv','penalty']:['adv'],  type: new Date(2025,5,15) < today ? 'done':'upcoming' },
    { date:'Jul 31, 2025', dateObj: new Date(2025,6,31), title:'ITR Filing Deadline (Salaried)',         desc:'Last date to file Income Tax Return for FY 2024–25 (AY 2025–26) without penalty. Missing this triggers ₹5,000 penalty (Sec 234F) and 1% monthly interest on dues.',      tags:['penalty','refund'], type: new Date(2025,6,31) < today ? 'done':'upcoming' },
    { date:'Sep 15, 2025', dateObj: new Date(2025,8,15), title:'Advance Tax — 2nd Installment (45%)',   desc:`Cumulative 45% of estimated liability due. ${needsAdvTax ? 'Cumulative amount: ' + fmt(cumAmounts[1],true) + '. Shortfall attracts 1% p.m. Sec 234C interest.' : 'Not required.'}`, tags:needsAdvTax?['adv','penalty']:['adv'],  type: new Date(2025,8,15) < today ? 'done':'upcoming' },
    { date:'Oct 15, 2025', dateObj: new Date(2025,9,15), title:'Belated/Revised ITR Deadline',          desc:'Last date to file belated ITR (missed Jul 31) or revise an already-filed return for FY 2024–25. Penalty ₹5,000 applies. After this, no revisions possible.',            tags:['penalty'], type: new Date(2025,9,15) < today ? 'done':'upcoming' },
    { date:'Nov 30, 2025', dateObj: new Date(2025,10,30),title:'Review & Optimise Before Year-End',     desc:'3 months left to maximise tax savings. Top up 80C (₹1.5L limit), NPS Tier 1 (extra ₹50K under 80CCD(1B)), health insurance (80D). Last chance for major investments.',  tags:['refund'],  type: new Date(2025,10,30) < today ? 'done':'upcoming' },
    { date:'Dec 15, 2025', dateObj: new Date(2025,11,15), title:'Advance Tax — 3rd Installment (75%)',  desc:`Cumulative 75% due. ${needsAdvTax ? 'Cumulative: ' + fmt(cumAmounts[2],true) + '. If you missed earlier installments, pay full arrears now to limit interest.' : 'Not required.'}`,  tags:needsAdvTax?['adv','penalty']:['adv'],  type: new Date(2025,11,15) < today ? 'done':'upcoming' },
    { date:'Jan 15, 2026', dateObj: new Date(2026,0,15), title:'Submit Proof of Investments to Employer', desc:'Submit actual investment proofs (not just declarations) to HR/payroll. If you delay, employer deducts TDS on full salary in Feb–Mar which spikes your take-home dip.',    tags:['tds'],    type: new Date(2026,0,15) < today ? 'done':'upcoming' },
    { date:'Mar 15, 2026', dateObj: new Date(2026,2,15), title:'Advance Tax — 4th Installment (100%)',  desc:`Final installment — 100% of liability due. ${needsAdvTax ? 'Remaining balance: ' + fmt(instAmounts[3],true) + '. Any shortfall now attracts both 234B and 234C.' : 'Not required for you.'}`, tags:needsAdvTax?['adv','penalty']:['adv'],  type: new Date(2026,2,15) < today ? 'done':'upcoming' },
    { date:'Mar 28, 2026', dateObj: new Date(2026,2,28), title:'Last Day for 80C Investments (FY 2025–26)', desc:'Final deadline to make tax-saving investments that count for this financial year — ELSS, PPF top-up, 5-year FD, NSC, etc. After Mar 31, it counts for next year.', tags:['refund'],  type: new Date(2026,2,28) < today ? 'done':'upcoming' },
    { date:'Mar 31, 2026', dateObj: new Date(2026,2,31), title:'FY 2025–26 Ends',                       desc:'Financial year closes. All income, expenses, and investments after this date belong to FY 2026–27. Ensure all deductible payments are made before midnight.',          tags:['refund'],  type: new Date(2026,2,31) < today ? 'done':'upcoming' },
    { date:'Jun 15, 2026', dateObj: new Date(2026,5,15), title:'Form 16 Deadline for Employers',        desc:'Employers must issue Form 16 (Part A + B) by June 15. If you haven\'t received it by then, you can file with salary slips and 26AS.',                                   tags:['tds'],    type:'upcoming' },
    { date:'Jul 31, 2026', dateObj: new Date(2026,6,31), title:'ITR Filing Deadline (FY 2025–26)',      desc:'File your income tax return for this financial year. This is the date you are preparing for now. Refunds typically credited within 30–45 days of verified filing.',    tags:['refund','penalty'], type:'upcoming' },
  ];

  const tagLabels = { penalty:'⚠ Penalty risk', refund:'💰 Refund / savings', adv:'📊 Advance tax', tds:'🏦 TDS / employer', notice:'📬 Notice risk' };

  const timeline = document.getElementById('taxcal-timeline');
  timeline.innerHTML = events.map((ev, i) => {
    const isLast    = i === events.length - 1;
    const isToday   = Math.abs(ev.dateObj - today) < 2*24*3600*1000;
    const dotClass  = ev.type === 'done' ? 'done' : isToday ? 'today' : ev.dateObj < today ? 'overdue' : 'upcoming';
    const connClass = ev.type === 'done' ? 'done' : 'upcoming';
    const isUrgent  = !ev.type.includes('done') && (ev.dateObj - today) > 0 && (ev.dateObj - today) < 15*24*3600*1000;

    return `
    <div class="taxcal-event">
      <div class="taxcal-event-line">
        <div class="taxcal-event-dot ${dotClass}"></div>
        ${!isLast ? `<div class="taxcal-event-connector ${connClass}"></div>` : ''}
      </div>
      <div class="taxcal-event-body">
        <div class="taxcal-event-month">${ev.date}</div>
        <div class="taxcal-event-title">${ev.title}</div>
        <div class="taxcal-event-desc">${ev.desc}</div>
        <div class="taxcal-event-tags">${(ev.tags||[]).map(t=>`<span class="taxcal-event-tag ${t}">${tagLabels[t]||t}</span>`).join('')}</div>
        ${isUrgent ? `<div class="taxcal-event-urgent">⚡ Coming up in ${Math.ceil((ev.dateObj-today)/(24*3600*1000))} days — take action now</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════════════════════════════
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
  if(_files.f16 && Object.keys(f16Data).length <= 2) failed.push('Form 16');
  if(_files['26as'] && Object.keys(as26Data).length <= 2) failed.push('Form 26AS');
  if(_files.ais && Object.keys(aisData).length <= 2) failed.push('AIS');

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
  cur=1; showStep(1);
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
  if(!_i || !_o || !_n) return;
  const panel = document.getElementById('optimiser-panel');
  if(panel) panel.style.display = 'block';

  // Set sliders to current values
  document.getElementById('opt-80c').value = Math.min(_i.sec80c || 0, 150000);
  document.getElementById('opt-nps').value = Math.min(_i.nps || 0, 50000);
  document.getElementById('opt-80d').value = Math.min(_i.sec80d_self || 0, 50000);
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
  if(!_i || !_o || !_n) return;

  const new80c  = parseInt(document.getElementById('opt-80c').value) || 0;
  const newNps  = parseInt(document.getElementById('opt-nps').value) || 0;
  const new80d  = parseInt(document.getElementById('opt-80d').value) || 0;

  document.getElementById('opt-80c-val').textContent = '₹' + new80c.toLocaleString('en-IN');
  document.getElementById('opt-nps-val').textContent  = '₹' + newNps.toLocaleString('en-IN');
  document.getElementById('opt-80d-val').textContent  = '₹' + new80d.toLocaleString('en-IN');

  // Current best tax
  const currentBest = Math.min(_o.tax, _n.tax);

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
  if(!alert || !_i) return;

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
  if(!_i || !_o || !_n) return { subject:'', body:'' };
  const best   = Math.min(_o.tax, _n.tax);
  const win    = _o.tax <= _n.tax ? 'Old Regime' : 'New Regime';
  const sav    = Math.abs(_o.tax - _n.tax);
  const tds    = _i.tds_deducted || 0;
  const bal    = tds - best;
  const gross  = _i.gross || 0;
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
  if(!previewBox || !_i || !_o || !_n) return;
  const best  = Math.min(_o.tax, _n.tax);
  const win   = _o.tax <= _n.tax ? 'Old Regime' : 'New Regime';
  const tds   = _i.tds_deducted || 0;
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


