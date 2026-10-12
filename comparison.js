(function(root){'use strict';
 const Engine=typeof module!=='undefined'?require('./engine.js'):root.VAAS;
 const Day=typeof module!=='undefined'?require('./day.js'):root.VAAS_DAY;
 const Emissions=typeof module!=='undefined'?require('./emissions.js'):root.VAAS_EMISSIONS;
 const accrued=c=>c.wait+c.vehicles.reduce((s,v)=>s+v.wait,0)+c.pending.reduce((s,q)=>s+q.reduce((t,v)=>t+v.wait,0),0);
 const snapshot=c=>({arrived:c.arrived,served:c.served,pending:c.arrived-c.served,queue:c.queue,totalStopped:accrued(c),meanStopped:c.arrived?accrued(c)/c.arrived:0,completedTrip:c.travelTime||0,idleSecondsByType:[...c.idleSecondsByType]});
 async function run(config,onProgress=()=>{}){
  const {rates,seconds=600,seeds=[2026,2027,2028],mix='urban',acceleration=1,maxDrain=3600,schedule=null}=config;
  if(!Array.isArray(rates)||rates.length!==2||rates.some(r=>!Number.isFinite(r)||r<0||r>55)||(!Number.isFinite(seconds)||seconds<60||seconds>86400)||!seeds.length||seeds.length>5)throw Error('Configuración de ensayo inválida');
  if(schedule)Day.validate(schedule);
  const emissionConfig=JSON.parse(JSON.stringify(Emissions.validate(config.emissions||Emissions.defaults())));
  const runs=[];
  for(let n=0;n<seeds.length;n++){
   const rng=Engine.generator(seeds[n]),dynamic=new Engine.Controller(),staticController=new Engine.Controller('fixed'),trace=[];dynamic.acceleration=staticController.acceleration=acceleration;
   const pair=[dynamic,staticController];let horizon,drain=0,elapsed=0;
   for(let i=0;i<seconds*20;i++){
    const batch=Engine.demand(schedule?Day.at(schedule,i*.05).rates:rates,rng,.05,mix);pair.forEach(c=>c.step(.05,batch));elapsed+=.05;
    if(i%600===599)trace.push({time:Math.round(elapsed),dynamic:snapshot(dynamic),static:snapshot(staticController)});
    if(i%1000===999){onProgress({run:n+1,total:seeds.length,stage:'llegadas',elapsed:Math.round(elapsed)});await new Promise(resolve=>setTimeout(resolve,0));}
   }
   horizon={dynamic:snapshot(dynamic),static:snapshot(staticController)};
   for(let i=0;i<maxDrain*20&&pair.some(c=>c.served<c.arrived);i++){
    pair.forEach(c=>c.step(.05,[]));drain+=.05;
    if(i%1000===999){onProgress({run:n+1,total:seeds.length,stage:'vaciado',elapsed:Math.round(drain)});await new Promise(resolve=>setTimeout(resolve,0));}
   }
   const d=snapshot(dynamic),s=snapshot(staticController),complete=d.pending===0&&s.pending===0;
   runs.push({seed:seeds[n],arrivals:d.arrived,horizon,dynamic:d,static:s,drainSeconds:Math.round(drain),complete,savedPerVehicle:complete&&d.arrived?s.meanStopped-d.meanStopped:null,trace:n===0?trace:[]});
  }
  const count=runs.reduce((t,r)=>t+r.arrivals,0),complete=runs.every(r=>r.complete);
  const aggregate=key=>{const totalStopped=runs.reduce((t,r)=>t+r[key].totalStopped,0),trip=runs.reduce((t,r)=>t+r[key].completedTrip,0);return {idleSecondsByType:[0,1,2,3].map(i=>runs.reduce((t,r)=>t+r[key].idleSecondsByType[i],0)),totalStopped,meanStopped:count?totalStopped/count:0,meanTrip:count?trip/count:0,pending:runs.reduce((t,r)=>t+r[key].pending,0),horizonPending:runs.reduce((t,r)=>t+r.horizon[key].pending,0)};};
  const d=aggregate('dynamic'),s=aggregate('static');
  return {config:{rates:[...rates],seconds,seeds:[...seeds],mix,acceleration,maxDrain,schedule:schedule?JSON.parse(JSON.stringify(schedule)):null,emissions:emissionConfig},emissions:Emissions.pair(d,s,emissionConfig,count,complete),count,complete,dynamic:d,static:s,savedPerVehicle:complete&&count?s.meanStopped-d.meanStopped:null,savedTotalSeconds:complete?s.totalStopped-d.totalStopped:null,savedPercent:complete&&s.meanStopped>0?100*(s.meanStopped-d.meanStopped)/s.meanStopped:null,runs};
 }
 const API={run,snapshot};root.VAAS_COMPARE=API;if(typeof module!=='undefined')module.exports=API;
})(typeof globalThis!=='undefined'?globalThis:this);

