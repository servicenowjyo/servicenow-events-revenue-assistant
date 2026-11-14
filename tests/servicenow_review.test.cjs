// Runs the EventRevenueReview Script Include against a mock GlideRecord loaded from the import CSV.
// Proves the ServiceNow field conversion (strings, '1'/'0' booleans) gives the same results as the engine.
const { test } = require('node:test'), a = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { loadScriptInclude } = require('../src/policy.cjs');
const root = path.resolve(__dirname, '..');

function csvRows(file) {
  const [head, ...lines] = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/);
  const cols = head.split(',');
  return lines.map(l => Object.fromEntries(l.split(',').map((v, i) => [cols[i], v])));
}
const toSn = r => ({ ...r, opportunity_id: r.id, currency_code: r.currency,
  ...Object.fromEntries(['addon_already_selected', 'capacity_available', 'client_opt_out', 'addon_budget_confirmed']
    .map(k => [k, r[k] === 'true' ? '1' : '0'])) });

function harness(rows) {
  const writes = [];
  function GlideRecord(table) { this.table = table; this.i = -1; this.rows = rows; }
  GlideRecord.prototype = {
    orderBy() {}, query() {}, next() { return ++this.i < this.rows.length; },
    getValue(f) { const v = this.rows[this.i][f]; return v === undefined || v === '' ? null : String(v); },
    setValue(f, v) { (this.pending ||= {})[f] = v; }, setWorkflow(on) { this.workflow = on; },
    update() { writes.push({ id: this.rows[this.i].opportunity_id, workflow: this.workflow, ...this.pending }); this.pending = {}; }
  };
  function GlideDateTime() {}
  GlideDateTime.prototype.getLocalDate = () => ({ getValue: () => '2026-11-14' });
  const policy = loadScriptInclude('EventRevenuePolicy');
  const review = loadScriptInclude('EventRevenueReview',
    { GlideRecord, GlideDateTime, EventRevenuePolicy: policy.ctor });
  return { Review: review.ctor, writes };
}

const rows = csvRows(path.join(root, 'data/synthetic_event_opportunities.csv')).map(toSn);
const expected = JSON.parse(fs.readFileSync(path.join(root, 'results/analysis.json'))).summary;

test('ServiceNow adapter reproduces local summary for 2026-11-14', () => {
  const { Review } = harness(rows);
  const s = JSON.parse(JSON.stringify(new Review().runAll('2026-11-14', false)));
  for (const k of ['invalid', 'quote_followups', 'margin_reviews', 'overdue_deposit_reviews', 'addon_candidates',
    'overdue_deposit_paise', 'eligible_addon_revenue_paise', 'eligible_addon_contribution_paise'])
    a.equal(s[k], expected[k], k);
  a.equal(s.records, 24);
  a.equal(s.realized_income_increase_paise, 0);
});

test('read-only run writes nothing; write run disables workflow on every update', () => {
  let h = harness(rows); new h.Review().runAll('2026-11-14', false); a.equal(h.writes.length, 0);
  h = harness(rows); new h.Review().runAll(null, true);
  a.equal(h.writes.length, 24);
  a.ok(h.writes.every(w => w.workflow === false && w.last_reviewed_on === '2026-11-14'));
});

test('empty integer field is flagged, not treated as zero', () => {
  const { Review } = harness([{ ...rows[0], estimated_cost_paise: '' }]);
  const s = JSON.parse(JSON.stringify(new Review().runAll('2026-11-14', false)));
  a.equal(s.invalid, 1);
});
