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
  if(window._errors.length===0){
    // Also add a refund/due notification
    const tds=window._i.tds_deducted,best=Math.min(window._o.tax,window._n.tax),bal=tds-best;
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
            <div class="err-title">${bal>=0?'Refund: '+window.fmt(bal):'Balance Tax Due: '+window.fmt(Math.abs(bal))}</div>
            <div class="err-desc">TDS deducted: ${window.fmt(tds)} · Tax payable: ${window.fmt(best)} · ${bal>=0?'Claim this refund when you file your ITR. It gets deposited directly to your bank account.':'Pay this as Self-Assessment Tax before filing your ITR to avoid interest under Section 234B/C.'}</div>
            <div class="err-action ${bal>=0?'blue':'amber'}">${bal>=0?'→ File ITR before July 31 to claim refund':'→ Pay via Challan 280 at incometax.gov.in before filing'}</div>
          </div>
        </div>
      </div>`;
    } else container.innerHTML='';
    return;
  }

  const crits=window._errors.filter(e=>e.type==='crit').length;
  const warns=window._errors.filter(e=>e.type==='warn').length;
  const mainType=crits>0?'error-panel':warns>0?'error-panel warn':'error-panel ok';
  const dot=crits>0?'red':warns>0?'amber':'green';
  const heading=crits>0?`⚠️ ${crits} Critical Issue${crits>1?'s':''} Found`:`${warns+window._errors.filter(e=>e.type==='info').length} Items Need Your Attention`;

  container.innerHTML=`<div class="${mainType} mb14">
    <div class="ep-header">
      <div class="ep-dot ${dot}"></div>
      <div class="ep-heading">${heading}</div>
      <div class="ep-count">${window._errors.length} item${window._errors.length>1?'s':''}</div>
    </div>
    ${window._errors.map(e=>`
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
  const tds=window._i.tds_deducted,best=Math.min(window._o.tax,window._n.tax),bal=tds-best;
  if(tds>0){
    container.innerHTML+=`<div class="error-panel ${bal>=0?'ok':'warn'} mb14">
      <div class="ep-header"><div class="ep-dot ${bal>=0?'green':'amber'}"></div><div class="ep-heading">${bal>=0?'Refund: '+window.fmt(bal)+' due on filing':'Balance Tax Due: '+window.fmt(Math.abs(bal))}</div></div>
      <div class="error-item ${bal>=0?'info':'warn'}">
        <div class="err-icon">${bal>=0?'🎉':'📋'}</div>
        <div><div class="err-title">TDS Reconciliation</div>
        <div class="err-desc">TDS deducted: ${window.fmt(tds)} · Tax payable: ${window.fmt(best)} · Balance: ${window.fmt(Math.abs(bal))} ${bal>=0?'refund':'due'}</div>
        <div class="err-action ${bal>=0?'blue':'amber'}">${bal>=0?'→ File ITR before July 31 to claim refund':'→ Pay Self-Assessment Tax before filing'}</div>
        </div>
      </div>
    </div>`;
  }
}

// =====================================================================================================================================================================

// ── Window exports (required for HTML onclick= attributes with ES modules) ──
if(typeof buildErrorPanel!=="undefined") window.buildErrorPanel=buildErrorPanel;
if(typeof buildRecon!=="undefined") window.buildRecon=buildRecon;
