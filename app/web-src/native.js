
/* ================== APP ANDROID ==================
   Todo lo de aquí solo corre dentro de la app instalada (Capacitor).
   En el navegador NATIVE es false y nada de esto se ejecuta. */
let nsT=0,pausedAt=0;
/* Copia de seguridad nativa + datos del widget (cada vez que se guarda algo) */
function nativeSync(){
  if(!FZ)return;clearTimeout(nsT);
  nsT=setTimeout(()=>{try{
    FZ.kvSet({key:'data',value:JSON.stringify(snapshot())}).catch(()=>{});
    const b=balances(),d=monthData(now.getFullYear(),now.getMonth()),cs=getComputedStyle(document.body),mes=MONTHS[now.getMonth()].toLowerCase();
    FZ.widgetUpdate({label:'en tus cuentas',total:money(totalOf(b)),sub:`${short(d.exp)} gastado en ${mes}`,
      accent:cs.getPropertyValue('--accent').trim()||'#D0D0D0',tile:cs.getPropertyValue('--tile').trim()||'#0F0F0F',text:cs.getPropertyValue('--text').trim()||'#EDEDED',muted:cs.getPropertyValue('--muted').trim()||'#767676'}).catch(()=>{});
  }catch(e){}},400);
}
/* ---------- notificaciones de Yape y bancos ---------- */
const NOTIF_ACC=[['yape','yape'],['plin','plin'],['bcp','bcp'],['interbank','interbank'],['ibk','interbank'],['bbva','bbva'],['scotia','scotiabank'],['lemon','lemon']];
function notifAccount(pkg,s,cur,credit){
  const p=norm(pkg),byName=k=>state.accs.find(a=>a.id===k)||state.accs.find(a=>norm(a.name).includes(k));
  if(credit){const c=state.accs.find(a=>a.kind==='credito'&&NOTIF_ACC.some(([k,n])=>p.includes(k)&&norm(a.name).includes(n)))||state.accs.find(a=>a.kind==='credito');if(c)return c}
  if(/yape/.test(s)||p.includes('yape')){const a=byName('yape');if(a)return a}
  if(/plin/.test(s)){const a=byName('plin');if(a)return a}
  for(const [k,n] of NOTIF_ACC)if(p.includes(k)){const a=byName(n);if(a&&(cur!=='USD'||a.currency==='USD'))return a;if(a&&cur!=='USD')return a}
  if(cur==='USD'){const u=state.accs.find(a=>a.currency==='USD');if(u)return u}
  return state.accs.find(a=>a.kind==='banco')||state.accs.find(a=>a.kind!=='credito')||state.accs[0];
}
function parseBankNotif(it){
  const full=`${it.title||''}. ${it.text||''}`.replace(/\s+/g,' '),s=norm(full);
  if(/(codigo|clave|token|otp|verificacion)\b/.test(s)&&!/(te envio|recibiste|yapeaste|consumo|compra)/.test(s))return null;
  if(/(promocion|oferta|gana |sorteo|descuento|cashback hasta)/.test(s))return null;
  const m=full.match(/(S\/|US\$|\$)\s?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i);if(!m)return null;
  const cur=/S\//i.test(m[1])?'PEN':'USD';
  let raw=m[2].replace(/\s/g,'');raw=/,\d{2}$/.test(raw)&&!raw.includes('.')?raw.replace(',','.'):raw.replace(/,/g,'');
  let amount=Math.round(parseFloat(raw)*100)/100;if(!(amount>0))return null;
  const inc=/(te envio|te envi[oó]|te yapeo|te yapearon|te plineo|recibiste|te transfiri|abono|deposito en tu|te depositaron|te pagaron|ingreso de)/.test(s);
  const exp=/(yapeaste|plineaste|pagaste|enviaste|consumo|compra|retiro|retiraste|transferiste|cargo|realizaste|debito|pago de servicio|pago realizado|pago exitoso)/.test(s);
  if(!inc&&!exp)return null;
  const type=inc?'ingreso':'gasto',credit=type==='gasto'&&/credito/.test(s),acc=notifAccount(it.pkg||'',s,cur,credit);if(!acc)return null;
  if(cur==='USD'&&acc.currency!=='USD')amount=Math.round(amount*(state.user.rate||3.4)*100)/100;
  if(cur==='PEN'&&acc.currency==='USD')amount=Math.round(amount/(state.user.rate||3.4)*100)/100;
  let who='';
  if(inc){const w=full.match(/((?:[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ]*\s+){0,3}[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ]*\.?)\s+te\s+(?:envi|yape|pline|transfiri|pag|deposit)/)||full.match(/\bde\s+([A-ZÁÉÍÓÚÑ][^.,\d]{2,40}?)(?:\.|,|$|\s+por\s|\s+el\s)/);if(w)who=w[1].trim()}
  else{const w=full.match(/\b(?:en|a)\s+([A-ZÁÉÍÓÚÑ0-9*][^.,]{2,40}?)(?:\.|,|$|\s+el\s|\s+con\s|\s+por\s|\s+desde\s)/);if(w)who=w[1].trim()}
  who=who.replace(/\b(tu|su)\s+(tarjeta|cuenta).*$/i,'').trim();
  const note=(inc?(who?`${who} te pagó`:'Ingreso'):(who||(/yape/.test(s)?'Pago con Yape':'Pago con tarjeta'))).slice(0,40);
  const cats=catsOf(type),cat=findCat(norm(note+' '+full),type)||(cats.find(c=>c.id===(inc?'extra':'otros'))||cats.at(-1)||{}).id;if(!cat)return null;
  const d=new Date(it.time||Date.now());
  return{id:'n'+(it.time||Date.now())+Math.floor(Math.random()*1e3),type,amount,cat,acc:acc.id,note:cap(note),date:iso(d),src:'notif'};
}
let pulling=false;
async function pullNotifs(){
  if(!FZ||pulling||!state.user.onboarded)return;pulling=true;
  try{
    const r=await FZ.notifPending(),items=(r&&r.items)||[],added=[];
    state.user.nseen=state.user.nseen||[];
    for(const it of items){const key=`${it.pkg}|${it.text}|${Math.round((it.time||0)/60000)}`;if(state.user.nseen.includes(key))continue;state.user.nseen.push(key);
      const tx=parseBankNotif(it);if(tx){state.txs.push(tx);added.push(tx)}}
    state.user.nseen=state.user.nseen.slice(-150);
    if(items.length)persist();
    if(added.length){
      render(true);
      const msg=`Anoté ${added.length===1?'un movimiento':added.length+' movimientos'} de tus notificaciones:\n${added.map(t=>`· ${t.type==='ingreso'?'+':'−'}${accMoney(t.amount,t.acc)} ${t.note} (${accById(t.acc).name})`).join('\n')}\nSi algo no cuadra, tócalo en Movimientos y lo corriges.`;
      state.chat.push({from:'bot',text:msg});if(state.chatOpen)drawMsgs();
      toast(added.length===1?`${state.user.bot} anotó: ${added[0].note}`:`${state.user.bot} anotó ${added.length} movimientos`);
    }
  }catch(e){}
  pulling=false;
}
function openNotifSheet(){
  openSheet(`<div class="sh-title">Anotar solo tus pagos</div>
    <div class="sh-sub" style="line-height:1.55;margin-top:10px">Cuando Yape o tu banco te envían una notificación de un pago, ${esc(state.user.bot)} la lee y lo anota en la cuenta correcta. No tienes que escribir nada.</div>
    <div class="blk" style="background:var(--soft);margin-top:20px"><div class="kv" style="margin-top:0"><span>Estado</span><b>${NOTIF_OK?'Activado':'Desactivado'}</b></div>
    <div class="kv"><span>Lee</span><b>Yape, BCP, Interbank, BBVA…</b></div><div class="kv"><span>Lo que lee</span><b>Se queda en tu celular</b></div></div>
    <div class="hint" style="line-height:1.5">${NOTIF_OK?'Puedes desactivarlo en los ajustes de Android cuando quieras.':'Se abrirán los ajustes de Android: busca <b>Finanzas</b> y activa el acceso. Solo se hace una vez.'}</div>
    <button class="btn" data-act="notifopen">${NOTIF_OK?'Abrir ajustes':'Activar'}</button><button class="btn soft" data-act="sheetclose">${NOTIF_OK?'Cerrar':'Ahora no'}</button>`);
}
async function checkPerms(){
  if(!FZ)return;
  try{const a=await FZ.bioAvailable();BIO_OK=!!(a&&a.available)}catch(e){}
  try{const n=await FZ.notifStatus();const was=NOTIF_OK;NOTIF_OK=!!(n&&n.enabled);if(was!==NOTIF_OK&&state.tab==='menu')render(true);if(!was&&NOTIF_OK)toast('Listo: tus pagos se anotarán solos')}catch(e){}
}
async function takeAction(){
  if(!FZ)return;
  try{const r=await FZ.takeAction();if(r&&r.action==='add'){const f=()=>{closeJarvis();openForm('gasto')};if($('#lock').classList.contains('open'))afterUnlock=f;else f()}}catch(e){}
}
function onBack(){
  if($('#lock').classList.contains('open')){CAPAPP.minimizeApp();return}
  if($('#story').classList.contains('open')){$('#story').classList.remove('open');return}
  if($('#onb').classList.contains('open')){if(onb&&onb.step>0){onb.step--;drawOnb()}else CAPAPP.minimizeApp();return}
  if(state.chatOpen){closeJarvis();return}
  if($('#sheetWrap').classList.contains('open')){backOrClose();return}
  if(state.tab!=='home'){go(MAIN.includes(state.tab)?'home':(state.backTo||'menu'));return}
  CAPAPP.minimizeApp();
}
if(NATIVE){
  document.documentElement.classList.add('native');
  /* si el WebView perdió los datos pero existe la copia nativa, se recupera sola */
  if(firstRun)FZ.kvGet({key:'data'}).then(r=>{if(r&&r.value){store.setItem(KEY,r.value);location.reload()}}).catch(()=>{});
  CAPAPP.addListener('backButton',onBack);
  CAPAPP.addListener('pause',()=>{pausedAt=Date.now();if(VO.on)voiceEnd('')});
  CAPAPP.addListener('resume',()=>{
    const day=iso(now);now=new Date();
    if(iso(now)!==day){applyRecs();autoBackup()}
    checkPerms();pullNotifs();takeAction();
    if(state.user.pin&&pausedAt&&Date.now()-pausedAt>60000)showLock();
    if(state.tab==='home'&&!$('#sheetWrap').classList.contains('open')&&!state.chatOpen)render(true);
  });
  FZ.addListener('notif',()=>pullNotifs());
  FZ.addListener('action',()=>takeAction());
  FZ.addListener('voice',e=>voEvent(e));
  checkPerms().then(()=>{if(state.user.pin&&state.user.bio&&$('#lock').classList.contains('open'))showLock()});
  pullNotifs();takeAction();nativeSync();
}
