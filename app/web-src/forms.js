/* ================== HOJAS ================== */
let returnTo=null;
function openSheet(html,cls=''){const sh=$('#sheet');sh.className='sheet '+cls;sh.innerHTML=`<div class="handle"></div>${html}`;sh.scrollTop=0;$('#sheetWrap').classList.add('open')}
function closeSheet(){$('#sheetWrap').classList.remove('open');returnTo=null;form=null}
function backOrClose(){if(returnTo){const f=returnTo;returnTo=null;f()}else closeSheet()}
const swatches=(cur,attr='data-color')=>`<div class="swatches">${PALETTE.concat(['#7FA6FF','#B794FF','#D9F27E','#5FD6E3']).filter((c,i,a)=>a.indexOf(c)===i).map(c=>`<button class="${cur===c?'on':''}" ${attr}="${c}" style="--c:${c}" aria-label="${c}"></button>`).join('')}</div>`;
let tt;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),1900)}

/* ---------- registrar / editar movimiento ---------- */
let form=null;
function openForm(type='gasto',tx){
  if(type==='mov'&&state.accs.length<2){toast('Necesitas al menos dos cuentas');openAccForm(null);return}
  form=tx?{...tx,amount:String(tx.amount),cuotas:tx.cuotas||1}:{id:null,type,amount:'',cat:null,acc:null,from:null,to:null,note:'',date:iso(isCurrentMonth()?now:new Date(state.y,state.m,1)),cuotas:1,rep:false,split:false,names:''};
  drawForm();setTimeout(()=>$('#amt')?.focus(),350);
}
function drawForm(){
  const t=form.type,accs=state.accs,has=id=>accs.some(a=>a.id===id);
  if(t!=='mov'){
    const cats=catsOf(t);if(!cats.some(c=>c.id===form.cat))form.cat=cats[0]?.id||null;
    if(!has(form.acc))form.acc=has(state.user.lastAcc[t])?state.user.lastAcc[t]:accs[0]?.id;
  }else{
    if(!has(form.from))form.from=has(state.user.lastAcc.gasto)&&accs.length>1?accs.find(a=>a.kind==='banco')?.id||accs[0].id:accs[0]?.id;
    if(!has(form.to)||form.to===form.from)form.to=accs.find(a=>a.id!==form.from)?.id;
  }
  const accChips=(key,label)=>`<div class="lab"><span>${label}</span></div><div class="chips">${accs.map(a=>`<button class="chip ${form[key]===a.id?'on':''}" data-facc="${key}:${a.id}" style="--c:${a.color}">${monoEl(a,'s')}${esc(a.name)}</button>`).join('')}<button class="chip add" data-act="newacc-f" data-key="${key}">${svg('plus',14)}Cuenta</button></div>`;
  const cats=t==='mov'?'':`<div class="lab"><span>Categoría</span></div><div class="chips">${catsOf(t).map(c=>`<button class="chip plain ${form.cat===c.id?'on':''}" data-fcat="${c.id}" style="--c:${c.color}">${dotEl(c.id)}${esc(c.name)}</button>`).join('')}<button class="chip add" data-act="newcat-f">${svg('plus',14)}Categoría</button></div>`;
  const tp=!form.id&&t==='gasto'?templates():[],acc=accById(form.acc),isCard=t==='gasto'&&acc.kind==='credito',cur=curOf(t==='mov'?form.from:form.acc);
  if(!isCard)form.cuotas=1;
  const opts=form.id||t==='mov'?'':`<div class="lab"><span>Opciones</span></div>
    <button class="opt" data-act="frep"><div>Repetir cada mes<small>${form.rep?`Se anotará solo el día ${parseISO(form.date||iso(now)).getDate()} de cada mes`:'Alquiler, pensión, suscripciones…'}</small></div><span class="switch ${form.rep?'on':''}"></span></button>
    ${t==='gasto'?`<button class="opt" data-act="fsplit"><div>Dividir con amigos<small>Anota cuánto te debe cada uno</small></div><span class="switch ${form.split?'on':''}"></span></button>
    ${form.split?`<input class="field" id="splitNames" placeholder="¿Con quiénes? Ej. Carlos, Ana" value="${esc(form.names)}"><div class="cuo-note" id="splitNote">${splitNote()}</div>`:''}`:''}`;
  openSheet(`<div class="seg">${[['gasto','Gasto'],['ingreso','Ingreso'],['mov','Mover']].map(([k,l])=>`<button data-type="${k}" class="${t===k?'on':''}">${l}</button>`).join('')}</div>
    ${tp.length?`<div class="tpl">${tp.map(x=>`<button data-tpl="${x.id}">${esc(x.note)}<small>${txMoney(x)} · ${esc(accById(x.acc).name)}</small></button>`).join('')}</div>`:''}
    <div class="amount"><span>${symOf(cur)}</span><input id="amt" inputmode="decimal" placeholder="0.00" value="${esc(form.amount)}"></div>
    <div class="quick">${[5,10,20,50,100].map(v=>`<button data-quick="${v}">+${v}</button>`).join('')}</div>
    ${t==='gasto'?accChips('acc','¿Con qué pagaste?'):t==='ingreso'?accChips('acc','¿A dónde entró?'):accChips('from','Sale de')+accChips('to','Entra a')}
    ${isCard?`<div class="lab"><span>Cuotas</span><span>sin intereses</span></div><div class="cuo">${[1,3,6,12].map(n=>`<button data-cuotas="${n}" class="${form.cuotas===n?'on':''}">${n===1?'Una sola':n}</button>`).join('')}</div><div class="cuo-note" id="cuoNote">${cuoNote()}</div>`:''}
    ${t==='mov'&&curOf(form.from)!==curOf(form.to)?`<div class="hint" id="fxHint">${fxHint()}</div>`:''}
    ${cats}
    <div class="lab"><span>Detalle</span></div>
    <div class="row2"><input class="field" id="note" placeholder="${t==='mov'?'Ej. Retiro de cajero':'Nota (opcional)'}" value="${esc(form.note)}"><input class="field" id="date" type="date" value="${form.date}" max="${iso(now)}"></div>
    ${opts}
    <button class="btn" data-act="save">${form.id?'Guardar cambios':t==='gasto'?'Registrar gasto':t==='ingreso'?'Registrar ingreso':'Mover dinero'}</button>
    ${form.id?`<button class="btn ghost" data-act="del">${svg('trash',18)}Eliminar movimiento</button>`:''}`);
}
function syncForm(){if(!form)return;const a=$('#amt'),n=$('#note'),dt=$('#date'),sn=$('#splitNames');if(a)form.amount=a.value;if(n)form.note=n.value;if(dt)form.date=dt.value;if(sn)form.names=sn.value}
const amtVal=()=>parseFloat(String(form.amount).replace(',','.'))||0;
const splitNames=()=>String(form.names||'').split(/,|\sy\s/).map(x=>x.trim()).filter(Boolean);
function splitNote(){const n=splitNames().length,v=amtVal();return n&&v?`Son ${n+1} contándote · cada uno te debe ${money(v/(n+1))}`:'Escribe los nombres separados por coma'}
function cuoNote(){const v=amtVal(),n=form.cuotas||1;return n>1?(v?`${n} cuotas de ${money(v/n)} · en tu mes solo cuenta la cuota`:`Se reparte en ${n} meses`):'Se cobra completo en tu próximo pago'}
function fxRate(from,to){const r=state.user.rate||3.4;return curOf(from)===curOf(to)?1:curOf(from)==='USD'?r:1/r}
function fxHint(){const v=amtVal(),to=accById(form.to);return `Llegan <b>${accMoney(v*fxRate(form.from,form.to),form.to)}</b> a ${esc(to.name)} · US$ 1 = S/ ${state.user.rate.toFixed(2)}`}
function liveForm(){syncForm();const c=$('#cuoNote'),f=$('#fxHint'),s=$('#splitNote');if(c)c.textContent=cuoNote();if(f)f.innerHTML=fxHint();if(s)s.textContent=splitNote()}
function saveForm(){
  syncForm();const amount=parseFloat(String(form.amount).replace(',','.'));
  if(!(amount>0)){toast('Ingresa un monto válido');$('#amt')?.focus();return}
  const base={id:form.id||('t'+Date.now()),type:form.type,amount:Math.round(amount*100)/100,note:form.note.trim(),date:form.date||iso(now)};
  let tx;
  if(form.type==='mov'){if(!form.from||!form.to||form.from===form.to){toast('Elige dos cuentas distintas');return}tx={...base,from:form.from,to:form.to,note:base.note||'Entre cuentas'};
    const fx=fxRate(form.from,form.to);if(fx!==1)tx.amountTo=Math.round(base.amount*fx*100)/100;
    if(accById(form.to).kind==='credito'&&!form.note.trim())tx.note='Pago de tarjeta'}
  else{if(!form.cat){toast('Elige o crea una categoría');return}if(!form.acc){toast('Elige o crea una cuenta');return}tx={...base,cat:form.cat,acc:form.acc};state.user.lastAcc[form.type]=form.acc;
    if(form.type==='gasto'&&accById(form.acc).kind==='credito'&&form.cuotas>1)tx.cuotas=form.cuotas;
    if(form.rec)tx.rec=form.rec}
  const editing=!!form.id,names=form.split&&form.type==='gasto'&&!editing?splitNames():[];
  if(form.split&&form.type==='gasto'&&!editing&&!names.length){toast('Escribe con quién lo divides');$('#splitNames')?.focus();return}
  if(editing){const i=state.txs.findIndex(t=>t.id===form.id);state.txs[i]=tx}else state.txs.push(tx);
  let extra='';
  if(!editing&&form.rep&&tx.type!=='mov'){const d=parseISO(tx.date),name=tx.note||catById(tx.cat).name,r={id:uid('r-',name),name,type:tx.type,amount:tx.amount,cat:tx.cat,acc:tx.acc,day:d.getDate(),active:true,start:mkey(d),done:[mkey(d)]};
    state.recs.push(r);tx.rec=r.id;applyRecs();extra=` · se repetirá el día ${r.day}`}
  if(names.length){const share=Math.round(tx.amount/(names.length+1)*100)/100;
    names.forEach((n,i)=>state.debts.push({id:'d'+Date.now()+i,person:cap(n),dir:'medeben',amount:share,note:tx.note||catById(tx.cat).name,date:tx.date,paid:false}));extra=` · cada uno te debe ${money(share)}`}
  const d=parseISO(tx.date);state.y=d.getFullYear();state.m=d.getMonth();
  persist();closeSheet();render(true);
  toast(editing?'Cambios guardados':(tx.type==='gasto'?(tx.cuotas?`En ${tx.cuotas} cuotas de ${money(tx.amount/tx.cuotas)}`:`Gasto registrado · ${accById(tx.acc).name}`):tx.type==='ingreso'?`Ingreso registrado · ${accById(tx.acc).name}`:`Movido a ${accById(tx.to).name}`)+extra);
}

