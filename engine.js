/* Simulación microscópica didáctica. Unidades: metros, segundos. */
(function(root){'use strict';
 const PARAMS={minGreen:8,maxGreen:35,fixedGreen:30,amber:3,prepare:3,clearance:2,pedestrian:8,heartbeatTimeout:5};
 const TYPES=[{name:'Auto',length:4.4,width:1.8,maxSpeed:11.1,accel:2.3,brake:3,color:'#3f7f72'}, {name:'Moto',length:2.2,width:.8,maxSpeed:12.5,accel:3,brake:3.5,color:'#be923f'}, {name:'Colectivo',length:10,width:2.5,maxSpeed:9.7,accel:1.1,brake:2.3,color:'#59749c'}, {name:'Camión',length:11,width:2.5,maxSpeed:8.3,accel:.8,brake:2,color:'#996e84'}];

 const OPTIONS={0:[{out:3,turn:'derecha'},{out:2,turn:'izquierda'}],1:[{out:1,turn:'recto'},{out:2,turn:'derecha'},{out:3,turn:'izquierda'}],2:[{out:2,turn:'recto'},{out:1,turn:'izquierda'}],3:[{out:3,turn:'recto'},{out:1,turn:'derecha'}]};
 const STREET=['Próspero Bovino','25 de Mayo','San Lorenzo desde el oeste','San Lorenzo desde el este'];
 function line(l,p){return l===0?{x:-.18*p-2,y:p,dx:-.18,dy:1}:l===1?{x:.18*p+2,y:-p,dx:.18,dy:-1}:l===2?{x:p,y:.18*p+2,dx:1,dy:.18}:{x:-p,y:-.18*p-2,dx:-1,dy:-.18};}
 const ROUTES={};
 for(const [lane,options] of Object.entries(OPTIONS))for(const opt of options){
  const start=line(Number(lane),-18),end=line(opt.out,18),norm=Math.hypot(start.dx,start.dy),c1={x:start.x+start.dx/norm*14,y:start.y+start.dy/norm*14},c2={x:end.x-end.dx/norm*14,y:end.y-end.dy/norm*14};let length=0,previous=start;const samples=[];
  for(let i=0;i<=120;i++){const t=i/120,u=1-t,x=u*u*u*start.x+3*u*u*t*c1.x+3*u*t*t*c2.x+t*t*t*end.x,y=u*u*u*start.y+3*u*u*t*c1.y+3*u*t*t*c2.y+t*t*t*end.y;if(i)length+=Math.hypot(x-previous.x,y-previous.y);samples.push({x,y,d:length});previous={x,y};}
  ROUTES[lane+'-'+opt.out]={lane:Number(lane),...opt,length,end:-18+length,samples};
 }
 function location(v){const route=ROUTES[v.route||v.lane+'-'+(v.lane===0?3:v.lane)];if(v.p<=-18){const p=line(v.lane,v.p);return {...p,angle:Math.atan2(p.dy,p.dx)};}if(v.p>=route.end){const p=line(route.out,18+v.p-route.end);return {...p,angle:Math.atan2(p.dy,p.dx)};}const d=v.p+18,s=route.samples;let j=1;while(j<s.length-1&&s[j].d<d)j++;const a=s[j-1],b=s[j],t=(d-a.d)/(b.d-a.d||1);return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,angle:Math.atan2(b.y-a.y,b.x-a.x)};}
 function routeChoice(lane,rng){const options=OPTIONS[lane],r=rng();return lane>=2?options[r<.8?0:1]:lane===1?options[r<.4?0:r<.7?1:2]:options[r<.5?0:1];}

 function generator(seed=2026){let s=seed>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};}
 function demand(rates,rng,dt=.05,mix='urban',choice='permitidas'){const batch=[];rates.forEach((rate,axis)=>{for(let lane=axis*2;lane<axis*2+2;lane++)if(rng()<1-Math.exp(-rate/120*dt)){const r=rng();let type=mix==='freight'?(r<.45?0:r<.60?1:r<.75?2:3):(r<.68?0:r<.88?1:r<.96?2:3);const route=routeChoice(lane,rng,choice);batch.push({lane,type,route:lane+'-'+route.out});}});return batch;}
 class Controller{
  constructor(mode='adaptive'){this.mode=mode;this.time=0;this.approach=2;this.phase='green';this.elapsed=0;this.target=30;this.vehicles=[];this.pending=[[],[],[],[]];this.arrived=0;this.served=0;this.wait=0;this.idleSecondsByType=[0,0,0,0];this.maxQueue=0;this.connected=true;this.lastHeartbeat=0;this.fallback=false;this.pedRequested=false;this.events=[];this.serial=0;this.acceleration=1;this.reservations=[];this.exitBuffer=87;this.exitBlocked=null;this.exited=[];this.log('Inicio · San Lorenzo Oeste en verde');}
  log(message){this.events.unshift({time:this.time,message});this.events=this.events.slice(0,100);}
  requestPedestrian(){if(!this.pedRequested&&this.phase!=='pedestrian'){this.pedRequested=true;this.log('Solicitud peatonal en espera');}}
  setConnected(value){if(this.connected!==value){this.connected=value;this.log(value?'Enlace restablecido':'Enlace interrumpido');}}
  get axis(){return Math.floor(this.approach/2);}
  get approachQueues(){return [0,1,2,3].map(lane=>this.vehicles.filter(v=>v.lane===lane&&v.p+v.length/2<=-18&&v.v<.5).concat(this.pending[lane]));}
  get queues(){return [0,1].map(a=>this.vehicles.filter(v=>Math.floor(v.lane/2)===a&&v.p+v.length/2<=-18&&v.v<.5).concat(this.pending[a*2],this.pending[a*2+1]));}
  get approachDemand(){return [0,1,2,3].map(lane=>this.pending[lane].length+this.vehicles.filter(v=>v.lane===lane&&!v.passed).length);}
  plan(){if(this.mode==='fixed'||this.fallback)return PARAMS.fixedGreen;const own=this.approachDemand[this.approach];return Math.round(Math.min(PARAMS.maxGreen,PARAMS.minGreen+own*2.4));}
  signal(lane){return this.approach===lane&&this.phase==='green'?'green':this.approach===lane&&(this.phase==='amber'||this.phase==='prepare')?'amber':'red';}
  get occupied(){return this.vehicles.some(v=>(v.passed&&v.p-v.length/2<ROUTES[v.route].end+3)||(v.committed&&!v.passed));}
  beginPreparation(){let next=(this.approach+1)%4;if(this.mode==='adaptive'&&!this.fallback){const demand=this.approachDemand;for(let offset=1;offset<=4;offset++){const candidate=(this.approach+offset)%4;if(demand[candidate]>0){next=candidate;break;}}}this.approach=next;this.phase='prepare';this.elapsed=0;this.log('Amarillo previo al verde · '+STREET[this.approach]+' · 3 s');}
  nextGreen(){this.phase='green';this.elapsed=0;this.target=this.plan();this.log('Verde '+STREET[this.approach]+' · '+this.target+' s');}
  step(dt,batch=[]){
   this.exited=[];this.time+=dt;this.elapsed+=dt;if(this.connected)this.lastHeartbeat=this.time;
   const failed=this.time-this.lastHeartbeat>=PARAMS.heartbeatTimeout-1e-8;if(failed!==this.fallback){this.fallback=failed;this.log(failed?'Sin heartbeat · control fijo local':'Heartbeat recuperado · control seleccionado');if(this.phase==='green')this.target=this.plan();}
   for(const entry of batch){const route=entry.route||entry.lane+'-'+OPTIONS[entry.lane][0].out;if(!ROUTES[route]||ROUTES[route].lane!==entry.lane)throw Error('Maniobra no permitida');this.pending[entry.lane].push({...entry,route,entered:this.time,wait:0});this.arrived++;}
   this.pending.forEach((pending,lane)=>{pending.forEach(v=>{v.wait+=dt;this.idleSecondsByType[v.type]+=dt;});const last=this.vehicles.filter(v=>v.lane===lane&&v.p< -18).sort((a,b)=>a.p-b.p)[0];if(pending.length&&(!last||last.p-last.length/2>-94)){const entry=pending.shift(),spec=TYPES[entry.type];this.vehicles.push({...spec,...entry,turn:ROUTES[entry.route].turn,out:ROUTES[entry.route].out,id:++this.serial,p:Number.isFinite(entry.p)?entry.p:-105,v:Number.isFinite(entry.v)?entry.v:(last?Math.min(last.v,spec.maxSpeed*.75):spec.maxSpeed*.75),a:0,passed:false});}});
   this.reservations=this.reservations.filter(id=>{const owner=this.vehicles.find(v=>v.id===id);return owner&&owner.p-owner.length/2<=ROUTES[owner.route].end+3&&(owner.passed||owner.committed||this.signal(owner.lane)==='green');});
   const candidates=this.vehicles.filter(v=>!v.passed&&v.p+v.length/2>=-30&&(this.signal(v.lane)==='green'||v.committed)).sort((a,b)=>a.entered-b.entered);
   for(const candidate of candidates){if(this.reservations.includes(candidate.id))continue;const compatible=this.reservations.every(id=>{const owner=this.vehicles.find(v=>v.id===id);return owner.lane===candidate.lane;});if(compatible)this.reservations.push(candidate.id);}
   for(let lane=0;lane<4;lane++){
    const list=this.vehicles.filter(v=>v.lane===lane).sort((a,b)=>b.p-a.p);let leader=null;
    for(const v of list){
     let gap=leader?leader.p-leader.length/2-(v.p+v.length/2):Infinity,leaderV=leader?leader.v:0;
     const route=ROUTES[v.route],front=v.p+v.length/2,stopGap=-18-front,axis=Math.floor(lane/2),signal=this.signal(lane);
     // Compartir salida exige seguir a quienes ya ingresaron al mismo carril.
     if(v.p>=route.end){const progress=18+v.p-route.end;leader=null;gap=Infinity;for(const other of this.vehicles){if(other.id===v.id||other.out!==v.out||other.p<ROUTES[other.route].end)continue;const op=18+other.p-ROUTES[other.route].end;if(op>progress){const g=op-other.length/2-progress-v.length/2;if(g<gap){gap=g;leader=other;leaderV=other.v;}}}}
     else if(leader&&leader.route!==v.route&&leader.p>0){leader=null;gap=Infinity;leaderV=0;}
     // Un solo acceso recibe verde. Los vehículos habilitados siguen al
     // precedente y se separan al divergir las trayectorias.
     const blocked=signal!=='green'&&!this.reservations.includes(v.id);
     if(!v.passed&&((signal!=='green'&&!v.committed)||blocked)&&stopGap<gap){gap=Math.max(.01,stopGap);leaderV=0;}
     const a=v.accel*this.acceleration,b=v.brake;
     const wanted=2+Math.max(0,v.v*1.3+v.v*(v.v-leaderV)/(2*Math.sqrt(a*b)));
     v.a=Math.max(-b,Math.min(a,a*(1-Math.pow(v.v/(route.turn!=='recto'&&v.p> -30&&v.p<route.end?Math.min(v.maxSpeed,4.2):v.maxSpeed),4)-(Number.isFinite(gap)?Math.pow(wanted/Math.max(.05,gap),2):0))));
     let nextV=Math.max(0,Math.min(v.maxSpeed,v.v+v.a*dt));let nextP=v.p+(v.v+nextV)*.5*dt;
     const limit=Number.isFinite(gap)?v.p+Math.max(0,gap-.15):Infinity;
     if(this.exitBlocked&&this.exitBlocked(v)){const exitLimit=route.end+this.exitBuffer+v.length/2;if(nextP>exitLimit){nextP=exitLimit;nextV=0;v.a=(nextV-v.v)/dt;}}
     if(nextP>limit){nextP=limit;nextV=Math.max(0,(nextP-v.p)/dt);v.a=(nextV-v.v)/dt;}
     v.a=(nextV-v.v)/dt;v.p=nextP;v.v=nextV;if(v.v<.5&&!v.passed){v.wait+=dt;this.idleSecondsByType[v.type]+=dt;}
     if(v.p+v.length/2> -18)v.passed=true;
     leader=v;
    }
   }
   this.vehicles=this.vehicles.filter(v=>{if(v.p-v.length/2>ROUTES[v.route].end+this.exitBuffer){this.served++;this.wait+=v.wait;this.travelTime=(this.travelTime||0)+this.time-v.entered;this.exited.push({...v});return false;}return true;});
   if(this.phase==='green'){
    if(this.elapsed>=PARAMS.minGreen&&Math.floor((this.elapsed-dt)/3)!==Math.floor(this.elapsed/3)&&this.mode==='adaptive'&&!this.fallback)this.target=this.plan();
    if(this.elapsed>=this.target-1e-8){this.phase='amber';this.elapsed=0;for(const v of this.vehicles){if(v.lane===this.approach&&!v.passed&&this.reservations.includes(v.id)&&-18-(v.p+v.length/2)<=v.v*v.v/(2*v.brake)+1)v.committed=true;}this.log('Amarillo · frenado o despeje de vehículos comprometidos');}
   }else if(this.phase==='amber'&&this.elapsed>=3-1e-8){this.phase='clearance';this.elapsed=0;this.log('Cuatro accesos en rojo · despeje');}
   else if(this.phase==='clearance'&&this.elapsed>=2-1e-8&&!this.occupied){if(this.pedRequested){this.phase='pedestrian';this.pedRequested=false;this.elapsed=0;this.log('Cruce peatonal habilitado · 8 s');}else this.beginPreparation();}
   else if(this.phase==='pedestrian'&&this.elapsed>=8-1e-8)this.beginPreparation();
   else if(this.phase==='prepare'&&this.elapsed>=PARAMS.prepare-1e-8)this.nextGreen();
   this.maxQueue=Math.max(this.maxQueue,this.queue);
  }
  get remaining(){return Math.max(0,({green:this.target,amber:3,prepare:PARAMS.prepare,clearance:2,pedestrian:8}[this.phase])-this.elapsed);}
  get queue(){return this.queues.reduce((sum,q)=>sum+q.length,0);}
  get delay(){return this.served?this.wait/this.served:0;}
 }
 function experiment(rates,seconds=600,seed=2026,mix='urban',acceleration=1,choice='permitidas'){const rng=generator(seed),adaptive=new Controller(),fixed=new Controller('fixed');adaptive.acceleration=fixed.acceleration=acceleration;for(let i=0;i<seconds*20;i++){const batch=demand(rates,rng,.05,mix,choice);adaptive.step(.05,batch);fixed.step(.05,batch);}return {adaptive,fixed,seconds,seed,rates:[...rates],mix,acceleration,choice};}
 const API={Controller,PARAMS,TYPES,OPTIONS,STREET,ROUTES,line,location,generator,demand,experiment};root.VAAS=API;if(typeof module!=='undefined')module.exports=API;
})(typeof globalThis!=='undefined'?globalThis:this);


