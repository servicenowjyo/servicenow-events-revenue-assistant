/*
 * Scheduled Script Execution: Kaivalyam - Daily event revenue review
 * Run: Daily, 08:00. Run as: a dedicated user whose time zone is Asia/Kolkata.
 * Writes advice fields only. Sends nothing, creates no tasks, changes no quotes or payments.
 */
(function() {
    var summary = new EventRevenueReview().runAll(null, true);
    gs.info('Kaivalyam event revenue review: ' + JSON.stringify(summary));
})();
