/*
 * Run in System Definition > Scripts - Background, in the Kaivalyam application scope,
 * AFTER importing data/synthetic_event_opportunities.csv. Read-only (write = false).
 * Checks the instance gives the same answers as the locally tested engine for 2026-11-14.
 */
(function() {
    var expected = { records: 24, invalid: 0, quote_followups: 6, margin_reviews: 4, overdue_deposit_reviews: 4,
        addon_candidates: 2, overdue_deposit_paise: 20000000, eligible_addon_revenue_paise: 3500000,
        eligible_addon_contribution_paise: 1550000 };
    var s = new EventRevenueReview().runAll('2026-11-14', false), failures = [];
    for (var k in expected) {
        if (s[k] !== expected[k]) failures.push(k + ': expected ' + expected[k] + ', got ' + s[k]);
    }
    gs.info(JSON.stringify(s));
    gs.info(failures.length ? 'VERIFICATION FAILED\n' + failures.join('\n') : 'VERIFICATION PASSED: instance matches local results');
})();
