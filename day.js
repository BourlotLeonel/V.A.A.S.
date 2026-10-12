(function(root){'use strict';
 const defaults=()=>({enabled:true,start:360,end:1380,base:450,share:25,rows:[
  {name:'Pico de mañana',start:435,end:510,vph:1000,kind:'peak',reference:'800–1.200'},
  {name:'Valle de mañana',start:540,end:720,vph:600,kind:'valley',reference:'500–700'},
  {name:'Pico de mediodía',start:720,end:810,vph:1000,kind:'peak',reference:'800–1.200'},
  {name:'Siesta',start:840,end:960,vph:300,kind:'low',reference:'200–400'},
  {name:'Valle de tarde',start:990,end:1140,vph:600,kind:'valley',reference:'500–700'},
  {name:'Pico de tarde / noche',start:1140,end:1230,vph:1000,kind:'peak',reference:'800–1.200'},
  {name:'Noche temprana',start:1260,end:1380,vph:300,kind:'low',reference:'200–400'},
  {name:'Madrugada',start:0,end:360,vph:40,kind:'night',reference:'Menos de 50'}
 ]});
 const parse=value=>{if(!/^\d{2}:\d{2}$/.test(value))throw Error('Ingresá una hora válida.');const [h,m]=value.split(':').map(Number);if(h>23||m>59)throw Error('Ingresá una hora válida.');return h*60+m;};
 const clock=minutes=>{const m=((Math.floor(minutes)%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');};
 const contains=(row,m)=>row.start<row.end?m>=row.start&&m<row.end:m>=row.start||m<row.end;
 const duration=c=>((c.end-c.start+1440)%1440||1440)*60;
 function validate(c){
  if(!Number.isInteger(c.start)||!Number.isInteger(c.end)||c.start<0||c.end<0||c.start>=1440||c.end>=1440)throw Error('Revisá las horas de la jornada.');
  if(!Number.isFinite(c.share)||c.share<0||c.share>100)throw Error('El reparto entre ejes debe estar entre 0 y 100%.');
  if(!Number.isFinite(c.base)||c.base<0||c.base>3000)throw Error('El tráfico debe estar entre 0 y 3.000 vehículos/h.');
  for(const r of c.rows){if(!Number.isInteger(r.start)||!Number.isInteger(r.end)||r.start<0||r.end<0||r.start>=1440||r.end>=1440||r.start===r.end)throw Error('Revisá el inicio y fin de '+r.name+'.');if(!Number.isFinite(r.vph)||r.vph<0||r.vph>3000)throw Error('Revisá el tráfico de '+r.name+'.');}
  for(let m=0;m<1440;m++)if(c.rows.filter(r=>contains(r,m)).length>1)throw Error('Hay franjas superpuestas a las '+clock(m)+'. Ajustá sus horarios.');
  return c;
 }
 function at(c,elapsed){const absolute=c.start+elapsed/60,m=((absolute%1440)+1440)%1440,r=c.rows.find(row=>contains(row,m)),vph=r?r.vph:c.base;return {minute:m,clock:clock(absolute),day:Math.floor(absolute/1440),name:r?r.name:'Transición entre franjas',vph,rates:[vph*c.share/6000,vph*(100-c.share)/6000]};}
 function expected(c,seconds=duration(c)){let sum=0;for(let t=0;t<seconds;t+=60)sum+=at(c,t).vph*Math.min(60,seconds-t)/3600;return sum;}
 const API={defaults,parse,clock,contains,duration,validate,at,expected};root.VAAS_DAY=API;if(typeof module!=='undefined')module.exports=API;
})(typeof globalThis!=='undefined'?globalThis:this);
