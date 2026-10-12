'use strict';
function livePhase(c){return {green:'Verde: '+VAAS.STREET[c.approach],amber:'Amarillo de cierre',prepare:'Amarillo previo al verde',clearance:'Despeje',pedestrian:'Cruce peatonal'}[c.phase];}
function renderLivePair(){
 const d=pair.dynamic,s=pair.static,ds=VAAS_COMPARE.snapshot(d),ss=VAAS_COMPARE.snapshot(s);
 $('mean-all').textContent=number(ds.meanStopped);$('pending').textContent=ds.pending;
 $('static-arrived').textContent=s.arrived;$('static-served').textContent=s.served;$('static-queue').textContent=s.queue;$('static-delay').textContent=number(s.delay);$('static-mean-all').textContent=number(ss.meanStopped);$('static-pending').textContent=ss.pending;
 $('static-phase-label').textContent=livePhase(s);$('static-phase-time').textContent=s.phase==='clearance'&&s.remaining===0&&s.occupied?'Despejando':Math.ceil(s.remaining)+' s';
 $('static-fleet').innerHTML=VAAS.TYPES.map((t,i)=>'<span style="--type:'+t.color+'">'+t.name+' · '+s.vehicles.filter(v=>v.type===i).length+'</span>').join('');
 $('static-signals').innerHTML=VAAS.STREET.map((name,lane)=>'<div class="'+s.signal(lane)+'"><b>'+name+'</b><i></i>'+({green:'Verde',amber:'Amarillo',red:'Rojo'}[s.signal(lane)])+'</div>').join('');
 $('static-phase-track').innerHTML=['green','amber','clearance','pedestrian','prepare'].map(p=>`<span class="${s.phase===p?'active '+p:''}">${{green:'Verde',amber:'Amarillo · 3 s',prepare:'Previo al verde · 3 s',clearance:'Despeje · ≥2 s',pedestrian:'Peatones · 8 s'}[p]}</span>`).join('');
 const delta=ss.meanStopped-ds.meanStopped;
 $('live-delta').textContent=(delta>0?'+':'')+number(delta)+' s';$('live-delta').className=delta>=0?'positive':'negative';
 const meaning=delta>=0?'a favor del dinámico':'a favor del estático';
 renderEnvironmentLive();
 $('live-status').textContent=pair.complete?`Muestra completa: ${d.arrived} vehículos en cada modelo. Diferencia final ${meaning}.`:pair.accepting?`Muestra en curso · ${d.arrived} llegadas idénticas en cada modelo · diferencia acumulada ${meaning}, aún no definitiva.`:`Sin nuevas llegadas: vaciando ambos cruces · pendientes ${ds.pending} dinámico / ${ss.pending} estático. La diferencia todavía puede cambiar.`;
}
function exportLivePair(){
 recordLiveEnvironment(true);
 const ds=VAAS_COMPARE.snapshot(pair.dynamic),ss=VAAS_COMPARE.snapshot(pair.static);
 const rows=[['indicador','dinamico','estatico'],['tiempo_simulado_s',pair.dynamic.time,pair.static.time],['ingresaron',ds.arrived,ss.arrived],['salieron',ds.served,ss.served],['pendientes',ds.pending,ss.pending],['cola',ds.queue,ss.queue],['detencion_total_acumulada_s',ds.totalStopped,ss.totalStopped],['detencion_media_todos_s',ds.meanStopped,ss.meanStopped],['detencion_media_salidas_s',pair.dynamic.delay,pair.static.delay],['diferencia_s_veh_estatico_menos_dinamico',ss.meanStopped-ds.meanStopped,''],['muestra_completa',pair.complete,pair.complete],['semilla',pair.seed,pair.seed],['configuracion_actual_demanda',dayRates(pair.dynamic.time).join('/'),dayRates(pair.static.time).join('/')],['mezcla_actual',$('mix').value,$('mix').value],['nota','Las condiciones pueden haberse cambiado durante la sesión. Diferencia parcial hasta que se vacíen ambas muestras.','Simulación sin datos de campo.']];if(dayConfig.enabled)rows.push(['hora_simulada',VAAS_DAY.at(dayConfig,pair.dynamic.time).clock,''],['jornada_inicio',VAAS_DAY.clock(dayConfig.start),''],['jornada_fin',VAAS_DAY.clock(dayConfig.end),''],['reparto_bovino_25_porcentaje',dayConfig.share,''],['entre_franjas_veh_h',dayConfig.base,''],[],['franja','desde','hasta','vehiculos_h'],...dayConfig.rows.map(r=>[r.name,VAAS_DAY.clock(r.start),VAAS_DAY.clock(r.end),r.vph]));rows.push([], ...emissionsCSV(VAAS_EMISSIONS.pair(ds,ss,emissionsConfig,ds.arrived,pair.complete),emissionsConfig),[],['serie_tiempo_s','espera_dinamica_s_veh','espera_estatica_s_veh','co2_dinamico_kg','co2_estatico_kg'],...liveHistory.map(t=>[t.time,t.dynamic.meanStopped,t.static.meanStopped,VAAS_EMISSIONS.estimate(t.dynamic.idleSecondsByType,emissionsConfig,t.dynamic.arrived).kg,VAAS_EMISSIONS.estimate(t.static.idleSecondsByType,emissionsConfig,t.static.arrived).kg]));downloadCSV(rows,'VAAS-comparacion-en-vivo.csv');
}
