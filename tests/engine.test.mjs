import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,validate,simulateHub,plan,evaluate,stressCases,toCsv,weatherFromResponse} from '../dist/engine.js';
const close=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
const simple={id:'test',name:'Test hub',area:'Test district',seats:10,priority:1,solar:0,communications:1,refrigeration:0,cooling:0,lighting:0};
const basic=()=>({...defaults(),hours:6,packs:1,packKwh:2,packKw:5,soc:100,reserve:0,efficiency:100,hubs:[{...simple}]});
test('hand-calculated discharge: a 2 kWh battery supplies 1 kW for 2 hours',()=>{
 const r=simulateHub(simple,1,basic());close(r.served,2);close(r.unserved,4);close(r.ending,0);close(r.serviceHours,2);assert.equal(r.firstGap,2);
});
test('discharge obeys inverter power and reserve constraints',()=>{
 const c={...basic(),packKwh:100,packKw:0.5,reserve:20};const r=simulateHub(simple,1,c);close(r.served,3);assert.ok(r.series.every(s=>s.discharge<=0.5&&s.stored>=20));
});
test('round trip efficiency is split between charge and discharge',()=>{
 const c={...basic(),packKwh:10,efficiency:81,reserve:20,soc:40};const r=simulateHub(simple,1,c);close(r.served,1.8);close(r.losses,0.2);close(r.ending,2);
});
test('all hourly and whole-outage energy balances close under solar, storage and losses',()=>{
 const c=defaults(), r=plan(c);
 for(const s of r.optimal.sites){close(s.initial+s.pv,s.served+s.spill+s.losses+s.ending);assert.ok(s.series.every(row=>row.stored>=s.capacity*c.reserve/100-1e-8&&row.stored<=s.capacity+1e-8&&row.served<=row.demand+1e-8));}
});
test('zero battery inventory is a valid solar-only scenario',()=>{
 const r=plan({...defaults(),packs:0,floor:0});assert.equal(r.optimal.allocation.reduce((a,b)=>a+b,0),0);assert.ok(Number.isFinite(r.score));assert.ok(r.optimal.sites.every(s=>s.capacity===0));
});
test('infeasible service floor returns an explicit error',()=>{
 assert.throws(()=>plan({...basic(),packs:0,floor:20}),/infeasible/);
});
test('exact dynamic program matches exhaustive enumeration for both objectives',()=>{
 for(const robust of [true,false]){
 const c={...defaults(),hours:12,packs:4,floor:0,hubs:defaults().hubs.slice(0,3),robust};const result=plan(c);let best=-Infinity;
 const cases=stressCases(c);
 for(let a=0;a<=4;a++)for(let b=0;b<=4-a;b++){
 const alloc=[a,b,4-a-b];let score=0;
 c.hubs.forEach((h,i)=>{const s=cases.map(z=>simulateHub(h,alloc[i],c,z));score+=(robust?Math.min(...s.map(x=>x.serviceHours/x.series.length))*c.hours:s[0].serviceHours)*h.seats*h.priority;});best=Math.max(best,score);
 }
 close(result.score,best);assert.ok(result.score>=result.baselineScore-1e-7);
 }
});
test('a feasible floor is met at every hub in every requested stress case',()=>{
 const c={...defaults(),packs:18,packKwh:60,floor:25};const r=plan(c);
 for(const stress of r.stress)assert.ok(stress.result.sites.every(s=>s.coverage>=0.25-1e-8));
});
test('invalid numeric ranges, duplicated ids and malformed imports are rejected',()=>{
 for(const patch of [{hours:Infinity},{packs:2.3},{packKwh:-4},{soc:5,reserve:10},{hubs:[]},{name:''},{hours:49}])assert.throws(()=>validate({...defaults(),...patch}));
 const c=defaults();c.hubs[1].id=c.hubs[0].id;assert.throws(()=>validate(c),/unique/);
 assert.throws(()=>evaluate(defaults(),[20,0,0,0,0,0]),/inventory/);
});
test('weather import validates units, nulls, length and timestamps',()=>{
 const data={hourly_units:{shortwave_radiation:'W/m²',temperature_2m:'°C'},hourly:{shortwave_radiation:Array(96).fill(200),temperature_2m:Array(96).fill(27),time:Array(96).fill('2026-10-23T00:00')}};
 const w=weatherFromResponse(data);assert.equal(w.radiation.length,96);
 const c={...defaults(),weather:w,hours:48,startHour:23};const r=plan(c);assert.ok(r.stress.every(s=>Number.isFinite(s.result.totals.served)));
 data.hourly.shortwave_radiation[0]=null;assert.throws(()=>weatherFromResponse(data));
});
test('CSV export neutralizes formula injection and preserves quotes',()=>{
 const c=defaults();c.hubs[0].name='=HYPERLINK("bad")';const csv=toCsv(plan(c));assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));assert.equal(csv.split('\r\n').length,7);
});
test('more packs cannot decrease the globally optimal objective',()=>{
 let last=-Infinity;for(let k=0;k<=9;k++){const r=plan({...defaults(),packs:k,floor:0});assert.ok(r.score>=last-1e-7);last=r.score;}
});

test('allocation explanations use the actual floor and counterfactual score',()=>{
 const c=defaults(),r=plan(c);
 for(const [i,x] of r.explanations.entries()){
 assert.equal(x.packs,r.optimal.allocation[i]);assert.equal(x.minimumPacks,r.minimum[i]);assert.ok(x.removeOneScoreLoss>=-1e-7);
 assert.equal(x.removalViolatesFloor,x.packs>0&&x.packs-1<x.minimumPacks);
 close(x.nominalCoverage,r.optimal.sites[i].coverage);
 }
});
