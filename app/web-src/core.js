/* ================== PUENTE CON ANDROID ================== */
const CAP=window.Capacitor,NATIVE=!!(CAP&&CAP.isNativePlatform&&CAP.isNativePlatform());
const NP=n=>NATIVE?((CAP.Plugins&&CAP.Plugins[n])||CAP.registerPlugin(n)):null;
const FZ=NP('Finanzas'),CAPAPP=NP('App');
let BIO_OK=false,NOTIF_OK=false,afterUnlock=null;
/* ================== ICONOS ================== */
const ICONS={
  home:'<path d="M3.5 10.5 12 4l8.5 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-4v-6h-6v6H5A1.5 1.5 0 0 1 3.5 19z"/>',
  list:'<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  wallet:'<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="8" width="16.5" height="11" rx="2.5"/><path d="M16 13.5h.01"/>',
  menu:'<circle cx="6" cy="6" r="1.6"/><circle cx="12" cy="6" r="1.6"/><circle cx="18" cy="6" r="1.6"/><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/><circle cx="6" cy="18" r="1.6"/><circle cx="12" cy="18" r="1.6"/><circle cx="18" cy="18" r="1.6"/>',
  tag:'<path d="M3.5 12.5v-8h8l9 9-8 8z"/><circle cx="8" cy="9" r="1.3"/>',
  gauge:'<path d="M4 16a8 8 0 1 1 16 0"/><path d="m12 16 4-5"/>',
  swap:'<path d="M7 7h12l-3.5-3.5M17 17H5l3.5 3.5"/>',
  spark:'<path d="M12 3.5c.8 4.4 2.6 6.7 7.5 8.5-4.9 1.8-6.7 4.1-7.5 8.5-.8-4.4-2.6-6.7-7.5-8.5 4.9-1.8 6.7-4.1 7.5-8.5z"/>',
  brush:'<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 0 0 17z" fill="currentColor" stroke="none" opacity=".35"/>',
  close:'<path d="M6 6l12 12M18 6 6 18"/>',minus:'<path d="M6 12h12"/>',
  chevL:'<path d="m15 6-6 6 6 6"/>',chevR:'<path d="m9 6 6 6-6 6"/>',
  mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  send:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  download:'<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',upload:'<path d="M12 15V4M7 8.5l5-5 5 5M5 20h14"/>',
  refresh:'<path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v4.5h-4.5"/>',trash:'<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>',
  undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  arrow:'<path d="M5 12h14M14 7l5 5-5 5"/>',
  chevD:'<path d="M6 9l6 6 6-6"/>',
  eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:'<path d="M4 4l16 16M10 6c.6-.1 1.3-.2 2-.2 6 0 9.5 6.4 9.5 6.4a17 17 0 0 1-3 3.8M6.6 7.3A16 16 0 0 0 2.5 12s3.5 6.5 9.5 6.5c1.6 0 3-.4 4.3-1"/>',
  lock:'<rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  repeat:'<path d="M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 0 1-3 3H4"/>',
  target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  users:'<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8M16 5.6a3 3 0 0 1 0 5.8M17.5 14.5c1.6.6 2.7 2.2 3 4.5"/>',
  card:'<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/>',
  dollar:'<path d="M12 3v18M16.5 7.5c-.8-1.3-2.4-2-4.5-2-2.6 0-4.3 1.3-4.3 3.2 0 4.5 9 2.3 9 6.8 0 2-1.9 3.4-4.7 3.4-2.2 0-4-.8-4.8-2.4"/>',
  shield:'<path d="M12 3.5 19 6v5.5c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9V6z"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  history:'<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 4v4.5H8"/><path d="M12 8v4.5l3 2"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
  keys:'<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M8 14h8"/>',
};
const svg=(n,s=20,sw=1.7)=>`<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]||''}</svg>`;

