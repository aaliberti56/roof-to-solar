(()=>{
const id=s=>document.getElementById(s),msg=t=>id('loc-msg').textContent=t;
if(location.protocol==='file:'){
 id('finder').hidden=true; id('search-form').hidden=true;
 id('trace').disabled=true;id('finish').disabled=true;
 msg('Hai aperto una copia offline. Per cercare un edificio sulla mappa, apri Avvia_Laboratorio.cmd nella cartella estratta e usa la finestra che si apre. Qui puoi provare un tetto di esempio o importare un GeoJSON.');
 return;
}
if(!window.L){msg('Mappa online non disponibile. Puoi ancora usare il tetto di esempio o importare una copertura.');return;}
const map=L.map('finder',{scrollWheelZoom:false}).setView([40.775,14.789],17);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxNativeZoom:19,maxZoom:20,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' }).addTo(map);
let poly=null,manual=false,pts=[],seq=0;
function clear(){seq++;if(poly)map.removeLayer(poly);poly=null;pts=[];id('chooser').hidden=true;}
function show(p){if(poly)map.removeLayer(poly);poly=L.polygon(p.map(([x,y])=>[y,x]),{color:'#007364'}).addTo(map);}
function ready(p){prepare({type:'Polygon',coordinates:[[...p,p[0]]]});show(p);msg('Verifica il contorno evidenziato, poi conferma la copertura.');}
async function find(lat,lon){clear();manual=false;const n=seq;map.setView([lat,lon],19);msg('Cerco i contorni degli edifici vicini…');
try{const query='[out:json][timeout:12];way["building"](around:35,'+lat+','+lon+');out geom;';const resp=await fetch('https://overpass-api.de/api/interpreter?data='+encodeURIComponent(query),{signal:AbortSignal.timeout(18000)});if(!resp.ok)throw Error();const d=await resp.json();if(n!==seq)return;
const fs=d.elements.filter(f=>f.geometry?.length>=4).map(f=>({type:'Feature',properties:{name:f.tags?.name||'Edificio OSM'},geometry:{type:'Polygon',coordinates:[f.geometry.map(p=>[p.lon,p.lat])]}})).sort((a,b)=>dist(a)-dist(b));function dist(f){return Math.min(...f.geometry.coordinates[0].map(([x,y])=>map.distance([lat,lon],[y,x])));}
prepare({type:'FeatureCollection',features:fs});id('roof').onchange=()=>show(roofs[+id('roof').value].geometry.coordinates[0]);id('roof').onchange();msg('Verifica la sagoma: se necessario scegli un altro edificio o traccia il tetto.');}catch{if(n===seq)msg('Sagoma non disponibile. Premi «Traccia il tetto» e indica i suoi angoli sulla mappa.');}}
map.on('click',e=>{if(manual){pts.push([e.latlng.lng,e.latlng.lat]);show(pts);msg(pts.length+' vertici inseriti.');}else find(e.latlng.lat,e.latlng.lng);});
id('trace').onclick=()=>{clear();manual=true;msg('Clicca in ordine lungo il perimetro, poi premi «Termina contorno».');};id('finish').onclick=()=>{if(!manual||pts.length<3)return msg('Servono almeno tre vertici.');try{ready(pts);manual=false;}catch(e){msg(e.message);}};
id('search-form').onsubmit=async e=>{e.preventDefault();clear();const n=seq;msg('Ricerca indirizzo…');const select=id('matches');select.hidden=true;try{const u='https://photon.komoot.io/api/?limit=5&q='+encodeURIComponent(id('address').value);const resp=await fetch(u,{signal:AbortSignal.timeout(12000)});const d=await resp.json();if(n!==seq)return;if(!d.features.length)throw Error();select.replaceChildren(new Option('Scegli l’indirizzo trovato',''),...d.features.map((f,i)=>new Option([f.properties.name,f.properties.housenumber,f.properties.city,f.properties.country].filter(Boolean).join(', '),i)));select.hidden=false;select.onchange=()=>{if(select.value==='')return;const [x,y]=d.features[+select.value].geometry.coordinates;find(y,x);};msg('Seleziona il risultato corretto.');}catch{if(n===seq)msg('Ricerca non disponibile. Puoi scegliere il punto direttamente sulla mappa.');}};
})();
