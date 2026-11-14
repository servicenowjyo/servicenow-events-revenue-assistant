# Proposed solution for Kaivalyam Events

## Opportunity to validate with your cousin
For event decor/planning, the quote-to-booking handoff and the cost of extras can affect contribution. A promising project is a **ServiceNow Event Revenue Assistant**: surface quotes needing follow-up, stop unnoticed low-margin quotes from being treated as healthy opportunities, and identify relevant, deliverable optional upgrades. This is a proposed business opportunity; no claim that Kaivalyam currently has these problems.

## Dataset used — exact answer
Synthetic Hyderabad Event Opportunities v1: **24 invented rows**, snapshot November14,2026. CSV and JSON supplied, with a deterministic Python generator. I did not take genuine customer data from Instagram, public filings, another business or Kaggle. Instagram informed service context only. See DATASET_CARD.md for every field and limitation. Event types/prices/costs are hypotheses, not Kaivalyam's catalogue.

## What ServiceNow would do
1. Each inquiry/quote is an **Event Opportunity** record in a scoped app, with event date, quote, estimated delivery cost, deposit schedule and one candidate add-on.
2. Script Include `EventRevenuePolicy` holds the rules; `EventRevenueReview` reads records and writes advice fields. The same Script Include file is what the local Node tests run, so local and instance results come from one source.
3. Open quotes at least 3 calendar days old get a follow-up recommendation. A later version could create one de-duplicated Task per owner; this version sends nothing.
4. Estimated contribution below 25% of quote gets manager review. Threshold is a demo assumption. Contribution = quoted price minus estimated delivery costs; it is not net profit and excludes overheads/taxes.
5. A booked event within 45 days can receive an optional add-on discussion only when capacity, budget and positive add-on contribution are confirmed, the client has not opted out and it was not already sold. A real quote amendment requires owner/client agreement.
6. Past-due contractual deposit amounts are reviewed separately against actual receipts. Collections are never labelled new revenue.
7. A daily scheduled job refreshes the advice; a "Review revenue actions" form button re-checks one record on demand.

## Observed local results
24 valid synthetic opportunities; **32 tests passed (29 rule tests + 3 GlideRecord-adapter tests)**.
- 6 quote follow-ups.
- 4 margin reviews.
- 4 overdue-deposit reviews: **₹2,00,000 of existing scheduled cash due**.
- 2 optional-add-on candidates: **₹35,000 possible add-on sales**, with **₹15,500 estimated incremental contribution if both are accepted and delivered at assumed costs**.
- Illustrative what-if: 25% realization of that add-on contribution = **₹3,875**, before CRM/staff/other costs. The 25% is an arbitrary scenario, not a predicted conversion rate. No forecast is fitted to real outcomes.
- Actual measured income increase: **none; no business trial run**.
Counts can overlap; never sum them into distinct customers. Follow-up pipeline quote values are not booked revenue. Cost savings and lost sales recovered are not established.

## Concrete example (invented)
An event quote of ₹1,00,000 with ₹70,000 estimated delivery cost has ₹30,000 estimated contribution. An optional ₹20,000 upgrade costing ₹12,000 adds ₹8,000 contribution if accepted. Total contribution becomes ₹38,000, before overheads and taxes. A pending ₹25,000 deposit is existing cash to collect; do not add it to sales growth.

## Status and next steps
The rule engine is a ServiceNow Script Include, executed and tested locally under Node (32/32). It was also deployed on a ServiceNow personal developer instance, where it gave identical results on all 24 synthetic records (see `results/servicenow_verification_2026-11-14.txt`). No ServiceNow credentials, customer contacts, WhatsApp integration or payments are involved. Follow `docs/SERVICENOW_SETUP.md` on a personal developer instance; the owner should validate catalogue, costs, thresholds, timezone, lead workflow and consent before a real-data pilot. `PILOT_PLAN.md` describes measuring actual improvement. Check licence/operating costs before any paid rollout; the prototype itself runs on a free developer instance.
