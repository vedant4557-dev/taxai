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

// ── Window exports (required for HTML onclick= attributes with ES modules) ──
if(typeof toIN!=="undefined") window.toIN=toIN;
if(typeof toWords!=="undefined") window.toWords=toWords;
if(typeof fmt!=="undefined") window.fmt=fmt;
// window.gv — not found in utils.js, check definition
// window.gs — not found in utils.js, check definition
if(typeof fa!=="undefined") window.fa=fa;
// window.capWarn — not found in utils.js, check definition
// window.capWarnPct — not found in utils.js, check definition
