# Reproduce fixture (Python3, no dependencies)
import datetime,json,csv
from pathlib import Path
out=Path(__file__).parent
rows=[]
asof=datetime.date(2026,11,14)
for i in range(24):
 q=(80000+(i%6)*40000)*100
 rows.append(dict(id=f'SYN-EVT-{i+1:03}',currency='INR',event_type=['Engagement','Wedding decor','Celebration','Corporate event'][i%4],
 stage=['quoted','negotiation','closed_won','closed_won','closed_lost','closed_won'][i%6],
 quote_date=str(asof-datetime.timedelta(days=1+i%8)),event_date=str(asof+datetime.timedelta(days=7+i*2)),
 quote_paise=q,estimated_cost_paise=round(q*([.68,.72,.70,.85,.75,.60][i%6])),
 deposit_due_date=str(asof-datetime.timedelta(days=2)),deposit_due_paise=q//2,
 deposit_received_paise=q//(4 if i%3==0 else 2),
 addon_price_paise=(10000+(i%4)*5000)*100,addon_cost_paise=(6000+(i%4)*2500)*100,
 addon_already_selected=i%7==0,capacity_available=i%5!=0,client_opt_out=i%11==0,addon_budget_confirmed=i%4!=0))

(out/'synthetic_event_opportunities.json').write_text(json.dumps(rows,indent=2)+'\n',encoding='utf-8')
with (out/'synthetic_event_opportunities.csv').open('w',encoding='utf-8',newline='') as f:
 w=csv.DictWriter(f,fieldnames=rows[0].keys());w.writeheader()
 for r in rows: w.writerow({k:(str(v).lower() if isinstance(v,bool) else v) for k,v in r.items()})  # ServiceNow import-friendly booleans