/* ---------- cuentas ---------- */
let accF=null;
function openAccForm(id,opts={}){
  const a=id?state.accs.find(x=>x.id===id):null,bal=balances();
  accF=a?{id:a.id,name:a.name,kind:a.kind,color:a.color,currency:a.currency||'PEN',limit:String(a.limit||''),closeDay:String(a.closeDay||''),payDay:String(a.payDay||''),saldo:String(Math.round((a.kind==='credito'?-1:1)*(bal[a.id]||0)*100)/100),confirm:false}:{id:null,name:'',kind:'banco',color:PALETTE[state.accs.length%PALETTE.length],currency:'PEN',limit:'',closeDay:'20',payDay:'5',saldo:'',confirm:false};
  if(opts.key)accF.key=opts.key;
  drawAccForm();
}
function drawAccForm(){
  const f=accF,used=new Set(state.accs.map(a=>norm(a.name)));
  const n=f.id?state.txs.filter(t=>t.acc===f.id||t.from===f.id||t.to===f.id).length:0,other=state.accs.find(a=>a.id!==f.id);
  openSheet(`<div class="sh-title">${f.id?'Editar cuenta':'Nueva cuenta'}</div><div class="sh-sub">${f.id?'Cambia el nombre, tipo, color o corrige el saldo':'Banco, billetera digital, tarjeta o efectivo'}</div>
    ${f.id?'':`<div class="lab"><span>Rápido</span></div><div class="chips">${ACC_PRESETS.filter(p=>!used.has(norm(p[0]))).map(p=>`<button class="chip ${norm(f.name)===norm(p[0])?'on':''}" data-preset="${esc(p[0])}" style="--c:${p[2]}">${monoEl({name:p[0],color:p[2]},'s')}${esc(p[0])}</button>`).join('')}</div>`}
    <div class="lab"><span>Nombre</span></div><input class="field" id="accName" placeholder="Ej. BCP sueldo, Yape, Billetera" value="${esc(f.name)}" maxlength="22">
    <div class="lab"><span>Tipo</span></div><div class="chips">${Object.entries(KINDS).map(([k,l])=>`<button class="chip plain ${f.kind===k?'on':''}" data-kind="${k}">${l}</button>`).join('')}</div>
    ${f.kind==='credito'?`<div class="lab"><span>Línea de crédito · día de corte · día de pago</span></div><div class="grid3"><input class="field" id="cLimit" inputmode="decimal" placeholder="Línea S/" value="${esc(f.limit)}"><input class="field" id="cClose" type="number" min="1" max="31" placeholder="Corte" value="${esc(f.closeDay)}"><input class="field" id="cPay" type="number" min="1" max="31" placeholder="Pago" value="${esc(f.payDay)}"></div>`
      :`<div class="lab"><span>Moneda</span></div><div class="chips"><button class="chip plain ${f.currency!=='USD'?'on':''}" data-cur="PEN">Soles · S/</button><button class="chip plain ${f.currency==='USD'?'on':''}" data-cur="USD">Dólares · US$</button></div>`}
    <div class="lab"><span>Color</span></div>${swatches(f.color)}
    <div class="lab"><span>${f.kind==='credito'?'¿Cuánto debes ahora?':f.id?'Saldo actual (corrígelo si no cuadra)':'¿Cuánto tienes ahora?'}</span></div>
    <div class="amount" style="margin:6px 0 0"><span>${f.kind==='credito'?'S/':symOf(f.currency)}</span><input id="accSaldo" inputmode="decimal" placeholder="0.00" value="${esc(f.saldo)}"></div>
    <button class="btn" data-act="saveacc">${f.id?'Guardar cuenta':'Añadir cuenta'}</button>
    ${f.id?`<button class="btn soft" data-act="accviewtx" data-id="${f.id}">Ver sus movimientos</button>`:''}
    ${f.id&&state.accs.length>1?`<button class="btn ghost" data-act="delacc">${svg('trash',18)}${f.confirm?'Toca otra vez para quitarla':'Quitar cuenta'}</button>${f.confirm&&n?`<div class="warn">Sus ${n} movimientos pasarán a ${esc(other.name)}.</div>`:''}`:''}
    ${returnTo?`<button class="btn soft" data-act="sheetback">Volver</button>`:''}`);
}
function syncAcc(){const n=$('#accName'),s=$('#accSaldo');if(n)accF.name=n.value;if(s)accF.saldo=s.value;for(const [k,i] of [['limit','cLimit'],['closeDay','cClose'],['payDay','cPay']]){const e=$('#'+i);if(e)accF[k]=e.value}}
function saveAcc(){
  syncAcc();const name=accF.name.trim();if(!name){toast('Ponle un nombre');$('#accName')?.focus();return}
  if(state.accs.some(a=>a.id!==accF.id&&norm(a.name)===norm(name))){toast('Ya tienes una cuenta con ese nombre');return}
  const cc=accF.kind==='credito',saldo=(cc?-1:1)*(parseFloat(String(accF.saldo||'0').replace(',','.'))||0);let id=accF.id;
  const extra=cc?{currency:'PEN',limit:parseFloat(String(accF.limit).replace(',','.'))||0,closeDay:clamp(Math.round(+accF.closeDay)||20,1,31),payDay:clamp(Math.round(+accF.payDay)||5,1,31)}:{currency:accF.currency};
  if(id){const a=state.accs.find(x=>x.id===id),cur=balances()[id]||0;Object.assign(a,{name,kind:accF.kind,color:accF.color},extra);if(!cc){delete a.limit;delete a.closeDay;delete a.payDay}a.init=Math.round(((a.init||0)+saldo-cur)*100)/100}
  else{id=uid('',name);state.accs.push({id,name,kind:accF.kind,color:accF.color,...extra,init:Math.round(saldo*100)/100})}
  persist();toast(accF.id?'Cuenta actualizada':`${name} añadida`);
  if(returnTo&&form&&accF.key){form[accF.key]=id;const f=returnTo;returnTo=null;render(true);f();return}
  closeSheet();render(true);
}
function delAcc(){
  if(!accF.confirm){accF.confirm=true;syncAcc();drawAccForm();return}
  const id=accF.id,other=state.accs.find(a=>a.id!==id);
  state.txs.forEach(t=>{if(t.acc===id)t.acc=other.id;if(t.from===id)t.from=other.id;if(t.to===id)t.to=other.id});
  state.txs=state.txs.filter(t=>!(t.type==='mov'&&t.from===t.to));
  const a=state.accs.find(x=>x.id===id);other.init=(other.init||0)+(a.init||0);
  state.accs=state.accs.filter(x=>x.id!==id);
  for(const k of ['gasto','ingreso'])if(state.user.lastAcc[k]===id)state.user.lastAcc[k]=other.id;
  if(state.accFilter===id)state.accFilter='all';
  persist();closeSheet();render(true);toast(`${a.name} quitada`);
}

