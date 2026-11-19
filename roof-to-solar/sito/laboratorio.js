
const by=id=>document.getElementById(id);let roofs=[];
function prepare(data){
 roofs=[];by('chooser').hidden=true;by('message').textContent='';
 const fs=data.type==='FeatureCollection'?data.features:data.type==='Feature'?[data]:[{geometry:data}];
 for(const f of fs){const g=f.geometry;if(!g)continue;for(const ringSet of g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[]){
 if(!ringSet.length||!ringSet.every(r=>r.length>=4&&r.length<=3000&&r.every(p=>Array.isArray(p)&&p.length>=2&&p.slice(0,2).every(Number.isFinite)&&Math.abs(p[0])<=180&&Math.abs(p[1])<85)&&r[0][0]===r.at(-1)[0]&&r[0][1]===r.at(-1)[1]))throw Error('Coordinate non valide: esporta il poligono in WGS84.');
 const pts=ringSet[0],dx=Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0])),dy=Math.max(...pts.map(p=>p[1]))-Math.min(...pts.map(p=>p[1]));
 if(!dx||!dy||dx*111320*Math.cos(pts[0][1]*Math.PI/180)>600||dy*111320>600)throw Error('Seleziona una singola copertura con estensione inferiore a 600 m.');
 roofs.push({name:String(f.properties?.nome||f.properties?.name||'Copertura')+' · '+(roofs.length+1),geometry:{type:'Polygon',coordinates:ringSet}});}}
 if(!roofs.length)throw Error('Il file non contiene poligoni di copertura.');
 by('roof').replaceChildren(...roofs.map((r,i)=>new Option(r.name,i)));by('chooser').hidden=false;by('message').textContent=roofs.length+' coperture disponibili.';
}
by('file').onchange=async e=>{try{prepare(JSON.parse(await e.target.files[0].text()));}catch(err){by('chooser').hidden=true;by('message').textContent=err.message;}};
by('example').onclick=()=>prepare({type:'Polygon',coordinates:[[[12,42],[12.0003,42],[12.0003,42.00015],[12,42.00015],[12,42]]]});
by('load').onclick=()=>{if(!by('tilt').reportValidity()||!by('tilt').value)return;const r=roofs[+by('roof').value];by('work').hidden=false;by('chooser').parentElement.hidden=true;by('roofname').textContent=r.name;run(r);};
function run(r){
const DATA=[{type:'Feature',geometry:r.geometry,properties:{}}],latitude=r.geometry.coordinates[0][0][1];
const features=d=>d.type==='FeatureCollection'?d.features:[d];
const polys=g=>g.type==='Polygon'?[g.coordinates]:g.coordinates;
const all=DATA.flatMap(features);
const pts=all.flatMap(f=>polys(f.geometry).flat(2));
const xs=pts.map(p=>p[0]*Math.cos(latitude*Math.PI/180)),ys=pts.map(p=>p[1]);
const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
const scale=Math.min(490/(maxX-minX),310/(maxY-minY));
const xy=([x,y])=>[300+(x*Math.cos(latitude*Math.PI/180)-(minX+maxX)/2)*scale,190+((minY+maxY)/2-y)*scale];
const svg=document.querySelector('#map'), ns='http://www.w3.org/2000/svg';
function el(tag,attrs){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);svg.append(e);return e;}
for(let i=20;i<600;i+=20)el('path',{d:'M'+i+' 0V380',stroke:'#dce5d9'});
for(let i=20;i<380;i+=20)el('path',{d:'M0 '+i+'H600',stroke:'#dce5d9'});
for(const f of all){const z=f.properties?.zona;const e=el('path',{d:polys(f.geometry).flatMap(p=>p.map(r=>'M'+r.map(xy).map(q=>q.join(',')).join('L')+'Z')).join(' '),'fill-rule':'evenodd',fill:'#b3c5b5',stroke:'#648477','stroke-width':2});if(z){e.dataset.zone=z;e.setAttribute('tabindex','0');e.setAttribute('role','button');e.setAttribute('aria-label','Seleziona zona '+z);e.onclick=()=>pick(z);e.onkeydown=event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();pick(z);}};const a=f.geometry.coordinates[0].slice(0,-1).map(xy);const x=a.reduce((s,p)=>s+p[0],0)/a.length,y=a.reduce((s,p)=>s+p[1],0)/a.length;el('path',{d:'M'+x+' '+y+'h27',stroke:'#374e40','pointer-events':'none'});el('text',{x:x+32,y:y+6,fill:'#18352e','font-weight':800,'pointer-events':'none'}).textContent=z;}}
const section=document.createElement('section');
section.className='card compare';
section.innerHTML='<h2>Disegna una zona sul tetto</h2><p>Attiva il disegno e fai clic sulla mappa per aggiungere i vertici. Chiudi il poligono con almeno tre punti.</p><div class="draw-tools"><button id="draw">Inizia disegno</button> <button id="undo">Annulla vertice</button> <button id="close-zone">Chiudi zona</button> <button id="clear-zone">Cancella</button> <button id="export-zone">Esporta GeoJSON</button></div><p id="draw-status" role="status"></p><small>Superficie geometrica indicativa: non sottrae ostacoli o fasce di rispetto. Il disegno viene conservato in questo browser.</small>';
document.querySelector('.grid').after(section);
const style=document.createElement('style');
style.textContent='.draw-tools{display:flex;gap:8px;flex-wrap:wrap}.draw-tools button:disabled{opacity:.5;cursor:default}#map.drawing{cursor:crosshair;touch-action:manipulation}#map.drawing [data-zone]{pointer-events:none}#draw-status{font-weight:650}';
document.head.append(style);
const overlay=el('g',{'pointer-events':'none'});
const get=id=>document.getElementById(id);
let drawing=false, vertices=[], closed=false, msg='';
const key='lab-roof:'+JSON.stringify(r.geometry);
try {const v=JSON.parse(localStorage.getItem(key));if(Array.isArray(v)&&v.length>=3&&v.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite))){vertices=v;closed=true;}} catch {}
const lonFactor=Math.cos(latitude*Math.PI/180), mPerPx=6371008.8*Math.PI/180/scale;
function area(v){return Math.abs(v.reduce((acc,p,i)=>{const q=v[(i+1)%v.length];return acc+p[0]*q[1]-q[0]*p[1];},0))/2*mPerPx*mPerPx;}
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function intersects(a,b,c,d){
 const overlap=(k)=>Math.max(Math.min(a[k],b[k]),Math.min(c[k],d[k]))<=Math.min(Math.max(a[k],b[k]),Math.max(c[k],d[k]));
 return overlap(0)&&overlap(1)&&cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0;
}
function simple(v){return v.every((a,i)=>v.every((c,j)=>j<=i+1||(i===0&&j===v.length-1)||!intersects(a,v[i+1],c,v[(j+1)%v.length])));}
function geo([x,y]){return [((x-300)/scale+(minX+maxX)/2)/lonFactor,(minY+maxY)/2-(y-190)/scale];}
function render(){
 overlay.replaceChildren();
 const add=(tag,attrs)=>{const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));overlay.append(n);};
 if(vertices.length)add(closed?'polygon':'polyline',{points:vertices.map(p=>p.join(',')).join(' '),fill:closed?'#e8ae4577':'none',stroke:'#674709','stroke-width':2,'stroke-dasharray':closed?'none':'5 4'});
 for(const [cx,cy] of vertices)add('circle',{cx,cy,r:4,fill:'#956511',stroke:'#fff'});
 svg.classList.toggle('drawing',drawing);
 get('draw').disabled=drawing||closed;
 get('undo').disabled=!drawing||!vertices.length;
 get('close-zone').disabled=!drawing||vertices.length<3;
 get('clear-zone').disabled=!drawing&&!closed;
 get('export-zone').disabled=!closed;
 document.dispatchEvent(new CustomEvent('zona:aggiornata'));
 get('draw-status').textContent=msg||(closed?'Superficie disegnata: '+area(vertices).toLocaleString('it-IT',{maximumFractionDigits:1})+' m²':drawing?vertices.length+' vertici. Seleziona i punti sulla mappa.':'Nessuna zona disegnata.');
}
svg.addEventListener('click',e=>{if(!drawing)return;const ctm=svg.getScreenCTM();if(!ctm)return;const pt=new DOMPoint(e.clientX,e.clientY).matrixTransform(ctm.inverse());if(pt.x<0||pt.x>600||pt.y<0||pt.y>380)return;if(vertices.some(p=>Math.hypot(p[0]-pt.x,p[1]-pt.y)<3))return;vertices.push([pt.x,pt.y]);msg='';render();});
get('draw').onclick=()=>{drawing=true;msg='';render();svg.scrollIntoView({block:'nearest'});};
get('undo').onclick=()=>{vertices.pop();msg='';render();};
get('close-zone').onclick=()=>{if(!simple(vertices)||area(vertices)<.01){msg='Il contorno si incrocia o non racchiude una superficie. Annulla un vertice e riprova.';render();return;}drawing=false;closed=true;try{localStorage.setItem(key,JSON.stringify(vertices));}catch{}render();};
get('clear-zone').onclick=()=>{drawing=false;closed=false;vertices=[];msg='';try{localStorage.removeItem(key);}catch{}render();};
get('export-zone').onclick=()=>{const r=vertices.map(geo);if(vertices.reduce((s,p,i)=>{const q=vertices[(i+1)%vertices.length];return s+p[0]*q[1]-q[0]*p[1];},0)>0)r.reverse();r.push(r[0]);const url=URL.createObjectURL(new Blob([JSON.stringify({type:'Feature',properties:{nome:'Zona disegnata',superficie_m2:+area(vertices).toFixed(2)},geometry:{type:'Polygon',coordinates:[r]}},null,2)],{type:'application/geo+json'}));const a=document.createElement('a');a.href=url;a.download='zona-edificio-f.geojson';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
render();
// Stima elettrica di riferimento: resa specifica PVGIS dello scenario Sud dello studio.

const panel = document.createElement('section');
panel.className='card compare forecast';
panel.innerHTML=`<div class="fc-head"><small>GEOLIBRE · SIMULAZIONE DI POSA</small><h2>Previsione per la zona disegnata</h2><span>Copertura importata · simulazione indicativa</span></div>
<div class="fc-body"><button id="analyse">Analizza il mio tetto</button><p id="pvstate" role="status">Stima preliminare · ombre locali non valutate.</p><details><summary>Inserimento manuale facoltativo</summary><label>Resa annua specifica del sito da PVGIS (kWh/kWp, facoltativa) <input type="number" min="0" step="any" id="yield" placeholder="Dal tuo scenario sud a 15°"></label></details><div id="solar-results" aria-live="polite"></div><details><summary>Dati e ipotesi di calcolo</summary><p>Schema di ingombro in pianta a file fisse (non ruota con lo scenario energetico): moduli da 450 Wp, ingombro ipotizzato in pianta di 1,13 × 1,72 m, distanza laterale 0,10 m e tra le file 0,60 m. Il disegno considera il perimetro del tetto; ostacoli, corridoi e distanze di sicurezza richiedono una verifica separata.</p><label>Sostituisci la griglia del 21 dicembre <input id="solar-grid" type="file" accept=".json,application/json"></label><p id="solar-input-status" role="status"></p></details></div>`;
section.after(panel);
let annualSite=null;let griglia = null; get('solar-input-status').textContent='Carica una griglia del tuo edificio per ottenere l’irradiazione.';
const fmt = (v, digits=2) => v.toLocaleString('it-IT',{maximumFractionDigits:digits});
function contiene([x,y], v) {
 let inside=false;
 for(let i=0,j=v.length-1;i<v.length;j=i++){
  const [a,b]=v[i], [c,d]=v[j];
  if ((b>y)!==(d>y) && x<(c-a)*(y-b)/(d-b)+a) inside=!inside;
 }
 return inside;
}
const modLayer=el('g',{'pointer-events':'none','aria-label':'Pannelli proposti'});
const roofRings=polys(features(DATA[0])[0].geometry)[0].map(r=>r.slice(0,-1).map(xy));
function bordoLibero(c,r){return !r.some((p,i)=>c.some((q,j)=>intersects(p,r[(i+1)%r.length],q,c[(j+1)%4])));}
function posa(v,fx=0,fy=0){
 const w=1.13/mPerPx,h=1.72/mPerPx,stepX=w+.10/mPerPx,stepY=h+.60/mPerPx;
 const roof=roofRings[0], lim=(r,k,fn)=>fn(...r.map(p=>p[k]));
 const left=Math.max(lim(v,0,Math.min),lim(roof,0,Math.min)),top=Math.max(lim(v,1,Math.min),lim(roof,1,Math.min));
 const right=Math.min(lim(v,0,Math.max),lim(roof,0,Math.max)),bottom=Math.min(lim(v,1,Math.max),lim(roof,1,Math.max));
 const arr=[];
 for(let y=top+.001+fy*stepY;y+h<bottom;y+=stepY)for(let x=left+.001+fx*stepX;x+w<right;x+=stepX){
 const c=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
 if(![v,roof].every(r=>c.every(p=>contiene(p,r))&&bordoLibero(c,r)))continue;
 if(roofRings.slice(1).some(r=>c.some(p=>contiene(p,r))||r.some(p=>contiene(p,c))||!bordoLibero(c,r)))continue;
 arr.push({x,y,w,h});}return arr;
}
function aggiornaPrevisione(){
 const out=get('solar-results');modLayer.replaceChildren();
 if(!closed){out.innerHTML='<div class="fc-empty"><b>Disegna la tua configurazione</b><p>Seleziona «Inizia disegno», indica almeno tre vertici sul tetto e premi «Chiudi zona». Qui appariranno i moduli e i risultati.</p></div>';return;}
 const mods=posa(vertices), kw=mods.length*.45;
 const path=(d,attrs)=>{const p=document.createElementNS(ns,'path');Object.entries({d,...attrs}).forEach(([k,v])=>p.setAttribute(k,v));modLayer.append(p);};
 path(mods.map(({x,y,w,h})=>'M'+x+' '+y+'h'+w+'v'+h+'h-'+w+'Z').join(' '),{fill:'#153956',stroke:'#dceefb','stroke-width':.075/mPerPx});
 path(mods.map(({x,y,w,h})=>'M'+(x+w/2)+' '+y+'v'+h+' M'+x+' '+(y+h/3)+'h'+w+' M'+x+' '+(y+2*h/3)+'h'+w).join(' '),{fill:'none',stroke:'#92b9d1','stroke-width':.035/mPerPx});
 const cells=(griglia||[]).filter(c=>contiene(xy(c),vertices)&&contiene(xy(c),roofRings[0])&&!roofRings.slice(1).some(r=>contiene(xy(c),r))),media=cells.length?fmt(cells.reduce((s,c)=>s+c[2],0)/cells.length):'—';
 const metric=(title,n,unit)=>'<div class="fc-metric"><small>'+title+'</small><strong>'+n+'</strong><span>'+unit+'</span></div>';
 out.innerHTML='<div class="fc-grid"><div class="fc-plan"><small>PLANIMETRIA · N ↑</small><svg id="fc-preview" aria-label="Schema della disposizione proposta"></svg><span>■ Moduli fotovoltaici</span></div><div class="fc-metrics">'+metric('Moduli in pianta',fmt(mods.length,0),'da 450 Wp')+metric('Potenza installata',fmt(kw),'kWp')+metric('Irradiazione annua del sito',Number.isFinite(annualSite)?fmt(annualSite,0):'—','kWh/m²/anno · piano dei moduli, PVGIS')+(cells.length?metric('Irradiazione locale',media,'kWh/m² · 21 dicembre, GeoLibre'):'')+metric('Riferimento PVGIS',(get('yield').valueAsNumber>0?fmt(kw*get('yield').valueAsNumber,0):'—'),'kWh/anno · scenario scelto')+'</div></div><p class="fc-note">'+(mods.length?'I pannelli blu sono visibili anche sulla mappa del tetto.':'Nessun modulo intero entra nella porzione di tetto selezionata con questa disposizione.')+' Il riferimento annuo usa la potenza dei moduli disegnati e non corregge le ombre locali.</p>';
 const prev=get('fc-preview'),xs=vertices.map(p=>p[0]),ys=vertices.map(p=>p[1]),w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys),pad=Math.max(w,h)*.08;
 prev.setAttribute('viewBox',[Math.min(...xs)-pad,Math.min(...ys)-pad,w+2*pad,h+2*pad].join(' '));const poly=document.createElementNS(ns,'polygon');poly.setAttribute('points',vertices.map(p=>p.join(',')).join(' '));poly.setAttribute('fill','#d7e4d5');prev.append(poly,modLayer.cloneNode(true));
}
let importId=0;
if(location.protocol!=='file:'){
 const bb=r.geometry.coordinates[0],xx=bb.map(p=>p[0]),yy=bb.map(p=>p[1]);
 fetch('/api/griglia?'+new URLSearchParams({w:Math.min(...xx),s:Math.min(...yy),e:Math.max(...xx),n:Math.max(...yy)}))
 .then(v=>v.json()).then(d=>{if(importId||!Array.isArray(d.cells))return;griglia=d.cells;
 get('solar-input-status').textContent=d.cells.length?'Griglia locale GeoLibre trovata automaticamente.':'Nessuna griglia locale disponibile per questo tetto.';aggiornaPrevisione();}).catch(()=>{});
}

