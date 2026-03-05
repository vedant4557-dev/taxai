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

// ── Window exports (required for HTML onclick= attributes with ES modules) ──
if(typeof simSelect!=="undefined") window.simSelect=simSelect;
if(typeof simApply!=="undefined") window.simApply=simApply;
if(typeof updateSim!=="undefined") window.updateSim=updateSim;
// window.initOptimiser — not found in simulator.js, check definition