/* ---------- categorías ---------- */
let catF=null;
function openCatForm(id,type){
  const c=id?state.cats.find(x=>x.id===id):null;type=c?c.type:(type||state.catTab);
  const usedColors=new Set(catsOf(type).map(x=>x.color));
  catF=c?{id:c.id,name:c.name,type,color:c.color,bud:String(state.budgets[c.id]||''),confirm:false}:{id:null,name:'',type,color:PALETTE.find(p=>!usedColors.has(p))||PALETTE[0],bud:'',confirm:false};
  drawCatForm();
}
function drawCatForm(){
  const f=catF,used=new Set(state.cats.map(c=>norm(c.name)));
  const n=f.id?state.txs.filter(t=>t.cat===f.id).length:0,fb=fallbackCat(f.id,f.type);
  openSheet(`<div class="sh-title">${f.id?'Editar categoría':`Nueva categoría de ${f.type}`}</div>
    ${f.id?'':`<div class="lab"><span>Ideas</span></div><div class="chips">${CAT_SUGG[f.type].filter(s=>!used.has(norm(s))).map(s=>`<button class="chip plain ${f.name===s?'on':''}" data-csugg="${esc(s)}">${esc(s)}</button>`).join('')}</div>`}
    <div class="lab"><span>Nombre</span></div><input class="field" id="catName" placeholder="Ej. Universidad, Mascotas" value="${esc(f.name)}" maxlength="22">
    <div class="lab"><span>Color</span></div>${swatches(f.color)}
    ${f.type==='gasto'?`<div class="lab"><span>Límite mensual (opcional)</span></div><div class="amount" style="margin:6px 0 0"><span>S/</span><input id="catBud" inputmode="decimal" placeholder="sin límite" value="${esc(f.bud)}"></div>`:''}
    <button class="btn" data-act="savecat">${f.id?'Guardar':'Crear categoría'}</button>
    ${f.id&&fb?`<button class="btn ghost" data-act="delcat">${svg('trash',18)}${f.confirm?'Toca otra vez para quitarla':'Quitar categoría'}</button>${f.confirm&&n?`<div class="warn">Sus ${n} movimientos pasarán a ${esc(fb.name)}.</div>`:''}`:''}
    ${returnTo?`<button class="btn soft" data-act="sheetback">Volver</button>`:''}`);
}
function fallbackCat(id,type){const list=catsOf(type).filter(c=>c.id!==id);return list.find(c=>c.id==='otros'||c.id==='extra')||list.at(-1)}
function syncCat(){const n=$('#catName'),b=$('#catBud');if(n)catF.name=n.value;if(b)catF.bud=b.value}
function saveCat(){
  syncCat();const name=catF.name.trim();if(!name){toast('Ponle un nombre');$('#catName')?.focus();return}
  if(state.cats.some(c=>c.id!==catF.id&&c.type===catF.type&&norm(c.name)===norm(name))){toast('Esa categoría ya existe');return}
  let id=catF.id;
  if(id)Object.assign(state.cats.find(c=>c.id===id),{name,color:catF.color});
  else{id=uid('',name);const i=state.cats.findIndex(c=>c.type===catF.type&&(c.id==='otros'||c.id==='extra'));const nc={id,name,type:catF.type,color:catF.color};if(i>=0)state.cats.splice(i,0,nc);else state.cats.push(nc)}
  if(catF.type==='gasto'){const b=parseFloat(String(catF.bud).replace(',','.'));if(b>0)state.budgets[id]=Math.round(b*100)/100;else delete state.budgets[id]}
  persist();toast(catF.id?'Categoría actualizada':`${name} creada`);
  if(returnTo&&form){form.cat=id;form.type=catF.type;const f=returnTo;returnTo=null;render(true);f();return}
  closeSheet();render(true);
}
function delCat(){
  if(!catF.confirm){catF.confirm=true;syncCat();drawCatForm();return}
  const id=catF.id,fb=fallbackCat(id,catF.type),c=catById(id);
  state.txs.forEach(t=>{if(t.cat===id)t.cat=fb.id});state.cats=state.cats.filter(x=>x.id!==id);delete state.budgets[id];
  persist();closeSheet();render(true);toast(`${c.name} quitada`);
}

