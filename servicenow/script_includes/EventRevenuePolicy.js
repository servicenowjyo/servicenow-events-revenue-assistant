/*
 * Script Include: EventRevenuePolicy
 * Scope:          Kaivalyam Event Revenue Assistant (scoped application)
 * Accessible from: This application scope only
 * Client callable: false
 *
 * Pure, advice-only rule engine. No GlideRecord, no messages, no payments.
 * Money is integer INR paise; dates are ISO calendar dates (YYYY-MM-DD).
 * Written in ES5 so it runs on any ServiceNow JavaScript mode. The same file
 * is executed unchanged by the Node test suite (see src/policy.cjs).
 */
var EventRevenuePolicy = Class.create();

EventRevenuePolicy.STAGES = ['quoted', 'negotiation', 'closed_won', 'closed_lost'];
EventRevenuePolicy.MONEY_FIELDS = ['quote_paise', 'estimated_cost_paise', 'deposit_due_paise',
    'deposit_received_paise', 'addon_price_paise', 'addon_cost_paise'];
EventRevenuePolicy.BOOLEAN_FIELDS = ['addon_already_selected', 'capacity_available',
    'client_opt_out', 'addon_budget_confirmed'];
EventRevenuePolicy.FOLLOW_UP_DAYS = 3;        // demo assumption
EventRevenuePolicy.MARGIN_FLOOR = 0.25;       // demo assumption, not company policy
EventRevenuePolicy.ADDON_WINDOW_DAYS = 45;    // demo assumption
EventRevenuePolicy.MAX_PAISE = 1000000000;    // fits a ServiceNow Integer field

EventRevenuePolicy.prototype = {
    initialize: function() {},

    /* ISO date -> whole UTC day number, or NaN for anything that is not a real calendar date. */
    day: function(s) {
        if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return NaN;
        var y = parseInt(s.substring(0, 4), 10), m = parseInt(s.substring(5, 7), 10), d = parseInt(s.substring(8, 10), 10);
        var t = Date.UTC(y, m - 1, d), dt = new Date(t);
        if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return NaN;
        return t / 86400000;
    },

    _money: function(n) {
        return typeof n === 'number' && isFinite(n) && Math.floor(n) === n && n >= 0 && n <= EventRevenuePolicy.MAX_PAISE;
    },

    _has: function(list, value) {
        return list.indexOf(value) !== -1;
    },

    assess: function(d, asOf) {
        var P = EventRevenuePolicy, issues = [], i, k;
        var today = this.day(asOf), event = this.day(d.event_date), quote = this.day(d.quote_date), due = this.day(d.deposit_due_date);

        for (i = 0; i < P.MONEY_FIELDS.length; i++) {
            k = P.MONEY_FIELDS[i];
            if (!this._money(d[k])) issues.push('INVALID_' + k.toUpperCase());
        }
        if (!d.id || d.currency !== 'INR') issues.push('INVALID_ID_OR_CURRENCY');
        if (isNaN(today) || isNaN(event) || isNaN(quote) || isNaN(due)) issues.push('INVALID_DATE');
        if (!this._has(P.STAGES, d.stage)) issues.push('UNKNOWN_STAGE');
        for (i = 0; i < P.BOOLEAN_FIELDS.length; i++) {
            k = P.BOOLEAN_FIELDS[i];
            if (typeof d[k] !== 'boolean') issues.push('INVALID_' + k.toUpperCase());
        }
        if (d.deposit_due_paise > d.quote_paise || d.deposit_received_paise > d.quote_paise) issues.push('DEPOSIT_EXCEEDS_QUOTE');
        if (quote > today || quote > event) issues.push('INCONSISTENT_QUOTE_DATE');
        if (issues.length) return { id: d.id, valid: false, issues: issues, actions: [], payment_authorized: false };

        var won = d.stage === 'closed_won', lost = d.stage === 'closed_lost', upcoming = event >= today;
        var contribution = d.quote_paise - d.estimated_cost_paise;
        var margin = d.quote_paise > 0 ? contribution / d.quote_paise : null;
        var followUp = !won && !lost && upcoming && today - quote >= P.FOLLOW_UP_DAYS;
        var lowMargin = !lost && upcoming && (margin === null || margin < P.MARGIN_FLOOR);
        var depositOutstanding = won && due < today ? Math.max(0, d.deposit_due_paise - d.deposit_received_paise) : 0;
        var addonContribution = d.addon_price_paise - d.addon_cost_paise;
        var addon = won && upcoming && event - today <= P.ADDON_WINDOW_DAYS && !lowMargin &&
            !d.addon_already_selected && d.capacity_available && !d.client_opt_out && d.addon_budget_confirmed &&
            addonContribution > 0 && d.addon_price_paise > 0 && addonContribution / d.addon_price_paise >= P.MARGIN_FLOOR;

        var actions = [];
        if (followUp) actions.push('FOLLOW_UP_QUOTE');
        if (lowMargin) actions.push('REVIEW_MARGIN');
        if (depositOutstanding > 0) actions.push('REVIEW_OVERDUE_DEPOSIT');
        if (addon) actions.push('DISCUSS_OPTIONAL_ADDON');

        return {
            id: d.id, valid: true, issues: [], actions: actions,
            contribution_paise: contribution, contribution_margin: margin,
            overdue_deposit_paise: depositOutstanding,
            eligible_addon_revenue_paise: addon ? d.addon_price_paise : 0,
            eligible_addon_contribution_paise: addon ? addonContribution : 0,
            payment_authorized: false
        };
    },

    type: 'EventRevenuePolicy'
};
