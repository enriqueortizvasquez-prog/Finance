/* ================== VISTAS NUEVAS ================== */
const dayLabel=s=>{const d=parseISO(s),n=-daysUntil(d);return n===0?'Hoy':n===1?'Ayer':`${DOWL[d.getDay()]} ${d.getDate()} ${MSHORT[d.getMonth()]}`};
const agoTxt=s=>{const n=-daysUntil(parseISO(s));return n<=0?'hoy':n===1?'ayer':`hace ${n} días`};
const PERSON_COLORS=['#8E9E7A','#A3666F','#6F99A1','#B09670','#9C9C9C','#9FD3C7'];
const personColor=n=>PERSON_COLORS[[...norm(n)].reduce((s,c)=>s+c.charCodeAt(0),0)%PERSON_COLORS.length];
const cap=s=>s?s[0].toUpperCase()+s.slice(1):s;

function viewFixed(){
  const k=mkey(now),g=state.recs.filter(r=>r.type==='gasto'),i=state.recs.filter(r=>r.type==='ingreso');
  const tot=g.filter(r=>r.active).reduce((s,r)=>s+toPEN(r.amount,r.acc),0);
  const row=r=>{const a=accById(r.acc),st=!r.active?'<span class="st">Pausado</span>':r.done?.includes(k)?'<span class="st ok">Anotado este mes</span>':`<span class="st due">Se anota ${whenTxt(nextRecDate(r))}</span>`;
    return `<button class="srow ${r.active?'':'muted'}" data-rec="${r.id}">${monoEl(a,'l')}<div class="t">${esc(r.name)}<small>Día ${r.day} · ${esc(a.name)} · ${st}</small></div><span class="val">${accMoney(r.amount,r.acc)}</span></button>`};
  return `${pageHead('fixed')}<h1 class="title">Gastos fijos</h1>
  <p class="state">Pagas <b>${money(tot)}</b> <em>fijos cada mes.</em> Se anotan solos el día que toca y ${esc(state.user.bot)} te avisa un día antes.</p>
  <div class="h"><span>Gastos</span><span>monto</span></div>${g.map(row).join('')||'<div class="empty">Aún no tienes gastos fijos.</div>'}
  ${i.length?`<div class="h"><span>Ingresos fijos</span></div>${i.map(row).join('')}`:''}
  <button class="srow addrow" data-act="newrec" style="margin-top:10px"><span class="ic">${svg('plus',18)}</span><div class="t">Nuevo gasto fijo<small>Alquiler, pensión, internet, Netflix, gimnasio…</small></div></button>`;
}
function viewGoals(){
  const ap=goalSaved();
  return `${pageHead('goals')}<h1 class="title">Metas</h1>
  <p class="state">Tienes <b>${money(ap)}</b> <em>apartado para ${state.goals.length} meta${state.goals.length===1?'':'s'}.</em></p>
  <p class="sub" style="padding:0 6px">Lo apartado sigue en tus cuentas; aquí lo separas para no gastarlo.</p>
  ${state.goals.map(g=>{const q=goalPace(g),d=parseISO(g.date);return `<div class="blk"><h4><span>${esc(g.name)}</span><span>para ${MSHORT[d.getMonth()]} ${d.getFullYear()}</span></h4>
    <div class="num">${money(g.saved)}<small>de ${money(g.target)}</small></div><div class="bar"><i style="width:${(q.p*100).toFixed(1)}%"></i></div>
    ${q.left?`<div class="kv"><span>Te faltan</span><b>${money(q.left)}</b></div><div class="kv"><span>Para llegar a tiempo</span><b>${money(q.perWeek)} por semana</b></div>`:`<div class="kv"><span>¡Meta cumplida!</span><b>100%</b></div>`}
    <div class="acts"><button class="pri" data-goaladd="${g.id}">Apartar</button><button data-goaledit="${g.id}">Editar</button></div></div>`}).join('')}
  <button class="srow addrow" data-act="newgoal" style="margin-top:12px"><span class="ic">${svg('plus',18)}</span><div class="t">Nueva meta<small>Laptop, viaje, fondo de emergencia…</small></div></button>`;
}
function viewDebts(){
  const t=debtTotals(),paid=state.debts.filter(d=>d.paid).slice(-5).reverse();
  const row=d=>`<button class="srow ${d.paid?'muted':''}" data-debt="${d.id}"><span class="av2" style="--cc:${personColor(d.person)}">${esc(d.person[0].toUpperCase())}</span><div class="t">${esc(d.person)}<small>${d.paid?'Saldado':d.dir==='medeben'?'Te debe':'Le debes'}${d.note?' · '+esc(d.note):''} · ${agoTxt(d.date)}</small></div><span class="val ${d.dir==='medeben'?'':'over-t'}" style="${d.dir==='medeben'&&!d.paid?'color:var(--inc)':''}">${money(d.amount)}</span></button>`;
  return `${pageHead('debts')}<h1 class="title">Deudas</h1>
  <p class="sub" style="padding:0 6px">Lo que prestas y lo que te prestan. No mueve tus cuentas.</p>
  <div class="duo"><div class="blk"><h4>Te deben</h4><div class="num" style="color:var(--inc)">${money(t.me)}</div></div><div class="blk"><h4>Debes</h4><div class="num">${money(t.yo)}</div></div></div>
  <div class="h"><span>Pendientes</span></div>${t.open.map(row).join('')||'<div class="empty">Todo saldado.</div>'}
  ${paid.length?`<div class="h"><span>Saldadas</span></div>${paid.map(row).join('')}`:''}
  <button class="srow addrow" data-act="newdebt" style="margin-top:12px"><span class="ic">${svg('plus',18)}</span><div class="t">Anotar préstamo o deuda<small>Para dividir una cuenta, actívalo al registrar el gasto</small></div></button>`;
}
function viewCopias(){
  const b=backups();
  return `${pageHead('copias')}<h1 class="title">Copias</h1>
  <p class="sub" style="padding:0 6px">Cada día se guarda sola una copia de todo en este celular. Se conservan las últimas 7. No necesitas hacer nada.</p>
  <div class="h"><span>Toca una para volver a ese día</span></div>
  ${b.map((x,i)=>`<button class="srow" data-restore="${i}"><span class="ic">${svg('history',18)}</span><div class="t">${dayLabel(x.date)}<small>${x.n} movimientos · ${x.data.accs?.length||0} cuentas</small></div><span class="chev">${svg('chevR',16)}</span></button>`).join('')||'<div class="empty">La primera copia se guardará hoy.</div>'}
  <p class="dt" style="padding:18px 6px 0">Si cambias de celular, usa Menú → Exportar respaldo y guarda el archivo.</p>`;
}

