// Arma www/index.html (la app) a partir de las piezas de web-src.
import fs from 'fs';import path from 'path';import {fileURLToPath} from 'url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..'),src=path.join(root,'web-src'),out=path.join(root,'www');
const read=f=>fs.readFileSync(path.join(src,f),'utf8');
let html=['head.html','core.js','plan.js','views.js','extras.js','jarvis.js','forms.js','events.js'].map(read).join('');
// sin internet: fuera Google Fonts, fuentes locales
html=html.replace(/<link rel="preconnect"[^>]*>\n?/g,'').replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>\n?/,'');
html=html.replace('<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">','<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">');
html=html.replace(/<title>[^<]*<\/title>/,'<title>Finanzas</title>');
html=html.replace('</style>\n</head>',read('app.css')+'</style>\n</head>');
const i=html.lastIndexOf('</script>');html=html.slice(0,i)+read('native.js')+html.slice(i);
if(/fonts\.googleapis/.test(html))throw new Error('quedó un enlace a Google Fonts');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(path.join(out,'fonts'),{recursive:true});
fs.writeFileSync(path.join(out,'index.html'),html);
for(const f of fs.readdirSync(path.join(src,'fonts')))fs.copyFileSync(path.join(src,'fonts',f),path.join(out,'fonts',f));
console.log('www/index.html listo',(html.length/1024).toFixed(0)+' KB');
