(function(root){'use strict';
 const Engine=typeof module!=='undefined'?require('./engine.js'):root.VAAS;
 class LivePair{
  constructor(seed=2026){this.seed=seed;this.rng=Engine.generator(seed);this.dynamic=new Engine.Controller();this.static=new Engine.Controller('fixed');this.arrivalId=0;this.accepting=true;}
  step(dt,rates,mix){const batch=this.accepting?Engine.demand(rates,this.rng,dt,mix).map(v=>({...v,sourceId:++this.arrivalId})):[];this.dynamic.step(dt,batch);this.static.step(dt,batch);}
  setAcceleration(value){this.dynamic.acceleration=this.static.acceleration=value;}
  requestPedestrian(){this.dynamic.requestPedestrian();this.static.requestPedestrian();}
  setConnected(value){this.dynamic.setConnected(value);this.static.setConnected(value);}
  get complete(){return !this.accepting&&this.dynamic.served===this.dynamic.arrived&&this.static.served===this.static.arrived;}
 }
 root.VAAS_LIVE=LivePair;if(typeof module!=='undefined')module.exports=LivePair;
})(typeof globalThis!=='undefined'?globalThis:this);