/* ================== HOJAS NUEVAS ================== */
function openCard(id){
  const a=accById(id),c=cardInfo(a),pc=c.limit?Math.min(1,c.debt/c.limit):0;
  openSheet(`<div class="sh-title">${esc(a.name)}</div><div class="sh-sub">Tarjeta de crédito</div>
    <div class="blk" style="background:var(--soft)"><h4><span>Deuda total</span><span>línea ${short(c.limit)}</span></h4><div class="num">${money(c.debt)}</div><div class="bar"><i style="width:${(pc*100).toFixed(1)}%"></i></div>
    <div class="kv"><span>Línea disponible</span><b>${money(c.free)}</b></div>
    <div class="kv"><span>Pagas el ${c.payDate.getDate()} ${MSHORT[c.payDate.getMonth()]}${daysUntil(c.payDate)<7?` (${whenTxt(c.payDate)})`:''}</span><b>${money(c.due)}</b></div>
    <div class="kv"><span>${c.open?'Corte de este ciclo':'Ciclo cerrado el'}</span><b>${c.closeDate.getDate()} ${MSHORT[c.closeDate.getMonth()]}</b></div></div>
    ${c.open?`<div class="hint">Lo que compres hasta el corte se suma a este pago. Las cuotas cuentan una por mes.</div>`:''}
    ${c.plans.length?`<div class="lab"><span>Compras en cuotas</span></div>${c.plans.map(p=>`<div class="kv" style="display:flex;justify-content:space-between;font-size:14px;padding:8px 0"><span>${esc(p.tx.note||'Compra')} <small style="color:var(--muted)">· cuota ${p.i} de ${p.n}</small></span><b style="font-weight:400">${money(p.per)}/mes</b></div>`).join('')}`:''}
    ${c.due?`<button class="btn" data-act="paycard" data-id="${a.id}">Pagar ${money(c.due)}</button>`:''}
    <button class="btn soft" data-act="cardedit" data-id="${a.id}">Editar tarjeta</button>
    <button class="btn soft" data-act="accviewtx" data-id="${a.id}">Ver sus movimientos</button>`);
}
/* ---------- gasto fijo ---------- */
let recF=null;
function openRecForm(id){
  const r=id?state.recs.find(x=>x.id===id):null;
  recF=r?{...r,amount:String(r.amount),confirm:false}:{id:null,name:'',type:'gasto',amount:'',cat:null,acc:state.accs.find(a=>a.kind==='banco')?.id||state.accs[0]?.id,day:now.getDate()+1>28?1:now.getDate()+1,active:true,now:false,confirm:false};
  drawRecForm();
}
function drawRecForm(){
  const f=recF,cats=catsOf(f.type);if(!cats.some(c=>c.id===f.cat))f.cat=cats.find(c=>c.id==='servicios')?.id||cats[0]?.id;
  openSheet(`<div class="seg">${[['gasto','Gasto fijo'],['ingreso','Ingreso fijo']].map(([k,l])=>`<button data-rtype="${k}" class="${f.type===k?'on':''}">${l}</button>`).join('')}</div>
    <div class="amount"><span>${symOf(curOf(f.acc))}</span><input id="recAmt" inputmode="decimal" placeholder="0.00" value="${esc(f.amount)}"></div>
    <div class="lab"><span>Nombre</span></div><input class="field" id="recName" placeholder="Ej. Alquiler, Netflix, Gimnasio" value="${esc(f.name)}" maxlength="24">
    <div class="lab"><span>Día del mes en que se anota</span></div><input class="field" id="recDay" type="number" min="1" max="31" inputmode="numeric" value="${f.day}">
    <div class="lab"><span>${f.type==='gasto'?'Se paga con':'Entra a'}</span></div><div class="chips">${state.accs.map(a=>`<button class="chip ${f.acc===a.id?'on':''}" data-racc="${a.id}" style="--c:${a.color}">${monoEl(a,'s')}${esc(a.name)}</button>`).join('')}</div>
    <div class="lab"><span>Categoría</span></div><div class="chips">${cats.map(c=>`<button class="chip plain ${f.cat===c.id?'on':''}" data-rcat="${c.id}" style="--c:${c.color}">${dotEl(c.id)}${esc(c.name)}</button>`).join('')}</div>
    ${f.id?`<button class="opt" data-act="recactive"><div>Activo<small>${f.active?'Se anota solo cada mes':'Pausado: no se anotará'}</small></div><span class="switch ${f.active?'on':''}"></span></button>`
      :`<button class="opt" data-act="recnow"><div>Anotarlo también este mes<small>Si el día ya pasó y aún no lo registraste</small></div><span class="switch ${f.now?'on':''}"></span></button>`}
    <button class="btn" data-act="saverec">${f.id?'Guardar':'Crear gasto fijo'}</button>
    ${f.id?`<button class="btn ghost" data-act="delrec">${svg('trash',18)}${f.confirm?'Toca otra vez para quitarlo':'Quitar gasto fijo'}</button><div class="warn">Los movimientos ya anotados se quedan.</div>`:''}`);
}
function syncRec(){const a=$('#recAmt'),n=$('#recName'),d=$('#recDay');if(a)recF.amount=a.value;if(n)recF.name=n.value;if(d)recF.day=d.value}
function saveRec(){
  syncRec();const amount=parseFloat(String(recF.amount).replace(',','.')),day=Math.round(+recF.day),name=recF.name.trim()||catById(recF.cat).name;
  if(!(amount>0)){toast('Ingresa un monto válido');return}if(!(day>=1&&day<=31)){toast('El día va del 1 al 31');return}
  const k=mkey(now),data={name,type:recF.type,amount:Math.round(amount*100)/100,cat:recF.cat,acc:recF.acc,day,active:recF.active};
  if(recF.id)Object.assign(state.recs.find(r=>r.id===recF.id),data);
  else state.recs.push({id:uid('r-',name),...data,start:k,done:!recF.now&&day<=now.getDate()?[k]:[]});
  const added=applyRecs();persist();closeSheet();render(true);
  if(!added.length)toast(recF.id?'Gasto fijo actualizado':`Listo: se anotará solo el día ${day}`);
}
/* ---------- metas ---------- */
let goalF=null;
function openGoalForm(id){
  const g=id?state.goals.find(x=>x.id===id):null,d=new Date(now.getFullYear(),now.getMonth()+6,1);
  goalF=g?{...g,target:String(g.target),saved:String(g.saved),month:g.date.slice(0,7),confirm:false}:{id:null,name:'',target:'',saved:'',month:mkey(d),confirm:false};
  drawGoalForm();
}
function drawGoalForm(){
  const f=goalF;
  openSheet(`<div class="sh-title">${f.id?'Editar meta':'Nueva meta'}</div><div class="sh-sub">¿Para qué estás ahorrando?</div>
    ${f.id?'':`<div class="lab"><span>Ideas</span></div><div class="chips">${['Laptop','Viaje','Fondo de emergencia','Celular','Matrícula','Moto'].map(s=>`<button class="chip plain ${f.name===s?'on':''}" data-gsugg="${s}">${s}</button>`).join('')}</div>`}
    <div class="lab"><span>Nombre</span></div><input class="field" id="gName" placeholder="Ej. Laptop nueva" value="${esc(f.name)}" maxlength="24">
    <div class="lab"><span>¿Cuánto necesitas?</span></div><div class="amount" style="margin:6px 0 0"><span>S/</span><input id="gTarget" inputmode="decimal" placeholder="0" value="${esc(f.target)}"></div>
    <div class="row2" style="grid-template-columns:1fr 1fr"><div><div class="lab"><span>¿Para cuándo?</span></div><input class="field" id="gMonth" type="month" min="${mkey(now)}" value="${f.month}"></div>
    <div><div class="lab"><span>Ya tienes</span></div><input class="field" id="gSaved" inputmode="decimal" placeholder="S/ 0" value="${esc(f.saved)}"></div></div>
    <button class="btn" data-act="savegoal">${f.id?'Guardar meta':'Crear meta'}</button>
    ${f.id?`<button class="btn ghost" data-act="delgoal">${svg('trash',18)}${f.confirm?'Toca otra vez para quitarla':'Quitar meta'}</button>`:''}`);
}
function syncGoal(){for(const [k,i] of [['name','gName'],['target','gTarget'],['saved','gSaved'],['month','gMonth']]){const e=$('#'+i);if(e)goalF[k]=e.value}}
function saveGoal(){
  syncGoal();const name=goalF.name.trim(),target=parseFloat(String(goalF.target).replace(',','.')),saved=parseFloat(String(goalF.saved||0).replace(',','.'))||0;
  if(!name){toast('Ponle un nombre');return}if(!(target>0)){toast('¿Cuánto necesitas?');return}
  const [y,m]=(goalF.month||mkey(now)).split('-').map(Number),date=iso(new Date(y,m-1,daysIn(y,m-1)));
  if(goalF.id)Object.assign(state.goals.find(g=>g.id===goalF.id),{name,target,saved,date});
  else state.goals.push({id:uid('g-',name),name,target,saved,date,log:saved?[{date:iso(now),amount:saved}]:[]});
  persist();closeSheet();render(true);toast(goalF.id?'Meta actualizada':`Meta “${name}” creada`);
}
function openGoalAdd(id){
  const g=state.goals.find(x=>x.id===id),q=goalPace(g);
  openSheet(`<div class="sh-title">Apartar para ${esc(g.name)}</div><div class="sh-sub">Llevas ${money(g.saved)} de ${money(g.target)}${q.left?` · sugerido ${money(q.perWeek)} esta semana`:''}</div>
    <div class="amount"><span>S/</span><input id="gAmt" inputmode="decimal" placeholder="0.00" value="${q.left?Math.ceil(q.perWeek):''}"></div>
    <div class="quick">${[20,50,100,200].map(v=>`<button data-gq="${v}">${v}</button>`).join('')}</div>
    <button class="btn" data-act="goalput" data-id="${id}" data-sign="1">Apartar</button>
    ${g.saved?`<button class="btn soft" data-act="goalput" data-id="${id}" data-sign="-1">Sacar de la meta</button>`:''}`);
  setTimeout(()=>$('#gAmt')?.select(),350);
}
function goalPut(id,sign){
  const g=state.goals.find(x=>x.id===id),v=parseFloat(String($('#gAmt').value).replace(',','.'));
  if(!(v>0)){toast('Ingresa un monto');return}
  const amt=sign<0?-Math.min(v,g.saved):v;g.saved=Math.round((g.saved+amt)*100)/100;g.log=(g.log||[]).concat({date:iso(now),amount:amt});
  persist();closeSheet();render(true);toast(g.saved>=g.target?`¡Cumpliste tu meta ${g.name}!`:sign<0?`Sacaste ${money(-amt)} de ${g.name}`:`Apartaste ${money(amt)} para ${g.name}`);
}
/* ---------- deudas ---------- */
let debtF=null;
function openDebtForm(id){
  const d=id?state.debts.find(x=>x.id===id):null;
  debtF=d?{...d,amount:String(d.amount),confirm:false}:{id:null,dir:'medeben',person:'',amount:'',note:'',date:iso(now),paid:false,confirm:false};
  drawDebtForm();
}
function drawDebtForm(){
  const f=debtF,people=[...new Set(state.debts.map(d=>d.person))].slice(-6);
  openSheet(`<div class="seg">${[['medeben','Me deben'],['debo','Debo']].map(([k,l])=>`<button data-ddir="${k}" class="${f.dir===k?'on':''}">${l}</button>`).join('')}</div>
    <div class="amount"><span>S/</span><input id="dAmt" inputmode="decimal" placeholder="0.00" value="${esc(f.amount)}"></div>
    <div class="lab"><span>${f.dir==='medeben'?'¿Quién te debe?':'¿A quién le debes?'}</span></div><input class="field" id="dPerson" placeholder="Nombre" value="${esc(f.person)}" maxlength="20">
    ${people.length&&!f.id?`<div class="chips" style="margin-top:12px">${people.map(p=>`<button class="chip plain" data-dperson="${esc(p)}">${esc(p)}</button>`).join('')}</div>`:''}
    <div class="lab"><span>Detalle</span></div><input class="field" id="dNote" placeholder="Ej. Pizza del viernes" value="${esc(f.note)}" maxlength="30">
    ${f.id&&!f.paid?`<button class="btn" data-act="debtpaid">${f.dir==='medeben'?'Ya me pagó':'Ya le pagué'}</button><button class="btn soft" data-act="savedebt">Guardar cambios</button>`:`<button class="btn" data-act="savedebt">${f.id?'Guardar':'Anotar'}</button>`}
    ${f.id?`<button class="btn ghost" data-act="deldebt">${svg('trash',18)}${f.confirm?'Toca otra vez para borrarla':'Borrar'}</button>`:''}`);
}
function syncDebt(){const a=$('#dAmt'),p=$('#dPerson'),n=$('#dNote');if(a)debtF.amount=a.value;if(p)debtF.person=p.value;if(n)debtF.note=n.value}
function saveDebt(paid){
  syncDebt();const amount=parseFloat(String(debtF.amount).replace(',','.')),person=cap(debtF.person.trim());
  if(!(amount>0)){toast('Ingresa un monto');return}if(!person){toast('¿Con quién?');return}
  const data={dir:debtF.dir,person,amount:Math.round(amount*100)/100,note:debtF.note.trim(),paid:paid||debtF.paid};
  if(debtF.id)Object.assign(state.debts.find(d=>d.id===debtF.id),data);else state.debts.push({id:'d'+Date.now(),date:iso(now),...data});
  persist();closeSheet();render(true);toast(paid?`Saldado con ${person}`:debtF.id?'Guardado':data.dir==='medeben'?`${person} te debe ${money(amount)}`:`Le debes ${money(amount)} a ${person}`);
}
/* ---------- tipo de cambio ---------- */
function openRate(){
  openSheet(`<div class="sh-title">Tipo de cambio</div><div class="sh-sub" style="line-height:1.5">¿A cuánto está el dólar? Se usa para sumar tus cuentas en dólares a tu total y para mover dinero entre soles y dólares.</div>
    <div class="amount"><span>US$ 1 = S/</span><input id="rate" inputmode="decimal" value="${state.user.rate.toFixed(2)}" style="width:150px"></div>
    <button class="btn" data-act="saverate">Guardar</button>`);
}
/* ---------- PIN ---------- */
const pinHash=s=>{let h=7;for(const c of s+'|fz')h=(h*31+c.charCodeAt(0))>>>0;return h.toString(36)};
let pinF=null;
const dotsHTML=n=>`<div class="dots" id="pinDots">${[0,1,2,3].map(i=>`<i class="${i<n?'on':''}"></i>`).join('')}</div>`;
const padHTML=attr=>`<div class="pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button ${attr}="${n}">${n}</button>`).join('')}${attr==='data-lk'&&NATIVE&&BIO_OK&&state.user.bio?`<button class="nob" data-act="lockbio" aria-label="Usar huella">Huella</button>`:'<span></span>'}<button ${attr}="0">0</button><button class="nob" ${attr}="del">Borrar</button></div>`;
function openPin(){
  if(state.user.pin&&!pinF){openSheet(`<div class="sh-title">Bloqueo con PIN</div><div class="sh-sub" style="line-height:1.5">Activado. Se pide al abrir la app y al volver después de un minuto.</div>
    ${NATIVE&&BIO_OK?`<button class="opt" data-act="bio" style="margin-top:18px"><div>Entrar con huella<small>Si falla, usas tu PIN</small></div><span class="switch ${state.user.bio?'on':''}"></span></button>`:''}
    <button class="btn" data-act="pinchange">Cambiar PIN</button><button class="btn ghost" data-act="pinoff">Quitar PIN</button>`);return}
  pinF=pinF||{step:1,a:'',b:''};const v=pinF.step===1?pinF.a:pinF.b;
  openSheet(`<div class="sh-title">${pinF.step===1?'Crea tu PIN':'Repítelo'}</div><div class="sh-sub">${pinF.step===1?'4 números que solo tú sepas':'Para confirmar'}</div>${dotsHTML(v.length)}${padHTML('data-pk')}`);
}
function pinKey(k){
  const key=pinF.step===1?'a':'b';
  if(k==='del')pinF[key]=pinF[key].slice(0,-1);else if(pinF[key].length<4)pinF[key]+=k;
  if(pinF[key].length===4){
    if(pinF.step===1){pinF.step=2;setTimeout(openPin,180)}
    else if(pinF.a===pinF.b){state.user.pin=pinHash(pinF.a);pinF=null;if(NATIVE&&BIO_OK)state.user.bio=true;persist();closeSheet();render(true);toast(NATIVE&&BIO_OK?'PIN activado · también puedes usar tu huella':'PIN activado');return}
    else{pinF={step:1,a:'',b:''};toast('No coinciden, intenta otra vez');setTimeout(openPin,250)}
  }
  const d=$('#pinDots');if(d)d.outerHTML=dotsHTML((pinF?.[key]||'').length);
}
let lockBuf='';
function showLock(){
  if(!state.user.pin)return;lockBuf='';
  const l=$('#lock');l.innerHTML=`<div class="lk-ic">${svg('lock',24)}</div><h2>Hola, ${esc(state.user.name)}</h2><p>Ingresa tu PIN</p>${dotsHTML(0)}${padHTML('data-lk')}`;
  l.classList.add('open');$('#jvTip')?.classList.remove('show');
  if(NATIVE&&BIO_OK&&state.user.bio)setTimeout(lockBio,350);
}
function unlockNow(){$('#lock').classList.remove('open');if(afterUnlock){const f=afterUnlock;afterUnlock=null;setTimeout(f,200)}}
function lockBio(){if(!FZ)return;FZ.bioAuth({title:'Finanzas',subtitle:`Hola, ${state.user.name}`}).then(r=>{if(r&&r.ok)unlockNow()}).catch(()=>{})}
function lockKey(k){
  if(k==='del')lockBuf=lockBuf.slice(0,-1);else if(lockBuf.length<4)lockBuf+=k;
  $('#pinDots').outerHTML=dotsHTML(lockBuf.length);
  if(lockBuf.length===4){
    if(pinHash(lockBuf)===state.user.pin){setTimeout(unlockNow,150)}
    else{const d=$('#pinDots');d.classList.add('bad');setTimeout(()=>{lockBuf='';const x=$('#pinDots');if(x)x.outerHTML=dotsHTML(0)},420)}
  }
}
/* ---------- resumen del mes ---------- */
function openStory(Y,M){
  if(Y===undefined){const d=new Date(now.getFullYear(),now.getMonth()-1,1);Y=d.getFullYear();M=d.getMonth()}
  const s=monthStory(Y,M),pm=MONTHS[M?M-1:11].toLowerCase(),ap=state.goals.reduce((t,g)=>t+(g.log||[]).filter(l=>{const d=parseISO(l.date);return d.getFullYear()===Y&&d.getMonth()===M}).reduce((x,l)=>x+l.amount,0),0);
  const tip=s.rate>=.2?`Ahorraste el ${Math.round(s.rate*100)}% de lo que entró. Muy bien, ${state.user.name}.`:s.rate>0?`Ahorraste el ${Math.round(s.rate*100)}%. Si bajas un poco ${s.topCat?catById(s.topCat.cat).name.toLowerCase():'tus gastos'}, llegas al 20%.`:`Gastaste más de lo que entró. Revisa ${s.topCat?catById(s.topCat.cat).name.toLowerCase():'tus gastos'} este mes.`;
  const td=s.topDay?parseISO(s.topDay[0]):null;
  $('#story').innerHTML=`<button class="x" data-act="storyclose" aria-label="Cerrar">${svg('close',18,1.8)}</button>
    <div class="k">Tu mes en números</div><h2>${MONTHS[M]}<br>${Y}</h2>
    <div class="blk"><h4>Gastaste</h4><div class="num">${money(s.d.exp)}</div>${s.pv.exp?`<div class="kv"><span>${s.diff<=0?`${Math.round(-s.diff*100)}% menos`:`${Math.round(s.diff*100)}% más`} que en ${pm}</span><b>${money(s.pv.exp)}</b></div>`:''}</div>
    <div class="duo"><div class="blk"><h4>Entró</h4><div class="num">${short(s.d.inc)}</div></div><div class="blk"><h4>Ahorraste</h4><div class="num" style="color:${s.saved>=0?'var(--inc)':'var(--exp)'}">${short(s.saved)}</div></div></div>
    ${s.topCat?`<div class="blk"><h4>Donde más gastaste</h4><div class="num">${esc(catById(s.topCat.cat).name)}<small>${money(s.topCat.total)}</small></div></div>`:''}
    ${td?`<div class="blk"><h4>Tu día más caro</h4><div class="num">${cap(DOWL[td.getDay()])} ${td.getDate()}<small>${money(s.topDay[1])}</small></div></div>`:''}
    ${ap?`<div class="blk"><h4>Apartaste para tus metas</h4><div class="num">${money(ap)}</div></div>`:''}
    <div class="blk"><h4>${esc(state.user.bot)}</h4><div style="font-size:15px;line-height:1.5;margin-top:10px">${esc(tip)}</div></div>
    <button class="btn" data-act="storyclose" style="margin-top:22px">Listo</button>`;
  $('#story').scrollTop=0;$('#story').classList.add('open');$('#jvTip')?.classList.remove('show');
}
/* ---------- bienvenida (solo la primera vez) ---------- */
let onb=null;
function showOnb(){onb=onb||{step:0,name:'',accs:['Efectivo','Yape'],pal:state.theme};drawOnb();$('#onb').classList.add('open')}
function drawOnb(){
  const o=onb,stp=`<div class="stp">${[0,1,2].map(i=>`<i class="${i<=o.step?'on':''}"></i>`).join('')}</div>`,skip=`<button class="skip" data-act="onbdemo">Explorar con datos de ejemplo</button>`;
  const steps=[
    ()=>`<h2>Hola. ¿Cómo te llamas?</h2><p>Tus datos se quedan solo en este celular. No necesitas crear cuenta ni vincular nada.</p>
      <div class="body"><input class="field" id="onbName" placeholder="Tu nombre" value="${esc(o.name)}" maxlength="20" autocomplete="off"></div>`,
    ()=>`<h2>¿Qué cuentas usas?</h2><p>Toca las que tengas. Luego puedes poner sus saldos o añadir más.</p>
      <div class="body"><div class="chips">${ACC_PRESETS.filter(p=>p[0]!=='Visa BCP').map(p=>`<button class="chip ${o.accs.includes(p[0])?'on':''}" data-onbacc="${esc(p[0])}" style="--c:${p[2]}">${monoEl({name:p[0],color:p[2]},'s')}${esc(p[0])}</button>`).join('')}</div></div>`,
    ()=>`<h2>Elige tu estilo</h2><p>Puedes cambiarlo cuando quieras en Menú → Apariencia.</p>
      <div class="body">${Object.entries(THEMES).map(([k,t])=>`<button class="srow ${o.pal===k?'on':''}" data-onbpal="${k}"><i class="th-prev" style="background:${t.prev}"></i><div class="t">${t.name}<small>${t.short}</small></div><span class="radio"></span></button>`).join('')}</div>`];
  $('#onb').innerHTML=`${stp}${steps[o.step]()}<button class="btn" data-act="onbnext">${o.step<2?'Continuar':'Empezar'}</button>${skip}`;
}
function onbNext(){
  const n=$('#onbName');if(n)onb.name=n.value.trim();
  if(onb.step<2){onb.step++;drawOnb();return}
  const accs=(onb.accs.length?onb.accs:['Efectivo']).map(name=>{const p=ACC_PRESETS.find(x=>x[0]===name);
    const a={id:slug(name)||'cuenta',name,kind:p[1],color:p[2],init:0};if(name.includes('$'))a.currency='USD';if(p[1]==='credito')Object.assign(a,{limit:0,closeDay:20,payDay:5});return a});
  accs.forEach((a,i)=>{if(accs.findIndex(b=>b.id===a.id)<i)a.id+='-'+i});
  const first=accs.find(a=>a.kind!=='credito')||accs[0];
  Object.assign(state,{txs:[],accs,budgets:{},recs:[],goals:[],debts:[],theme:onb.pal,accFilter:'all',chat:[]});
  Object.assign(state.user,{name:onb.name||'Edward',onboarded:true,lastSeen:mkey(now),lastAcc:{gasto:first.id,ingreso:first.id}});
  persist();$('#onb').classList.remove('open');onb=null;render();
  toast(`Listo, ${state.user.name}. Toca Registrar para tu primer gasto`);
  if(NATIVE&&!NOTIF_OK)setTimeout(openNotifSheet,1200);
}
function onbDemo(){state.user.onboarded=true;state.user.lastSeen=mkey(now);persist();$('#onb').classList.remove('open');onb=null;render();toast('Estos son datos de ejemplo · bórralos en Menú')}
const overlayOpen=()=>['#lock','#onb'].some(s=>$(s)?.classList.contains('open'))||$('#story')?.classList.contains('open');
