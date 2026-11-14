/*
 * UI Action: Review revenue actions
 * Table: Event Opportunity (x_2304109_kaiv_rev_event_opportunity)   Form button: true
 * Action name: kaiv_review_revenue   Client: false
 * Condition: gs.hasRole('x_2304109_kaiv_rev.sales_manager')
 * Recalculates advice for this one record and shows it. Advice only.
 */
(function() {
    var labels = {
        FOLLOW_UP_QUOTE: 'Follow up this quote (open 3+ days).',
        REVIEW_MARGIN: 'Manager review: estimated contribution below 25% of quote.',
        REVIEW_OVERDUE_DEPOSIT: 'Finance review: deposit past due. This is existing cash, not new sales.',
        DISCUSS_OPTIONAL_ADDON: 'Optional add-on can be discussed: capacity, budget and margin confirmed, no opt-out.'
    };
    var r = new EventRevenueReview().reviewRecord(current, null, true);
    if (!r.valid) {
        gs.addErrorMessage('Record needs fixing before review: ' + r.issues.join(', '));
    } else if (!r.actions.length) {
        gs.addInfoMessage('No revenue actions for this event today.');
    } else {
        for (var i = 0; i < r.actions.length; i++) gs.addInfoMessage(labels[r.actions[i]]);
    }
    action.setRedirectURL(current);
})();
