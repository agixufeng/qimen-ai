/** Independent fixture derivation. Does not import core or read its output.
 * AI-assisted derivation of the approved v1 rules, not human-certified gold data.
 * lunar-javascript is used ONLY for civil-date calendar facts and solar terms.
 */
import { Solar } from 'lunar-javascript';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const stems = [...'甲乙丙丁戊己庚辛壬癸'];
const branches = [...'子丑寅卯辰巳午未申酉戌亥'];
const ring = [1,8,3,4,9,2,7,6];
const stars = {1:'天蓬',8:'天任',3:'天冲',4:'天辅',9:'天英',2:'天芮',7:'天柱',6:'天心'};
const doors = {1:'休门',8:'生门',3:'伤门',4:'杜门',9:'景门',2:'死门',7:'惊门',6:'开门'};
const gods = ['值符','螣蛇','太阴','六合','白虎','玄武','九地','九天'];
const sequences = [...'戊己庚辛壬癸丁丙乙'];
const juTable = {
  冬至:[1,7,4],小寒:[2,8,5],大寒:[3,9,6],立春:[8,5,2],雨水:[9,6,3],惊蛰:[1,7,4],
  春分:[3,9,6],清明:[4,1,7],谷雨:[5,2,8],立夏:[4,1,7],小满:[5,2,8],芒种:[6,3,9],
  夏至:[9,3,6],小暑:[8,2,5],大暑:[7,1,4],立秋:[2,5,8],处暑:[1,4,7],白露:[9,3,6],
  秋分:[7,1,4],寒露:[6,9,3],霜降:[5,8,2],立冬:[6,9,3],小雪:[5,8,2],大雪:[4,7,1],
};
const mod = (n,m) => ((n%m)+m)%m;
const ganzhi = n => stems[mod(n,10)] + branches[mod(n,12)];
const cycleIndex = text => Array.from({length:60},(_,i)=>ganzhi(i)).indexOf(text);
const host = id => id===5 ? 2 : id;

function derive(input) {
  const solar = Solar.fromYmdHms(input.year,input.month,input.day,input.hour,input.minute,input.second);
  const lunar = solar.getLunar();
  const term = lunar.getPrevJieQi();
  const termName = term.getName();
  if (!juTable[termName]) throw new Error(`Unknown solar term ${termName}`);
  // Separate the civil instant (term) from the explicit 23:00 day convention.
  const civilDay = Solar.fromYmd(input.year,input.month,input.day);
  const effectiveDay = input.hour===23 ? civilDay.next(1) : civilDay;
  const dayGz = effectiveDay.getLunar().getDayInGanZhi();
  const dayIndex = cycleIndex(dayGz);
  if (dayIndex<0) throw new Error('Invalid calendar day');
  const fuIndex = dayIndex - dayIndex%5;
  const fuBranch = fuIndex%12;
  const yuanIndex = [0,3,6,9].includes(fuBranch) ? 0 : [2,5,8,11].includes(fuBranch) ? 1 : 2;
  const yuan = ['上元','中元','下元'][yuanIndex];
  const direction = Object.keys(juTable).indexOf(termName)<12 ? 1 : -1;
  const dun = direction===1 ? '阳遁' : '阴遁';
  const ju = juTable[termName][yuanIndex];
  const hourBranch = Math.floor((input.hour+1)/2)%12;
  const hourStem = ((dayIndex%10)%5*2+hourBranch)%10;
  const hourGz = stems[hourStem]+branches[hourBranch];
  const hourIndex = cycleIndex(hourGz);
  const decade = Math.floor(hourIndex/10);
  const xunShou = ganzhi(decade*10);
  const hiddenStem = sequences[decade];
  const earth = {};
  sequences.forEach((stem,i)=>{earth[mod(ju-1+direction*i,9)+1]=stem;});
  const origin = Number(Object.keys(earth).find(id=>earth[id]===hiddenStem));
  const sourceHost = host(origin);
  const locatingStem = hourStem===0 ? hiddenStem : stems[hourStem];
  const rawTarget = Number(Object.keys(earth).find(id=>earth[id]===locatingStem));
  const starTarget = host(rawTarget);
  const hourSteps = hourIndex%10;
  const doorRaw = mod(origin-1+direction*hourSteps,9)+1;
  const doorTarget = host(doorRaw);
  const starRotation = mod(ring.indexOf(starTarget)-ring.indexOf(sourceHost),8);
  const doorRotation = mod(ring.indexOf(doorTarget)-ring.indexOf(sourceHost),8);
  const palaces = Array.from({length:9},(_,i)=>({id:i+1,earthStem:earth[i+1],heavenStems:[],hostedEarthStems:i+1===2?[earth[5]]:[],stars:[],door:null,deity:null}));
  const starMoves = [], doorMoves = [], deityMoves = [];
  ring.forEach((from,i)=>{
    const to = ring[(i+starRotation)%8];
    palaces[to-1].stars = from===2 ? ['天芮','天禽'] : [stars[from]];
    palaces[to-1].heavenStems = from===2 ? [earth[2],earth[5]] : [earth[from]];
    starMoves.push({from,to,stars:palaces[to-1].stars,heavenStems:palaces[to-1].heavenStems});
    const doorTo=ring[(i+doorRotation)%8];
    palaces[doorTo-1].door=doors[from];
    doorMoves.push({from,to:doorTo,door:doors[from]});
  });
  gods.forEach((deity,i)=>{
    const to=ring[mod(ring.indexOf(starTarget)+direction*i,8)];
    palaces[to-1].deity=deity;
    deityMoves.push({deity,to});
  });
  return {
    input,
    expected:{dun,ju,yuan,xunShou,hiddenStem,chiefStar:{name:origin===5?'天禽':stars[sourceHost],origin,palace:starTarget},chiefDoor:{name:doors[sourceHost],origin,palace:doorTarget,rawPalace:doorRaw},palaces},
    provenance:{
      kind:'ai-assisted-independent-rule-derivation',
      source:'用户批准的 shijia-zhuanpan-chaibu-v1 规则（2026-10-28）；历法事实仅取 lunar-javascript 1.7.7；未读取 core 算法或调用 generateQimen。非人工审定、非外部古籍完整盘面。',
      workings:{
        calendar:{civilTimeUTC8:`${solar.toYmdHms()}+08:00`,term:termName,termStartsAtUTC8:`${term.getSolar().toYmdHms()}+08:00`,effectiveDay:effectiveDay.toYmd(),dayGz,dayCycleIndex:dayIndex,hourGz,hourCycleIndex:hourIndex},
        yuan:{fuTou:ganzhi(fuIndex),fuTouBranch:branches[fuBranch],daysAfterFuTou:dayIndex%5,yuan,termJuTriplet:juTable[termName]},
        earth:{start:ju,direction,sequence:sequences,palaces:earth,centerHostedAt:2},
        chief:{xunShou,hiddenStem,origin,sourceHost,locatingStem,rawStarTarget:rawTarget,starTarget,hourSteps,doorRaw,doorTarget},
        rotation:{ring,starRotation,doorRotation,starMoves,doorMoves,deityMoves},
      },
    },
  };
}

