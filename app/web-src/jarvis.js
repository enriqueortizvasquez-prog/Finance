/* ================== JARVIS · CEREBRO ================== */
const KW={
  comida:['almuerzo','menu','cena','desayuno','cafe','comida','pollo','pollada','ceviche','mercado','pan','restaurante','chifa','pizza','hamburguesa','jugo','snack','bodega','delivery','lonche','fruta','salchipapa','anticucho','polleria','galleta','helado','gaseosa'],
  transporte:['taxi','combi','micro','bus','pasaje','mototaxi','moto','gasolina','uber','didi','cabify','colectivo','peaje','estacionamiento','cochera','indriver','tren','carro'],
  casa:['alquiler','renta','casa','mueble','limpieza','departamento','cuarto','ferreteria'],
  servicios:['luz','agua','internet','celular','telefono','cable','gas','recarga','movistar','claro','entel','bitel','hidrandina'],
  universidad:['universidad','matricula','pension','curso','libro','copias','separata','ciclo','utiles','udemy','platzi','taller','clase','facultad','tesis','examen','u'],
  salud:['farmacia','medicina','medicamento','doctor','consulta','pastilla','dentista','clinica','inkafarma','mifarma','vitamina'],
  ocio:['cine','netflix','spotify','juego','salida','fiesta','cerveza','chela','bar','concierto','discoteca','youtube','disney','hbo','steam','play','karaoke','viaje'],
  compras:['ropa','zapatilla','polo','pantalon','compra','tienda','plaza vea','tottus','ripley','saga','falabella','amazon','metro','wong','mall','audifono','mochila'],
  sueldo:['sueldo','quincena','salario','planilla'],freelance:['freelance','proyecto','cliente','web','diseno','chamba','cachuelo'],ventas:['venta','vendi'],
};
const ACC_ALIAS={efectivo:['efectivo','cash','sencillo','billete','en mano','al contado'],yape:['yape','yapee','yapeado','yapeo','yapearon'],plin:['plin'],lemon:['lemon','lemoncash'],bcp:['bcp','credito bcp']};
const kwHit=(s,w)=>new RegExp(`(^|[^a-z])${reEsc(w)}(es|s)?([^a-z]|$)`).test(s);
function findCat(s,type){
  for(const c of state.cats){if((!type||c.type===type)&&kwHit(s,norm(c.name)))return c.id}
  for(const [k,ws] of Object.entries(KW)){const c=state.cats.find(x=>x.id===k);if(!c||(type&&c.type!==type))continue;if(ws.some(w=>kwHit(s,w)))return k}
  return null;
}
function accHits(s){
  const hits=[];
  for(const a of state.accs){const words=[norm(a.name),...(ACC_ALIAS[a.id]||[])];let best=-1;
    for(const w of words){const m=new RegExp(`(^|[^a-z])${reEsc(w)}([^a-z]|$)`).exec(s);if(m&&(best<0||m.index<best))best=m.index}
    if(best>=0)hits.push({id:a.id,i:best})}
  if(!hits.length&&/tarjeta/.test(s)){const a=state.accs.find(a=>a.kind==='credito')||state.accs.find(a=>a.kind==='banco');if(a)hits.push({id:a.id,i:s.indexOf('tarjeta')})}
  return hits.sort((a,b)=>a.i-b.i);
}
const INCOME_RE=/(me pagaron|pagaron|cobre|ingreso|ingresa|recibi|gane|me depositaron|depositaron|vendi|yapearon|me dieron|me transfirieron|sueldo|quincena|salario|me plinearon)/;
const MOVE_RE=/(pase|pasé|transferi|movi|mande a mi|recargue|retire|saque|deposite en mi)/;
function stripAccs(r){
  let out=r;
  for(const a of state.accs){for(const w of [a.name,...(ACC_ALIAS[a.id]||[])])out=out.replace(new RegExp(`\\s*(con|por|en|del|de|desde|a|al|via)?\\s*(mi |el |la )?${reEsc(w)}\\b`,'gi'),' ')}
  return out.replace(/\s*(con|por|en|desde) (tarjeta|la tarjeta)\b/gi,' ');
}
function noteFrom(raw){
  let r=stripAccs(raw).replace(/s\/\.?\s*/gi,' ').replace(/\b(hoy|ayer|anteayer|antier)\b/gi,' ');
  const m=r.match(/\d+(?:[.,]\d{1,2})?\s*(?:soles|sol|lucas|mangos)?\s*(?:en|de|por|para|del)\s+(?:el |la |los |las |un |una |mi |unos |unas )?(.+)$/i);
  let n=m?m[1]:r.replace(/\d+(?:[.,]\d{1,2})?/g,' ').replace(/\b(soles|sol|lucas|gast[eé]|pagu[eé]|compr[eé]|me pagaron|pagaron|cobr[eé]|recib[ií]|gan[eé]|me depositaron|me yapearon|ingreso|gasto|en|de|por|para)\b/gi,' ');
  n=n.replace(/\s+/g,' ').trim().replace(/[.?!,]+$/,'');
  return n?n[0].toUpperCase()+n.slice(1):'';
}
function insights(){
  const n=state.user.name,Y=now.getFullYear(),M=now.getMonth(),d=monthData(Y,M),day=now.getDate(),dim=daysIn(Y,M),rem=dim-day,bal=balances();
  const todayL=d.list.filter(t=>t.type==='gasto'&&t.date===iso(now)),todayExp=sum(todayL),todayVar=sum(todayL.filter(t=>!FIXED.includes(t.cat)));
  const avg=sum(d.list.filter(t=>t.type==='gasto'&&!FIXED.includes(t.cat)))/day,proj=projection(d,Y,M),out=[];
  out.push(todayExp?`Hoy llevas ${money(todayExp)} en gastos${todayVar>avg*1.2?`, algo más que tu promedio diario de ${money(avg)}.`:todayVar<avg*.8?`, menos que tu promedio de ${money(avg)}. Bien ahí, ${n}.`:', justo en tu promedio.'}`
    :`Aún no registras gastos hoy, ${n}. Dime “gasté 15 en menú con yape” y lo anoto.`);
  const low=state.accs.filter(a=>a.kind!=='credito'&&(bal[a.id]||0)<50).sort((a,b)=>bal[a.id]-bal[b.id])[0];
  if(low)out.push(`En ${low.name} te quedan ${money(bal[low.id])}. ¿Le pasamos algo desde otra cuenta?`);
  out.push(proj>=0?`A este ritmo cerrarás ${MONTHS[M]} con unos ${money(proj)} libres.`:`Ojo, ${n}: a este ritmo terminarías ${MONTHS[M]} en ${money(proj)}. Intenta gastar máximo ${money(Math.max(0,d.bal)/Math.max(1,rem))} por día.`);
  budgetAlerts().slice(0,2).forEach(({c,p,s})=>out.push(p>=1?`Ya superaste tu límite de ${c.name} por ${money(s-state.budgets[c.id])}.`:`${c.name} va al ${Math.round(p*100)}% de su límite y quedan ${rem} días.`));
  /* avisos que van primero */
  const urgent=[];
  upcoming(3).forEach(u=>{const w=whenTxt(u.date);urgent.push(u.kind==='card'?`${cap(w)} vence tu ${u.name}: te toca pagar ${money(u.amount)}.`:`${cap(w)} se anota solo ${u.name} (${accMoney(u.amount,u.acc)}) desde ${accById(u.acc).name}.`)});
  if(now.getDay()===0){const w=weekSummary();if(w)urgent.push(w)}
  const owed=state.debts.filter(d=>!d.paid&&d.dir==='medeben'&&-daysUntil(parseISO(d.date))>=7)[0];
  if(owed)out.push(`${owed.person} te debe ${money(owed.amount)} desde ${agoTxt(owed.date)}. ¿Le recuerdas?`);
  const g=state.goals.find(g=>g.saved<g.target);
  if([4,10].includes(M))out.push(`Este mes llega tu CTS. Si puedes, aparta una parte${g?` para tu meta ${g.name}`:''} antes de gastarla.`);
  if([6,11].includes(M))out.push(`Este mes llega tu gratificación. Un buen plan: separar al menos el 30%${g?` para ${g.name}`:' para ahorrar'}.`);
  if(g){const q=goalPace(g);out.push(`Para tu meta ${g.name} te toca apartar ${money(q.perWeek)} esta semana.`)}
  return urgent.concat(out);
}
function weekSummary(){
  const t=new Date(now.getFullYear(),now.getMonth(),now.getDate()),a=new Date(t-6*864e5),b=new Date(t-13*864e5);
  const v=x=>x.type==='gasto'&&!isFixedTx(x)&&!(x.cuotas>1);
  const l=state.txs.filter(x=>v(x)&&parseISO(x.date)>=a&&parseISO(x.date)<=t),pl=state.txs.filter(x=>v(x)&&parseISO(x.date)>=b&&parseISO(x.date)<a);
  if(!l.length)return '';const g={};l.forEach(x=>g[x.cat]=(g[x.cat]||0)+toPEN(x.amount,x.acc));const top=Object.entries(g).sort((x,y)=>y[1]-x[1])[0],cur=sum(l),prev=sum(pl);
  return `Tu semana: gastaste ${money(cur)} en el día a día (sin contar fijos)${prev?`, ${cur<=prev?`${Math.round((1-cur/prev)*100)}% menos`:cur>prev*2?'más del doble':`${Math.round((cur/prev-1)*100)}% más`} que la anterior`:''}. Lo que más pesó: ${catById(top[0]).name} (${money(top[1])}).`;
}
const findGoal=s=>state.goals.find(g=>s.includes(norm(g.name)))||state.goals.find(g=>norm(g.name).split(/\s+/).some(w=>w.length>3&&s.includes(w)));
let lastJvTx=null;
function addFromJarvis(tx){state.txs.push(tx);lastJvTx=tx.id;persist();const dt=parseISO(tx.date);state.y=dt.getFullYear();state.m=dt.getMonth();render(true)}
function jarvisReply(raw){
  const n=state.user.name,s=norm(raw).replace(/s\/\.?\s*/g,' ').trim();
  const Y=now.getFullYear(),M=now.getMonth(),d=monthData(Y,M),dim=daysIn(Y,M),rem=dim-now.getDate();
  const amtM=s.match(/(\d+(?:[.,]\d{1,2})?)/),hits=accHits(s);
  const isQ=/\?|^(cuanto|como|que|cual|dame|muestrame|dime|en que|resumen|saldo)|cuanto|resumen|como voy/.test(s);
  if(!s)return{text:'Te escucho.'};
  if(/^(hola|hey|buenas|buenos|que tal)/.test(s)&&!amtM)return{text:`${greeting()}, ${n}. Tienes ${money(totalOf(balances()))} entre todas tus cuentas. ¿Registramos algo?`};
  if(/gracias/.test(s))return{text:`Para eso estoy, ${n}.`};
  if(/deshacer|borra(r)?( el)? ultimo|elimina(r)?( el)? ultimo|me equivoque/.test(s)){
    const t=state.txs.find(t=>t.id===lastJvTx);if(!t)return{text:'No tengo un movimiento reciente para deshacer.'};
    undoTx(t.id,true);return{text:`Listo, borré “${t.note||'el movimiento'}” de ${money(t.amount)}.`};
  }
  const dt=new Date(now);if(/\banteayer\b|\bantier\b/.test(s))dt.setDate(dt.getDate()-2);else if(/\bayer\b/.test(s))dt.setDate(dt.getDate()-1);
  const when=iso(dt)===iso(now)?'':(/\bayer\b/.test(s)?' (ayer)':' (anteayer)');
  /* --- notificación de Yape o Plin pegada --- */
  const yn=s.match(/(yapeaste|plineaste|pagaste|enviaste)\s+(\d+(?:[.,]\d{1,2})?)\s+a\s+([a-zñ .]+?)(?:\.|,|$| el | con | desde )/);
  const yi=s.match(/(?:te yapearon|te plinearon|recibiste)\s+(\d+(?:[.,]\d{1,2})?)\s+de\s+([a-zñ .]+?)(?:\.|,|$| el | con )/)||s.match(/([a-zñ .]+?)\s+te (?:envio|yapeo|pleneo|plineo) (?:un pago (?:por|de)\s*)?(\d+(?:[.,]\d{1,2})?)/);
  if(yn||yi){const plin=/plin/.test(s),acc=state.accs.find(a=>a.id===(plin?'plin':'yape')||norm(a.name)===(plin?'plin':'yape'))||state.accs.find(a=>a.kind==='billetera')||state.accs[0];
    const inc=!!yi,amount=Math.round(parseFloat((inc?(yi[1].match(/\d/)?yi[1]:yi[2]):yn[2]).replace(',','.'))*100)/100,who=cap((inc?(yi[1].match(/\d/)?yi[2]:yi[1]):yn[3]).trim().replace(/\b\w/g,c=>c.toUpperCase()));
    const type=inc?'ingreso':'gasto',cats=catsOf(type),cat=findCat(s,type)||(cats.find(c=>c.id===(inc?'extra':'otros'))||cats.at(-1)).id;
    const tx={id:'j'+Date.now(),type,cat,amount,acc:acc.id,note:inc?`${who} te ${plin?'plineó':'yapeó'}`:`${plin?'Plin':'Yape'} a ${who}`,date:iso(now)};addFromJarvis(tx);
    return{undo:tx.id,text:`Leí tu notificación. Anoté ${inc?'un ingreso':'un gasto'} de ${money(amount)} en ${acc.name}: “${tx.note}” (${catById(cat).name}).\nSi la categoría no es esa, toca el movimiento y cámbiala.`}}
  /* --- préstamos y deudas --- */
  const AMT='(\\d+(?:[.,]\\d{1,2})?)\\s*(?:soles|sol|lucas)?';
  let lm=s.match(new RegExp(`(?:le )?preste\\s+${AMT}\\s+a\\s+([a-zñ]+)`))||s.match(new RegExp(`([a-zñ]+)\\s+me debe\\s+${AMT}`));
  if(lm){const swap=!/preste/.test(s),amount=+(swap?lm[2]:lm[1]).replace(',','.'),person=cap(swap?lm[1]:lm[2]);
    state.debts.push({id:'d'+Date.now(),person,dir:'medeben',amount,note:cap((raw.match(/\b(?:por|para)\s+(?:el |la |los |las |un |una )?(.+)$/i)||[])[1]||'Préstamo').slice(0,30),date:iso(now),paid:false});persist();render(true);
    return{text:`Anotado: ${person} te debe ${money(amount)}. No toqué tus cuentas. Te recuerdo en una semana si no te paga.`}}
  lm=s.match(new RegExp(`(?:le )?debo\\s+${AMT}\\s+a\\s+([a-zñ]+)`))||s.match(new RegExp(`([a-zñ]+)\\s+me presto\\s+${AMT}`));
  if(lm){const swap=/me presto/.test(s),amount=+(swap?lm[2]:lm[1]).replace(',','.'),person=cap(swap?lm[1]:lm[2]);
    state.debts.push({id:'d'+Date.now(),person,dir:'debo',amount,note:'Préstamo',date:iso(now),paid:false});persist();render(true);
    return{text:`Anotado: le debes ${money(amount)} a ${person}.`}}
  lm=s.match(/([a-zñ]+)\s+(?:ya\s+)?me (?:pago|devolvio)\b/)||s.match(/(?:ya\s+)?le (?:pague|devolvi)(?:\s+\S+)?\s+a\s+([a-zñ]+)/);
  if(lm){const person=lm[1],dir=/me (pago|devolvio)/.test(s)?'medeben':'debo',d=state.debts.find(x=>!x.paid&&x.dir===dir&&norm(x.person)===person);
    if(d){d.paid=true;persist();render(true);return{text:`Listo, marqué como saldado lo de ${d.person} (${money(d.amount)}).`}}}
  /* --- metas --- */
  const gm=s.match(/(?:aparte|ahorre|guarde|separe|aporte)\s+(\d+(?:[.,]\d{1,2})?)\s*(?:soles|sol)?\s+(?:para|a|en)\s+(?:la |el |mi |mis )?(.+)/);
  if(gm){const g=findGoal(gm[2]);
    if(g){const v=+gm[1].replace(',','.');g.saved=Math.round((g.saved+v)*100)/100;g.log=(g.log||[]).concat({date:iso(now),amount:v});persist();render(true);const q=goalPace(g);
      return{text:`Apartaste ${money(v)} para ${g.name}. Llevas ${money(g.saved)} de ${money(g.target)} (${Math.round(q.p*100)}%).${q.left?` Te faltan ${money(q.left)}.`:' ¡Meta cumplida!'}`}}
    if(state.goals.length)return{text:`No encontré esa meta. Tus metas: ${state.goals.map(g=>g.name).join(', ')}.`}}
  /* --- tarjeta --- */
  if(!amtM&&/tarjeta|visa|credito|mastercard/.test(s)&&/debo|deuda|pagar|pago|cuota|vence|linea/.test(s)){
    const cards=state.accs.filter(a=>a.kind==='credito');if(!cards.length)return{text:'No tienes tarjetas de crédito registradas. Añádela en Menú → Cuentas.'};
    return{text:cards.map(a=>{const c=cardInfo(a);return `${a.name}: debes ${money(c.debt)} y tienes ${money(c.free)} libres de línea.\n${c.due?`Tu próximo pago es de ${money(c.due)} y vence el ${c.payDate.getDate()} ${MSHORT[c.payDate.getMonth()]}${daysUntil(c.payDate)<7?` (${whenTxt(c.payDate)})`:''}.`:'Este mes ya no tienes pago pendiente.'}${c.plans.length?`\nEn cuotas: ${c.plans.map(p=>`${p.tx.note||'Compra'} ${p.i}/${p.n}`).join(', ')}.`:''}`}).join('\n\n')}}
  /* --- metas: pregunta --- */
  if(!amtM&&/meta|ahorro para|apartado/.test(s)&&state.goals.length)
    return{text:state.goals.map(g=>{const q=goalPace(g);return `· ${g.name}: ${money(g.saved)} de ${money(g.target)}${q.left?` · ${money(q.perWeek)} por semana`:' · cumplida'}`}).join('\n')};
  if(!amtM&&/deud|debe|presta|debo/.test(s)){const t=debtTotals();
    return{text:t.open.length?`Te deben ${money(t.me)} y debes ${money(t.yo)}:\n${t.open.map(d=>`· ${d.person}: ${d.dir==='medeben'?'te debe':'le debes'} ${money(d.amount)}`).join('\n')}`:'No tienes deudas pendientes.'}}
  if(!amtM&&/fijo|proximo pago|que pagos|que tengo que pagar|vence/.test(s)){const u=upcoming(31);
    return{text:u.length?`Próximos pagos:\n${u.slice(0,5).map(x=>`· ${x.kind==='card'?'Pago de '+x.name:x.name}: ${accMoney(x.amount,x.acc)} · ${whenTxt(x.date)}`).join('\n')}`:'No tienes pagos en los próximos días.'}}
  /* --- mover entre cuentas --- */
  if(amtM&&!isQ&&MOVE_RE.test(s)){
    const amount=Math.round(parseFloat(amtM[1].replace(',','.'))*100)/100;
    let from=hits[0]?.id,to=hits[1]?.id;
    if(/retire|saque/.test(s)){const ef=state.accs.find(a=>a.kind==='efectivo');to=ef?.id;from=hits.find(h=>h.id!==to)?.id}
    if(!from||!to||from===to)return{text:`¿Entre qué cuentas, ${n}? Dime por ejemplo “pasé 100 de BCP a Yape”.`};
    const tx={id:'j'+Date.now(),type:'mov',amount,from,to,note:/retire|saque/.test(s)?'Retiro de cajero':accById(to).kind==='credito'?'Pago de tarjeta':'Entre cuentas',date:iso(dt)};
    if(curOf(from)!==curOf(to))tx.amountTo=Math.round(amount*(curOf(from)==='USD'?state.user.rate:1/state.user.rate)*100)/100;
    addFromJarvis(tx);const b=balances();
    return{undo:tx.id,text:`Hecho. Moví ${accMoney(amount,from)} de ${accById(from).name} a ${accById(to).name}${when}.\n${accById(from).name}: ${accMoney(b[from],from)} · ${accById(to).name}: ${accMoney(b[to],to)}.`};
  }
  /* --- registrar gasto / ingreso --- */
  if(amtM&&!isQ){
    const amount=Math.round(parseFloat(amtM[1].replace(',','.'))*100)/100;
    if(!(amount>0))return{text:'Ese monto no me cuadra. Intenta otra vez, por ejemplo “gasté 12.50 en taxi”.'};
    const type=INCOME_RE.test(s)?'ingreso':'gasto',cats=catsOf(type);
    const cat=findCat(s,type)||(cats.find(c=>c.id===(type==='gasto'?'otros':'extra'))||cats.at(-1)||{}).id;
    if(!cat)return{text:`No tienes categorías de ${type}. Crea una en Menú → Categorías.`};
    const acc=hits[0]?.id||(state.accs.some(a=>a.id===state.user.lastAcc[type])?state.user.lastAcc[type]:state.accs[0]?.id);
    if(!acc)return{text:'Primero añade una cuenta en Menú → Cuentas.'};
    const tx={id:'j'+Date.now(),type,cat,amount,acc,note:noteFrom(raw)||catById(cat).name,date:iso(dt)};
    state.user.lastAcc[type]=acc;addFromJarvis(tx);
    const b=balances(),an=accById(acc).name,nd=monthData(dt.getFullYear(),dt.getMonth()),cn=catById(cat).name;
    if(type==='ingreso')return{undo:tx.id,text:`Excelente, ${n}. Entraron ${money(amount)} a ${an} (${cn})${when}.\n${an} ahora tiene ${money(b[acc])}.`};
    const spent=nd.byCat.find(x=>x.cat===cat)?.total||0,bud=state.budgets[cat];
    const extra=bud?(spent>bud?`\nOjo: con esto superas tu límite de ${cn} por ${money(spent-bud)}.`:`\nTe quedan ${money(bud-spent)} de tu límite de ${cn}.`):'';
    return{undo:tx.id,text:`Anotado, ${n}. ${accMoney(amount,acc)} en ${cn}: “${tx.note}”, pagado con ${an}${when}.${extra}`};
  }
  /* --- preguntas --- */
  const bal=balances();
  if(hits.length&&/tengo|saldo|queda|hay|cuanto/.test(s)){const a=accById(hits[0].id);if(a.kind==='credito'){const c=cardInfo(a);return{text:`En ${a.name} debes ${money(c.debt)}; te quedan ${money(c.free)} de línea.`}}return{text:`En ${a.name} tienes ${accMoney(bal[a.id],a.id)}${a.currency==='USD'?` (≈ ${money(toPEN(bal[a.id],a.id))})`:''}.`}}
  if(/cuentas|en total|cuanto tengo|donde esta/.test(s))
    return{text:`Tienes ${money(totalOf(bal))} en total, ${n}:\n${state.accs.map(a=>`· ${a.name}: ${accMoney(bal[a.id],a.id)}`).join('\n')}`};
  const by=Object.fromEntries(d.byCat.map(c=>[c.cat,c.total])),cat=findCat(s,'gasto');
  if(/hoy|ayer/.test(s)){
    const l=state.txs.filter(t=>t.type==='gasto'&&t.date===iso(dt));
    if(!l.length)return{text:`${/ayer/.test(s)?'Ayer':'Hoy'} no hay gastos registrados.`};
    return{text:`${/ayer/.test(s)?'Ayer gastaste':'Hoy llevas'} ${money(sum(l))} en ${l.length} gasto${l.length>1?'s':''}:\n${l.slice(0,6).map(t=>`· ${t.note||catById(t.cat).name}: ${money(t.amount)} (${accById(t.acc).name})`).join('\n')}`};
  }
  if(/semana/.test(s)){const w=weekSummary();return{text:w||'Esta semana no tienes gastos registrados.'}}
  if(cat){const sp=by[cat]||0,b=state.budgets[cat],cn=catById(cat).name;
    return{text:`En ${cn} llevas ${money(sp)} este mes${b?` de ${money(b)} (${Math.round(sp/b*100)}%).\n${sp>b?`Te pasaste por ${money(sp-b)}.`:`Te quedan ${money(b-sp)} para ${rem} días.`}`:'. No tiene límite; puedes ponerle uno en Menú → Límites.'}`}}
  if(/queda|saldo|disponible/.test(s)){const proj=projection(d,Y,M);
    return{text:`Este mes te quedan ${money(d.bal)} de lo que entró, ${n}.\nSi sigues así, cerrarás con unos ${money(proj)}. Puedes gastar ${money(Math.max(0,d.bal)/Math.max(1,rem+1))} por día.`}}
  if(/mayor|mas gaste|en que gasto|donde/.test(s)&&d.byCat.length)
    return{text:`Donde más gastas este mes:\n${d.byCat.slice(0,3).map((c,i)=>`${i+1}. ${catById(c.cat).name}: ${money(c.total)}`).join('\n')}`};
  if(isQ||/resumen|como voy/.test(s))
    return{text:`Resumen de ${MONTHS[M]}, ${n}:\n· Entró: ${money(d.inc)}\n· Salió: ${money(d.exp)} (${Math.round(d.ratio*100)}%)\n· En tus cuentas: ${money(totalOf(bal))}\n${d.mood.t}.${d.byCat[0]?` Tu mayor gasto es ${catById(d.byCat[0].cat).name}.`:''}`};
  return{text:`No te entendí del todo, ${n}. Puedes decirme:\n· “gasté 20 en taxi con yape”\n· “me pagaron 800 al BCP”\n· “pasé 100 de BCP a Yape”\n· “¿cuánto tengo en Lemon?”\n· “le presté 50 a Carlos”\n· “aparté 100 para la laptop”\n· o pega una notificación de Yape`};
}
const SUGG=['¿Cuánto tengo?','Gasté 15 en menú con yape','Resumen de la semana','¿Cuánto debo en la tarjeta?','Le presté 50 a Carlos','Aparté 100 para la laptop','¿Qué pagos vienen?','Yapeaste S/ 12.00 a Juan Pérez'];

