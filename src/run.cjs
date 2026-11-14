const fs=require('node:fs'),path=require('node:path'),{assessDeal}=require('./policy.cjs');
const root=path.resolve(__dirname,'..'),data=JSON.parse(fs.readFileSync(path.join(root,'data/synthetic_event_opportunities.json')));
const asOf='2026-11-14',results=data.map(d=>assessDeal(d,asOf));
const count=a=>results.filter(r=>r.actions.includes(a)).length;
const sum=k=>results.reduce((n,r)=>n+(r[k]||0),0);
const summary={as_of:asOf,environment:'LOCAL_NODE_RUN_OF_SERVICENOW_SCRIPT_INCLUDE',synthetic_records:data.length,invalid:results.filter(r=>!r.valid).length,quote_followups:count('FOLLOW_UP_QUOTE'),margin_reviews:count('REVIEW_MARGIN'),overdue_deposit_reviews:count('REVIEW_OVERDUE_DEPOSIT'),addon_candidates:count('DISCUSS_OPTIONAL_ADDON'),overdue_deposit_paise:sum('overdue_deposit_paise'),eligible_addon_revenue_paise:sum('eligible_addon_revenue_paise'),eligible_addon_contribution_paise:sum('eligible_addon_contribution_paise'),realized_income_increase_paise:0};
// Separate what-if: assumes 25% of eligible add-on contribution is realized. Not prediction.
summary.illustrative_25pct_addon_contribution_paise=Math.round(summary.eligible_addon_contribution_paise*.25);
fs.mkdirSync(path.join(root,'results'),{recursive:true});fs.writeFileSync(path.join(root,'results/analysis.json'),JSON.stringify({summary,results},null,2)+'\n');console.log(JSON.stringify(summary,null,2));
