# Validation status (14 Nov 2026)
**Local:** `npm test` passed 32 of 32 (29 rule tests, which run the ServiceNow Script Include itself, plus 3 tests of the GlideRecord adapter on a mock). `npm run demo` processed 24 valid synthetic rows into results/analysis.json.

**ServiceNow developer instance (Brazil release, scope x_2304109_kaiv_rev):** created the scoped app, Event Opportunity table (24 fields), 2 Script Includes, the sales_manager role, a UI Action and a daily scheduled job, then loaded the 24 synthetic records. The Script Include source hashes matched the repo files before install.
- The background verification script reported VERIFICATION PASSED, with every summary figure identical to local.
- Ran the scheduled job once. The advice fields on all 24 records matched results/analysis.json with 0 differences.
- The "Review revenue actions" button on SYN-EVT-004 showed a margin review and an overdue-deposit review. Screenshot: results/screenshots/.

**Not verified or not done:** table ACLs for the sales_manager role (the instance admin was used), a run-as user in the Asia/Kolkata time zone, a real business trial, and real client data. No messages were sent and no payments were made. No revenue was generated. The retired Salesforce version was never deployed and is not published.
