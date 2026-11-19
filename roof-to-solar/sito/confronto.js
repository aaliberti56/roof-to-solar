// Le rese PVGIS sono per 1 kWp. Ogni ramo pesa per i kWp effettivamente assegnati.
function sommaRami(rami){
 const valid=rami.every(r=>Array.isArray(r.data.months)&&r.data.months.length===12&&r.data.months.every(Number.isFinite));
 return {anno:rami.reduce((s,r)=>s+r.kw*r.data.yield,0),mesi:valid?Array.from({length:12},(_,i)=>rami.reduce((s,r)=>s+r.kw*r.data.months[i],0)):null};
}
function confronto(ctx){
 const box=document.createElement('section');box.className='card compare';box.id='ab-report';ctx.after.after(box);
 box.innerHTML='<h2>Confronta due soluzioni</h2><p class="ab-ui">Chiudi la zona, scegli lo scenario e salva A. Per B mantieni la zona e cambia orientamento, oppure cancella il disegno e traccia una seconda zona.</p><div class="ab-ui"><label>Scenario <select id="ab-mode"><option value="orig">Orientamento iniziale</option><option value="0">Sud</option><option value="ew">Est–ovest</option><option value="-90">Est</option><option value="90">Ovest</option></select></label> <button id="ab-a">Salva come A</button> <button id="ab-b">Salva come B</button> <button id="ab-print" disabled>Stampa / salva PDF</button><p role="status" id="ab-msg"></p></div><div id="ab-output"></div>';
 const $=s=>box.querySelector(s),slots={},fmt=(n,k=0)=>n.toLocaleString('it-IT',{maximumFractionDigits:k});
 const sourceNote='PVGIS: perdite 14%, senza correzione per le ombre locali. La ripartizione per orientamento è uno scenario energetico: lo schema di ingombro in pianta resta fisso.';
 function render(){
 const out=$('#ab-output');out.replaceChildren();const name=document.createElement('p');name.textContent=ctx.name;out.append(name);
 const cards=document.createElement('div');cards.className='ab-cards';out.append(cards);
 for(const k of ['A','B']){const s=slots[k],c=document.createElement('article');cards.append(c);if(!s){c.textContent='Soluzione '+k+' da salvare';continue;}
 c.innerHTML='<h3>Soluzione '+k+' · '+s.desc+'</h3><p>'+s.n+' moduli · '+fmt(s.kw,2)+' kWp · '+s.tilt+'°</p><strong>'+(s.energy?fmt(s.energy.anno)+' kWh/anno':'Produzione non disponibile')+'</strong><p>Tempo diurno al sole: '+(s.sun==null?'non calcolato':fmt(s.sun,1)+'%')+'</p>';c.prepend(s.plan.cloneNode(true));}
 const a=slots.A,b=slots.B;if(a&&b){
 const p=document.createElement('p');out.append(p);
 if(a.energy&&b.energy){const delta=b.energy.anno-a.energy.anno;p.textContent=(Math.abs(delta)<.5?'Produzione annua equivalente.':('La soluzione '+(delta>0?'B':'A')+' produce circa '+fmt(Math.abs(delta))+' kWh/anno in più.'))+' '+(a.kw!==b.kw?(a.desc===b.desc?'A parità di orientamento, cambia il numero di moduli.':'Cambiano sia la potenza sia lo scenario di orientamento.'):a.desc!==b.desc?'La potenza è uguale: il confronto isola lo scenario di orientamento.':'Potenza e orientamento coincidono: PVGIS non distingue le ombre tra queste zone.');}
 if(a.energy?.mesi&&b.energy?.mesi){const chart=document.createElement('div');chart.innerHTML='<h3>Produzione mensile · kWh</h3><p>Verde: A · Blu: B</p>';const max=Math.max(1,...a.energy.mesi,...b.energy.mesi);
 ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'].forEach((m,i)=>{const row=document.createElement('div');row.className='ab-row';row.innerHTML='<b>'+m+'</b><div>'+[a,b].map((s,j)=>'<i style="width:'+s.energy.mesi[i]/max*100+'%;background:'+(j?'#417996':'#187056')+'"></i>').join('')+'</div><span>A '+fmt(a.energy.mesi[i])+' · B '+fmt(b.energy.mesi[i])+'</span>';chart.append(row);});out.append(chart);}
 else p.append(' Grafico mensile non disponibile senza 12 valori PVGIS per entrambe le soluzioni.');
 }
 const foot=document.createElement('small');foot.textContent=sourceNote;out.append(foot);$('#ab-print').disabled=!(a&&b);}
 async function save(k){const s=ctx.snapshot();if(!s){$('#ab-msg').textContent='Disegna e chiudi una zona con almeno un modulo.';return;}const mode=$('#ab-mode').value;const counts=mode==='ew'?[[Math.ceil(s.n/2),-90],[Math.floor(s.n/2),90]]:[[s.n,mode==='orig'?ctx.aspect:Number(mode)]];
 s.desc=mode==='ew'?counts[0][0]+' est + '+counts[1][0]+' ovest':({'0':'Sud','-90':'Est','90':'Ovest','180':'Nord'})[counts[0][1]];
 s.tilt=ctx.tilt;$('#ab-msg').textContent='Recupero dei valori PVGIS…';$('#ab-a').disabled=$('#ab-b').disabled=true;
 try{s.energy=sommaRami(await Promise.all(counts.filter(([n])=>n).map(async([n,aspect])=>{const res=await fetch('/api/resa?'+new URLSearchParams({...ctx.site,angle:s.tilt,aspect}));if(!res.ok)throw Error();const data=await res.json();if(!Number.isFinite(data.yield))throw Error();return {kw:n*.45,data};})));}catch{s.energy=null;}
 slots[k]=s;render();$('#ab-a').disabled=$('#ab-b').disabled=false;$('#ab-msg').textContent='Soluzione '+k+' salvata per questa sessione.'+(s.energy?'':' PVGIS non disponibile: premi di nuovo il pulsante per riprovare.');}
 $('#ab-a').onclick=()=>save('A');$('#ab-b').onclick=()=>save('B');$('#ab-print').onclick=()=>window.print();render();
}
