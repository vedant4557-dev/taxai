// FILE UPLOAD
// =====================================================================================================================================================================
window._files={f16:null,'26as':null,ais:null};

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
  window.validateDocumentBeforeUpload(file, key).then(ok => {
    if(!ok){ input.value=''; return; }
    window._files[key]=file;
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
  window._files[key]=file;
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
  const any=window._files.f16||window._files['26as']||window._files.ais;
  const btn=document.getElementById('extract-btn');
  const lbl=document.getElementById('extract-btn-label');
  if(any){
    btn.disabled=false;
    if(lbl){
      const parts=[];
      if(window._files.f16)parts.push('Form 16');
      if(window._files['26as'])parts.push('26AS');
      if(window._files.ais)parts.push('AIS');
      lbl.textContent='Extract from '+parts.join(' + ');
    }
  } else {
    btn.disabled=true;
    if(lbl)lbl.textContent='Upload at least one document to extract';
  }
}

// =====================================================================================================================================================================

// ── Window exports (required for HTML onclick= attributes with ES modules) ──
if(typeof handleFile!=="undefined") window.handleFile=handleFile;
if(typeof handleDrop!=="undefined") window.handleDrop=handleDrop;
if(typeof updateExtractBtn!=="undefined") window.updateExtractBtn=updateExtractBtn;
