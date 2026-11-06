/* ================== PIEZAS ================== */
function moneyParts(v){const c=Math.round(Math.abs(v)*100);return{sign:v<0?'−':'',int:Math.floor(c/100).toLocaleString('en-US'),dec:'.'+String(c%100).padStart(2,'0')}}
const moneyHTML=v=>{if(state.user.hide)return `<span class="cur">S/</span>${HIDDEN}`;const m=moneyParts(v);return `<span class="cur">${m.sign}S/</span>${m.int}<span class="dec">${m.dec}</span>`};
const short=v=>state.user.hide?'S/\u00a0'+HIDDEN:(v<0?'−':'')+'S/\u00a0'+Math.round(Math.abs(v)).toLocaleString('en-US');
function monthNav(){return `<div class="mnav"><button data-month="-1" aria-label="Mes anterior">${svg('chevL',15,1.8)}</button><span>${MONTHS[state.m]}${state.y!==now.getFullYear()?' '+state.y:''}</span><button data-month="1" ${isCurrentMonth()?'disabled':''} aria-label="Mes siguiente">${svg('chevR',15,1.8)}</button></div>`}
const MAIN=['home','txs','accounts','menu'];
const label=id=>({home:'Hoy',txs:'Movimientos',accounts:'Cuentas',menu:'Menú',cats:'Categorías',budgets:'Límites',look:'Apariencia',fixed:'Gastos fijos',goals:'Metas',debts:'Deudas',copias:'Copias',assistant:state.user.bot}[id]||'');
const heroLabel=()=>isCurrentMonth()?'en tus cuentas':`al cierre de ${MONTHS[state.m]}`;
/* Cabecera de cada página: cambia según el diseño */
const PP_IX=[['txs',d=>`${d.list.length} este mes`],['accounts',(d,bal)=>`${state.accs.length} · ${short(totalOf(bal))}`],['budgets',d=>`${Math.round(budgetTotals(d).p*100)}% usado`],['cats',()=>`${state.cats.length}`],['menu',()=>'ajustes y datos']];
const HL=[['home','Hoy'],['txs','Movimientos'],['accounts','Cuentas'],['budgets','Límites'],['cats','Categorías'],['menu','Menú']];
const ISLA_IDS=HL.map(h=>h[0]);
function pageHead(id){
  const sub=!MAIN.includes(id),back=state.backTo||'menu',T='mosaico';
  const plain=t=>`<header class="mt"><button class="back" data-go="${t}">${svg('chevL',18,1.8)}${label(t)}</button></header>`;
  if(T==='mosaico')return `<header class="mo-head"><button class="mo-x" data-go="${sub?back:'home'}" aria-label="Volver">${svg(sub?'chevL':'close',20,1.8)}</button><button class="mo-add" data-act="add" aria-label="Registrar">${svg('plus',20,2)}</button></header>`;
  if(T==='papel'){const n=PP_IX.findIndex(x=>x[0]===id),t=n>=0?'home':back;
    return `<header class="pp-head"><button data-go="${t}">${svg('chevL',17,1.6)}${t==='home'?'Índice':label(t)}</button>${n>=0?`<span>${String(n+1).padStart(2,'0')}</span>`:''}</header>`}
  if(T==='isla')return ISLA_IDS.includes(id)?'':plain(back);
  if(T==='hilo')return id==='home'?'':plain(sub?back:'home');
  return '';
}
function txRow(t){
  const d=parseISO(t.date),when=`${d.getDate()} ${MSHORT[d.getMonth()]}`;
  if(t.type==='mov'){const f=accById(t.from),to=accById(t.to);
    return `<button class="tr" data-tx="${t.id}">${monoEl(f)}<div class="m"><span>${esc(t.note||'Entre cuentas')}</span><small>${esc(f.name)} ${svg('arrow',11,2)} ${esc(to.name)} · ${when}</small></div><b class="mov">${txMoney(t)}</b></button>`}
  const c=catById(t.cat),a=accById(t.acc);
  return `<button class="tr" data-tx="${t.id}">${monoEl(a)}<div class="m"><span>${esc(t.note||c.name)}</span><small>${dotEl(t.cat)}${esc(c.name)} · ${esc(a.name)} · ${when}${t.cuotas>1?` · ${t.cuotas} cuotas`:''}${t.rec?' · fijo':''}</small></div><b class="${t.type==='ingreso'?'inc':''}">${t.type==='ingreso'?'+':'−'}${txMoney(t)}</b></button>`;
}
function catLine(id,spent,attr=''){
  const c=catById(id),b=state.budgets[id]||0,p=b?spent/b*100:0;
  return `<button class="cr" ${attr} style="--c:${c.color}"><div class="l">${dotEl(id)}<span>${esc(c.name)}</span><em class="${p>100?'over-t':''}">${b?`${Math.round(p)}% de ${short(b)}`:'sin límite'}</em><b>${money(spent)}</b></div><div class="hair ${p>100?'over':''}"><i style="width:${b?Math.min(100,p):0}%"></i></div></button>`;
}
function budgetTotals(d){
  const by=Object.fromEntries(d.byCat.map(c=>[c.cat,c.total])),cats=catsOf('gasto');
  const B=cats.reduce((s,c)=>s+(state.budgets[c.id]||0),0),S=cats.filter(c=>state.budgets[c.id]).reduce((s,c)=>s+(by[c.id]||0),0);
  return{by,B,S,p:B?S/B:0};
}