get('solar-grid').addEventListener('change', async e=>{
 const id=++importId, f=e.target.files[0];griglia=null;get('solar-input-status').textContent='';aggiornaPrevisione();if(!f)return;
 try{
  const d=JSON.parse(await f.text());
  if(id!==importId)return;
  if(d.date!=='12-21'||d.unit!=='kWh/m²/giorno'||!Array.isArray(d.cells)||!d.cells.length||!d.cells.every(c=>Array.isArray(c)&&c.length===3&&c.every(Number.isFinite)&&Math.abs(c[0])<=180&&Math.abs(c[1])<=90&&c[2]>=0))throw Error();
  griglia=d.cells;get('solar-input-status').textContent='Griglia caricata: '+fmt(griglia.length,0)+' celle.';
 }catch{if(id!==importId)return;get('solar-input-status').textContent='File non valido: usa il JSON creato dal raster del 21 dicembre.';}
 aggiornaPrevisione();
});

document.addEventListener('zona:aggiornata',aggiornaPrevisione);
aggiornaPrevisione();

const tilt=Number(by('tilt').value),aspect=Number(by('aspect').value),dir=by('aspect').selectedOptions[0].text;
get('analyse').onclick=async()=>{if(!closed)return get('pvstate').textContent='Prima disegna e chiudi una zona.';if(location.protocol==='file:')return get('pvstate').textContent='Per la stima online apri Avvia_Laboratorio.cmd dalla cartella estratta.';const btn=get('analyse');btn.disabled=true;get('pvstate').textContent='Calcolo PVGIS in corso…';try{const [lon,lat]=geo([300,190]);const res=await fetch('/api/resa?'+new URLSearchParams({lat,lon,angle:tilt,aspect}));if(!res.ok)throw Error();const d=await res.json();if(!Number.isFinite(d.yield)||d.yield<0)throw Error();annualSite=d.solarAnnual;get('yield').value=d.yield;aggiornaPrevisione();get('pvstate').textContent='PVGIS · '+by('kind').value+' · '+dir+' a '+tilt+'° · perdite 14%. Ombre locali non valutate.';}catch{get('pvstate').textContent='PVGIS non disponibile. La posa resta visibile; puoi riprovare.';}finally{btn.disabled=false;}};
get('yield').oninput=aggiornaPrevisione;
const sunBox=document.createElement('section');sunBox.className='card compare';panel.after(sunBox);
sunBox.innerHTML='<details><summary>Dati avanzati · Esposizione GeoLibre</summary><h2>Tempo al sole · GeoLibre</h2><p>Importa le celle del tuo raster Time In Daylight come JSON: {"cells":[[longitudine, latitudine, frazione]]}, con frazioni da 0 a 1. Il periodo è quello del raster importato.</p><input type="file" id="dayfile" accept=".json"><p id="daystatus" role="status"></p></details>';
let periodOpt='periodo del raster importato',daylight=[];const sunLayer=document.createElementNS(ns,'g');svg.insertBefore(sunLayer,overlay);sunLayer.style.pointerEvents='none';
function reportSun(){if(get("opt-reset"))resetOpt();get('daystatus').textContent=daylight.length+' celle sulla copertura.';if(closed){const a=daylight.filter(c=>contiene(c,vertices));get('daystatus').textContent+=a.length?' Zona: '+fmt(100*a.reduce((s,c)=>s+c[2],0)/a.length)+'% del tempo diurno al sole ('+a.length+' celle).':' Nessuna cella nella zona.';}}
get('dayfile').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());if(!Array.isArray(d.cells)||!d.cells.length||!d.cells.every(c=>Array.isArray(c)&&c.length===3&&c.every(Number.isFinite)&&Math.abs(c[0])<=180&&Math.abs(c[1])<=90&&c[2]>=0&&c[2]<=1))throw Error();periodOpt='periodo del raster importato';daylight=d.cells.map(c=>[...xy(c),c[2]]).filter(c=>contiene(c,roofRings[0])&&!roofRings.slice(1).some(r=>contiene(c,r)));sunLayer.replaceChildren();const groups=[[],[],[]];for(const [x,y,v] of daylight)groups[v<.8?0:v<.95?1:2].push('M'+x+' '+y+'h.01');groups.forEach((g,i)=>{const p=document.createElementNS(ns,'path');p.setAttribute('d',g.join(' '));p.setAttribute('stroke',['#503678','#28867d','#e3c535'][i]);p.setAttribute('stroke-width',1/mPerPx);p.setAttribute('stroke-linecap','round');sunLayer.append(p);});reportSun();}catch{daylight=[];sunLayer.replaceChildren();get('daystatus').textContent='File non valido: usa il formato indicato.';}};
document.addEventListener('zona:aggiornata',()=>{if(daylight.length)reportSun();});


