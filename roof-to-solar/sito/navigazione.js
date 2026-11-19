// Vista in coordinate della planimetria: tutti i layer seguono lo stesso viewBox.
(()=>{
const node=(tag,a)=>{const e=document.createElementNS(ns,tag);for(const k in a)e.setAttribute(k,a[k]);return e;};
svg.querySelectorAll('path[stroke="#dce5d9"]').forEach(e=>e.remove());
const bg=node('g',{'pointer-events':'none'});svg.prepend(bg);
function box(w,n,e,s){const [x,y]=xy([w,n]),[r,b]=xy([e,s]);return {x,y,width:r-x,height:b-y,preserveAspectRatio:'none'};}
bg.append(node('image',{href:'terreno.png',...box(14.781,40.780,14.797,40.770)}));
const tiles=node('g',{});bg.append(tiles);
const toolbar=document.querySelector('#nav-map'), status=document.querySelector('#map-state');
let cx=300,cy=190,z=1,drag=null,moved=false,street=false,last='';
const lim=(v,a,b)=>Math.max(a,Math.min(b,v));
const lon=(x,n)=>x/n*360-180,lat=(y,n)=>Math.atan(Math.sinh(Math.PI*(1-2*y/n)))*180/Math.PI;
function refresh(){
 svg.setAttribute('viewBox',[cx-300/z,cy-190/z,600/z,380/z].join(' '));
 document.querySelector('#zoom-val').textContent=Number(z.toFixed(1)).toLocaleString('it-IT')+'×';
 if(!street)return;
 const level=lim(17+Math.round(Math.log2(z)),15,19),n=2**level;
 const tile=(p)=>{const [a,b]=geo(p);return [Math.floor((a+180)/360*n),Math.floor((1-Math.asinh(Math.tan(b*Math.PI/180))/Math.PI)/2*n)];};
 const [l,t]=tile([cx-400/z,cy-240/z]),[r,b]=tile([cx+400/z,cy+240/z]);const k=[level,l,t,r,b].join();if(k===last)return;last=k;tiles.replaceChildren();
 for(let i=l;i<=r;i++)for(let j=t;j<=b;j++){const im=node('image',{...box(lon(i,n),lat(j,n),lon(i+1,n),lat(j+1,n))});im.addEventListener('error',()=>{if(street&&im.isConnected)status.textContent='Cartografia online non disponibile · resta visibile il terreno locale.';});im.setAttribute('href','https://tile.openstreetmap.org/'+level+'/'+i+'/'+j+'.png');tiles.append(im);}
}
function zoom(f,p=[cx,cy]){const next=lim(z*f,.5,12);cx=p[0]+(cx-p[0])*z/next;cy=p[1]+(cy-p[1])*z/next;z=next;refresh();}
function point(e){const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());return [p.x,p.y];}
toolbar.onclick=e=>{const a=e.target.closest('button')?.dataset.action;if(a==='in')zoom(1.5);if(a==='out')zoom(1/1.5);if(a==='home'){cx=300;cy=190;z=1;refresh();}};
document.querySelector('#base-map').onchange=e=>{street=e.target.value==='street';if(street&&location.protocol==='file:'){street=false;e.target.value='terrain';tiles.replaceChildren();last='';status.textContent='Per lo stradario avvia Avvia_Laboratorio.cmd e apri index.html dallo stesso indirizzo locale. Il terreno resta disponibile offline.';refresh();return;}tiles.replaceChildren();last='';status.textContent=street?'Stradario online · © OpenStreetMap contributors':'Terreno locale · Regione Campania, CTR 2020 (5 m)';refresh();};
svg.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1.2:1/1.2,point(e));},{passive:false});
svg.addEventListener('pointerdown',e=>{if(drawing||e.button!==0)return;moved=false;drag=[e.pointerId,e.clientX,e.clientY,cx,cy];});
svg.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag[0])return;const dx=e.clientX-drag[1],dy=e.clientY-drag[2];if(!moved&&Math.hypot(dx,dy)<4)return;moved=true;svg.setPointerCapture(e.pointerId);const s=svg.getScreenCTM().a;cx=drag[3]-dx/s;cy=drag[4]-dy/s;refresh();});
window.addEventListener('pointerup',()=>{drag=null;});window.addEventListener('pointercancel',()=>{drag=null;moved=false;});
svg.addEventListener('click',e=>{if(moved){e.stopImmediatePropagation();moved=false;}},true);refresh();
})();
