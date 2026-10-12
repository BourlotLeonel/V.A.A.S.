(function(root){'use strict';
 // EPA: kg CO2 per US gallon; one US gallon = 3.785411784 litres.
 const FACTORS=[8.887/3.785411784,8.887/3.785411784,10.180/3.785411784,10.180/3.785411784];
 // Illustrative idle consumption, not measurements of the Concordia fleet.
 const defaults=()=>({idleLitresPerHour:[0.8,0.25,2.5,3],engineOnPercent:100});
 function validate(c){if(!c||!Array.isArray(c.idleLitresPerHour)||c.idleLitresPerHour.length!==4||c.idleLitresPerHour.some(v=>!Number.isFinite(v)||v<0||v>10)||!Number.isFinite(c.engineOnPercent)||c.engineOnPercent<0||c.engineOnPercent>100)throw Error('Revisá los consumos (0–10 L/h) y los motores encendidos (0–100%).');return c;}
 function estimate(seconds,c=defaults(),vehicles=0){validate(c);if(!Array.isArray(seconds)||seconds.length!==4||seconds.some(v=>!Number.isFinite(v)||v<0))return null;const byType=seconds.map((s,i)=>{const litres=s/3600*c.idleLitresPerHour[i]*c.engineOnPercent/100;return {seconds:s,litres,kg:litres*FACTORS[i]};});const litres=byType.reduce((s,t)=>s+t.litres,0),kg=byType.reduce((s,t)=>s+t.kg,0);return {litres,kg,gramsPerVehicle:vehicles?kg*1000/vehicles:0,byType};}
 function pair(d,s,c,count,complete=false){const dynamic=estimate(d.idleSecondsByType,c,count),staticEstimate=estimate(s.idleSecondsByType,c,count);return {dynamic,static:staticEstimate,complete,deltaKg:dynamic&&staticEstimate?staticEstimate.kg-dynamic.kg:null,deltaPercent:dynamic&&staticEstimate&&staticEstimate.kg>0?100*(staticEstimate.kg-dynamic.kg)/staticEstimate.kg:null};}
 const API={FACTORS,defaults,validate,estimate,pair};root.VAAS_EMISSIONS=API;if(typeof module!=='undefined')module.exports=API;
})(typeof globalThis!=='undefined'?globalThis:this);