/* ================== INICIO (uno distinto por diseño) ================== */
const HOME={
  /* Mosaico, versión con aire: pocos bloques y poca información en cada uno */
  mosaico(d,bal){
    const tot=totalOf(bal),{B,p}=budgetTotals(d),R=26,L=2*Math.PI*R,last=d.list.slice(0,2),hide=state.user.hide;
    const up=isCurrentMonth()?upcoming(31).slice(0,2):[],gs=state.goals.slice().sort((a,b)=>a.date.localeCompare(b.date)),g=gs[0],ap=goalSaved(),dt=debtTotals(),rk=streak();
    const mini=t=>{const c=t.type==='mov'?null:catById(t.cat);return `<div class="mini">${t.type==='mov'?monoEl(accById(t.from)):monoEl(accById(t.acc))}<span>${esc(t.note||(c?c.name:'Entre cuentas'))}<small>${t.type==='mov'?'Entre cuentas':esc(c.name)}</small></span><b class="${t.type==='ingreso'?'inc':''}">${t.type==='ingreso'?'+':t.type==='gasto'?'−':''}${txMoney(t)}</b></div>`};
    return `<div class="mo-greet"><div class="mt"><span class="greet">${greeting()}</span>${monthNav()}</div>
      <h1>${esc(state.user.name)}</h1><p>${d.mood.t}. ${isCurrentMonth()&&rk>=2?`Llevas ${rk} días seguidos anotando.`:`Así va ${MONTHS[state.m]}.`}</p></div>
    <div class="bento">
      <div class="tile w2 t-saldo" data-tile="accounts" role="button" tabindex="0"><h3><span class="h3l">${heroLabel()} ${svg('chevR',16)}</span><button class="eye" data-act="hide" aria-label="${hide?'Mostrar montos':'Ocultar montos'}">${svg(hide?'eyeOff':'eye',18)}</button></h3>
        <div><div class="big2">${moneyHTML(tot)}</div><div class="sub2">${ap?`${short(ap)} apartado para metas · `:''}${short(d.exp)} gastado</div></div></div>
      <button class="tile t-add" data-act="add"><h3>Registrar</h3><span class="plus">${svg('plus',24,2)}</span></button>
      <button class="tile t-lim" data-tile="budgets"><h3>Límites ${svg('chevR',16)}</h3>
        <div class="row"><div class="tv">${Math.round(p*100)}%<small>de ${short(B)}</small></div>
        <div class="ring"><svg width="62" height="62" viewBox="0 0 62 62"><circle cx="31" cy="31" r="${R}" fill="none" stroke="var(--faint)" stroke-width="5"/>
          <circle cx="31" cy="31" r="${R}" fill="none" stroke="${p>1?'var(--exp)':'var(--accent)'}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(L*Math.min(1,p)).toFixed(1)} ${L.toFixed(1)}" transform="rotate(-90 31 31)"/></svg></div></div></button>
      ${up.length?`<button class="tile w2 t-next" data-tile="fixed"><h3>Próximos pagos ${svg('chevR',16)}</h3>
        ${up.map(u=>`<div class="mini">${monoEl(accById(u.acc))}<span>${esc(u.kind==='card'?'Pago de '+u.name:u.name)}<small>${u.kind==='card'?'Tarjeta de crédito':'Se anota solo · '+esc(accById(u.acc).name)}</small></span><div style="text-align:right"><b>${accMoney(u.amount,u.acc)}</b><div class="when">${whenTxt(u.date)}</div></div></div>`).join('')}</button>`:''}
      <button class="tile w2 t-tx" data-tile="txs"><h3>Últimos movimientos ${svg('chevR',16)}</h3>
        ${last.map(mini).join('')||'<div class="mini"><span>Sin movimientos todavía</span></div>'}</button>
      <button class="tile w2 t-goal" data-tile="goals"><h3>Metas de ahorro ${svg('chevR',16)}</h3>
        ${g?(()=>{const q=goalPace(g);return `<div><div class="gname">${esc(g.name)}</div><small>${q.left?`${short(q.perWeek)} por semana para llegar a tiempo`:'¡Meta cumplida!'}</small></div>
        <div class="bar"><i style="width:${(q.p*100).toFixed(1)}%"></i></div><div class="gl"><span>${short(g.saved)} de ${short(g.target)}</span><span>${Math.round(q.p*100)}%</span></div>`})():'<div class="tv">Crea tu primera meta<small>Una laptop, un viaje, un fondo de emergencia</small></div>'}</button>
      <button class="tile t-small t-mini" data-tile="debts"><h3>Deudas ${svg('chevR',16)}</h3><div class="tv">${dt.me?short(dt.me):dt.yo?short(dt.yo):'Al día'}<small>${dt.me?'te deben':dt.yo?'debes tú':'nadie te debe'}</small></div></button>
      <button class="tile t-small" data-tile="menu"><h3>Menú ${svg('chevR',16)}</h3><div class="tv" style="font-size:17px;line-height:1.3">Cuentas, fijos<br>y ajustes</div></button>
    </div>`;
  },
};
function viewHome(d){return HOME.mosaico(d,balances(monthEnd()))}

