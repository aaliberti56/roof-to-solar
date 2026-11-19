const features=d=>d.type==='FeatureCollection'?d.features:[d];
const polys=g=>g.type==='Polygon'?[g.coordinates]:g.coordinates;
const all=DATA.flatMap(features);
const pts=all.flatMap(f=>polys(f.geometry).flat(2));
const xs=pts.map(p=>p[0]*Math.cos(40.775*Math.PI/180)),ys=pts.map(p=>p[1]);
const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
const scale=Math.min(490/(maxX-minX),310/(maxY-minY));
const xy=([x,y])=>[300+(x*Math.cos(40.775*Math.PI/180)-(minX+maxX)/2)*scale,190+((minY+maxY)/2-y)*scale];
const svg=document.querySelector('#map'), ns='http://www.w3.org/2000/svg';
function el(tag,attrs){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);svg.append(e);return e;}
for(let i=20;i<600;i+=20)el('path',{d:'M'+i+' 0V380',stroke:'#dce5d9'});
for(let i=20;i<380;i+=20)el('path',{d:'M0 '+i+'H600',stroke:'#dce5d9'});
for(const f of all){const z=f.properties?.zona;const e=el('path',{d:polys(f.geometry).flatMap(p=>p.map(r=>'M'+r.map(xy).map(q=>q.join(',')).join('L')+'Z')).join(' '),'fill-rule':'evenodd',fill:'#b3c5b5',stroke:'#648477','stroke-width':2});if(z){e.dataset.zone=z;e.setAttribute('tabindex','0');e.setAttribute('role','button');e.setAttribute('aria-label','Seleziona zona '+z);e.onclick=()=>pick(z);e.onkeydown=event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();pick(z);}};const a=f.geometry.coordinates[0].slice(0,-1).map(xy);const x=a.reduce((s,p)=>s+p[0],0)/a.length,y=a.reduce((s,p)=>s+p[1],0)/a.length;el('path',{d:'M'+x+' '+y+'h27',stroke:'#374e40','pointer-events':'none'});el('text',{x:x+32,y:y+6,fill:'#18352e','font-weight':800,'pointer-events':'none'}).textContent=z;}}
const stats={A:['Più lontana dai volumi tecnici.','2,37','603,78'],B:['Vicina a un volume tecnico che proietta ombra sul tetto.','0,87','535,98']};
function pick(z){const [d,i,p]=stats[z];document.querySelector('#desc').textContent=d;document.querySelector('#irr').textContent=i+' kWh/m²';document.querySelector('#prod').textContent=p+' kWh/anno';document.querySelectorAll('[data-pick],[data-zone]').forEach(e=>{const on=(e.dataset.pick||e.dataset.zone)===z;e.setAttribute('aria-pressed',on);if(e.dataset.zone)e.setAttribute('fill',on?'#187553':'#b96635');});}
document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>pick(b.dataset.pick));pick('A');