/* ================== JARVIS · BURBUJA FLOTANTE ================== */
const FAB=56;
function fabXY(){
  const ph=$('#phone'),W=ph.clientWidth||390,H=ph.clientHeight||830,p=state.user.fabPos||{side:'r',y:H-118};
  const L=14;return{x:p.side==='l'?L:W-14-FAB,y:clamp(p.y,70,H-90),side:p.side,W,H};
}
function placeFab(){
  const f=$('#jvFab');if(!f)return;const {x,y}=fabXY();
  f.style.left=x+'px';f.style.top=y+'px';
  f.classList.toggle('hide',!state.user.fab||state.chatOpen);
}
let tipT;
function showTip(text){
  const tip=$('#jvTip');if(!tip||!state.user.fab||state.chatOpen||overlayOpen())return;
  const {x,y,side,W}=fabXY();
  tip.innerHTML=`<b>${esc(state.user.bot)}</b>${esc(text)}`;
  tip.style.top='';tip.style.bottom=($('#phone').clientHeight-y+10)+'px';
  if(side==='l'){tip.style.left=(14)+'px';tip.style.right='auto'}else{tip.style.right='14px';tip.style.left='auto'}
  tip.classList.add('show');clearTimeout(tipT);tipT=setTimeout(()=>tip.classList.remove('show'),7000);
}
(()=>{
  const f=$('#jvFab');let sx=0,sy=0,ox=0,oy=0,drag=false,down=false;
  f.addEventListener('pointerdown',e=>{down=true;drag=false;sx=e.clientX;sy=e.clientY;ox=f.offsetLeft;oy=f.offsetTop;try{f.setPointerCapture(e.pointerId)}catch(_){}});
  f.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-sx,dy=e.clientY-sy;
    if(!drag&&Math.hypot(dx,dy)>6){drag=true;f.classList.add('drag');$('#jvTip').classList.remove('show')}
    if(drag){f.style.left=(ox+dx)+'px';f.style.top=(oy+dy)+'px'}});
  const up=()=>{if(!down)return;down=false;f.classList.remove('drag');
    if(!drag){openJarvis();return}
    const W=$('#phone').clientWidth;state.user.fabPos={side:f.offsetLeft+FAB/2<W/2?'l':'r',y:f.offsetTop};persist();placeFab()};
  f.addEventListener('pointerup',up);f.addEventListener('pointercancel',up);
  f.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')openJarvis()});f.tabIndex=0;
})();
function openJarvis(){
  const u=state.user,w=$('#jvWin');clearTimeout(tipT);$('#jvTip').classList.remove('show');
  if(!state.chat.length)state.chat.push({from:'bot',text:`${greeting()}, ${u.name}. Soy ${u.bot}.\n${insights()[0]}\n¿Qué hacemos?`});
  const {x,y}=fabXY();w.style.transformOrigin=`${x+FAB/2-10}px ${y+FAB/2-46}px`;
  w.innerHTML=`<div class="jv-head"><div class="orb" id="jvOrb"></div><div><b>${esc(u.bot)}</b><small>Todo queda en tu celular</small></div><button class="x" data-act="jvclose" aria-label="Minimizar">${svg('minus',16,2.2)}</button></div>
    <div class="msgs" id="msgs"></div>
    <div class="sugg">${SUGG.map(t=>`<button data-sugg="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    <div class="jv-input"><input id="jvInput" placeholder="Escríbele a ${esc(u.bot)}…" autocomplete="off"><button class="mic" id="jvMic" data-act="mic" aria-label="Hablar">${svg('mic',20,2)}</button><button class="send" data-act="jvsend" aria-label="Enviar">${svg('send',20,2.2)}</button></div>`;
  state.chatOpen=true;w.offsetWidth;w.classList.add('open');$('#jvDim').classList.add('open');placeFab();drawMsgs();
}
function closeJarvis(){state.chatOpen=false;$('#jvWin').classList.remove('open');$('#jvDim').classList.remove('open');if(rec){try{rec.stop()}catch(e){}}placeFab()}
function drawMsgs(typing){
  const box=$('#msgs');if(!box)return;
  box.innerHTML=state.chat.map(m=>`<div class="msg ${m.from}">${esc(m.text)}${m.undo&&state.txs.find(t=>t.id===m.undo)?`<br><button class="undo" data-undo="${m.undo}">${svg('undo',13,2)}Deshacer</button>`:''}</div>`).join('')+(typing?'<div class="msg bot typing"><i></i><i></i><i></i></div>':'');
  box.scrollTop=box.scrollHeight;
}
function sendJarvis(text){
  text=String(text||'').trim();if(!text)return;
  if(!state.chatOpen)openJarvis();
  const inp=$('#jvInput');if(inp)inp.value='';
  state.chat.push({from:'me',text});drawMsgs(true);$('#jvOrb')?.classList.add('busy');
  setTimeout(()=>{const r=jarvisReply(text);state.chat.push({from:'bot',...r});drawMsgs();$('#jvOrb')?.classList.remove('busy');speak(r.text)},550);
}
function undoTx(id,silent){state.txs=state.txs.filter(t=>t.id!==id);persist();render(true);if(!silent){state.chat.push({from:'bot',text:'Hecho, lo borré.'});drawMsgs()}}
function speak(t){
  if(!state.user.voz)return;
  const txt0=t.replace(/S\/\s?(-?[\d,]+)\.(\d{2})/g,(_,a,b)=>`${a.replace(/,/g,'')}${b!=='00'?' con '+b:''} soles`).replace(/[·“”]/g,' ').replace(/\n/g,'. ');
  if(NATIVE){FZ.speak({text:txt0}).catch(()=>{});return}
  if(!('speechSynthesis' in window))return;speechSynthesis.cancel();const txt=txt0;
  const u=new SpeechSynthesisUtterance(txt);u.lang='es-PE';
  const v=speechSynthesis.getVoices().find(v=>/es[-_](PE|US|MX|419)/i.test(v.lang))||speechSynthesis.getVoices().find(v=>/^es/i.test(v.lang));if(v)u.voice=v;
  u.rate=1.04;speechSynthesis.speak(u);
}
let rec=null;
function toggleMic(){
  if(NATIVE){$('#jvOrb')?.classList.add('busy');FZ.listen().then(r=>{$('#jvOrb')?.classList.remove('busy');if(r&&r.text)sendJarvis(r.text)}).catch(()=>{$('#jvOrb')?.classList.remove('busy');toast('No pude abrir el dictado')});return}
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){toast('Este navegador no permite dictado. En la app sí funcionará.');return}
  if(rec){rec.stop();return}
  rec=new SR();rec.lang='es-PE';rec.interimResults=true;
  const btn=$('#jvMic'),inp=$('#jvInput');btn.classList.add('on');$('#jvOrb')?.classList.add('busy');inp.placeholder='Te escucho…';
  rec.onresult=e=>{inp.value=[...e.results].map(r=>r[0].transcript).join('')};
  rec.onerror=()=>toast('No te escuché bien, intenta de nuevo');
  rec.onend=()=>{btn?.classList.remove('on');$('#jvOrb')?.classList.remove('busy');rec=null;if(inp){inp.placeholder=`Escríbele a ${state.user.bot}…`;if(inp.value.trim())sendJarvis(inp.value)}};
  try{rec.start()}catch(e){rec=null;toast('No pude activar el micrófono')}
}
