// Celle del raster Time In Daylight, limitate alla copertura.
const soleXY=celleSole.map(([x,y,v])=>[...xy([x,y]),v]);
const palette=['#482475','#33638d','#20938c','#9aca45','#f6df39'];
const layer=document.createElementNS(ns,'g');
svg.insertBefore(layer,svg.querySelector('[data-zone]'));
layer.style.pointerEvents='none';
const paths=palette.map(()=>[]), lato=1/mPerPx;
for(const [x,y,v] of soleXY){const k=v<.8?0:v<.9?1:v<.95?2:v<.99?3:4;paths[k].push('M'+(x-lato/2)+' '+(y-lato/2)+'h'+lato+'v'+lato+'h-'+lato+'Z');}
paths.forEach((p,i)=>{const n=document.createElementNS(ns,'path');n.setAttribute('d',p.join(''));n.setAttribute('fill',palette[i]);layer.append(n);});
const legend=document.createElement('p');legend.innerHTML='<strong>GeoLibre · Time In Daylight di dicembre</strong><br>'+['<80%','80–<90%','90–<95%','95–<99%','≥99%'].map((x,i)=>'<span style="display:inline-block;margin-right:8px"><b style="color:'+palette[i]+'">■</b> '+x+'</span>').join('');
svg.after(legend);
function mediaSole(poly){const v=soleXY.filter(p=>contiene(p,poly));return v.length?(100*v.reduce((a,p)=>a+p[2],0)/v.length).toLocaleString('it-IT',{maximumFractionDigits:2})+'% del tempo diurno al sole · media su '+v.length+' celle':'Nessuna cella di copertura nella zona';}
const info=document.createElement('p');get('desc').before(info);
function mostraAB(){const z=document.querySelector('[data-pick][aria-pressed="true"]').dataset.pick;const f=features(DATA[1]).find(f=>f.properties.zona===z);info.textContent='GeoLibre · Zona '+z+': '+mediaSole(f.geometry.coordinates[0].map(xy));}
document.addEventListener('click',mostraAB);document.addEventListener('keyup',mostraAB);mostraAB();
const custom=document.createElement('p');get('draw-status').after(custom);function aggiornaSole(){custom.textContent=closed?'GeoLibre · Zona disegnata: '+mediaSole(vertices):'';}
document.addEventListener('zona:aggiornata',aggiornaSole);aggiornaSole();