/* ---------- límites ---------- */
function openBudget(id){
  const c=catById(id),d=monthData(),sp=d.byCat.find(x=>x.cat===id)?.total||0;
  openSheet(`<div class="sh-title" style="display:flex;align-items:center;justify-content:center;gap:10px">${dotEl(id)}${esc(c.name)}</div><div class="sh-sub">Límite mensual · llevas ${money(sp)} en ${MONTHS[state.m]}</div>
  <div class="amount"><span>S/</span><input id="bud" inputmode="decimal" placeholder="0" value="${state.budgets[id]||''}"></div>
  <div class="quick">${[100,200,300,500,1000].map(v=>`<button data-budq="${v}">${v}</button>`).join('')}</div>
  <button class="btn" data-act="savebud" data-id="${id}">Guardar límite</button>${state.budgets[id]?`<button class="btn soft" data-act="nobud" data-id="${id}">Quitar límite</button>`:''}
  <button class="btn soft" data-act="editcat" data-id="${id}">Editar categoría</button>`);
  setTimeout(()=>$('#bud')?.focus(),350);
}
function confirmSheet(title,text,act,label){openSheet(`<div class="sh-title">${title}</div><div class="sh-sub" style="margin-top:10px;line-height:1.5">${text}</div><button class="btn" data-act="${act}" style="background:var(--exp)">${label}</button><button class="btn soft" data-act="sheetclose">Cancelar</button>`)}