/* ================== DEMÁS VISTAS (compartidas) ================== */
function txGroups(d){
  const q=norm(state.q.trim());
  let list=d.list.filter(t=>state.filter==='all'||t.type===state.filter);
  if(state.accFilter!=='all')list=list.filter(t=>t.acc===state.accFilter||t.from===state.accFilter||t.to===state.accFilter);
  if(q)list=list.filter(t=>norm(t.note||'').includes(q)||(t.cat&&norm(catById(t.cat).name).includes(q))||norm(accById(t.acc||t.from).name).includes(q));
  const groups={};for(const t of list)(groups[t.date]=groups[t.date]||[]).push(t);
  return Object.entries(groups).map(([date,ts])=>{const dd=parseISO(date),sp=sum(ts.filter(t=>t.type==='gasto'));
    return `<div class="day"><span>${iso(dd)===iso(now)?'Hoy':DOWL[dd.getDay()]+' '+dd.getDate()}</span><span>${sp?'−'+money(sp):''}</span></div>${ts.map(txRow).join('')}`}).join('')||'<div class="empty">Nada por aquí.</div>';
}
function viewTxs(d){
  return `${pageHead('txs')}<div class="mt"><div class="greet">Historial</div>${monthNav()}</div>
  <h1 class="title main">Movimientos</h1>
  <input class="search" id="search" placeholder="Buscar por nota, categoría o cuenta" value="${esc(state.q)}">
  <div class="tog">${[['all','todos'],['gasto','gastos'],['ingreso','ingresos'],['mov','entre cuentas']].map(([k,l])=>`<button class="${state.filter===k?'on':''}" data-filter="${k}">${l}</button>`).join('')}</div>
  <div class="chips scroll"><button class="chip plain ${state.accFilter==='all'?'on':''}" data-accf="all">Todas las cuentas</button>${state.accs.map(a=>`<button class="chip ${state.accFilter===a.id?'on':''}" data-accf="${a.id}" style="--c:${a.color}">${monoEl(a,'s')}${esc(a.name)}</button>`).join('')}</div>
  <div id="txList">${txGroups(d)}</div>`;
}
function viewAccounts(){
  const bal=balances(),tot=totalOf(bal),pos=state.accs.map(a=>Math.max(0,toPEN(bal[a.id]||0,a.id))),ptot=pos.reduce((s,v)=>s+v,0)||1;
  const d=monthData(now.getFullYear(),now.getMonth());
  return `${pageHead('accounts')}<div class="mt"><div class="greet">Dónde está tu dinero</div></div>
  <h1 class="title main">Cuentas</h1>
  <p class="state">Tienes <b>${money(tot)}</b> <em>repartido en ${state.accs.length} cuenta${state.accs.length===1?'':'s'}.</em></p>
  <div class="split">${state.accs.map((a,i)=>pos[i]?`<i style="--c:${a.color};flex:${pos[i]/ptot}"></i>`:'').join('')}</div>
  <div class="h"><span>Toca una cuenta para verla o editarla</span><span>saldo</span></div>
  ${state.accs.map(a=>{const inM=sum(d.list.filter(t=>(t.type==='ingreso'&&t.acc===a.id)||(t.type==='mov'&&t.to===a.id))),outM=sum(d.list.filter(t=>(t.type==='gasto'&&t.acc===a.id)||(t.type==='mov'&&t.from===a.id)));
    const b=bal[a.id]||0;
    if(a.kind==='credito'){const c=cardInfo(a);return `<button class="srow" data-card="${a.id}">${monoEl(a,'l')}<div class="t">${esc(a.name)}<small>Tarjeta · línea libre ${short(c.free)}${c.due?` · paga ${short(c.due)} ${whenTxt(c.payDate)}`:''}</small></div><span class="val">${c.debt?'debes '+money(c.debt):'al día'}</span></button>`}
    return `<button class="srow" data-accedit="${a.id}">${monoEl(a,'l')}<div class="t">${esc(a.name)}<small>${a.currency==='USD'?`En dólares · ≈ ${short(toPEN(b,a.id))}`:`${KINDS[a.kind]||'Cuenta'} · mes +${state.user.hide?'•••':Math.round(inM).toLocaleString('en-US')} −${state.user.hide?'•••':Math.round(outM).toLocaleString('en-US')}`}</small></div><span class="val ${b<0?'over-t':''}">${accMoney(b,a.id)}</span></button>`}).join('')}
  ${state.accs.some(a=>a.currency==='USD')?`<p class="dt" style="padding:14px 6px 0">El total convierte tus dólares a US$ 1 = S/ ${state.user.rate.toFixed(2)} · cámbialo en Menú → Tipo de cambio.</p>`:''}
  <button class="srow addrow" data-act="newacc"><span class="ic">${svg('plus',18)}</span><div class="t">Añadir cuenta o billetera<small>BCP, Interbank, Yape, Plin, Lemon, efectivo…</small></div></button>
  <button class="srow" data-act="newmov"><span class="ic">${svg('swap',18)}</span><div class="t">Mover dinero entre cuentas<small>Retiros, recargas a Yape, pagos de tarjeta</small></div><span class="chev">${svg('chevR',16)}</span></button>`;
}
function viewMenu(){
  const u=state.user,bal=balances(),d=monthData(now.getFullYear(),now.getMonth()),{B}=budgetTotals(d);
  const row=(go,ic,t,s)=>`<button class="srow" ${go}><span class="ic">${svg(ic,18)}</span><div class="t">${t}<small>${s}</small></div><span class="chev">${svg('chevR',16)}</span></button>`;
  return `${pageHead('menu')}<div class="mt"><div class="greet">Todo en un lugar</div></div>
  <h1 class="title main">Menú</h1>
  <div class="me-card"><div class="av">${esc(u.name.slice(0,1).toUpperCase())}</div><div style="flex:1"><input id="setName" value="${esc(u.name)}" maxlength="20" aria-label="Tu nombre"><small>Tus datos se guardan solo en este celular</small></div></div>
  <div class="h"><span>Tu dinero</span></div>
  ${row('data-go="accounts"','wallet','Cuentas y billeteras',`${state.accs.length} cuentas · ${money(totalOf(bal))}`)}
  ${row('data-go="cats"','tag','Categorías',`${catsOf('gasto').length} de gasto · ${catsOf('ingreso').length} de ingreso`)}
  ${row('data-go="budgets"','gauge','Límites del mes',B?`${money(d.exp)} de ${money(B)}`:'Sin límites')}
  ${row('data-act="newmov"','swap','Mover entre cuentas','Retiros, recargas, pagos de tarjeta')}
  <div class="h"><span>Planifica</span></div>
  ${row('data-go="fixed"','repeat','Gastos fijos',`${state.recs.filter(r=>r.active).length} activos · se anotan solos`)}
  ${row('data-go="goals"','target','Metas de ahorro',state.goals.length?`${state.goals.length} metas · ${money(goalSaved())} apartado`:'Aún no tienes metas')}
  ${row('data-go="debts"','users','Deudas y préstamos',(()=>{const t=debtTotals();return t.open.length?`Te deben ${money(t.me)} · debes ${money(t.yo)}`:'Todo saldado'})())}
  ${row('data-act="story"','chart','Resumen del mes',`Tu ${MONTHS[(now.getMonth()+11)%12].toLowerCase()} en números`)}
  <div class="h"><span>Asistente y apariencia</span></div>
  ${row('data-go="assistant"','spark',esc(u.bot),`${u.vozDirecta!==false?'Conversa por voz':'Chat escrito'} · burbuja ${u.fab?'activada':'oculta'}`)}
  ${row('data-go="look"','brush','Apariencia',`Paleta ${THEMES[state.theme].name}`)}
  <button class="srow" data-act="hide"><span class="ic">${svg(u.hide?'eyeOff':'eye',18)}</span><div class="t">Ocultar montos<small>Para revisar la app en público</small></div><span class="switch ${u.hide?'on':''}"></span></button>
  ${row('data-act="rate"','dollar','Tipo de cambio',`US$ 1 = S/ ${u.rate.toFixed(2)} · lo pones tú`)}
  <div class="h"><span>Seguridad y datos</span></div>
  ${NATIVE?row('data-act="notifperm"','spark','Anotar solo mis pagos',NOTIF_OK?'Activado · lee Yape y tus bancos':'Toca para activarlo'):''}
  ${row('data-act="pin"','lock',NATIVE&&BIO_OK?'Bloqueo con PIN o huella':'Bloqueo con PIN',u.pin?(u.bio?'Activado · huella o PIN':'Activado · se pide al abrir'):'Desactivado')}
  ${row('data-go="copias"','history','Copias automáticas',(()=>{const b=backups();return b.length?`Última: ${b[0].date===iso(now)?'hoy':b[0].date} · se guardan solas`:'Se guardan solas cada día'})())}
  ${row('data-act="export"','download','Exportar respaldo','Archivo con todo, para guardarlo donde quieras')}
  ${row('data-act="import"','upload','Importar respaldo','Recuperar desde un archivo')}
  ${row('data-act="demo"','refresh','Datos de ejemplo','Volver a cargar el mes de prueba')}
  <button class="srow danger" data-act="wipe"><span class="ic" style="color:var(--exp);background:color-mix(in srgb,var(--exp) 10%,transparent)">${svg('trash',18)}</span><div class="t">Borrar todo<small>Movimientos, cuentas y categorías vuelven a cero</small></div></button>
  <input type="file" id="importFile" accept="application/json" hidden>
  <div class="foot">Finanzas v1.0 · ${state.txs.length} movimientos guardados en este dispositivo</div>`;
}
function viewCats(){
  const t=state.catTab,d=monthData(now.getFullYear(),now.getMonth()),by={};
  d.list.forEach(x=>{if(x.cat)by[x.cat]=(by[x.cat]||0)+x.amount});
  return `${pageHead('cats')}
  <h1 class="title">Categorías</h1>
  <p class="sub">Crea las tuyas (universidad, mascotas, gimnasio…), cámbiales el nombre o el color, o quítalas.</p>
  <div class="tog" style="margin-top:18px">${[['gasto','de gasto'],['ingreso','de ingreso']].map(([k,l])=>`<button class="${t===k?'on':''}" data-cattab="${k}">${l}</button>`).join('')}</div>
  <div style="margin-top:8px">${catsOf(t).map(c=>`<button class="srow" data-catedit="${c.id}"><i class="dot" style="--c:${c.color};width:10px;height:10px;margin:0 13px"></i><div class="t">${esc(c.name)}<small>${money(by[c.id]||0)} este mes${t==='gasto'?` · ${state.budgets[c.id]?'límite '+money(state.budgets[c.id]):'sin límite'}`:''}</small></div><span class="chev">${svg('chevR',16)}</span></button>`).join('')}</div>
  <button class="srow addrow" data-act="newcat"><span class="ic">${svg('plus',18)}</span><div class="t">Nueva categoría de ${t}</div></button>`;
}
function viewBudgets(){
  const d=monthData(),{by,B,S,p}=budgetTotals(d),cats=catsOf('gasto');
  const dim=daysIn(state.y,state.m),dayN=isCurrentMonth()?now.getDate():dim,perDay=Math.max(0,B-S)/Math.max(1,dim-dayN+1);
  return `${pageHead('budgets')}<div class="mt"><span class="greet">Este mes</span>${monthNav()}</div>
  <h1 class="title">Límites</h1>
  <p class="state">Llevas <b>${money(S)}</b> <em>de ${money(B)}.</em>${isCurrentMonth()&&B?` Puedes usar <b>${money(perDay)}</b> <em>al día.</em>`:''}</p>
  <div class="hair ${p>1?'over':''}" style="--c:var(--accent)"><i style="width:${Math.min(100,p*100)}%"></i></div>
  <div class="h"><span>Toca una categoría para poner o cambiar su límite</span></div>
  ${cats.map(c=>catLine(c.id,by[c.id]||0,`data-bud="${c.id}"`)).join('')}
  <button class="srow addrow" data-act="newcat-g" style="margin-top:10px"><span class="ic">${svg('plus',18)}</span><div class="t">Nueva categoría con límite</div></button>`;
}
function viewLook(){
  return `${pageHead('look')}<h1 class="title">Apariencia</h1><p class="sub">El mismo diseño Mosaico en paletas oscuras. Cada una usa negro y un solo color apagado.</p><div style="margin-top:14px">
  ${Object.entries(THEMES).map(([k,t])=>`<button class="srow ${state.theme===k?'on':''}" data-theme-set="${k}"><i class="th-prev" style="background:${t.prev}"></i><div class="t">${t.name}<small>${t.short}</small></div><span class="radio"></span></button>`).join('')}</div>`;
}
function viewAssistant(){
  const u=state.user;
  return `${pageHead('assistant')}<h1 class="title">${esc(u.bot)}</h1><p class="sub">Tu asistente vive en una burbuja flotante. Arrástrala a cualquier lado; tócala y háblale como a una persona.</p>
  <div style="margin-top:14px">
  <label class="srow"><div class="t">Nombre del asistente</div><input id="setBot" value="${esc(u.bot)}" maxlength="16"></label>
  <div class="srow"><div class="t">Mostrar burbuja flotante<small>Si la ocultas, igual puedes abrirlo desde aquí</small></div><button class="switch ${u.fab?'on':''}" data-act="fabtoggle" aria-label="Burbuja"></button></div>
  <div class="srow"><div class="t">Conversar por voz al tocar la burbuja<small>Te escucha y te responde hablando, sin escribir</small></div><button class="switch ${u.vozDirecta!==false?'on':''}" data-act="vozdir" aria-label="Conversar por voz"></button></div>
  <div class="srow"><div class="t">En el chat escrito, responder también en voz</div><button class="switch ${u.voz?'on':''}" data-act="voz" aria-label="Voz"></button></div>
  <button class="srow" data-act="fabreset"><div class="t">Devolver la burbuja a su lugar</div><span class="chev">${svg('chevR',16)}</span></button>
  <button class="srow" data-act="lizivoz"><div class="t">Hablar con ${esc(u.bot)} ahora</div><span class="chev">${svg('chevR',16)}</span></button></div>`;
}
const phoneW=()=>$('#phone').clientWidth||390;

