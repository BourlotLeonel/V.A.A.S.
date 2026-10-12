'use strict';
const $=id=>document.getElementById(id),canvas=$('cross'),ctx=canvas.getContext('2d'),staticCanvas=$('cross-static'),staticCtx=staticCanvas.getContext('2d');
let controller,pair,rng,running=true,rates=[2,6],speed=1,comparison=null,selected=null,accumulator=0,last=null,uiTime=0,points=[];
const fmt=t=>Math.floor(t/60).toString().padStart(2,'0')+':'+Math.floor(t%60).toString().padStart(2,'0');
function reset(){liveHistory=[];dayEnded=false;pair=new VAAS_LIVE(2026);controller=pair.dynamic;pair.setAcceleration(Number($('acceleration').value));$('live-drain').textContent='Detener llegadas y vaciar';selected=null;accumulator=0;render();renderLivePair();}
function setRates(values){dayConfig.enabled=false;dayEnded=false;$('day-enabled').checked=false;rates=values;['ns','ew'].forEach((id,i)=>{$(id).value=values[i];$(id+'-value').textContent=values[i];});document.querySelectorAll('[data-rates]').forEach(b=>b.classList.toggle('selected',b.dataset.rates===values.join(',')));}
function position(v){const pt=VAAS.location(v);return {x:450+pt.x*3,y:285+pt.y*3,angle:pt.angle};}
function drawPath(vertices,fill,stroke,context=ctx){const ctx=context;ctx.beginPath();vertices.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
function drawText(s,x,y,color='#61758a',size=13,context=ctx){const ctx=context;ctx.fillStyle=color;ctx.font=`${size}px Segoe UI, Arial`;ctx.fillText(s,x,y);}
function draw(model=controller,context=ctx,isStatic=false){const controller=model,ctx=context,path=(v,f,s)=>drawPath(v,f,s,ctx),text=(s,x,y,c,size)=>drawText(s,x,y,c,size,ctx);
 ctx.clearRect(0,0,900,570);ctx.fillStyle='#eef1f4';ctx.fillRect(0,0,900,570);
 // Huellas del plano de referencia, registradas con el eje de las calles.
 const mapPoint=([x,y])=>[450+(x-VAAS_MAP.anchor[0])*VAAS_MAP.scale,285+(y-VAAS_MAP.anchor[1])*VAAS_MAP.scale];
 ctx.lineWidth=1;
 for(const building of VAAS_MAP.buildings){path(building.p.map(mapPoint),building.warm?'#eee6d5':'#dce2e8',building.warm?'#d4c4a3':'#bdc8d2');}
 // Calle lateral visible al noreste en la captura.
 path([[230,23],[390,52],[388,60],[228,31]].map(mapPoint),'#a5b3c0');
 // Bovino y 25 de Mayo comparten ancho y eje geométrico; la mano única
 // se expresa con flechas, sin estrechar ni desplazar la calzada.
 path([[0,182],[900,344],[900,388],[0,226]],'#a5b3c0');path([[479,0],[523,0],[421,570],[377,570]],'#a5b3c0');
 ctx.strokeStyle='#85919e';ctx.lineWidth=1.3;ctx.setLineDash([9,10]);ctx.beginPath();ctx.moveTo(0,204);ctx.lineTo(400,276);ctx.moveTo(500,294);ctx.lineTo(900,366);ctx.moveTo(501,0);ctx.lineTo(458,243);ctx.stroke();ctx.setLineDash([]);
 // Pasos peatonales y líneas de detención.
 ctx.strokeStyle=controller.phase==='pedestrian'?'#3ae1bc':'#c4ccd3';ctx.lineWidth=4;
 for(const p of [-16,16]){for(let i=-3;i<=3;i++){const x=450-.18*p*3,y=285+p*3;ctx.beginPath();ctx.moveTo(x+i*6,y-2);ctx.lineTo(x+i*6,y+2);ctx.stroke();const xx=450+p*3,yy=285+.18*p*3;ctx.beginPath();ctx.moveTo(xx-2,yy+i*6);ctx.lineTo(xx+2,yy+i*6);ctx.stroke();}}
 ctx.strokeStyle='#edf2f6';ctx.lineWidth=2;for(let lane=0;lane<4;lane++){const pt=position({lane,p:-18});ctx.save();ctx.translate(pt.x,pt.y);ctx.rotate(pt.angle);ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(0,5);ctx.stroke();ctx.restore();}
 text('PRÓSPERO BOVINO',535,28,'#344f66',15);text('25 DE MAYO',305,552,'#344f66',15);text('SAN LORENZO OESTE',30,166,'#344f66',15);text('SAN LORENZO OESTE',649,411,'#344f66',15);
 text('REFERENCIA: IMÁGENES APORTADAS',22,28,'#6c8194',11);text('25 DE MAYO: SOLO HACIA SAN LORENZO',22,548,'#356c5f',11);
 // Flechas de circulación: carril superior de San Lorenzo hacia la izquierda;
 // carril inferior hacia la derecha. Bovino permite ingreso y salida.
 for(const [lane,p] of [[0,-65],[1,-65],[1,65],[2,-65],[2,65],[3,-65],[3,65]]){const point=VAAS.line(lane,p),base={...point,angle:Math.atan2(point.dy,point.dx)};ctx.save();ctx.translate(450+base.x*3,285+base.y*3);ctx.rotate(base.angle);ctx.strokeStyle='#eff3f6';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(10,0);ctx.moveTo(4,-5);ctx.lineTo(10,0);ctx.lineTo(4,5);ctx.stroke();ctx.restore();}
 if($('paths').checked){for(const key of Object.keys(VAAS.ROUTES).filter(k=>VAAS.ROUTES[k].lane===controller.approach)){const route=VAAS.ROUTES[key];ctx.strokeStyle={recto:'#3f7f72',derecha:'#597ca0',izquierda:'#ae8439'}[route.turn];ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();route.samples.forEach((p,i)=>i?ctx.lineTo(450+p.x*3,285+p.y*3):ctx.moveTo(450+p.x*3,285+p.y*3));ctx.stroke();ctx.setLineDash([]);}text('RECORRIDOS DEL ACCESO HABILITADO',22,48,'#5b7387',11);}
 // Un haz por semáforo: origen en el poste y extremo en su aproximación.
 if($('vision').checked){const range=Number($('vision-range').value),poles=[[417,235,0],[484,335,1],[394,310,2],[506,262,3]];
  for(const [x,y,lane] of poles){const end=VAAS.line(lane,-18-range),ex=450+end.x*3,ey=285+end.y*3,norm=Math.hypot(end.dx,end.dy),nx=-end.dy/norm*9,ny=end.dx/norm*9,color='#337fb6';
   path([[x,y],[ex+nx,ey+ny],[ex-nx,ey-ny]],'#337fb618');ctx.lineWidth=1;ctx.setLineDash([3,5]);ctx.strokeStyle='#337fb655';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex+nx,ey+ny);ctx.moveTo(x,y);ctx.lineTo(ex-nx,ey-ny);ctx.stroke();ctx.setLineDash([]);
   ctx.strokeStyle=color;ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.stroke();ctx.beginPath();ctx.arc(ex,ey,3,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();text(range+' m',ex+12,ey-8,'#286185',12);
  }
 }
 // Zonas virtuales de aproximación.
 if($('detections').checked){ctx.strokeStyle='#51d4bb55';ctx.setLineDash([4,4]);for(let lane=0;lane<4;lane++){const pt=position({lane,p:-49});ctx.save();ctx.translate(pt.x,pt.y);ctx.rotate(pt.angle);ctx.strokeRect(-80,-8,160,16);ctx.restore();}ctx.setLineDash([]);}
 const drawPoints=[];
 for(const v of controller.vehicles){const pt=position(v),len=v.length*3,width=Math.max(3,v.width*3);drawPoints.push({id:v.id,x:pt.x,y:pt.y,length:len});ctx.save();ctx.translate(pt.x,pt.y);ctx.rotate(pt.angle);
  if(v.id===selected&&!isStatic){ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.strokeRect(-len/2-4,-width/2-4,len+8,width+8);}
  ctx.fillStyle='#08101c';for(const xx of [-len*.3,len*.3]){ctx.fillRect(xx-2,-width/2-1,4,2);ctx.fillRect(xx-2,width/2-1,4,2);}
  ctx.fillStyle=v.color;ctx.fillRect(-len/2,-width/2,len,width);ctx.fillStyle='#173348';ctx.fillRect(len*.02,-width*.38,len*.23,width*.76);if(v.type>=2){ctx.fillStyle='#ffffff55';for(let j=0;j<3;j++)ctx.fillRect(-len*.32+j*len*.13,-width*.37,len*.09,width*.74);}
  if(v.a<-.5){ctx.fillStyle='#ff6c79';ctx.fillRect(-len/2,-width/2,2,width);}ctx.restore();
  if($('detections').checked){ctx.strokeStyle=v.color+'99';ctx.lineWidth=.7;const r=Math.max(7,len*.5);ctx.strokeRect(pt.x-r,pt.y-r,r*2,r*2);if(v.id===selected&&!isStatic||v.length>8)text(`${v.name} ${(v.v*3.6).toFixed(0)} km/h`,pt.x+r+3,pt.y-r,v.color,11);}
 }
 if(!isStatic)points=drawPoints;
 const positions=[[417,235,0],[484,335,1],[394,310,2],[506,262,3]],colors={red:'#ff6c79',amber:'#ffc96e',green:'#3ae1bc'};
 for(const [x,y,axis] of positions){ctx.fillStyle='#091422';ctx.fillRect(x-8,y-21,16,42);for(const [j,phase] of ['red','amber','green'].entries()){ctx.beginPath();ctx.arc(x,y-13+j*13,4,0,Math.PI*2);ctx.fillStyle=controller.signal(axis)===phase?colors[phase]:'#344354';ctx.fill();}}
 if(controller.phase==='pedestrian'){const progress=controller.elapsed/8;ctx.fillStyle='#b6fff0';for(let n=0;n<3;n++){ctx.beginPath();ctx.arc(423+progress*52,238+n*8,2.8,0,Math.PI*2);ctx.fill();}text('CRUCE PEATONAL',530,230,'#356c5f',12);}
}
function render(){
 $('signal-list').innerHTML=VAAS.STREET.map((name,lane)=>'<div class="'+controller.signal(lane)+'"><b>'+name+'</b><i></i>'+({green:'Verde',amber:'Amarillo',red:'Rojo'}[controller.signal(lane)])+'</div>').join('');
 renderDay();$('time').textContent=fmt(controller.time);$('arrived').textContent=controller.arrived;$('served').textContent=controller.served;$('delay').textContent=number(controller.delay);$('queue').textContent=controller.queue;const q=controller.queues;$('queue-ns').textContent=q[0].length;$('queue-ew').textContent=q[1].length;
 $('fleet').innerHTML=VAAS.TYPES.map((t,i)=>'<span style="--type:'+t.color+'">'+t.name+' · '+controller.vehicles.filter(v=>v.type===i).length+'</span>').join('');
 const phases={green:'Verde: '+VAAS.STREET[controller.approach],amber:'Amarillo de cierre',prepare:'Amarillo previo al verde',clearance:'Despeje',pedestrian:'Peatones'};$('phase-label').textContent=phases[controller.phase];$('phase-time').textContent=controller.phase==='clearance'&&controller.remaining===0&&controller.occupied?'Despejando':Math.ceil(controller.remaining)+' s';
 $('phase-detail').textContent=(controller.fallback?'Control fijo local · ':controller.mode==='fixed'?'Control fijo · ':'Control adaptativo · ')+phases[controller.phase];$('connection').textContent=controller.fallback?'Contingencia: modo fijo':controller.connected?'Enlace activo':'Esperando heartbeat';$('connection').className='badge'+(!controller.connected||controller.fallback?' warn':'');$('network').textContent=controller.connected?'Interrumpir enlace':'Restablecer enlace';$('heartbeat').textContent='Último heartbeat: hace '+Math.floor(controller.time-controller.lastHeartbeat)+' s';$('pedestrian').disabled=controller.pedRequested||controller.phase==='pedestrian';$('pedestrian').textContent=controller.phase==='pedestrian'?'Cruce habilitado':controller.pedRequested?'Solicitud pendiente':'Solicitar cruce peatonal';
 $('phase-track').innerHTML=['green','amber','clearance','pedestrian','prepare'].map(p=>`<span class="${controller.phase===p?'active '+p:''}">${{green:'Verde',amber:'Amarillo · 3 s',prepare:'Previo al verde · 3 s',clearance:'Despeje · ≥2 s',pedestrian:'Peatones · 8 s'}[p]}</span>`).join('');
 const v=controller.vehicles.find(v=>v.id===selected);$('inspect').textContent=v?`#${v.id} · ${v.name} · ${(v.v*3.6).toFixed(1)} km/h · ${v.a.toFixed(2)} m/s² · detención ${v.wait.toFixed(1)} s · ${VAAS.STREET[v.lane]} · ${v.turn} · ${v.passed?'despejando / salida':'aproximación'}`:selected?'El vehículo seleccionado salió del tramo.':'Seleccioná un vehículo para ver su velocidad y aceleración.';
 $('events').innerHTML=controller.events.slice(0,20).map(e=>`<li><time>${fmt(e.time)}</time><span>${e.message}</span></li>`).join('');
}
function frame(now){if(last!==null&&running){accumulator+=Math.min(.15,(now-last)/1000)*speed;while(accumulator>=.05){if(dayConfig.enabled&&controller.time+1e-6>=VAAS_DAY.duration(dayConfig)){pair.accepting=false;dayEnded=true;$('live-drain').textContent='Jornada finalizada';}pair.step(.05,dayRates(controller.time),$('mix').value);recordLiveEnvironment();accumulator-=.05;if(pair.complete){running=false;$('play').textContent='Continuar';break;}}}last=now;draw();draw(pair.static,staticCtx,true);if(now-uiTime>120){render();renderLivePair();uiTime=now;}requestAnimationFrame(frame);}
$('play').onclick=()=>{running=!running;$('play').textContent=running?'Pausar':'Continuar';last=null;};$('speed').onchange=e=>{speed=Number(e.target.value);};$('reset').onclick=reset;
['ns','ew'].forEach((id,i)=>{$(id).oninput=e=>{const next=[...rates];next[i]=Number(e.target.value);setRates(next);};});document.querySelectorAll('[data-rates]').forEach(b=>b.onclick=()=>setRates(b.dataset.rates.split(',').map(Number)));
$('acceleration').oninput=e=>{pair.setAcceleration(Number(e.target.value));$('acceleration-value').textContent=controller.acceleration.toFixed(1).replace('.',',')+'×';};$('vision-range').oninput=e=>{$('vision-range-value').textContent=e.target.value+' m';};$('mix').onchange=()=>controller.log('Composición de nuevas llegadas: '+$('mix').value);$('network').onclick=()=>{pair.setConnected(!controller.connected);render();};$('pedestrian').onclick=()=>{pair.requestPedestrian();render();};
canvas.onclick=e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*900/r.width,y=(e.clientY-r.top)*570/r.height;const closest=points.map(p=>({...p,d:Math.hypot(p.x-x,p.y-y)})).sort((a,b)=>a.d-b.d)[0];selected=closest&&closest.d<Math.max(15,closest.length/2)?closest.id:null;render();};
$('compare').onclick=()=>runComparison().catch(()=>{});$('report-export').onclick=exportReport;
$('export').onclick=()=>downloadCSV([['tipo','tiempo_s','detalle','valor'],['sesion',controller.time,'ingresaron',controller.arrived],['sesion',controller.time,'salieron',controller.served],['sesion',controller.time,'cola',controller.queue],...controller.events.map(e=>['evento',e.time.toFixed(2),e.message,''])],'VAAS-sesion.csv');
$('live-drain').onclick=()=>{if(dayEnded){$('day-error').textContent='La jornada terminó. Aplicá nuevos horarios o reiniciá ambos modelos.';return;}pair.accepting=!pair.accepting;$('live-drain').textContent=pair.accepting?'Detener llegadas y vaciar':'Reanudar llegadas';if(pair.accepting&&!running){running=true;$('play').textContent='Pausar';last=null;}renderLivePair();};$('live-export').onclick=exportLivePair;
setupDay();setupEnvironment();reset();renderLivePair();renderReport(VAAS_BASELINE);requestAnimationFrame(frame);
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'run_traffic_comparison',title:'Comparar control semafórico',description:'Ejecuta el ensayo emparejado con la demanda, duración y repeticiones seleccionadas y actualiza el informe.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw Error('Se requiere un objeto vacío');return runComparison();}})).catch(()=>{});}catch{}}

