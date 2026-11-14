// Loads the ServiceNow Script Include source unchanged and exposes it to Node.
// One source of truth: servicenow/script_includes/EventRevenuePolicy.js
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const snClass = { create: () => function () { this.initialize.apply(this, arguments); } };

function loadScriptInclude(name, globals = {}) {
  const file = path.join(root, 'servicenow/script_includes', name + '.js');
  const ctx = vm.createContext({ Class: snClass, ...globals });
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
  return { ctor: vm.runInContext(name, ctx), ctx };
}

const { ctor: EventRevenuePolicy } = loadScriptInclude('EventRevenuePolicy');
const engine = new EventRevenuePolicy();
// JSON round-trip returns plain objects from this realm (vm results use another realm's prototypes).
const assessDeal = (d, asOf) => JSON.parse(JSON.stringify(engine.assess(d, asOf)));
const day = s => engine.day(s);

module.exports = { assessDeal, day, loadScriptInclude, EventRevenuePolicy };