/* ================== NAVEGACIÓN (una distinta por diseño) ================== */
const TAB_OF={home:'home',txs:'txs',accounts:'accounts',menu:'menu',cats:'menu',budgets:'menu',look:'menu',assistant:'menu'};
const NAVS={
  mosaico:()=>'',papel:()=>'',
  isla(){const bal=balances(),d=monthData(now.getFullYear(),now.getMonth()),cur=TAB_OF[state.tab]===state.tab?state.tab:state.tab;
    const meta={home:short(totalOf(bal)),txs:`${d.list.length} este mes`,accounts:`${state.accs.length} cuentas`,budgets:`${Math.round(budgetTotals(d).p*100)}%`,cats:`${state.cats.length}`,menu:'ajustes'};
    return `<div class="isla-wrap" id="islaWrap"><div class="isla-shade"></div><div class="isla-dim" data-isla="close"></div>
      <div class="isla"><button class="isla-bar" data-isla="toggle"><span class="pulse"></span><b id="islaLabel">${label(cur)}</b><em>${MONTHS[now.getMonth()]} · ${money(totalOf(bal))}</em>${svg('chevD',16,1.8)}</button>
        <div class="isla-panel">${HL.map(([k])=>`<button class="ip-go ${k===cur?'on':''}" data-isla-go="${k}"><span>${label(k)}</span><small>${meta[k]}</small></button>`).join('')}
          <div class="ip-acts"><button data-act="add">${svg('plus',16,2)}Registrar</button><button data-act="newmov">${svg('swap',16)}Mover</button><button data-act="jarvis">${svg('spark',16)}${esc(state.user.bot)}</button></div></div></div>
      <button class="isla-plus" data-act="add" aria-label="Registrar">${svg('plus',20,2.2)}</button></div>`},
  hilo(){return `<nav class="hilo-rail" id="hiloRail"><button class="hl-add" data-act="add" aria-label="Registrar">${svg('plus',19,2.2)}</button>
    ${HL.map(([k,l])=>`<button class="hl-t" data-hl="${k}" aria-label="${l}"><span>${l}</span><i></i></button>`).join('')}</nav>`},
};
function islaToggle(open){const w=$('#islaWrap');if(!w)return;w.classList.toggle('open',open===undefined?!w.classList.contains('open'):open)}
let hlCur='',peekT;
function hlSpy(){if(state.theme!=='hilo')return;const s=$('#screen');let cur='home';
  if(state.tab==='home'){for(const [k] of HL){const el=document.getElementById('hl-'+k);if(el&&el.offsetTop-180<=s.scrollTop)cur=k}
    if(s.scrollTop>40&&s.scrollTop+s.clientHeight>=s.scrollHeight-4)cur='menu'}
  else cur=ISLA_IDS.includes(state.tab)?state.tab:'menu';
  document.querySelectorAll('.hl-t').forEach(t=>t.classList.toggle('on',t.dataset.hl===cur));
  if(cur!==hlCur){hlCur=cur;const r=$('#hiloRail');if(r){r.classList.add('peek');clearTimeout(peekT);peekT=setTimeout(()=>r.classList.remove('peek'),1600)}}}
