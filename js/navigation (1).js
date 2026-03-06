// NAVIGATION
// =====================================================================================================================================================================
window.cur=1;const TOT=6;
const snames=['Upload Docs','Basic Info','Income','Investments','Loans','EPF & Gratuity','Other Income'];

function ns(f){window.cur=f+1;showStep(window.cur);}
function ps(f){window.cur=f-1;showStep(window.cur);}
function jumpTo(n){
  if(n===0){showUpload();return;}
  if(n<=window.cur){window.cur=n;showStep(n);}
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
function restart(){window.cur=1;window._extractedData={};window._errors=[];showUpload();}
function setTog(el,fld,val){el.parentElement.querySelectorAll('.tog-btn').forEach(b=>b.classList.remove('active'));el.classList.add('active');document.getElementById(fld).value=val;}
function showCond(id,show){const el=document.getElementById(id);if(show)el.classList.add('show');else el.classList.remove('show');}
function skipToStep1(){document.querySelectorAll('.card').forEach(c=>c.classList.remove('active'));window.cur=1;showStep(1);}

// =====================================================================================================================================================================

// ── Window exports (required for HTML onclick= attributes with ES modules) ──
if(typeof ps!=="undefined") window.ps=ps;
if(typeof ns!=="undefined") window.ns=ns;
if(typeof jumpTo!=="undefined") window.jumpTo=jumpTo;
if(typeof setTog!=="undefined") window.setTog=setTog;
if(typeof skipToStep1!=="undefined") window.skipToStep1=skipToStep1;
if(typeof restart!=="undefined") window.restart=restart;
if(typeof showStep!=="undefined") window.showStep=showStep;
