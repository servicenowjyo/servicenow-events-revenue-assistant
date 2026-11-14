# ServiceNow setup (personal developer instance)

The author deployed and verified this on a personal developer instance on 14 Nov 2026. The verification script reported `VERIFICATION PASSED`, the daily job wrote advice that matched `results/analysis.json` on all 24 records, and the form button worked (see `results/servicenow_verification_2026-11-14.txt`). The repo files match what was installed, except that `EventRevenueReview.TABLE` uses that instance's vendor prefix `2304109`. On your own instance, change it in step 4. That deployment created the records through the REST Table API rather than an import set; both routes give the same records.

## What gets built
| Item | Type | File |
|---|---|---|
| Kaivalyam Event Revenue Assistant | Scoped application (`x_kaiv_rev`, plus your PDI vendor prefix) | — |
| Event Opportunity | Table, 24 fields | `servicenow/schema/event_opportunity.fields.csv` |
| EventRevenuePolicy | Script Include (pure rules, ES5) | `servicenow/script_includes/EventRevenuePolicy.js` |
| EventRevenueReview | Script Include (reads/writes records) | `servicenow/script_includes/EventRevenueReview.js` |
| Daily event revenue review | Scheduled Script Execution | `servicenow/scheduled_jobs/daily_review.scheduled_job.js` |
| Review revenue actions | UI Action (form button) | `servicenow/ui_actions/review_revenue_actions.ui_action.js` |
| Import check | Background script | `servicenow/verification/verify_synthetic_import.background.js` |

No email notifications, Flow Designer flows, tasks, integrations, payment connections or WhatsApp. The app only writes advice fields.

## Steps
1. **Instance.** Request a free personal developer instance at developer.servicenow.com. Never load these synthetic records into a production instance.
2. **Scoped app.** Studio (or App Engine Studio) → Create application → name *Kaivalyam Event Revenue Assistant*, scope `x_kaiv_rev`. Your PDI will usually add a vendor prefix (e.g. `x_1234567_kaiv_rev`). Write down the full scope name.
3. **Table.** In the app, create table *Event Opportunity*. Add every column in `event_opportunity.fields.csv` with the type and length shown. Create the four `stage` choices exactly as listed. Set the output fields (`recommended_actions` → `last_reviewed_on`) read-only on the form.
4. **Script Includes.** Create `EventRevenuePolicy` and `EventRevenueReview` (Accessible from: this application scope only; Client callable: off). Paste the files as they are. In `EventRevenueReview.js`, set `EventRevenueReview.TABLE` to your table's full name, e.g. `x_1234567_kaiv_rev_event_opportunity`.
5. **Roles.** Create `x_kaiv_rev.sales_manager` and give it read/write ACLs on the table. Add the role to your test user. Use your prefixed role name in the UI Action condition.
6. **Import the data.** System Import Sets → Load Data → upload `data/synthetic_event_opportunities.csv`. Create a transform map to the Event Opportunity table: `id` → `opportunity_id`, `currency` → `currency_code`, every other column to the field with the same name. Amounts stay in integer paise, so don't convert them. Use `opportunity_id` as the coalesce field so a second run updates records instead of creating duplicates.
7. **Verify.** Scripts – Background, with the app scope selected → paste `verify_synthetic_import.background.js` → Run. Expect `VERIFICATION PASSED`: 24 records, 6 follow-ups, 4 margin reviews, 4 overdue-deposit reviews, 2 add-on candidates, ₹2,00,000 overdue, ₹15,500 add-on contribution. The script is read-only.
8. **UI Action and scheduled job.** Create the form button and the daily job from their files. Give the job a dedicated run-as user whose time zone is **Asia/Kolkata**, because "today" comes from that user's local date. Run the job once, open a record and check the advice fields. Take real screenshots now and save them in `results/screenshots/`. Don't substitute mock-ups.

## Before a real pilot with the business
- Agree the real stages, cost basis, follow-up interval, 25% margin floor, 45-day add-on window and time zone with the owner. All of these are demo assumptions.
- Discounts, quote changes and paid add-ons need an approval process the owner signs off on. The advice fields don't enforce anything.
- Deposits follow the signed contract and bank-reconciled receipts. An overdue deposit is existing cash to collect, never new revenue.
- An optional next step is to create one Task per opportunity per action per day, with de-duplication, owner routing, contact limits and opt-out checks. This version deliberately has none of that.
