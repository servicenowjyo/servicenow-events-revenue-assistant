/*
 * Script Include: EventRevenueReview
 * Scope:          Kaivalyam Event Revenue Assistant (scoped application)
 * Accessible from: This application scope only
 * Client callable: false
 *
 * Reads Event Opportunity records, runs EventRevenuePolicy and (optionally)
 * writes the advice back onto the record. Nothing else happens: no emails,
 * no tasks, no quote changes, no payments. setWorkflow(false) stops the
 * write-back from firing notifications or other business rules.
 *
 * TABLE must match your table's full name. Personal developer instances add
 * a vendor prefix to the scope, e.g. x_1234567_kaiv_rev_event_opportunity.
 */
var EventRevenueReview = Class.create();

EventRevenueReview.TABLE = 'x_2304109_kaiv_rev_event_opportunity'; // change to your own table name
EventRevenueReview.MONEY = ['quote_paise', 'estimated_cost_paise', 'deposit_due_paise',
    'deposit_received_paise', 'addon_price_paise', 'addon_cost_paise'];
EventRevenueReview.FLAGS = ['addon_already_selected', 'capacity_available', 'client_opt_out', 'addon_budget_confirmed'];

EventRevenueReview.prototype = {
    initialize: function() {
        this.policy = new EventRevenuePolicy();
    },

    /* Business-calendar date for the run-as user. Set that user's time zone to Asia/Kolkata. */
    todayLocal: function() {
        return new GlideDateTime().getLocalDate().getValue();
    },

    /* Integer field -> number. Empty or non-digit values stay invalid instead of becoming 0. */
    _int: function(gr, f) {
        var v = gr.getValue(f);
        return v !== null && /^\d+$/.test(v) ? parseInt(v, 10) : v;
    },

    /* True/False field -> boolean. Empty stays invalid: a missing answer is not consent. */
    _bool: function(gr, f) {
        var v = gr.getValue(f);
        if (v === '1' || v === 'true') return true;
        if (v === '0' || v === 'false') return false;
        return v;
    },

    toPolicyInput: function(gr) {
        var d = {
            id: gr.getValue('opportunity_id'),
            currency: gr.getValue('currency_code'),
            stage: gr.getValue('stage'),
            quote_date: gr.getValue('quote_date'),
            event_date: gr.getValue('event_date'),
            deposit_due_date: gr.getValue('deposit_due_date')
        }, i;
        for (i = 0; i < EventRevenueReview.MONEY.length; i++) d[EventRevenueReview.MONEY[i]] = this._int(gr, EventRevenueReview.MONEY[i]);
        for (i = 0; i < EventRevenueReview.FLAGS.length; i++) d[EventRevenueReview.FLAGS[i]] = this._bool(gr, EventRevenueReview.FLAGS[i]);
        return d;
    },

    reviewRecord: function(gr, asOf, write) {
        var day = asOf || this.todayLocal();
        var r = this.policy.assess(this.toPolicyInput(gr), day);
        if (write) {
            gr.setValue('recommended_actions', r.actions.join(','));
            gr.setValue('validation_issues', r.issues.join(','));
            gr.setValue('contribution_paise', r.valid ? r.contribution_paise : '');
            gr.setValue('contribution_margin_pct', r.valid && r.contribution_margin !== null ? Math.round(r.contribution_margin * 10000) / 100 : '');
            gr.setValue('overdue_deposit_paise', r.valid ? r.overdue_deposit_paise : '');
            gr.setValue('eligible_addon_contribution_paise', r.valid ? r.eligible_addon_contribution_paise : '');
            gr.setValue('last_reviewed_on', day);
            gr.setWorkflow(false);
            gr.update();
        }
        return r;
    },

    runAll: function(asOf, write) {
        var day = asOf || this.todayLocal();
        var s = { as_of: day, environment: 'SERVICENOW', records: 0, invalid: 0, quote_followups: 0, margin_reviews: 0,
            overdue_deposit_reviews: 0, addon_candidates: 0, overdue_deposit_paise: 0,
            eligible_addon_revenue_paise: 0, eligible_addon_contribution_paise: 0, realized_income_increase_paise: 0 };
        var gr = new GlideRecord(EventRevenueReview.TABLE);
        gr.orderBy('opportunity_id');
        gr.query();
        while (gr.next()) {
            var r = this.reviewRecord(gr, day, write);
            s.records++;
            if (!r.valid) { s.invalid++; continue; }
            if (r.actions.indexOf('FOLLOW_UP_QUOTE') !== -1) s.quote_followups++;
            if (r.actions.indexOf('REVIEW_MARGIN') !== -1) s.margin_reviews++;
            if (r.actions.indexOf('REVIEW_OVERDUE_DEPOSIT') !== -1) s.overdue_deposit_reviews++;
            if (r.actions.indexOf('DISCUSS_OPTIONAL_ADDON') !== -1) s.addon_candidates++;
            s.overdue_deposit_paise += r.overdue_deposit_paise;
            s.eligible_addon_revenue_paise += r.eligible_addon_revenue_paise;
            s.eligible_addon_contribution_paise += r.eligible_addon_contribution_paise;
        }
        return s;
    },

    type: 'EventRevenueReview'
};
