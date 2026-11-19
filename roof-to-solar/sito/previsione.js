// Stima elettrica di riferimento: resa specifica PVGIS dello scenario Sud dello studio.
const resaSud = 7245.66 / 5.4;
const panel = document.createElement('section');
panel.className='card compare forecast';
panel.innerHTML=`<div class="fc-head"><small>GEOLIBRE · SIMULAZIONE DI POSA</small><h2>Previsione per la zona disegnata</h2><span>Edificio F · Campus di Fisciano</span></div>
<div class="fc-body"><div id="solar-results" aria-live="polite"></div><details><summary>Dati e ipotesi di calcolo</summary><p>Posa indicativa verso sud a 15°: moduli da 450 Wp, ingombro ipotizzato in pianta di 1,13 × 1,72 m, distanza laterale 0,10 m e tra le file 0,60 m. Il disegno considera il perimetro del tetto; ostacoli, corridoi e distanze di sicurezza richiedono una verifica separata.</p><label>Sostituisci la griglia del 21 dicembre <input id="solar-grid" type="file" accept=".json,application/json"></label><p id="solar-input-status" role="status"></p></details></div>`;
section.after(panel);
let griglia = grigliaDicembre.cells; get('solar-input-status').textContent='Griglia del 21 dicembre già caricata.';
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
function posa(v){
 const w=1.13/mPerPx,h=1.72/mPerPx,stepX=w+.10/mPerPx,stepY=h+.60/mPerPx;
 const roof=roofRings[0], lim=(r,k,fn)=>fn(...r.map(p=>p[k]));
 const left=Math.max(lim(v,0,Math.min),lim(roof,0,Math.min)),top=Math.max(lim(v,1,Math.min),lim(roof,1,Math.min));
 const right=Math.min(lim(v,0,Math.max),lim(roof,0,Math.max)),bottom=Math.min(lim(v,1,Math.max),lim(roof,1,Math.max));
 const arr=[];
 for(let y=top+.001;y+h<bottom;y+=stepY)for(let x=left+.001;x+w<right;x+=stepX){
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
 const cells=(griglia||[]).filter(c=>contiene(xy(c),vertices)),media=cells.length?fmt(cells.reduce((s,c)=>s+c[2],0)/cells.length):'—';
 const metric=(title,n,unit)=>'<div class="fc-metric"><small>'+title+'</small><strong>'+n+'</strong><span>'+unit+'</span></div>';
 out.innerHTML='<div class="fc-grid"><div class="fc-plan"><small>PLANIMETRIA · N ↑</small><svg id="fc-preview" aria-label="Schema della disposizione proposta"></svg><span>■ Moduli fotovoltaici</span></div><div class="fc-metrics">'+metric('Moduli in pianta',fmt(mods.length,0),'da 450 Wp')+metric('Potenza installata',fmt(kw),'kWp')+metric('Irradiazione media',media,'kWh/m² · 21 dicembre')+metric('Riferimento PVGIS',fmt(kw*resaSud,0),'kWh/anno · sud, 15°')+'</div></div><p class="fc-note">'+(mods.length?'I pannelli blu sono visibili anche sulla mappa del tetto.':'Nessun modulo intero entra nella porzione di tetto selezionata con questa disposizione.')+' Il riferimento annuo usa la potenza dei moduli disegnati e non corregge le ombre locali.</p>';
 const prev=get('fc-preview'),xs=vertices.map(p=>p[0]),ys=vertices.map(p=>p[1]),w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys),pad=Math.max(w,h)*.08;
 prev.setAttribute('viewBox',[Math.min(...xs)-pad,Math.min(...ys)-pad,w+2*pad,h+2*pad].join(' '));const poly=document.createElementNS(ns,'polygon');poly.setAttribute('points',vertices.map(p=>p.join(',')).join(' '));poly.setAttribute('fill','#d7e4d5');prev.append(poly,modLayer.cloneNode(true));
}
let importId=0;
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