const sim=document.createElement('section');sim.className='card compare';section.before(sim);
sim.innerHTML='<h2>Mappa di esposizione del tetto</h2><p>Usa i dati GeoLibre disponibili oppure simula la luce diretta del 21 dicembre su un tetto piano. Indica i volumi come cilindri: scegli raggio e altezza sopra la copertura, poi clicca sul loro centro.</p><label>Raggio (m) <input id="radius" type="number" value="1" min=".1" max="50" step=".1"></label> <label>Altezza (m) <input id="height-ob" type="number" value="3" min=".1" max="100" step=".1"></label> <button id="add-ob">Posiziona ostacolo</button> <button id="rm-ob">Annulla ultimo</button> <button id="calc-sun">Calcola esposizione</button><p id="sim-msg" role="status"></p><small>🟣 Meno dell’80% · 🟢 80–95% escluso · 🟡 Dal 95% del tempo diurno al sole. Le celle senza dati non sono colorate.</small>';
const obs=[],marks=el('g',{'pointer-events':'none'});let placing=false,version=0;
const lo=Math.min(...roofRings[0].map(p=>p[0])),bot=Math.max(...roofRings[0].map(p=>p[1]));
const toMet=p=>[(p[0]-lo)*mPerPx,(bot-p[1])*mPerPx];
function wipe(){version++;sunLayer.replaceChildren();daylight=[];reportSun();get('sim-msg').textContent='Ostacoli: '+obs.length+'. Premi Calcola esposizione.';}
get('add-ob').onclick=()=>{if(drawing)return get('sim-msg').textContent='Chiudi prima la zona di posa.';placing=true;get('sim-msg').textContent='Clicca sul centro del camino o del volume.';};
svg.addEventListener('click',e=>{if(!placing)return;e.stopImmediatePropagation();placing=false;const pt=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse()),r=get('radius').valueAsNumber,h=get('height-ob').valueAsNumber;if(!(r>0&&r<=50&&h>0&&h<=100&&obs.length<12))return get('sim-msg').textContent='Verifica le dimensioni; massimo 12 ostacoli.';obs.push([...toMet([pt.x,pt.y]),r,h]);const c=document.createElementNS(ns,'circle');for(const [k,v] of Object.entries({cx:pt.x,cy:pt.y,r:r/mPerPx,fill:'#67392c'}))c.setAttribute(k,v);marks.append(c);wipe();},true);
get('rm-ob').onclick=()=>{placing=false;obs.pop();marks.lastChild?.remove();wipe();};
get('calc-sun').onclick=async()=>{const token=++version;placing=false;const note=get('sim-msg');note.textContent='Calcolo in corso…';try{const pts=r.geometry.coordinates[0],xx=pts.map(p=>p[0]),yy=pts.map(p=>p[1]);let data=[],size=1,source='';
if(!obs.length){const res=await fetch('/api/sole?'+new URLSearchParams({w:Math.min(...xx),e:Math.max(...xx),s:Math.min(...yy),n:Math.max(...yy)}));if(!res.ok)throw Error();data=(await res.json()).cells.map(c=>[...xy(c),c[2]]).filter(c=>contiene(c,roofRings[0]));source='GeoLibre · Time In Daylight di dicembre, sole celle disponibili.';}
if(!data.length){const res=await fetch('/api/ombre',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lat:latitude,w:(Math.max(...roofRings[0].map(p=>p[0]))-lo)*mPerPx,h:(bot-Math.min(...roofRings[0].map(p=>p[1])))*mPerPx,obs})});if(!res.ok)throw Error();const d=await res.json();size=d.step;data=d.cells.map(([x,y,v])=>[lo+x/mPerPx,bot-y/mPerPx,v]);source=d.polar?'Nessun intervallo di luce nel giorno simulato.':obs.length?'Simulazione geometrica · 21 dicembre, intervalli di 10 minuti.':'Tetto piano senza ostacoli modellati: esposizione uniforme per ipotesi.';}
if(token!==version)return;periodOpt=source.startsWith('GeoLibre')?'dicembre (raster GeoLibre)':'21 dicembre (simulazione)';daylight=data.filter(c=>contiene(c,roofRings[0])&&!roofRings.slice(1).some(h=>contiene(c,h)));sunLayer.replaceChildren();const paths=[[],[],[]],s=size/mPerPx;for(const [x,y,v] of daylight)paths[v<.8?0:v<.95?1:2].push('M'+(x-s/2)+' '+(y-s/2)+'h'+s+'v'+s+'h-'+s+'Z');paths.forEach((d,i)=>{const p=document.createElementNS(ns,'path');p.setAttribute('d',d.join(' '));p.setAttribute('fill',['#503678','#28867d','#e3c535'][i]);sunLayer.append(p);});note.textContent=source;reportSun();}catch{if(token===version)note.textContent='Calcolo non disponibile: avvia Avvia_Laboratorio.cmd e riprova.';}};
sim.append(get('daystatus'));
const box=document.createElement('section');box.className='card compare';sim.after(box);
box.innerHTML='<h2>Consigliami un impianto</h2><p>Usa tutto il tetto oppure chiudi una zona per limitare la ricerca. Il consiglio automatico seleziona moduli con almeno il 95% di tempo medio al sole nel periodo della mappa.</p><label>Modalità <select id="opt-mode"><option value="auto">Consigliami tu</option><option value="manual">Scelgo io il numero</option></select></label> <label id="opt-number" hidden>Numero di pannelli <input id="target-mod" type="number" min="1" step="1" value="5"></label> <button id="opt-go">Mostra proposta</button> <button id="opt-reset" hidden>Chiudi anteprima</button><p role="status" id="opt-status"></p><small>Verde: pannelli proposti · Contorno grigio: posti aggiuntivi nella stessa griglia. La stima PVGIS resta separata.</small>';
const optLayer=el('g',{'pointer-events':'none'}), statusOpt=get('opt-status');
function resetOpt(){optLayer.replaceChildren();modLayer.style.display='';statusOpt.textContent='';get('opt-reset').hidden=true;}
get('opt-reset').onclick=resetOpt;get('target-mod').oninput=resetOpt;
document.addEventListener('zona:aggiornata',resetOpt);
for(const id of ['calc-sun','add-ob','rm-ob','dayfile'])get(id).addEventListener(id==='dayfile'?'change':'click',resetOpt,true);
get('opt-mode').onchange=()=>{resetOpt();get('opt-number').hidden=get('opt-mode').value==='auto';};
get('opt-go').onclick=()=>{
 resetOpt();const n=get('target-mod').valueAsNumber;
 const auto=get('opt-mode').value==='auto';if(drawing||!daylight.length){statusOpt.textContent='Completa il disegno in corso e calcola o importa la mappa di esposizione.';return;}
 if(!auto&&(!Number.isSafeInteger(n)||n<1)){statusOpt.textContent='Inserisci un numero intero positivo.';return;}
 const bins=new Map(),unit=2/mPerPx,key=(i,j)=>i+','+j;
 for(const c of daylight){const k=key(Math.floor(c[0]/unit),Math.floor(c[1]/unit));if(!bins.has(k))bins.set(k,[]);bins.get(k).push(c);}
 function candidates(f,g){const result=[];for(const p of posa(closed?vertices:roofRings[0],f,g)){const {x,y,w,h}=p;
 if(obs.some(([ox,oy,r])=>{const a=lo+ox/mPerPx,b=bot-oy/mPerPx;return Math.hypot(Math.max(x-a,0,a-x-w),Math.max(y-b,0,b-y-h))<=r/mPerPx;}))continue;
 let sum=0,count=0;for(let i=Math.floor(x/unit);i<=Math.floor((x+w)/unit);i++)for(let j=Math.floor(y/unit);j<=Math.floor((y+h)/unit);j++)for(const [a,b,v] of bins.get(key(i,j))||[])if(a>=x&&a<=x+w&&b>=y&&b<=y+h){sum+=v;count++;}
 if(count)result.push({...p,score:sum/count});}return result;}
 let best=[],poolBest=[],sumBest=-1;
 for(const f of [0,.25,.5,.75])for(const g of [0,.25,.5,.75]){
 const pool=candidates(f,g).sort((a,b)=>b.score-a.score);
 const chosen=auto?pool.filter(p=>p.score>=.95-1e-10):pool.slice(0,n);
 const sum=chosen.reduce((v,p)=>v+p.score,0);
 if(chosen.length>best.length||chosen.length===best.length&&(sum>sumBest+1e-9||Math.abs(sum-sumBest)<1e-9&&pool.length>poolBest.length)){best=chosen;poolBest=pool;sumBest=sum;}}
 modLayer.style.display='none';get('opt-reset').hidden=false;
 for(const [i,{x,y,w,h}] of poolBest.entries()){const e=document.createElementNS(ns,'rect');for(const [k,v] of Object.entries({x,y,width:w,height:h,fill:i<best.length?'#52bf8acc':'none',stroke:i<best.length?'#087348':'#737777','stroke-width':.065/mPerPx}))e.setAttribute(k,v);optLayer.append(e);}
 statusOpt.textContent=(auto?best.length+' consigliati alla soglia del 95%':best.length+' proposti su '+n+' richiesti')+' · '+poolBest.length+' posti con dati nella griglia scelta. '+(best.length?'Tempo medio al sole dei moduli: '+fmt(100*sumBest/best.length)+'%. ':'')+(auto?'':best.length<n?'Non è stato possibile collocare tutti i moduli nelle griglie provate. ':'')+'Periodo: '+periodOpt+'. Anteprima sulla mappa.';

};

