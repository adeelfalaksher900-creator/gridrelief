/* GridRelief: deterministic planning model. All energy steps are one hour. */
export const VERSION = '1.0.0';
export const SOURCE_URL = 'https://open-meteo.com/en/docs';
export const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=35.2271&longitude=-80.8431&hourly=temperature_2m,shortwave_radiation&forecast_days=4&timezone=America%2FNew_York';
export const DEFAULT_HUBS = [
  {id:'north',name:'Northside community hub',area:'North district',seats:120,priority:1.7,solar:3,communications:0.35,refrigeration:1.2,cooling:2.6,lighting:0.45},
  {id:'east',name:'Eastside neighborhood center',area:'East district',seats:90,priority:1.9,solar:0,communications:0.25,refrigeration:0.6,cooling:1.4,lighting:0.25},
  {id:'west',name:'Westside resource hub',area:'West district',seats:160,priority:1.6,solar:6,communications:0.4,refrigeration:1.5,cooling:3.4,lighting:0.6},
  {id:'central',name:'Central library hub',area:'Central district',seats:65,priority:1.1,solar:5,communications:0.2,refrigeration:0.15,cooling:0.8,lighting:0.2},
  {id:'south',name:'Southside food pantry',area:'South district',seats:45,priority:1.4,solar:2,communications:0.15,refrigeration:1.7,cooling:0.35,lighting:0.15},
  {id:'river',name:'Riverside gathering space',area:'River district',seats:75,priority:1.3,solar:0,communications:0.2,refrigeration:0.3,cooling:1.1,lighting:0.25}
];
export function defaults(){return {version:VERSION,name:'Charlotte storm exercise',hours:24,startHour:16,packs:8,packKwh:30,packKw:5,soc:90,reserve:10,efficiency:94,solarFactor:55,demandFactor:100,floor:10,robust:true,weather:null,hubs:structuredClone(DEFAULT_HUBS)};}
const finite=(v,min,max,label)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw new Error(`${label} must be between ${min} and ${max}.`);};
export function validate(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('A scenario must be a JSON object.');
  const c={...raw,version:VERSION};
  if(typeof c.name!=='string'||!c.name.trim()||c.name.length>80)throw new Error('Use a scenario name of 1–80 characters.');
  c.name=c.name.trim();
  for(const [key,min,max] of [['hours',6,48],['startHour',0,23],['packs',0,18],['packKwh',1,100],['packKw',0.2,40],['soc',5,100],['reserve',0,40],['efficiency',70,100],['solarFactor',0,120],['demandFactor',50,200],['floor',0,60]])finite(c[key],min,max,key);
  for(const key of ['hours','startHour','packs'])if(!Number.isInteger(c[key]))throw new Error(`${key} must be a whole number.`);
  if(c.soc<c.reserve)throw new Error('Initial state of charge cannot be below the reserve.');
  if(typeof c.robust!=='boolean')throw new Error('Robust planning must be true or false.');
  if(!Array.isArray(c.hubs)||c.hubs.length<1||c.hubs.length>8)throw new Error('Include between 1 and 8 hubs.');
  const ids=new Set();
  c.hubs=c.hubs.map(h=>{
    if(!h||typeof h!=='object'||typeof h.id!=='string'||!/^[a-z0-9-]{1,30}$/.test(h.id)||ids.has(h.id))throw new Error('Each hub needs a unique, simple id.');
    ids.add(h.id);
    for(const key of ['name','area'])if(typeof h[key]!=='string'||!h[key].trim()||h[key].length>80)throw new Error('Hub names and areas must contain 1–80 characters.');
    for(const [key,min,max] of [['seats',1,1000],['priority',1,3],['solar',0,50],['communications',0,30],['refrigeration',0,30],['cooling',0,50],['lighting',0,20]])finite(h[key],min,max,key);
    if(h.communications+h.refrigeration+h.cooling+h.lighting<=0)throw new Error(`${h.name} needs at least one electrical load.`);
    return Object.fromEntries(['id','name','area','seats','priority','solar','communications','refrigeration','cooling','lighting'].map(k=>[k,h[k]]));
  });
  if(c.weather!==null){
    const w=c.weather;
    if(!w||typeof w!=='object'||!Array.isArray(w.radiation)||!Array.isArray(w.temperature)||!Array.isArray(w.time)||w.radiation.length<84||w.radiation.length>96||w.temperature.length!==w.radiation.length||w.time.length!==w.radiation.length)throw new Error('Weather data must include 84–96 matched hourly records.');
    w.radiation.forEach(v=>finite(v,0,1600,'Solar radiation'));
    w.temperature.forEach(v=>finite(v,-70,65,'Temperature'));
    if(w.time.some(v=>typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)))throw new Error('Weather timestamps must use local ISO hourly format.');
    if(typeof w.fetchedAt!=='string'||!Number.isFinite(Date.parse(w.fetchedAt)))throw new Error('Weather retrieval time is missing.');
    c.weather={radiation:[...w.radiation],temperature:[...w.temperature],time:[...w.time],fetchedAt:w.fetchedAt,source:'Open-Meteo',timezone:'America/New_York'};
  }
  return Object.fromEntries(['version','name','hours','startHour','packs','packKwh','packKw','soc','reserve','efficiency','solarFactor','demandFactor','floor','robust','weather','hubs'].map(k=>[k,c[k]]));
}
export function weatherFromResponse(data,now=new Date()){
  if(!data?.hourly||data.hourly_units?.shortwave_radiation!=='W/m²'||data.hourly_units?.temperature_2m!=='°C')throw new Error('Unexpected weather units; the previous scenario has been retained.');
  const base=defaults();
  base.weather={radiation:data.hourly.shortwave_radiation,temperature:data.hourly.temperature_2m,time:data.hourly.time,fetchedAt:now.toISOString()};
  return validate(base).weather;
}
export function conditions(c,t,stress={}){
  const hour=(c.startHour+t)%24;
  // Frozen synthetic training curves, not observations or a forecast.
  const radiation=c.weather?c.weather.radiation[c.startHour+t]:Math.max(0,Math.sin((hour-6)/12*Math.PI))*780;
  const temperature=c.weather?c.weather.temperature[c.startHour+t]:29+5*Math.sin((hour-8)/12*Math.PI);
  return {hour,radiation:radiation*(c.solarFactor/100)*(stress.solar??1),temperature};
}
export function simulateHub(h,packs,c,stress={}){
  const hours=stress.hours??c.hours;
  const capacity=packs*c.packKwh, reserve=capacity*c.reserve/100, eta=Math.sqrt(c.efficiency/100);
  let stored=capacity*c.soc/100;
  const initial=stored, series=[];
  let served=0,demand=0,pvTotal=0,losses=0,spill=0,serviceHours=0,fullHours=0,firstGap=null;
  for(let t=0;t<hours;t++){
    const w=conditions(c,t,stress);
    const coolingMultiplier=Math.max(0.5,Math.min(2.5,0.75+Math.max(0,w.temperature-24)*0.075));
    const need=(h.communications+h.refrigeration+h.cooling*coolingMultiplier+h.lighting*(w.hour>=18||w.hour<7?1:0.35))*c.demandFactor/100*(stress.demand??1);
    const pv=h.solar*w.radiation/1000*0.8;
    const direct=Math.min(need,pv), gap=Math.max(0,need-direct);
    const discharge=Math.min(gap,packs*c.packKw,Math.max(0,stored-reserve)*eta);
    stored-=discharge/eta;
    const charge=Math.min(Math.max(0,pv-direct),packs*c.packKw,Math.max(0,capacity-stored)/eta);
    stored+=charge*eta;
    const supplied=direct+discharge, fraction=Math.min(1,supplied/need);
    const wasted=Math.max(0,pv-direct-charge), loss=discharge/eta-discharge+charge*(1-eta);
    served+=supplied; demand+=need; pvTotal+=pv; spill+=wasted; losses+=loss; serviceHours+=fraction;
    if(fraction>1-1e-8)fullHours++;else if(firstGap===null)firstGap=t;
    series.push({t,hour:w.hour,demand:need,pv,served:supplied,unserved:Math.max(0,need-supplied),stored,soc:capacity?stored/capacity*100:0,fraction,charge,discharge,spill:wasted,loss});
  }
  return {id:h.id,packs,capacity,served,demand,unserved:demand-served,pv:pvTotal,losses,spill,initial,ending:stored,serviceHours,coverage:served/demand,fullHours,firstGap,personHours:serviceHours*h.seats,series};
}
export function evaluate(c,allocation,stress={}){
  if(!Array.isArray(allocation)||allocation.length!==c.hubs.length||allocation.some(k=>!Number.isInteger(k)||k<0)||allocation.reduce((a,b)=>a+b,0)>c.packs)throw new Error('Allocation exceeds the available battery inventory.');
  const sites=c.hubs.map((h,i)=>simulateHub(h,allocation[i],c,stress));
  const totals={served:0,demand:0,unserved:0,personHours:0,serviceHours:0,pv:0,losses:0,spill:0};
  for(const s of sites)for(const k of Object.keys(totals))totals[k]+=s[k];
  totals.coverage=totals.served/totals.demand;
  totals.minimumCoverage=Math.min(...sites.map(s=>s.coverage));
  const hours=stress.hours??c.hours;
  const series=Array.from({length:hours},(_,t)=>{
    const row={t,hour:(c.startHour+t)%24,demand:0,served:0,pv:0,stored:0,soc:0};
    for(const s of sites)for(const k of ['demand','served','pv','stored'])row[k]+=s.series[t][k];
    row.soc=c.packs?row.stored/(allocation.reduce((a,b)=>a+b,0)*c.packKwh||1)*100:0;
    return row;
  });
  return {allocation:[...allocation],sites,totals,series};
}
export function stressCases(c){return [{id:'nominal',name:'Planned outage',hours:c.hours,solar:1,demand:1},{id:'cloud',name:'Solar output −40%',hours:c.hours,solar:0.6,demand:1},{id:'extended',name:'Outage +12h · demand +15%',hours:Math.min(60,c.hours+12),solar:0.8,demand:1.15}];}
export function plan(raw){
  const c=validate(raw), cases=stressCases(c), n=c.hubs.length;
  const cache=c.hubs.map(h=>Array.from({length:c.packs+1},(_,k)=>cases.map(stress=>simulateHub(h,k,c,stress))));
  const optionScore=(i,k)=>{
    const options=cache[i][k];
    const hours=c.robust?Math.min(...options.map(x=>x.serviceHours/x.series.length))*c.hours:options[0].serviceHours;
    return hours*c.hubs[i].seats*c.hubs[i].priority;
  };
  const minimum=cache.map(options=>options.findIndex(casesForPack=>(c.robust?Math.min(...casesForPack.map(x=>x.coverage)):casesForPack[0].coverage)+1e-9>=c.floor/100));
  if(minimum.some(k=>k===-1)||minimum.reduce((a,b)=>a+b,0)>c.packs)throw new Error(`The ${c.floor}% minimum service floor is infeasible with ${c.packs} packs. Add batteries, reduce loads, or lower the floor.`);
  let states=Array(c.packs+1).fill(null);states[0]={score:0,allocation:[]};
  let transitions=0;
  for(let i=0;i<n;i++){
    const next=Array(c.packs+1).fill(null);
    for(let used=0;used<=c.packs;used++)if(states[used]){
      for(let k=minimum[i];used+k<=c.packs;k++){
        transitions++;
        const score=states[used].score+optionScore(i,k), total=used+k;
        if(!next[total]||score>next[total].score+1e-9)next[total]={score,allocation:[...states[used].allocation,k]};
      }
    }
    states=next;
  }
  const best=states[c.packs];
  if(!best)throw new Error('No feasible allocation was found.');
  const baseline=[...minimum]; let remainder=c.packs-baseline.reduce((a,b)=>a+b,0), j=0;
  while(remainder-->0){baseline[j%n]++;j++;}
  const optimal=evaluate(c,best.allocation), equal=evaluate(c,baseline);
  const stress=cases.map(test=>({id:test.id,name:test.name,hours:test.hours,result:evaluate(c,best.allocation,test),baseline:evaluate(c,baseline,test)}));
  const explanations=c.hubs.map((h,i)=>{const k=best.allocation[i];return {id:h.id,packs:k,minimumPacks:minimum[i],nominalCoverage:cache[i][k][0].coverage,stressMinimumCoverage:Math.min(...cache[i][k].map(s=>s.coverage)),removeOneScoreLoss:k?optionScore(i,k)-optionScore(i,k-1):0,removalViolatesFloor:k>0&&k-1<minimum[i]};});
  return {version:VERSION,scenario:c,optimal,explanations,baseline:equal,stress,score:best.score,baselineScore:baseline.reduce((sum,k,i)=>sum+optionScore(i,k),0),minimum,transitions,method:c.robust?'Exact DP · conservative per-hub stress score':'Exact DP · nominal weighted service',generatedAt:new Date().toISOString()};
}
export function toCsv(result){
  const quote=s=>'"'+String(s).replaceAll('"','""')+'"';
  // Prefix spreadsheet formula triggers in untrusted text fields.
  const safe=s=>quote(/^[=+@\-\t\r]/.test(String(s))?"'"+s:s);
  const rows=[['Hub','Area','Battery packs','Storage kWh','Service coverage %','Equivalent service hours','Unserved kWh','Priority weight']];
  result.scenario.hubs.forEach((h,i)=>{const s=result.optimal.sites[i];rows.push([h.name,h.area,s.packs,s.capacity,(s.coverage*100).toFixed(2),s.serviceHours.toFixed(2),s.unserved.toFixed(2),h.priority]);});
  return rows.map(row=>row.map(safe).join(',')).join('\r\n');
}
