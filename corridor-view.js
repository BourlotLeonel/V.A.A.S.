'use strict';
const $=id=>document.getElementById(id);
const number=(x,d=1)=>Number(x||0).toLocaleString('es-AR',{minimumFractionDigits:d,maximumFractionDigits:d});
const integer=x=>Number(x||0).toLocaleString('es-AR',{maximumFractionDigits:0});
let latest=null;

function renderInventory(){
 $('node-table').innerHTML=VAAS_CORRIDOR.NODES.map(n=>`<tr><td>${n.name} y San Lorenzo</td><td>${n.id}</td><td>${n.signal}</td><td>${n.movement}</td><td>${n.countC}</td><td>${n.cycle} s</td><td>${n.cab1??'—'}</td><td>${n.cab3??'—'}</td><td>${n.signs}</td></tr>`).join('');
}
function stat(title,value,sub){return `<div class="metric"><small>${title}</small><strong>${value}</strong><small>${sub}</small></div>`;}
function renderResult(r){
 $('results').hidden=false;
 $('complete-badge').textContent=r.complete?'Corrida vaciada':'Quedaron vehículos activos';
 $('complete-badge').className='badge'+(r.complete?'':' warn');
 $('metrics').innerHTML=[
  stat('Viajes generados / terminados',`${integer(r.dynamic.started)} / ${integer(r.dynamic.completed)}`,`dinámico · estático ${integer(r.fixed.started)} / ${integer(r.fixed.completed)}`),
  stat('Detención media por viaje',`${number(r.dynamic.meanStopped)} s`,`${number(r.fixed.meanStopped)} s estático · ${number(r.delta.meanStoppedSeconds)} s menos (${number(r.delta.meanStoppedPercent)}%)`),
  stat('Duración media del viaje',`${number(r.dynamic.meanTrip)} s`,`${number(r.fixed.meanTrip)} s estático · ${number(r.delta.meanTripSeconds)} s menos`),
  stat('CO₂ estimado durante detenciones',`${number(r.emissions.dynamic.kg)} kg`,`${number(r.emissions.fixed.kg)} kg estático · ${number(r.delta.co2Kg)} kg menos (${number(r.delta.co2Percent)}%)`),
  stat('Cola simultánea máxima del corredor',`${integer(r.dynamic.maxCorridorQueue)} vehículos`,`${integer(r.fixed.maxCorridorQueue)} vehículos estático`),
  stat('Viajes incompletos al terminar',`${integer(r.dynamic.incomplete)}`,`${integer(r.fixed.incomplete)} estático · vaciado extra ${number(r.config.drainSeconds,0)} s`),
  stat('Parámetros del ensayo',`${number(r.config.seconds/3600,0)} h`,`semilla ${r.config.seed} · ${r.config.mix==='urban'?'mezcla urbana':'mezcla pesada'}`),
  stat('Demanda y separación',r.config.sideDistribution==='spread'?'repartida':'replicada',`${r.config.sideShare}% transversal · ${r.config.spacing[0]} m · ${r.config.linkCapacities[0]} autos/link aprox.`),
 ].join('');
 $('flow').innerHTML=r.nodes.map((n,i)=>`<article class="node-card"><div class="node-dot" aria-hidden="true"></div><h3>${n.name}</h3><div class="code">ID ${n.id} · semáforo ${n.signal}</div><dl><dt>Entradas dinámico</dt><dd>${integer(r.dynamic.perNode[i].arrived)}</dd><dt>Cola máx. dinámica</dt><dd>${integer(r.dynamic.perNode[i].maxQueue)}</dd><dt>Entradas estático</dt><dd>${integer(r.fixed.perNode[i].arrived)}</dd><dt>Cola máx. estática</dt><dd>${integer(r.fixed.perNode[i].maxQueue)}</dd></dl></article>`).join('');
 $('export-button').disabled=false;
}
function csvCell(v){const s=String(v??'');return '"'+s.replaceAll('"','""')+'"';}
function exportCsv(){
 if(!latest)return;
 const r=latest,rows=[['seccion','indicador','dinamico','estatico','unidad'],
  ['resumen','viajes_generados',r.dynamic.started,r.fixed.started,'viajes'],
  ['resumen','viajes_terminados',r.dynamic.completed,r.fixed.completed,'viajes'],
  ['resumen','viajes_incompletos',r.dynamic.incomplete,r.fixed.incomplete,'viajes'],
  ['resumen','detencion_media_viaje',r.dynamic.meanStopped,r.fixed.meanStopped,'s/viaje'],
  ['resumen','viaje_medio',r.dynamic.meanTrip,r.fixed.meanTrip,'s/viaje'],
  ['resumen','detencion_total',r.dynamic.stoppedVehicleHours*3600,r.fixed.stoppedVehicleHours*3600,'s-vehiculo'],
  ['resumen','cola_maxima_corredor',r.dynamic.maxCorridorQueue,r.fixed.maxCorridorQueue,'vehiculos'],
  ['resumen','co2_espera',r.emissions.dynamic.kg,r.emissions.fixed.kg,'kg CO2 estimados'],
  ['resumen','combustible_ralenti',r.emissions.dynamic.litres,r.emissions.fixed.litres,'L estimados'],
  ['config','duracion_s',r.config.seconds,r.config.seconds,'s'],['config','semilla',r.config.seed,r.config.seed,''],
  ['config','reparto_transversal_pct',r.config.sideShare,r.config.sideShare,'%'],
  ['config','distribucion_transversal',r.config.sideDistribution,r.config.sideDistribution,'spread=total repartido; perNode=por cruce'],
  ['config','reparto_corredor_pct',r.config.arterialShare,r.config.arterialShare,'%'],
  ['config','separaciones_m',r.config.spacing.join('/'),r.config.spacing.join('/'),'m'],
  ['config','completo',r.complete,r.complete,'booleano'],
  ['config','vaciado_extra_s',r.config.drainSeconds,r.config.drainSeconds,'s'],[],['interseccion','ID','Entradas dinámico','Entradas estático','Cola máx dinámica / estática']];
 r.nodes.forEach((n,i)=>rows.push([n.name,n.id,r.dynamic.perNode[i].arrived,r.fixed.perNode[i].arrived,`${r.dynamic.perNode[i].maxQueue} / ${r.fixed.perNode[i].maxQueue}`]));
 rows.push([],['inventario municipal','ID','Semáforo','Movimientos','Cantidad C','Ciclo','Cab 1x300+','Cab 3x200','Cartelería']);
 r.nodes.forEach(n=>rows.push([n.street,n.id,n.signal,n.movement,n.countC,n.cycle,n.cab1??'',n.cab3??'',n.signs]));
 const blob=new Blob(['\ufeff'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='VAAS-corredor-San-Lorenzo.csv';a.click();URL.revokeObjectURL(url);
}
async function execute(){
 const button=$('run-button');button.disabled=true;$('export-button').disabled=true;$('results').hidden=true;$('progress-bar').style.width='0%';
 $('run-state').textContent='Simulando…';$('progress-text').textContent='Preparando los cinco modelos dinámicos y los cinco estáticos.';
 const hours=Number($('hours').value),distance=Number($('spacing').value),share=Number($('side-share').value),sideDistribution=$('side-distribution').value,schedule=VAAS_DAY.defaults();
 schedule.start=360;schedule.end=(360+hours*60)%1440;schedule.share=share;
 try{
  latest=await VAAS_CORRIDOR.run({seconds:hours*3600,seed:Number($('seed').value),mix:$('mix').value,acceleration:Number($('acceleration').value),sideShare:share,sideDistribution,spacing:Array(4).fill(distance),schedule},p=>{
   const width=p.stage==='llegadas'?p.percent:100;
   $('progress-bar').style.width=width+'%';
   $('progress-text').textContent=p.stage==='llegadas'?`Llegadas: ${p.percent}% · ${number(p.elapsed/3600,2)} h simuladas`:`Vaciando colas: ${number(p.elapsed,0)} s adicionales`;
  });
  renderResult(latest);$('run-state').textContent=latest.complete?'Corrida completada':'Vaciado incompleto';$('progress-bar').style.width='100%';$('progress-text').textContent=`Finalizó la jornada de ${hours} h; vaciado adicional: ${number(latest.config.drainSeconds,0)} s.`;
 }catch(error){$('run-state').textContent='No se pudo completar';$('progress-text').textContent=error.message||String(error);}
 finally{button.disabled=false;}
}
$('run-button').addEventListener('click',execute);$('export-button').addEventListener('click',exportCsv);renderInventory();
if(window.VAAS_CORRIDOR_REFERENCE){latest=window.VAAS_CORRIDOR_REFERENCE;renderResult(latest);$('run-state').textContent='Resultado de referencia cargado · semilla '+latest.config.seed;$('progress-bar').style.width='100%';$('progress-text').textContent='Resultado guardado: '+number(latest.config.seconds/3600,0)+' h, reparto transversal '+latest.config.sideDistribution+', separación '+latest.config.spacing.join(' / ')+' m. Ejecutá otra vez para reproducirlo.';}