/* ================== ESTILOS ================== */
const THEMES={
  carbon:{name:'Carbón',short:'Negro y grises · cero color',prev:'linear-gradient(135deg,#000 0 45%,#1E1E1E 45% 70%,#D0D0D0 70%)',
    look:'Solo negro y grises. El único “color” es un gris claro para lo que se toca (Registrar, botones). Las cuentas y categorías se distinguen por un gris apenas distinto.'},
  musgo:{name:'Musgo',short:'Negro + verde musgo apagado',prev:'linear-gradient(135deg,#030403 0 45%,#1C211A 45% 70%,#8E9E7A 70%)',
    look:'Negro con un verde musgo grisáceo, como hojas en sombra. Tranquilo y natural; el verde solo aparece en lo que se toca y en una luz suave detrás del saldo.'},
  vino:{name:'Vino',short:'Negro + vino oscuro',prev:'linear-gradient(135deg,#040203 0 45%,#241A1C 45% 70%,#A3666F 70%)',
    look:'Negro con un tinto apagado, cálido y elegante. Nada brillante: el vino se ve como una luz tenue detrás del saldo y en el botón de registrar.'},
  petroleo:{name:'Petróleo',short:'Negro + azul petróleo',prev:'linear-gradient(135deg,#020405 0 45%,#192225 45% 70%,#6F99A1 70%)',
    look:'Negro con un azul verdoso profundo, frío y sereno. Da sensación de orden y calma.'},
  bronce:{name:'Bronce',short:'Negro + bronce mate',prev:'linear-gradient(135deg,#040302 0 45%,#24201A 45% 70%,#B09670 70%)',
    look:'Negro con un dorado mate, como bronce viejo. Cálido y con algo de lujo, sin llegar a ser llamativo.'},
};

/* ================== CONFIGURACIÓN INICIAL ================== */
const PALETTE=['#CBC4FF','#A9E4C6','#F0ABAB','#F6D49A','#9CC7F5','#E6A8E0','#A3E3D8','#D8D39A','#F5B98E','#8FD3F0','#C9E59B','#B9B4AE'];
const DEFAULT_CATS=[
  {id:'comida',name:'Comida',type:'gasto',color:'#F6D49A'},{id:'transporte',name:'Transporte',type:'gasto',color:'#9CC7F5'},
  {id:'casa',name:'Casa',type:'gasto',color:'#F0ABAB'},{id:'servicios',name:'Servicios',type:'gasto',color:'#A3E3D8'},
  {id:'universidad',name:'Universidad',type:'gasto',color:'#CBC4FF'},{id:'salud',name:'Salud',type:'gasto',color:'#A9E4C6'},
  {id:'ocio',name:'Ocio',type:'gasto',color:'#E6A8E0'},{id:'compras',name:'Compras',type:'gasto',color:'#F5B98E'},
  {id:'otros',name:'Otros',type:'gasto',color:'#B9B4AE'},
  {id:'sueldo',name:'Sueldo',type:'ingreso',color:'#A9E4C6'},{id:'freelance',name:'Freelance',type:'ingreso',color:'#CBC4FF'},
  {id:'ventas',name:'Ventas',type:'ingreso',color:'#F6D49A'},{id:'extra',name:'Extra',type:'ingreso',color:'#9CC7F5'},
];
const DEFAULT_ACCS=[
  {id:'bcp',name:'BCP',kind:'banco',color:'#7FA6FF',init:900},
  {id:'yape',name:'Yape',kind:'billetera',color:'#B794FF',init:40},
  {id:'lemon',name:'Lemon',kind:'billetera',color:'#D9F27E',init:80},
  {id:'efectivo',name:'Efectivo',kind:'efectivo',color:'#A9E4C6',init:60},
  {id:'dolares',name:'Ahorro $',kind:'ahorro',currency:'USD',color:'#9FD3C7',init:420},
  {id:'visa',name:'Visa BCP',kind:'credito',color:'#C9B8A0',init:0,limit:3000,closeDay:20,payDay:5},
];
const DEFAULT_BUDGETS={comida:900,transporte:300,casa:1200,servicios:300,universidad:350,salud:200,ocio:300,compras:400,otros:150};
const KINDS={banco:'Banco',billetera:'Billetera digital',efectivo:'Efectivo',credito:'Tarjeta de crédito',ahorro:'Ahorros'};
const ACC_PRESETS=[['BCP','banco','#7FA6FF'],['Interbank','banco','#5BD49A'],['BBVA','banco','#6E8DF0'],['Scotiabank','banco','#F08A8A'],['Yape','billetera','#B794FF'],['Plin','billetera','#5FD6E3'],['Lemon','billetera','#D9F27E'],['Efectivo','efectivo','#A9E4C6'],['Tarjeta de crédito','credito','#F5B98E'],['Ahorros','ahorro','#F6D49A'],['Visa BCP','credito','#C9B8A0'],['Ahorro $','ahorro','#9FD3C7']];
const CAT_SUGG={gasto:['Universidad','Mascotas','Gimnasio','Suscripciones','Regalos','Viajes','Deudas','Ahorro','Belleza','Hogar'],ingreso:['Propinas','Beca','Alquiler','Intereses','Regalo','Reembolso']};
const KEY='finanzas-app';
const store=(()=>{let mem={};try{localStorage.setItem('__t','1');localStorage.removeItem('__t');return localStorage}catch(e){return{getItem:k=>mem[k]??null,setItem:(k,v)=>{mem[k]=String(v)},removeItem:k=>{delete mem[k]}}}})();