function hlJump(k,smooth=true){
  if(state.tab!=='home'){state.tab='home';render(true)}
  const s=$('#screen'),el=document.getElementById('hl-'+k),top=k==='home'||!el?0:el.offsetTop-24;
  if(s.scrollTo)s.scrollTo({top,behavior:smooth?'smooth':'auto'});else s.scrollTop=top;
  setTimeout(hlSpy,smooth?450:0);
}
function placeNav(){}
function renderNav(){$('#nav').innerHTML=''}
function updateNav(){
  const l=$('#islaLabel');if(l)l.textContent=label(state.tab);
  document.querySelectorAll('[data-isla-go]').forEach(b=>b.classList.toggle('on',b.dataset.islaGo===state.tab));
  islaToggle(false);
}
let slideDir='';
function go(id){
  if(id==='add'){openForm('gasto');return}
  if(state.theme==='papel')slideDir=id==='home'?'slide-r':'slide-l';
  if(!MAIN.includes(id)&&id!==state.tab)state.backTo=MAIN.includes(state.tab)?state.tab:(state.backTo||'menu');
  state.tab=id;updateNav();render(true);$('#screen').scrollTop=0;hlSpy();
}
/* Mosaico: el bloque tocado se expande hasta llenar la pantalla */
function expandFrom(el,id){
  const pr=$('#phone').getBoundingClientRect(),r=el.getBoundingClientRect();
  const ins=[r.top-pr.top,pr.right-r.right,pr.bottom-r.bottom,r.left-pr.left].map(v=>Math.max(0,v).toFixed(0)+'px').join(' ');
  go(id);const s=$('#screen');
  if(s.animate)s.animate([{clipPath:`inset(${ins} round 30px)`,opacity:.6},{clipPath:'inset(0px 0px 0px 0px round 0px)',opacity:1}],{duration:520,easing:'cubic-bezier(.2,.9,.2,1)'});
}