// Select complete 18-ju coverage with nonzero rotations, all six xun, and center cases.
const buckets = new Map();
for (let d=0;d<365;d++) {
  const date=Solar.fromYmd(2026,1,1).next(d);
  for (const hour of [1,3,5,7,9,11,13,15,17,19,21,23]) {
    const candidate=derive({year:date.getYear(),month:date.getMonth(),day:date.getDay(),hour,minute:24,second:0});
    const key=`${candidate.expected.dun}-${candidate.expected.ju}`;
    if(!buckets.has(key)) buckets.set(key,[]);
    buckets.get(key).push(candidate);
  }
}
const entries=[], usedXun=new Map(), usedYuan=new Map();
for(const dun of ['阳遁','阴遁']) for(let ju=1;ju<=9;ju++) {
  const candidates=buckets.get(`${dun}-${ju}`);
  if(!candidates?.length) throw new Error(`Missing ${dun}${ju}`);
  const selected=[];
  for(let sample=0;sample<2;sample++) {
    const score=c=>{
      const w=c.provenance.workings, e=c.expected;
      if(selected.some(a=>a.input.day===c.input.day&&a.input.month===c.input.month)) return -1e6;
      let s=(w.rotation.starRotation!==0?5:0)+(w.rotation.doorRotation!==0?5:0)+(w.chief.hourSteps!==0?3:0);
      s+=30/(1+(usedXun.get(e.xunShou)||0))+10/(1+(usedYuan.get(e.yuan)||0));
      s+= sample===0 ? (w.chief.origin===5?15:0) : (w.chief.doorRaw===5?15:0)+(w.chief.rawStarTarget===5?15:0);
      if(selected.length&&selected[0].expected.xunShou!==e.xunShou)s+=20;
      if(selected.length&&selected[0].provenance.workings.chief.hourSteps!==w.chief.hourSteps)s+=8;
      return s;
    };
    const chosen=candidates.reduce((a,b)=>score(b)>score(a)?b:a);
    chosen.id=`${dun==='阳遁'?'yang':'yin'}-${ju}-${sample+1}`;
    entries.push(chosen);selected.push(chosen);
    usedXun.set(chosen.expected.xunShou,(usedXun.get(chosen.expected.xunShou)||0)+1);
    usedYuan.set(chosen.expected.yuan,(usedYuan.get(chosen.expected.yuan)||0)+1);
  }
}
writeFileSync(fileURLToPath(new URL('./reference-36.json',import.meta.url)),JSON.stringify(entries,null,2)+'\n');
console.log(JSON.stringify({count:entries.length,xun:Object.fromEntries(usedXun),yuan:Object.fromEntries(usedYuan),centerOrigin:entries.filter(x=>x.expected.chiefStar.origin===5).length,centerStarTarget:entries.filter(x=>x.provenance.workings.chief.rawStarTarget===5).length,centerDoor:entries.filter(x=>x.expected.chiefDoor.rawPalace===5).length,starRotations:[...new Set(entries.map(x=>x.provenance.workings.rotation.starRotation))],doorRotations:[...new Set(entries.map(x=>x.provenance.workings.rotation.doorRotation))]},null,2));
