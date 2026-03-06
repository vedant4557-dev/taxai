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
  const hasResults = window._i && window._o && window._n;

  // ── Compute tax liability ──────────────────────────────────────────
  const bestTax   = hasResults ? Math.min(window._o.tax, window._n.tax) : 0;
  const tds       = hasResults ? (window._i.tds_deducted || 0) : 0;
  const gross     = hasResults ? (window._i.gross || 0) : 0;
  // Advance tax = tax liability minus TDS already expected
  // For salaried employees, TDS covers most — advance tax is for other income
  const otherInc  = hasResults ? ((window._i.interest_income||0)+(window._i.rental_income||0)+(window._i.ltcg||0)+(window._i.stcg||0)) : 0;
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
    heroSub.textContent   = `Your TDS of ${window.fmt(tds,true)} covers your full liability of ${window.fmt(bestTax,true)}. You are fully compliant — no advance tax instalments needed.`;
    heroChips.innerHTML   = `<span class="taxcal-chip green">✓ TDS covers all tax</span><span class="taxcal-chip blue">Liability: ${window.fmt(bestTax)}</span>`;
  } else {
    heroTitle.textContent = `₹${Math.round(advTaxLiability/1000)}K advance tax due this year`;
    heroSub.textContent   = `Your estimated tax liability is ${window.fmt(bestTax,true)}, TDS covers ${window.fmt(tds,true)}. You need to pay ${window.fmt(advTaxLiability,true)} as advance tax across 4 installments to avoid Sec 234B/C interest.`;
    heroChips.innerHTML   = `
      <span class="taxcal-chip red">₹${Math.round(advTaxLiability/1000)}K due</span>
      <span class="taxcal-chip blue">Other income: ${window.fmt(otherInc)}</span>
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
      <span class="adv-tax-card-amount">${needsAdvTax ? window.fmt(instAmounts[i],true) : '₹0'}</span>
      <div class="adv-tax-card-pct">${inst.pct}% of annual liability (cumulative)</div>
      <div><span class="adv-tax-card-status ${statusClass}">${statusText}</span></div>
      ${!needsAdvTax ? '' : `<div class="adv-tax-card-days">${isPast ? 'Challan 280 on incometax.gov.in' : `Cumulative due: ${window.fmt(cumAmounts[i],true)}`}</div>`}
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
      <div class="penalty-row"><span>Advance tax shortfall (estimated)</span><span>${window.fmt(advTaxLiability,true)}</span></div>
      <div class="penalty-row"><span>Sec 234B — 1% p.m. for non-payment</span><span>~${window.fmt(sec234B,true)}</span></div>
      <div class="penalty-row"><span>Sec 234C — 1% p.m. for deferment</span><span>~${window.fmt(sec234C,true)}</span></div>
      <div class="penalty-row"><span style="color:var(--red)">Total interest if you don't pay</span><span>~${window.fmt(total,true)}</span></div>
      <div style="font-size:11px;color:var(--muted);margin-top:8px;line-height:1.5;">Pay via Challan 280 (ITNS 280) on incometax.gov.in → e-Pay Tax → Income Tax (0021) → Advance Tax (100)</div>`;
  }

  // ── Full Year Timeline ────────────────────────────────────────────
  const events = [
    { date:'Apr 1, 2025',  dateObj: new Date(2025,3,1),  title:'FY 2025–26 Begins',                    desc:'New financial year starts. Review salary structure, declare investments to employer (Form 12BB), choose Old vs New regime for TDS.',                                         tags:['adv'],    type:'done' },
    { date:'Apr 15, 2025', dateObj: new Date(2025,3,15), title:'Form 12BB Submission',                  desc:'Submit investment declaration to employer. This determines your TDS for the year. Include HRA, 80C, 80D, home loan details.',                                              tags:['tds'],    type:'done' },
    { date:'Jun 15, 2025', dateObj: new Date(2025,5,15), title:'Advance Tax — 1st Installment (15%)',   desc:`Pay 15% of estimated annual tax liability as advance tax. ${needsAdvTax ? 'Your estimated installment: ' + window.fmt(instAmounts[0],true) + '.' : 'Not required — TDS covers your liability.'}`,  tags:needsAdvTax?['adv','penalty']:['adv'],  type: new Date(2025,5,15) < today ? 'done':'upcoming' },
    { date:'Jul 31, 2025', dateObj: new Date(2025,6,31), title:'ITR Filing Deadline (Salaried)',         desc:'Last date to file Income Tax Return for FY 2024–25 (AY 2025–26) without penalty. Missing this triggers ₹5,000 penalty (Sec 234F) and 1% monthly interest on dues.',      tags:['penalty','refund'], type: new Date(2025,6,31) < today ? 'done':'upcoming' },
    { date:'Sep 15, 2025', dateObj: new Date(2025,8,15), title:'Advance Tax — 2nd Installment (45%)',   desc:`Cumulative 45% of estimated liability due. ${needsAdvTax ? 'Cumulative amount: ' + window.fmt(cumAmounts[1],true) + '. Shortfall attracts 1% p.m. Sec 234C interest.' : 'Not required.'}`, tags:needsAdvTax?['adv','penalty']:['adv'],  type: new Date(2025,8,15) < today ? 'done':'upcoming' },
    { date:'Oct 15, 2025', dateObj: new Date(2025,9,15), title:'Belated/Revised ITR Deadline',          desc:'Last date to file belated ITR (missed Jul 31) or revise an already-filed return for FY 2024–25. Penalty ₹5,000 applies. After this, no revisions possible.',            tags:['penalty'], type: new Date(2025,9,15) < today ? 'done':'upcoming' },
    { date:'Nov 30, 2025', dateObj: new Date(2025,10,30),title:'Review & Optimise Before Year-End',     desc:'3 months left to maximise tax savings. Top up 80C (₹1.5L limit), NPS Tier 1 (extra ₹50K under 80CCD(1B)), health insurance (80D). Last chance for major investments.',  tags:['refund'],  type: new Date(2025,10,30) < today ? 'done':'upcoming' },
    { date:'Dec 15, 2025', dateObj: new Date(2025,11,15), title:'Advance Tax — 3rd Installment (75%)',  desc:`Cumulative 75% due. ${needsAdvTax ? 'Cumulative: ' + window.fmt(cumAmounts[2],true) + '. If you missed earlier installments, pay full arrears now to limit interest.' : 'Not required.'}`,  tags:needsAdvTax?['adv','penalty']:['adv'],  type: new Date(2025,11,15) < today ? 'done':'upcoming' },
    { date:'Jan 15, 2026', dateObj: new Date(2026,0,15), title:'Submit Proof of Investments to Employer', desc:'Submit actual investment proofs (not just declarations) to HR/payroll. If you delay, employer deducts TDS on full salary in Feb–Mar which spikes your take-home dip.',    tags:['tds'],    type: new Date(2026,0,15) < today ? 'done':'upcoming' },
    { date:'Mar 15, 2026', dateObj: new Date(2026,2,15), title:'Advance Tax — 4th Installment (100%)',  desc:`Final installment — 100% of liability due. ${needsAdvTax ? 'Remaining balance: ' + window.fmt(instAmounts[3],true) + '. Any shortfall now attracts both 234B and 234C.' : 'Not required for you.'}`, tags:needsAdvTax?['adv','penalty']:['adv'],  type: new Date(2026,2,15) < today ? 'done':'upcoming' },
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

// ── Window exports (required for HTML onclick= attributes with ES modules) ──
if(typeof openTaxCalendar!=="undefined") window.openTaxCalendar=openTaxCalendar;
if(typeof closeTaxCalendar!=="undefined") window.closeTaxCalendar=closeTaxCalendar;