/* ================== RENDER ================== */
function render(keepNav){
  document.body.dataset.theme='mosaico';document.body.dataset.pal=state.theme;
  document.querySelector('meta[name=theme-color]').content=getComputedStyle(document.body).getPropertyValue('--bg').trim()||'#000';
  const d=monthData(),views={home:viewHome,txs:viewTxs,accounts:viewAccounts,menu:viewMenu,cats:viewCats,budgets:viewBudgets,look:viewLook,assistant:viewAssistant,fixed:viewFixed,goals:viewGoals,debts:viewDebts,copias:viewCopias};
  $('#screen').innerHTML=`<div class="${slideDir||'fade-in'}">${(views[state.tab]||viewHome)(d)}</div>`;slideDir='';
  if(keepNav!==true)renderNav();
  hlSpy();
  placeFab();renderStudio();
}
function renderStudio(){
  $('#themeTabs').innerHTML=Object.entries(THEMES).map(([k,t],i)=>`<button class="theme-tab ${state.theme===k?'on':''}" data-theme-set="${k}"><span class="sw" style="background:${t.prev}"></span>${i+1} · ${t.name}</button>`).join('');
  const t=THEMES[state.theme];
  $('#notes').innerHTML=`<div><h4>Paleta ${Object.keys(THEMES).indexOf(state.theme)+1} de 5</h4><h2>${t.name}</h2></div>
    <div><h4>Colores</h4>${t.look}</div>
    <div><h4>Diseño</h4>Mosaico, con más aire: menos bloques, menos datos en cada uno y más espacio entre ellos. Tocas un bloque y se expande; la X lo cierra.</div>
    <div><h4>Novedades v8</h4>Gastos fijos que se anotan solos, tarjeta con cuotas, soles y dólares, metas, deudas, ocultar montos, PIN, copias diarias y resumen del mes. Todo dentro del celular, sin vincular nada.</div>`;
}
