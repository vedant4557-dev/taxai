// ================================================================================
// TaxSmart — app.js (bootstrap)
// Loads all modules in dependency order.
// Each file is self-contained; globals are shared via window scope.
// ================================================================================

// ── Tier 1: Pure utilities (no dependencies) ────────────────────────────────
import './utils.js';           // toIN, toWords, fmt, gv, gs helpers

// ── Tier 2: Core logic (depends on utils) ───────────────────────────────────
import './taxEngine.js';       // compOld, compNew, slab calculations, HRA, cess

// ── Tier 3: UI & navigation ─────────────────────────────────────────────────
import './navigation.js';      // showStep, ps, step progress bar
import './upload.js';          // handleFile, handleDrop, updateExtractBtn

// ── Tier 4: Extraction pipeline ─────────────────────────────────────────────
import './extraction.js';      // runExtraction, autoFillForm, setEpState

// ── Tier 5: Calculation & validation ────────────────────────────────────────
import './validation.js';      // validateAndCalculate, _validationRules, runValidationWarnings

// ── Tier 6: Results rendering ───────────────────────────────────────────────
import './errorPanel.js';      // buildErrorPanel, buildRecon
import './results.js';         // buildComp, buildSlabViz, buildDeds, buildTips, buildInsight
import './simulator.js';       // buildITRPanel, buildScheduleAL, buildRiskScore, etc.

// ── Tier 7: Sharing & export ─────────────────────────────────────────────────
import './ui.js';              // sticky bar, CA brief, email retention, share functions
import './notice.js';          // IT notice response generator (uses Anthropic API)
import './taxCard.js';         // shareable tax card builder
import './itrTracker.js';      // ITR filing status tracker
import './payslip.js';         // payslip intelligence
import './hr.js';              // HR/finance team portal
import './calendar.js';        // tax calendar + advance tax planner

// ── Tier 8: UX enhancements ──────────────────────────────────────────────────
import './features.js';        // onboarding, extraction confirmation, optimiser,
                               // refund prediction, employer TDS alert,
                               // confidence badges, document format detection