/* ================== UTILS ================== */
const $=(s,r=document)=>r.querySelector(s);
const fmt=new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN',minimumFractionDigits:2,maximumFractionDigits:2});
const HIDDEN='•••••';
const moneyRaw=v=>fmt.format(v).replace(/S\/\s*/,'S/\u00a0').replace('-S/','−S/');
const money=v=>typeof state!=='undefined'&&state.user.hide?'S/\u00a0'+HIDDEN:moneyRaw(v);
const fmtUSD=new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const curOf=id=>(accById(id).currency==='USD'?'USD':'PEN');
const symOf=cur=>cur==='USD'?'US$':'S/';
const moneyC=(v,cur)=>cur==='USD'?(state.user.hide?'US$\u00a0'+HIDDEN:(v<0?'−':'')+'US$\u00a0'+fmtUSD.format(Math.abs(v))):money(v);
const accMoney=(v,id)=>moneyC(v,curOf(id));
const txMoney=t=>accMoney(t.amount,t.acc||t.from);
const toPEN=(v,id)=>curOf(id)==='USD'?v*(state.user.rate||3.4):v;
const mkey=d=>`${d.getFullYear()}-${pad2(d.getMonth()+1)}`;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pad2=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const parseISO=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const daysIn=(y,m)=>new Date(y,m+1,0).getDate();
const MONTHS=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MSHORT=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DOWL=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const esc=s=>String(s??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const sum=a=>a.reduce((x,t)=>x+toPEN(t.amount,t.acc||t.from),0);
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const reEsc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const slug=s=>norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'x';
const uid=(p,name)=>{let b=p+slug(name),id=b,i=2;while(state.cats.some(c=>c.id===id)||state.accs.some(a=>a.id===id)||(state.goals||[]).some(g=>g.id===id)||(state.recs||[]).some(r=>r.id===id))id=b+'-'+(i++);return id};
const FIXED=['casa','servicios'];

/* ================== DATOS ================== */
function seedData(){
  const r=mulberry32(7),txs=[],now=new Date();
  const pick=a=>a[Math.floor(r()*a.length)],rng=(a,b)=>Math.round((a+r()*(b-a))*10)/10;
  const notes={comida:['Almuerzo','Menú del día','Café','Mercado','Cena','Pollo a la brasa','Ceviche','Panadería'],transporte:['Combi','Taxi','Mototaxi','Pasaje','Gasolina'],
    ocio:['Cine','Spotify','Salida con amigos','Juego','Netflix'],compras:['Ropa','Zapatillas','Audífonos','Mochila'],salud:['Farmacia','Consulta','Vitaminas'],
    universidad:['Copias','Separata','Libro','Pasaje a la U','Materiales'],otros:['Regalo','Propina','Varios']};
  const ranges={comida:[8,45],transporte:[2,25],ocio:[15,80],compras:[30,180],salud:[15,110],universidad:[5,60],otros:[5,40]};
  const accOf={comida:['yape','yape','efectivo'],transporte:['efectivo','efectivo','yape'],ocio:['lemon','bcp'],compras:['bcp','lemon'],salud:['yape','bcp'],universidad:['bcp','yape','efectivo'],otros:['efectivo']};
  const weights=[['comida',40],['transporte',25],['ocio',8],['compras',6],['salud',4],['universidad',8],['otros',7]];
  const wsum=weights.reduce((s,w)=>s+w[1],0);
  const wpick=()=>{let x=r()*wsum;for(const [k,w] of weights){if((x-=w)<0)return k}return 'otros'};
  let id=1;
  const add=(d,type,cat,amount,note,acc)=>txs.push({id:'s'+(id++),type,cat,amount,note,date:iso(d),acc});
  const mov=(d,amount,from,to,note)=>txs.push({id:'s'+(id++),type:'mov',amount,from,to,note,date:iso(d)});
  for(let off=-2;off<=0;off++){
    const base=new Date(now.getFullYear(),now.getMonth()+off,1),y=base.getFullYear(),m=base.getMonth();
    const last=off===0?now.getDate():daysIn(y,m);
    add(new Date(y,m,1),'ingreso','sueldo',4200,'Sueldo mensual','bcp');
    mov(new Date(y,m,1),300,'bcp','yape','Para el mes');
    if(last>=2)add(new Date(y,m,2),'gasto','casa',1200,'Alquiler','bcp');
    if(last>=3)mov(new Date(y,m,3),300,'bcp','efectivo','Retiro de cajero');
    if(last>=4)add(new Date(y,m,4),'gasto','universidad',290,'Pensión de la U','bcp');
    if(last>=5)add(new Date(y,m,5),'gasto','servicios',rng(95,140),'Luz','bcp');
    if(last>=8)add(new Date(y,m,8),'gasto','servicios',99,'Internet','bcp');
    if(last>=10)add(new Date(y,m,10),'gasto','servicios',rng(25,45),'Agua','yape');
    if(last>=15)add(new Date(y,m,15),'ingreso','freelance',Math.round(rng(500,1200)),'Proyecto web','lemon');
    if(last>=16)mov(new Date(y,m,16),200,'bcp','yape','Recarga');
    if(last>=18)mov(new Date(y,m,18),450,'lemon','bcp','Pasé a BCP');
    if(last>=17)mov(new Date(y,m,17),200,'bcp','efectivo','Retiro de cajero');
    if(last>=22&&r()>.4)add(new Date(y,m,22),'ingreso','ventas',Math.round(rng(80,300)),'Venta de garaje','yape');
    for(let d=1;d<=last;d++){const n=Math.floor(r()*3.1);for(let k=0;k<n;k++){const c=wpick();add(new Date(y,m,d),'gasto',c,rng(...ranges[c]),pick(notes[c]),pick(accOf[c]))}}
  }
  /* hábitos que se repiten (sirven para las sugerencias del formulario) */
  for(let k=1;k<=24;k++){const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-k),wd=d.getDay();if(wd===0||wd===6)continue;
    txs.push({id:'s'+(id++),type:'gasto',cat:'transporte',amount:3,note:'Combi a la U',date:iso(d),acc:'efectivo'});
    if(wd%2)txs.push({id:'s'+(id++),type:'gasto',cat:'comida',amount:12,note:'Menú del día',date:iso(d),acc:'yape'});
    if(wd===5)txs.push({id:'s'+(id++),type:'gasto',cat:'comida',amount:6.5,note:'Café',date:iso(d),acc:'yape'})}
  /* tarjeta de crédito: compra del mes pasado ya pagada y una compra en cuotas este mes */
  const pm=new Date(now.getFullYear(),now.getMonth()-1,12),cm=new Date(now.getFullYear(),now.getMonth(),Math.min(2,now.getDate()));
  txs.push({id:'s'+(id++),type:'gasto',cat:'compras',amount:189.9,note:'Polo y zapatillas',date:iso(pm),acc:'visa'});
  if(now.getDate()>=5)txs.push({id:'s'+(id++),type:'mov',amount:189.9,from:'bcp',to:'visa',note:'Pago de tarjeta',date:iso(new Date(now.getFullYear(),now.getMonth(),5))});
  txs.push({id:'s'+(id++),type:'gasto',cat:'compras',amount:360,note:'Audífonos',date:iso(cm),acc:'visa',cuotas:3});
  return txs;
}
/* gastos fijos, metas y deudas de ejemplo */
function seedExtras(){
  const n=new Date(),done=day=>{const out=[];for(let off=-2;off<=0;off++){const d=new Date(n.getFullYear(),n.getMonth()+off,1);if(off<0||n.getDate()>=day)out.push(mkey(d))}return out};
  const start=mkey(new Date(n.getFullYear(),n.getMonth()-2,1)),ago=k=>iso(new Date(n.getFullYear(),n.getMonth(),n.getDate()-k));
  return{
    recs:[{id:'r-alquiler',name:'Alquiler',type:'gasto',amount:1200,cat:'casa',acc:'bcp',day:2,active:true,start,done:done(2)},
      {id:'r-pension',name:'Pensión de la U',type:'gasto',amount:290,cat:'universidad',acc:'bcp',day:4,active:true,start,done:done(4)},
      {id:'r-internet',name:'Internet',type:'gasto',amount:99,cat:'servicios',acc:'bcp',day:8,active:true,start,done:done(8)},
      {id:'r-netflix',name:'Netflix',type:'gasto',amount:44.9,cat:'ocio',acc:'visa',day:12,active:true,start:mkey(n),done:[]},
      {id:'r-sueldo',name:'Sueldo mensual',type:'ingreso',amount:4200,cat:'sueldo',acc:'bcp',day:1,active:true,start,done:done(1)}],
    goals:[{id:'g-laptop',name:'Laptop nueva',target:3000,date:iso(new Date(n.getFullYear()+1,2,31)),saved:850,log:[{date:ago(20),amount:500},{date:ago(6),amount:350}]},
      {id:'g-cusco',name:'Viaje a Cusco',target:1500,date:iso(new Date(n.getFullYear()+1,6,15)),saved:300,log:[{date:ago(12),amount:300}]}],
    debts:[{id:'d1',person:'Carlos',dir:'medeben',amount:50,note:'Pizza del viernes',date:ago(9),paid:false},
      {id:'d2',person:'Ana',dir:'debo',amount:30,note:'Entradas al cine',date:ago(3),paid:false},
      {id:'d3',person:'Luis',dir:'medeben',amount:20,note:'Pasaje',date:ago(25),paid:true}],
  };
}
function load(){try{const s=JSON.parse(store.getItem(KEY));if(s&&Array.isArray(s.txs))return s}catch(e){}return{}}
const saved=load(),firstRun=!saved.txs;let now=new Date();const EX=seedExtras();
const state={theme:THEMES[saved.theme]?saved.theme:'carbon',txs:saved.txs||seedData(),
  cats:saved.cats||DEFAULT_CATS.map(c=>({...c})),accs:saved.accs||DEFAULT_ACCS.map(a=>({...a})),budgets:saved.budgets||{...DEFAULT_BUDGETS},
  recs:saved.recs||EX.recs,goals:saved.goals||EX.goals,debts:saved.debts||EX.debts,
  user:Object.assign({name:'Edward',bot:'Lizi',voz:false,vozDirecta:true,fab:true,fabPos:null,lastAcc:{gasto:'yape',ingreso:'bcp'},hide:false,pin:null,rate:3.4,lastSeen:null,onboarded:!firstRun},saved.user||{}),
  y:now.getFullYear(),m:now.getMonth(),tab:'home',filter:'all',accFilter:'all',q:'',catTab:'gasto',chat:[],chatOpen:false};