let zoom=1,center=[300,190];function view(f){zoom=Math.min(10,Math.max(1,zoom*f));svg.setAttribute('viewBox',[center[0]-300/zoom,center[1]-190/zoom,600/zoom,380/zoom].join(' '));}
svg.onwheel=e=>{e.preventDefault();const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());center=[p.x,p.y];view(e.deltaY<0?1.2:1/1.2);};get('plus').onclick=()=>view(1.5);get('minus').onclick=()=>view(1/1.5);get('reset').onclick=()=>{center=[300,190];zoom=1;view(1);};
const [lngAB,latAB]=geo([300,190]);
confronto({after:panel,name:r.name,aspect,tilt,site:{lat:latAB,lon:lngAB},snapshot:()=>{if(!closed)return null;const n=posa(vertices).length;if(!n)return null;
const cells=daylight.filter(p=>contiene(p,vertices));const plan=get('fc-preview').cloneNode(true);plan.removeAttribute('id');return {n,kw:n*.45,plan,sun:cells.length?100*cells.reduce((a,c)=>a+c[2],0)/cells.length:null};}});

const toolsMenu=document.createElement('nav');toolsMenu.className='tool-menu';toolsMenu.setAttribute('aria-label','Funzioni del tetto');
const grid=get('work').querySelector('.grid');grid.before(toolsMenu);
const groups=[['Disegna zona',[section]],['Esposizione',[sim,sunBox]],['Consigliami un impianto',[box]],['Previsione',[panel]],['Confronto A/B',[get('ab-report')]]];
function openTool(i){groups.forEach(([,els],j)=>{els.forEach(e=>e.hidden=j!==i);toolsMenu.children[j].setAttribute('aria-pressed',String(i===j));});if(i!==1)placing=false;}
groups.forEach(([name],i)=>{const b=document.createElement('button');b.type='button';b.textContent=name;b.onclick=()=>openTool(i);toolsMenu.append(b);});
openTool(0);
}
