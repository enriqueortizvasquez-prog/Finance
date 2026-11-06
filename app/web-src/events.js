/* ================== EVENTOS ================== */
let noClickUntil=0;
document.addEventListener('click',e=>{
  if(Date.now()<noClickUntil){e.preventDefault();return}
  const el=e.target.closest('button,[data-act],[data-tile],.jv-tip');if(!el)return;
  if(el.id==='jvTip'){openJarvis();return}
  const ds=el.dataset;
  if(ds.themeSet){state.theme=ds.themeSet;persist();render();return}
  if(ds.tabk){go(ds.tabk);return}
  if(ds.lk){lockKey(ds.lk);return}
  if(ds.pk&&pinF){pinKey(ds.pk);return}
  if(ds.onbacc&&onb){const n=$('#onbName');if(n)onb.name=n.value.trim();const i=onb.accs.indexOf(ds.onbacc);if(i>=0)onb.accs.splice(i,1);else onb.accs.push(ds.onbacc);drawOnb();return}
  if(ds.onbpal&&onb){onb.pal=ds.onbpal;document.body.dataset.pal=ds.onbpal;drawOnb();return}
  if(ds.tile){expandFrom(el,ds.tile);return}
  if(ds.isla){islaToggle(ds.isla==='close'?false:undefined);return}
  if(ds.islaGo){go(ds.islaGo);return}
  if(ds.hl){hlJump(ds.hl);return}
  if(ds.cattabNew){state.catTab=ds.cattabNew;el.dataset.act='newcat'}
  if(el.closest('.isla-panel'))islaToggle(false);
  if(ds.go){go(ds.go);return}
  if(ds.month){const d=new Date(state.y,state.m+(+ds.month),1);if(d>new Date(now.getFullYear(),now.getMonth(),1))return;state.y=d.getFullYear();state.m=d.getMonth();render(true);return}
  if(ds.filter){state.filter=ds.filter;render(true);return}
  if(ds.accf){state.accFilter=ds.accf;render(true);return}
  if(ds.accview){state.accFilter=ds.accview;state.filter='all';go('txs');return}
  if(ds.cattab){state.catTab=ds.cattab;render(true);return}
  if(ds.catedit){openCatForm(ds.catedit);return}
  if(ds.accedit){openAccForm(ds.accedit);return}
  if(ds.card){openCard(ds.card);return}
  if(ds.rec){openRecForm(ds.rec);return}
  if(ds.rtype&&recF){syncRec();recF.type=ds.rtype;drawRecForm();return}
  if(ds.racc&&recF){syncRec();recF.acc=ds.racc;drawRecForm();return}
  if(ds.rcat&&recF){syncRec();recF.cat=ds.rcat;document.querySelectorAll('[data-rcat]').forEach(c=>c.classList.toggle('on',c.dataset.rcat===ds.rcat));return}
  if(ds.goaladd){openGoalAdd(ds.goaladd);return}
  if(ds.goaledit){openGoalForm(ds.goaledit);return}
  if(ds.gsugg&&goalF){syncGoal();goalF.name=ds.gsugg;drawGoalForm();return}
  if(ds.gq){$('#gAmt').value=ds.gq;return}
  if(ds.debt){openDebtForm(ds.debt);return}
  if(ds.ddir&&debtF){syncDebt();debtF.dir=ds.ddir;drawDebtForm();return}
  if(ds.dperson&&debtF){$('#dPerson').value=ds.dperson;debtF.person=ds.dperson;return}
  if(ds.restore){const b=backups()[+ds.restore];if(b){restoreIx=+ds.restore;confirmSheet('¿Volver a esta copia?',`Tus datos quedarán como estaban el ${dayLabel(b.date).toLowerCase()} (${b.n} movimientos). Lo de después se pierde.`,'dorestore','Restaurar copia')}return}
  if(ds.bud){openBudget(ds.bud);return}
  if(ds.tx){const t=state.txs.find(x=>x.id===ds.tx);if(t)openForm(t.type,t);return}
  if(ds.sugg){sendJarvis(ds.sugg);return}
  if(ds.undo){undoTx(ds.undo);return}
  /* formulario de movimiento */
  if(ds.type&&form){syncForm();form.type=ds.type;if(ds.type==='mov'&&state.accs.length<2){toast('Necesitas al menos dos cuentas');form.type='gasto'}drawForm();return}
  if(ds.facc&&form){syncForm();const [k,id]=ds.facc.split(':');form[k]=id;if(form.type==='mov'&&form.from===form.to){const o=state.accs.find(a=>a.id!==id);if(k==='from')form.to=o.id;else form.from=o.id}drawForm();return}
  if(ds.fcat&&form){syncForm();form.cat=ds.fcat;document.querySelectorAll('[data-fcat]').forEach(c=>c.classList.toggle('on',c.dataset.fcat===ds.fcat));return}
  if(ds.tpl&&form){const x=state.txs.find(t=>t.id===ds.tpl);if(x){Object.assign(form,{amount:String(x.amount),note:x.note,cat:x.cat,acc:x.acc});drawForm();toast('Listo, revisa y registra')}return}
  if(ds.cuotas&&form){syncForm();form.cuotas=+ds.cuotas;drawForm();return}
  if(ds.cur&&accF){syncAcc();accF.currency=ds.cur;drawAccForm();return}
  if(ds.quick){const a=$('#amt');a.value=String(Math.round(((parseFloat(String(a.value).replace(',','.'))||0)+(+ds.quick))*100)/100);liveForm();return}
  /* formularios de cuenta y categoría */
  if(ds.preset&&accF){const p=ACC_PRESETS.find(x=>x[0]===ds.preset);syncAcc();Object.assign(accF,{name:p[0],kind:p[1],color:p[2],currency:p[0].includes('$')?'USD':'PEN'});drawAccForm();return}
  if(ds.kind&&accF){syncAcc();accF.kind=ds.kind;drawAccForm();return}
  if(ds.csugg&&catF){syncCat();catF.name=ds.csugg;drawCatForm();return}
  if(ds.color){if($('#accName')&&accF){syncAcc();accF.color=ds.color;drawAccForm()}else if(catF){syncCat();catF.color=ds.color;drawCatForm()}return}
  if(ds.budq){$('#bud').value=ds.budq;return}
  const act=ds.act;if(!act)return;
  switch(act){
    case 'add':openForm('gasto');break;
    case 'newmov':openForm('mov');break;
    case 'save':saveForm();break;
    case 'del':state.txs=state.txs.filter(t=>t.id!==form.id);persist();closeSheet();render(true);toast('Movimiento eliminado');break;
    case 'newacc':returnTo=null;openAccForm(null);break;
    case 'newacc-f':syncForm();returnTo=drawForm;openAccForm(null,{key:ds.key});break;
    case 'saveacc':saveAcc();break;
    case 'delacc':delAcc();break;
    case 'accviewtx':state.accFilter=ds.id;state.filter='all';closeSheet();go('txs');break;
    case 'newcat':returnTo=null;openCatForm(null,state.catTab);break;
    case 'newcat-g':returnTo=null;openCatForm(null,'gasto');break;
    case 'newcat-f':syncForm();returnTo=drawForm;openCatForm(null,form.type);break;
    case 'editcat':openCatForm(ds.id);break;
    case 'savecat':saveCat();break;
    case 'delcat':delCat();break;
    case 'sheetback':backOrClose();break;
    case 'sheetclose':closeSheet();break;
    case 'savebud':{const v=parseFloat(String($('#bud').value).replace(',','.'));if(v>0)state.budgets[ds.id]=Math.round(v*100)/100;else delete state.budgets[ds.id];persist();closeSheet();render(true);toast('Límite guardado');break}
    case 'nobud':delete state.budgets[ds.id];persist();closeSheet();render(true);toast('Límite quitado');break;
    case 'hide':state.user.hide=!state.user.hide;persist();render(true);toast(state.user.hide?'Montos ocultos':'Montos visibles');break;
    case 'rate':openRate();break;
    case 'saverate':{const v=parseFloat(String($('#rate').value).replace(',','.'));if(!(v>0)){toast('Ingresa un número válido');break}state.user.rate=Math.round(v*1000)/1000;persist();closeSheet();render(true);toast(`US$ 1 = S/ ${state.user.rate.toFixed(2)}`);break}
    case 'pin':pinF=null;openPin();break;
    case 'pinchange':pinF={step:1,a:'',b:''};openPin();break;
    case 'bio':state.user.bio=!state.user.bio;persist();el.querySelector('.switch')?.classList.toggle('on',state.user.bio);if(state.user.bio)toast('Listo: entrarás con tu huella');break;
    case 'notifperm':openNotifSheet();break;
    case 'notifopen':FZ&&FZ.notifSettings();closeSheet();break;
    case 'lockbio':lockBio();break;
    case 'pinoff':state.user.bio=false;state.user.pin=null;persist();closeSheet();render(true);toast('PIN quitado');break;
    case 'story':openStory();break;
    case 'storyclose':$('#story').classList.remove('open');break;
    case 'newrec':openRecForm(null);break;
    case 'saverec':saveRec();break;
    case 'recactive':syncRec();recF.active=!recF.active;drawRecForm();break;
    case 'recnow':syncRec();recF.now=!recF.now;drawRecForm();break;
    case 'delrec':if(!recF.confirm){syncRec();recF.confirm=true;drawRecForm();break}state.recs=state.recs.filter(r=>r.id!==recF.id);persist();closeSheet();render(true);toast('Gasto fijo quitado');break;
    case 'newgoal':openGoalForm(null);break;
    case 'savegoal':saveGoal();break;
    case 'delgoal':if(!goalF.confirm){syncGoal();goalF.confirm=true;drawGoalForm();break}state.goals=state.goals.filter(g=>g.id!==goalF.id);persist();closeSheet();render(true);toast('Meta quitada');break;
    case 'goalput':goalPut(ds.id,+ds.sign);break;
    case 'newdebt':openDebtForm(null);break;
    case 'savedebt':saveDebt(false);break;
    case 'debtpaid':saveDebt(true);break;
    case 'deldebt':if(!debtF.confirm){syncDebt();debtF.confirm=true;drawDebtForm();break}state.debts=state.debts.filter(d=>d.id!==debtF.id);persist();closeSheet();render(true);toast('Borrado');break;
    case 'paycard':{const c=cardInfo(accById(ds.id)),from=state.accs.find(a=>a.kind==='banco'&&a.currency!=='USD')||state.accs.find(a=>a.kind!=='credito');
      openForm('mov');Object.assign(form,{from:from?.id,to:ds.id,amount:String(c.due),note:'Pago de tarjeta'});drawForm();break}
    case 'cardedit':returnTo=null;openAccForm(ds.id);break;
    case 'frep':syncForm();form.rep=!form.rep;drawForm();break;
    case 'fsplit':syncForm();form.split=!form.split;drawForm();if(form.split)setTimeout(()=>$('#splitNames')?.focus(),50);break;
    case 'onbnext':onbNext();break;
    case 'onbdemo':onbDemo();break;
    case 'dorestore':{const b=backups()[restoreIx];if(!b)break;Object.assign(state,{txs:b.data.txs||[],cats:b.data.cats||state.cats,accs:b.data.accs||state.accs,budgets:b.data.budgets||{},recs:b.data.recs||[],goals:b.data.goals||[],debts:b.data.debts||[],accFilter:'all'});
      store.setItem(KEY,JSON.stringify(snapshot()));closeSheet();render(true);toast('Copia restaurada');break}
    case 'jarvis':openJarvis();break;
    case 'jvclose':closeJarvis();break;
    case 'jvsend':sendJarvis($('#jvInput').value);break;
    case 'mic':toggleMic();break;
    case 'voz':state.user.voz=!state.user.voz;persist();el.classList.toggle('on',state.user.voz);if(state.user.voz)speak('Listo, ahora te respondo en voz alta.');break;
    case 'fabtoggle':state.user.fab=!state.user.fab;persist();el.classList.toggle('on',state.user.fab);placeFab();break;
    case 'fabreset':state.user.fabPos=null;state.user.fab=true;persist();render(true);toast('Burbuja en su lugar');break;
    case 'export':{if(NATIVE){FZ.saveFile({name:`finanzas-${iso(now)}.json`,data:JSON.stringify({app:'finanzas',v:8,...snapshot()},null,2)}).then(r=>toast(`Guardado en ${r.path}`)).catch(()=>toast('No pude guardar el archivo'));break}
      const blob=new Blob([JSON.stringify({app:'finanzas',v:8,...snapshot()},null,2)],{type:'application/json'});
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`finanzas-${iso(now)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Respaldo descargado');break}
    case 'import':$('#importFile').click();break;
    case 'demo':confirmSheet('¿Cargar datos de ejemplo?','Se reemplazan tus movimientos, cuentas y categorías por los de prueba.','dodemo','Cargar ejemplo');break;
    case 'dodemo':Object.assign(state,{txs:seedData(),cats:DEFAULT_CATS.map(c=>({...c})),accs:DEFAULT_ACCS.map(a=>({...a})),budgets:{...DEFAULT_BUDGETS},...seedExtras(),accFilter:'all'});applyRecs();persist();closeSheet();render(true);toast('Datos de ejemplo cargados');break;
    case 'wipe':confirmSheet('¿Borrar todo?','Se eliminan todos tus movimientos y límites. Las cuentas y categorías vuelven a las de inicio, con saldo cero. No se puede deshacer.','dowipe','Borrar todo');break;
    case 'dowipe':Object.assign(state,{txs:[],cats:DEFAULT_CATS.map(c=>({...c})),accs:DEFAULT_ACCS.map(a=>({...a,init:0})),budgets:{},recs:[],goals:[],debts:[],accFilter:'all',chat:[]});persist();closeSheet();render(true);toast('Todo borrado');break;
  }
});
$('#sheetWrap').addEventListener('click',e=>{if(e.target.id==='sheetWrap')closeSheet()});
$('#jvDim').addEventListener('click',closeJarvis);
document.addEventListener('input',e=>{
  if(e.target.id==='search'){state.q=e.target.value;$('#txList').innerHTML=txGroups(monthData())}
  if(form&&['amt','splitNames'].includes(e.target.id))liveForm();
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='setName'){state.user.name=t.value.trim()||'Edward';persist();const av=$('.me-card .av');if(av)av.textContent=state.user.name[0].toUpperCase()}
  if(t.id==='setBot'){state.user.bot=t.value.trim()||'Jarvis';persist();renderStudio()}
  if(t.id==='importFile'&&t.files[0]){const r=new FileReader();r.onload=()=>{try{const s=JSON.parse(r.result);if(!Array.isArray(s.txs))throw 0;
    Object.assign(state,{txs:s.txs,cats:s.cats||state.cats,accs:s.accs||state.accs,budgets:s.budgets||state.budgets,recs:s.recs||[],goals:s.goals||[],debts:s.debts||[]});if(s.user)Object.assign(state.user,s.user);if(THEMES[s.theme])state.theme=s.theme;
    persist();render();toast('Respaldo importado')}catch(_){toast('Ese archivo no es un respaldo válido')}};r.readAsText(t.files[0]);t.value=''}
});
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter')return;
  if(e.target.id==='jvInput')sendJarvis(e.target.value);
  else if(['amt','note'].includes(e.target.id))saveForm();
  else if(['accName','accSaldo'].includes(e.target.id))saveAcc();
  else if(['catName','catBud'].includes(e.target.id))saveCat();
  else if(['recAmt','recName','recDay'].includes(e.target.id))saveRec();
  else if(['gName','gTarget','gSaved'].includes(e.target.id))saveGoal();
  else if(e.target.id==='gAmt')$('[data-act="goalput"]')?.click();
  else if(['dAmt','dPerson','dNote'].includes(e.target.id))saveDebt(false);
  else if(e.target.id==='rate')$('[data-act="saverate"]')?.click();
  else if(e.target.id==='onbName')onbNext();
  else if(e.target.id==='setName'||e.target.id==='setBot')e.target.blur();
});
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{if(state.tab==='home')render(true);placeFab();hlSpy()},150)});

/* Hilo: el hilo de la derecha sigue tu lugar y se puede arrastrar */
$('#screen').addEventListener('scroll',()=>hlSpy(),{passive:true});
(()=>{let on=false;const pick=e=>{const t=document.elementFromPoint&&document.elementFromPoint(e.clientX,e.clientY)?.closest('.hl-t');if(t&&!t.classList.contains('on'))hlJump(t.dataset.hl,false)};
  $('#nav').addEventListener('pointerdown',e=>{if(!e.target.closest('.hl-t'))return;on=true;$('#hiloRail').classList.add('scrub')});
  addEventListener('pointermove',e=>{if(on)pick(e)});
  addEventListener('pointerup',()=>{if(!on)return;on=false;$('#hiloRail')?.classList.remove('scrub')});
})();

/* ================== INICIO ================== */
let restoreIx=0;
applyRecs();
render();
if(!state.user.onboarded)showOnb();
else{const k=mkey(now);if(state.user.lastSeen&&state.user.lastSeen<k)setTimeout(()=>openStory(),500);if(state.user.lastSeen!==k){state.user.lastSeen=k;persist()}}
showLock();
autoBackup();
setTimeout(()=>{if(state.tab==='home')showTip(insights()[0])},1400);
/* El saludo sigue la hora del celular y, si cambia el día, se anotan los gastos fijos que tocan */
(()=>{let g=greeting(),d=iso(new Date());setInterval(()=>{const n=greeting(),nd=iso(new Date());
  if(nd!==d){d=nd;applyRecs();autoBackup()}
  if(n===g)return;g=n;
  if(state.tab==='home'&&!$('#sheetWrap').classList.contains('open')&&!$('#jvWin').classList.contains('open'))render(true)},60000)})();
/* Bloqueo: al volver a la app después de un minuto se pide el PIN otra vez */
(()=>{let hid=0;document.addEventListener('visibilitychange',()=>{if(document.hidden)hid=Date.now();else if(state.user.pin&&hid&&Date.now()-hid>60000)showLock()})})();
</script>
</body>
</html>