if(state.user.bot==='Jarvis')state.user.bot='Lizi';
const snapshot=()=>({theme:state.theme,txs:state.txs,cats:state.cats,accs:state.accs,budgets:state.budgets,recs:state.recs,goals:state.goals,debts:state.debts,user:state.user});
function persist(){store.setItem(KEY,JSON.stringify(snapshot()));autoBackup();if(NATIVE)nativeSync()}
/* copia automática diaria dentro del mismo celular (se guardan las últimas 7) */
const BKEY=KEY+'-copias';
function backups(){try{return JSON.parse(store.getItem(BKEY))||[]}catch(e){return[]}}
function autoBackup(){const today=iso(new Date()),list=backups();if(list[0]?.date===today){list[0]={date:today,n:state.txs.length,data:snapshot()}}else list.unshift({date:today,n:state.txs.length,data:snapshot()});
  try{store.setItem(BKEY,JSON.stringify(list.slice(0,7)))}catch(e){}}

/* ---- búsquedas ---- */
const catById=id=>state.cats.find(c=>c.id===id)||{id,name:'Sin categoría',type:'gasto',color:'#77757D'};
const accById=id=>state.accs.find(a=>a.id===id)||{id,name:'Sin cuenta',kind:'efectivo',color:'#77757D',init:0};
const catsOf=type=>state.cats.filter(c=>c.type===type);
const initials=n=>{const w=String(n).trim().split(/\s+/).filter(Boolean);if(!w.length)return '?';if(w.length===1&&w[0].length<=4&&w[0]===w[0].toUpperCase())return w[0];return(w.length>1?w[0][0]+w[1][0]:w[0][0]).toUpperCase()};
const monoEl=(a,cls='')=>`<i class="mono ${cls}" style="--c:${a.color}">${esc(initials(a.name))}</i>`;
const dotEl=id=>`<i class="dot" style="--c:${catById(id).color}"></i>`;

