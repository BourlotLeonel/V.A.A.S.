(function(root){'use strict';
 const Engine=typeof module!=='undefined'?require('./engine.js'):root.VAAS;
 const Day=typeof module!=='undefined'?require('./day.js'):root.VAAS_DAY;
 const Emissions=typeof module!=='undefined'?require('./emissions.js'):root.VAAS_EMISSIONS;

 // Cruces transcritos de las capturas de la IDE Concordia. El orden es un
 // esquema de oeste a este; las capturas no contienen coordenadas por punto.
 const NODES=[
  {id:38,signal:37,name:'Alvear',movement:3,countC:3,cycle:101,cab1:2,cab3:3,cab2:null,signs:'No legible'},
  {id:39,signal:38,name:'Laprida',movement:2,countC:3,cycle:101,cab1:2,cab3:3,cab2:null,signs:'No legible'},
  {id:53,signal:52,name:'25 de Mayo',movement:3,countC:3,cycle:101,cab1:2,cab3:3,cab2:null,signs:'No legible'},
  {id:40,signal:39,name:'Sarmiento',movement:2,countC:2,cycle:101,cab1:2,cab3:2,cab2:null,signs:'No'},
  {id:54,signal:53,name:'San Luis',movement:3,countC:2,cycle:101,cab1:3,cab3:2,cab2:null,signs:'No legible'},
 ].map((n,i)=>({...n,index:i,street:n.name+' y San Lorenzo'}));
 const DEFAULT_SPACING=[150,150,150,150];
 const DEFAULTS={seconds:61200,seed:2026,mix:'urban',acceleration:1,sideShare:25,sideDistribution:'spread',spacing:[...DEFAULT_SPACING],maxDrain:3600,emissions:Emissions.defaults()};
 const STEP=.05,VEHICLE_SPEED=8.33;

 function random(seed){let s=seed>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};}
 function hashRandom(seed,id,node){let x=(seed^Math.imul(id,0x9e3779b9)^Math.imul(node+1,0x85ebca6b))>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return (x>>>0)/4294967296;}
 function copyModel(){
  const nodes=NODES.map(()=>{const c=new Engine.Controller();c.exitBuffer=8;return c;});
  return {nodes,transfers:NODES.map(()=>[]),started:0,completed:0,stoppedSec:0,tripSec:0,maxQueue:0,perNode:NODES.map(()=>({served:0,maxQueue:0})),active:new Set(),idleSecondsByType:[0,0,0,0]};
 }
 function nextRoute(lane,seed,id,node){
  const r=hashRandom(seed,id,node);
  if(lane===2)return r<.8?'2-2':'2-1';
  if(lane===3)return r<.8?'3-3':'3-1';
  return null;
 }
 function scheduleExit(model,index,v,now,spacing,seed){
  const totalWait=(v.accumulatedStopped||0)+(v.wait||0),out=v.out;
  const nextIndex=out===2?index+1:out===3?index-1:-1;
  if((out===2||out===3)&&nextIndex>=0&&nextIndex<NODES.length){
   const route=nextRoute(out,seed,v.tripId,nextIndex);
   // Hand the same vehicle to the adjacent intersection at its current
   // position along the link. Spacing is an explicit, editable map estimate.
   const distance=spacing[Math.min(index,nextIndex)]||DEFAULT_SPACING[0];
   const entry={node:nextIndex,lane:out,type:v.type,route,tripId:v.tripId,originTime:v.originTime,accumulatedStopped:totalWait,p:v.p-distance,v:v.v};
   model.transfers[nextIndex].push({due:now+STEP,entry});
  }else{
   model.completed++;model.stoppedSec+=totalWait;model.tripSec+=now+STEP-(v.originTime||0);model.active.delete(v.tripId);
  }
 }
 function makeExternal(nodeIndex,rates,rng,mix,tripSequence){
  const out=[];
  const side=Engine.demand([rates[0],0],rng,STEP,mix);
  for(const x of side)out.push({...x,node:nodeIndex,tripId:tripSequence.next++,originTime:tripSequence.time,accumulatedStopped:0});
  if(nodeIndex===0||nodeIndex===NODES.length-1){
   const edge=Engine.demand([0,rates[1]],rng,STEP,mix),wanted=nodeIndex===0?2:3;
   for(const x of edge)if(x.lane===wanted)out.push({...x,node:nodeIndex,tripId:tripSequence.next++,originTime:tripSequence.time,accumulatedStopped:0});
  }
  return out;
 }
 function collectDue(model,index,now,batch){
  const pending=model.transfers[index];let write=0;
  for(let i=0;i<pending.length;i++){
   const event=pending[i];
   if(event.due<=now+1e-9)batch.push(event.entry);
   else pending[write++]=event;
  }
  pending.length=write;
 }
 function snapshot(model){
  const queue=model.nodes.reduce((n,c)=>n+c.queue,0);
  return {started:model.started,completed:model.completed,incomplete:model.started-model.completed,activeTrips:model.active.size,unservedVisits:model.nodes.reduce((n,c)=>n+c.arrived-c.served,0),inFlightVehicles:model.nodes.reduce((n,c)=>n+c.vehicles.length,0),pendingApproaches:model.nodes.reduce((n,c)=>n+c.pending.reduce((s,q)=>s+q.length,0),0),meanStopped:model.completed?model.stoppedSec/model.completed:0,meanTrip:model.completed?model.tripSec/model.completed:0,stoppedVehicleHours:model.stoppedSec/3600,maxCorridorQueue:model.maxQueue,currentQueue:queue,perNode:model.nodes.map((c,i)=>({name:NODES[i].name,arrived:c.arrived,served:c.served,queue:c.queue,maxQueue:model.perNode[i].maxQueue})),idleSecondsByType:[...model.idleSecondsByType]};
 }
 async function run(config={},onProgress=()=>{}){
  const cfg={...DEFAULTS,...config,spacing:[...(config.spacing||DEFAULT_SPACING)]};
  if(!Number.isFinite(cfg.seconds)||cfg.seconds<60||cfg.seconds>86400||!Number.isInteger(cfg.seed)||!Number.isFinite(cfg.sideShare)||cfg.sideShare<0||cfg.sideShare>100||!['spread','perNode'].includes(cfg.sideDistribution)||cfg.spacing.length!==NODES.length-1||cfg.spacing.some(x=>!Number.isFinite(x)||x<80||x>500))throw Error('Revisá duración, semilla, reparto de demanda y distancias (80–500 m).');
  const day=cfg.schedule||Day.defaults();day.share=cfg.sideShare;Day.validate(day);
  const rng=random(cfg.seed),dynamic=copyModel(),fixed=copyModel();
  dynamic.nodes.forEach(c=>c.acceleration=cfg.acceleration);fixed.nodes.forEach(c=>{c.mode='fixed';c.acceleration=cfg.acceleration;});
  for(const model of [dynamic,fixed])model.nodes.forEach((c,index)=>{c.exitBlocked=v=>{
   const next=v.out===2?index+1:v.out===3?index-1:-1;if(next<0||next>=NODES.length)return false;
   const link=Math.min(index,next),capacity=Math.max(1,Math.floor((cfg.spacing[link]-36)/7.5)),target=model.nodes[next],lane=v.out;
   const occupied=target.vehicles.filter(other=>other.lane===lane&&other.p+other.length/2< -18).length+target.pending[lane].length;
   return occupied>=capacity;
  };});
  let tripId=1,elapsed=0,steps=Math.round(cfg.seconds/STEP),lastProgress=0;
  for(let tick=0;tick<steps;tick++){
   const rates=Day.at(day,elapsed).rates,tripSequence={next:tripId,time:elapsed};
   const sideRate=cfg.sideDistribution==='spread'?rates[0]/NODES.length:rates[0];
   const ext=NODES.map((_,i)=>makeExternal(i,[sideRate,rates[1]],rng,cfg.mix,tripSequence));tripId=tripSequence.next;
   for(const list of ext)for(const item of list){dynamic.started++;fixed.started++;dynamic.active.add(item.tripId);fixed.active.add(item.tripId);}
   for(let i=0;i<NODES.length;i++){
    const db=ext[i].map(x=>({...x})),fb=ext[i].map(x=>({...x}));
    collectDue(dynamic,i,elapsed,db);collectDue(fixed,i,elapsed,fb);
    dynamic.nodes[i].step(STEP,db);fixed.nodes[i].step(STEP,fb);
    for(const v of dynamic.nodes[i].exited)scheduleExit(dynamic,i,v,elapsed,cfg.spacing,cfg.seed);
    for(const v of fixed.nodes[i].exited)scheduleExit(fixed,i,v,elapsed,cfg.spacing,cfg.seed);
    dynamic.perNode[i].served=dynamic.nodes[i].served;fixed.perNode[i].served=fixed.nodes[i].served;
    dynamic.perNode[i].maxQueue=Math.max(dynamic.perNode[i].maxQueue,dynamic.nodes[i].queue);
    fixed.perNode[i].maxQueue=Math.max(fixed.perNode[i].maxQueue,fixed.nodes[i].queue);
   }
   dynamic.maxQueue=Math.max(dynamic.maxQueue,dynamic.nodes.reduce((n,c)=>n+c.queue,0));
   fixed.maxQueue=Math.max(fixed.maxQueue,fixed.nodes.reduce((n,c)=>n+c.queue,0));
   elapsed+=STEP;
   if(tick%6000===5999){const p=Math.round((tick+1)/steps*100);if(p!==lastProgress){onProgress({stage:'llegadas',percent:p,elapsed});lastProgress=p;}await new Promise(resolve=>setTimeout(resolve,0));}
  }
  let drained=0,maxDrainSteps=Math.round(cfg.maxDrain/STEP);
  const done=m=>m.active.size===0&&m.transfers.every(q=>q.length===0)&&m.nodes.every(c=>c.served===c.arrived);
  while(drained<maxDrainSteps&&(!done(dynamic)||!done(fixed))){
   const time=elapsed+drained*STEP;
   for(let i=0;i<NODES.length;i++){
    const db=[],fb=[];collectDue(dynamic,i,time,db);collectDue(fixed,i,time,fb);
    dynamic.nodes[i].step(STEP,db);fixed.nodes[i].step(STEP,fb);
    for(const v of dynamic.nodes[i].exited)scheduleExit(dynamic,i,v,time,cfg.spacing,cfg.seed);
    for(const v of fixed.nodes[i].exited)scheduleExit(fixed,i,v,time,cfg.spacing,cfg.seed);
    dynamic.perNode[i].served=dynamic.nodes[i].served;fixed.perNode[i].served=fixed.nodes[i].served;
    dynamic.perNode[i].maxQueue=Math.max(dynamic.perNode[i].maxQueue,dynamic.nodes[i].queue);
    fixed.perNode[i].maxQueue=Math.max(fixed.perNode[i].maxQueue,fixed.nodes[i].queue);
   }
   dynamic.maxQueue=Math.max(dynamic.maxQueue,dynamic.nodes.reduce((n,c)=>n+c.queue,0));
   fixed.maxQueue=Math.max(fixed.maxQueue,fixed.nodes.reduce((n,c)=>n+c.queue,0));
   drained++;
   if(drained%6000===5999){onProgress({stage:'vaciado',percent:Math.round(drained/maxDrainSteps*100),elapsed:drained*STEP});await new Promise(resolve=>setTimeout(resolve,0));}
  }
  for(const model of [dynamic,fixed])for(const c of model.nodes)c.idleSecondsByType.forEach((n,i)=>model.idleSecondsByType[i]+=n);
  const d=snapshot(dynamic),s=snapshot(fixed),emissionConfig=Emissions.validate(JSON.parse(JSON.stringify(cfg.emissions||Emissions.defaults()))),dco2=Emissions.estimate(d.idleSecondsByType,emissionConfig,d.started),sco2=Emissions.estimate(s.idleSecondsByType,emissionConfig,s.started);
  const linkCapacities=cfg.spacing.map(m=>Math.max(1,Math.floor((m-36)/7.5)));
  return {config:{seconds:cfg.seconds,seed:cfg.seed,mix:cfg.mix,acceleration:cfg.acceleration,sideShare:cfg.sideShare,sideDistribution:cfg.sideDistribution,arterialShare:100-cfg.sideShare,spacing:cfg.spacing,linkCapacities,schedule:day,drainSeconds:drained*STEP},complete:done(dynamic)&&done(fixed),dynamic:d,fixed:s,delta:{meanStoppedSeconds:s.meanStopped-d.meanStopped,meanStoppedPercent:s.meanStopped?100*(s.meanStopped-d.meanStopped)/s.meanStopped:null,meanTripSeconds:s.meanTrip-d.meanTrip,co2Kg:sco2.kg-dco2.kg,co2Percent:sco2.kg?100*(sco2.kg-dco2.kg)/sco2.kg:null},emissions:{dynamic:dco2,fixed:sco2},nodes:NODES};
 }
 const API={NODES,DEFAULTS,run};root.VAAS_CORRIDOR=API;if(typeof module!=='undefined')module.exports=API;
})(typeof globalThis!=='undefined'?globalThis:this);
