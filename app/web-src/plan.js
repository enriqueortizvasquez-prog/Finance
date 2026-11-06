/* ================== GASTOS FIJOS (se anotan solos) ================== */
const isFixedTx=x=>!!x.rec||FIXED.includes(x.cat)||state.recs.some(r=>r.cat===x.cat&&r.amount===x.amount);
function applyRecs(){
  const t=new Date(),cur=mkey(t),added=[];
  for(const r of state.recs){
    if(!r.active)continue;r.done=r.done||[];
    let [y,m]=(r.start||cur).split('-').map(Number);m--;
    for(let guard=0;guard<36;guard++){
      const k=`${y}-${pad2(m+1)}`;if(k>cur)break;
      const day=Math.min(r.day,daysIn(y,m));
      if(!r.done.includes(k)&&(k<cur||day<=t.getDate())&&state.accs.some(a=>a.id===r.acc)){
        const tx={id:'r'+Date.now()+Math.floor(Math.random()*1e4),type:r.type,amount:r.amount,cat:r.cat,acc:r.acc,note:r.name,date:`${k}-${pad2(day)}`,rec:r.id};
        state.txs.push(tx);r.done.push(k);added.push(r);
      }
      m++;if(m>11){m=0;y++}
    }
  }
  if(added.length){persist();setTimeout(()=>toast(added.length===1?`${added[0].name} se anotó solo (gasto fijo)`:`${added.length} gastos fijos se anotaron solos`),900)}
  return added;
}
/* próximos pagos: gastos fijos y tarjetas */
function nextRecDate(r){
  const t=new Date(),k=mkey(t);
  let y=t.getFullYear(),m=t.getMonth();
  if(r.done?.includes(k)||Math.min(r.day,daysIn(y,m))<t.getDate()){m++;if(m>11){m=0;y++}}
  return new Date(y,m,Math.min(r.day,daysIn(y,m)));
}
function upcoming(days=31){
  const t=new Date(),lim=new Date(t.getFullYear(),t.getMonth(),t.getDate()+days),out=[];
  for(const r of state.recs){if(!r.active||r.type!=='gasto')continue;const d=nextRecDate(r);if(d<=lim)out.push({kind:'rec',id:r.id,name:r.name,amount:r.amount,acc:r.acc,date:d})}
  for(const a of state.accs){if(a.kind!=='credito')continue;const c=cardInfo(a);if(c.due>0&&c.payDate<=lim)out.push({kind:'card',id:a.id,name:a.name,amount:c.due,acc:a.id,date:c.payDate})}
  return out.sort((a,b)=>a.date-b.date);
}
const daysUntil=d=>{const t=new Date();return Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate())-new Date(t.getFullYear(),t.getMonth(),t.getDate()))/864e5)};
const whenTxt=d=>{const n=daysUntil(d);return n<=0?'hoy':n===1?'mañana':n<7?`en ${n} días`:`${d.getDate()} ${MSHORT[d.getMonth()]}`};

/* ================== TARJETA DE CRÉDITO ================== */
/* Ciclos: cada compra cae en el estado de cuenta que cierra en el siguiente día de corte.
   Ese estado se paga el día de pago siguiente al corte. Las cuotas caen una por estado. */
function cardInfo(a){
  const t=new Date(),T=new Date(t.getFullYear(),t.getMonth(),t.getDate()),cd=a.closeDay||20,pd=a.payDay||5,bal=balances()[a.id]||0,debt=Math.max(0,-bal);
  const ymd=(ym,day)=>{const y=Math.floor(ym/12),m=ym%12;return new Date(y,m,Math.min(day,daysIn(y,m)))};
  const stmt=x=>{const ym=x.getFullYear()*12+x.getMonth();return x.getDate()<=Math.min(cd,daysIn(x.getFullYear(),x.getMonth()))?ym:ym+1};
  const closeOf=s=>ymd(s,cd),payOf=s=>ymd(pd>cd?s:s+1,pd);
  let s=stmt(T)-2;while(payOf(s)<T)s++;
  const buys=state.txs.filter(x=>x.type==='gasto'&&x.acc===a.id);let charge=0;const plans=[];
  for(const x of buys){const s0=stmt(parseISO(x.date)),n=x.cuotas||1,k=s-s0;if(k>=0&&k<n){charge+=x.amount/n;if(n>1)plans.push({tx:x,n,i:k+1,per:x.amount/n})}}
  const prevPay=payOf(s-1),paid=state.txs.filter(x=>x.type==='mov'&&x.to===a.id&&parseISO(x.date)>prevPay&&parseISO(x.date)<=T).reduce((v,x)=>v+(x.amountTo??x.amount),0);
  const due=Math.round(Math.max(0,Math.min(debt,charge-paid))*100)/100,closeDate=closeOf(s);
  return{debt,limit:a.limit||0,free:Math.max(0,(a.limit||0)-debt),due,payDate:payOf(s),closeDate,open:closeDate>=T,plans,paid};
}

/* ================== METAS, DEUDAS, RACHA, FRECUENTES ================== */
const goalSaved=()=>state.goals.reduce((s,g)=>s+(g.saved||0),0);
function goalPace(g){const left=Math.max(0,g.target-g.saved),weeks=Math.max(1,Math.ceil(daysUntil(parseISO(g.date))/7));return{left,weeks,perWeek:left/weeks,p:g.target?Math.min(1,g.saved/g.target):0}}
const debtTotals=()=>{const o=state.debts.filter(d=>!d.paid);return{me:o.filter(d=>d.dir==='medeben').reduce((s,d)=>s+d.amount,0),yo:o.filter(d=>d.dir==='debo').reduce((s,d)=>s+d.amount,0),open:o}};
function streak(){
  const days=new Set(state.txs.map(t=>t.date)),d=new Date();if(!days.has(iso(d)))d.setDate(d.getDate()-1);
  let n=0;while(days.has(iso(d))&&n<999){n++;d.setDate(d.getDate()-1)}return n;
}
function templates(){
  const since=iso(new Date(now.getFullYear(),now.getMonth(),now.getDate()-60)),g={};
  for(const t of state.txs){if(t.type!=='gasto'||t.date<since||t.rec||t.cuotas>1||!t.note)continue;const k=`${norm(t.note)}|${t.cat}|${t.acc}`;
    const e=(g[k]=g[k]||{n:0,am:{},best:t});e.n++;e.am[t.amount]=(e.am[t.amount]||0)+1;
    const cb=e.am[e.best.amount]||0,cn=e.am[t.amount];if(cn>cb||(cn===cb&&t.date>=e.best.date))e.best=t}
  return Object.values(g).filter(x=>x.n>=3).sort((a,b)=>b.n-a.n||b.best.date.localeCompare(a.best.date)).slice(0,4).map(x=>x.best);
}
/* resumen de un mes cerrado */
function monthStory(Y,M){
  const d=monthData(Y,M),pv=monthData(M?Y:Y-1,M?M-1:11),byDay={};
  d.list.filter(t=>t.type==='gasto'&&!isFixedTx(t)).forEach(t=>byDay[t.date]=(byDay[t.date]||0)+toPEN(t.amount,t.acc));
  const top=Object.entries(byDay).sort((a,b)=>b[1]-a[1])[0];
  return{d,pv,saved:d.inc-d.exp,rate:d.inc?(d.inc-d.exp)/d.inc:0,topCat:d.byCat[0],topDay:top,diff:pv.exp?(d.exp-pv.exp)/pv.exp:0,n:d.list.length};
}