/* ---- cálculos ---- */
function balances(until=iso(now)){
  const b={};state.accs.forEach(a=>b[a.id]=a.init||0);
  for(const t of state.txs){if(t.date>until)continue;
    if(t.type==='ingreso'){if(t.acc in b)b[t.acc]+=t.amount}
    else if(t.type==='gasto'){if(t.acc in b)b[t.acc]-=t.amount}
    else if(t.type==='mov'){if(t.from in b)b[t.from]-=t.amount;if(t.to in b)b[t.to]+=(t.amountTo??t.amount)}}
  return b;
}
const totalOf=b=>Object.entries(b).reduce((s,[id,v])=>s+toPEN(v,id),0);
const isCurrentMonth=()=>state.y===now.getFullYear()&&state.m===now.getMonth();
const monthEnd=()=>isCurrentMonth()?iso(now):iso(new Date(state.y,state.m+1,0));
function monthData(Y=state.y,M=state.m){
  const list=state.txs.filter(t=>{const d=parseISO(t.date);return d.getFullYear()===Y&&d.getMonth()===M})
    .sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(String(a.id)));
  let inc=0,exp=0;const by={},mk=Y*12+M;
  for(const t of list)if(t.type==='ingreso')inc+=toPEN(t.amount,t.acc);
  for(const t of state.txs){if(t.type!=='gasto')continue;const d=parseISO(t.date),k=mk-(d.getFullYear()*12+d.getMonth()),n=t.cuotas||1;
    if(k<0||k>=n)continue;const v=toPEN(t.amount,t.acc)/n;exp+=v;by[t.cat]=(by[t.cat]||0)+v}
  const byCat=Object.entries(by).map(([cat,total])=>({cat,total})).sort((a,b)=>b.total-a.total);
  const ratio=inc?exp/inc:(exp?1.2:0);
  const mood=ratio<.6?{k:'good',t:'Vas muy bien'}:ratio<.9?{k:'mid',t:'Vas justo'}:{k:'bad',t:'Te estás pasando'};
  return{list,inc,exp,bal:inc-exp,byCat,ratio,mood};
}
function projection(d,Y,M){const day=now.getDate(),rem=daysIn(Y,M)-day;return d.bal-sum(d.list.filter(t=>t.type==='gasto'&&!FIXED.includes(t.cat)))/day*rem}
function greeting(){const h=new Date().getHours();return h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches'}
function budgetAlerts(){
  const d=monthData(now.getFullYear(),now.getMonth()),by=Object.fromEntries(d.byCat.map(c=>[c.cat,c.total]));
  return catsOf('gasto').filter(c=>state.budgets[c.id]).map(c=>({c,p:(by[c.id]||0)/state.budgets[c.id],s:by[c.id]||0}))
    .filter(x=>x.p>=.8&&!(FIXED.includes(x.c.id)&&x.p<=1.001)).sort((a,b)=>b.p-a.p);
}
