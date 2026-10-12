'use strict';
let dayConfig=VAAS_DAY.defaults(),dayEnded=false;
function scheduleSnapshot(){return dayConfig.enabled?JSON.parse(JSON.stringify(dayConfig)):null;}
function dayRates(elapsed){return dayConfig.enabled?VAAS_DAY.at(dayConfig,elapsed).rates:rates;}
function renderDay(){
 const state=VAAS_DAY.at(dayConfig,controller.time);
 $('day-clock').textContent=state.clock+' h'+(state.day?' · día '+(state.day+1):'');
 $('day-current').textContent=dayEnded?'Jornada finalizada · vaciando ambos cruces':dayConfig.enabled?state.name:'Demanda manual constante';
 $('day-flow').textContent=number(dayConfig.enabled?state.vph:60*(rates[0]+rates[1]),0)+' veh/h';
 $('day-marker').style.left=(state.minute/1440*100)+'%';
 for(let i=0;i<dayConfig.rows.length;i++)$('day-row-'+i).className=dayConfig.enabled&&VAAS_DAY.contains(dayConfig.rows[i],state.minute)?'current-period':'';
 $('day-summary').textContent='Jornada '+VAAS_DAY.clock(dayConfig.start)+'–'+VAAS_DAY.clock(dayConfig.end)+' h · '+number(VAAS_DAY.duration(dayConfig)/3600,1)+' horas · '+number(VAAS_DAY.expected(dayConfig),0)+' llegadas esperadas por modelo. El total generado fluctúa con la semilla; la muestra es idéntica en ambos.';
}
function renderDayTimeline(){
 const bars=[];dayConfig.rows.forEach(r=>{const spans=r.start<r.end?[[r.start,r.end]]:[[r.start,1440],[0,r.end]];for(const [a,b] of spans)bars.push('<span class="day-band '+r.kind+'" style="left:'+a/14.4+'%;width:'+(b-a)/14.4+'%" title="'+r.name+' · '+VAAS_DAY.clock(a)+'–'+VAAS_DAY.clock(b)+' · '+r.vph+' veh/h"></span>');});
 $('day-bands').innerHTML=bars.join('');
}
function readDayInputs(){const numeric=id=>{if(String($(id).value).trim()==='')throw Error('Completá todos los promedios y el reparto entre ejes.');return Number($(id).value);};const c=VAAS_DAY.defaults();c.enabled=$('day-enabled').checked;c.start=VAAS_DAY.parse($('day-start').value);c.end=VAAS_DAY.parse($('day-end').value);c.base=numeric('day-base');c.share=numeric('day-share');c.rows=c.rows.map((r,i)=>({...r,start:VAAS_DAY.parse($('day-from-'+i).value),end:VAAS_DAY.parse($('day-to-'+i).value),vph:numeric('day-vph-'+i)}));return VAAS_DAY.validate(c);}
function fillDayInputs(){const c=dayConfig;$('day-enabled').checked=c.enabled;$('day-start').value=VAAS_DAY.clock(c.start);$('day-end').value=VAAS_DAY.clock(c.end);$('day-base').value=c.base;$('day-share').value=c.share;c.rows.forEach((r,i)=>{$('day-from-'+i).value=VAAS_DAY.clock(r.start);$('day-to-'+i).value=VAAS_DAY.clock(r.end);$('day-vph-'+i).value=r.vph;});}
function setupDay(){
 fillDayInputs();renderDayTimeline();
 $('day-apply').onclick=()=>{try{dayConfig=readDayInputs();$('day-error').textContent='';dayEnded=false;reset();running=true;last=null;$('play').textContent='Pausar';renderDayTimeline();}catch(e){$('day-error').textContent=e.message;}};
 $('day-defaults').onclick=()=>{dayConfig=VAAS_DAY.defaults();fillDayInputs();$('day-error').textContent='';reset();renderDayTimeline();};
 $('day-enabled').onchange=()=>{dayConfig.enabled=$('day-enabled').checked;dayEnded=false;renderDay();};
 for(const id of ['day-start','day-end','day-base','day-share',...dayConfig.rows.flatMap((r,i)=>['day-from-'+i,'day-to-'+i,'day-vph-'+i])])$(id).oninput=()=>{$('day-error').textContent='Cambios pendientes: aplicá los parámetros para iniciar una nueva comparación.';};
}
