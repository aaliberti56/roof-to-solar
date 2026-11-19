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
const key='solare-f-design-v1';
try {const v=JSON.parse(localStorage.getItem(key));if(Array.isArray(v)&&v.length>=3&&v.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite))){vertices=v;closed=true;}} catch {}
const lonFactor=Math.cos(40.775*Math.PI/180), mPerPx=6371008.8*Math.PI/180/scale;
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
