export type Exercise={name:string;sets:number;reps:string};
const e=(name:string,sets:number,reps='8–12'):Exercise=>({name,sets,reps});
export const workouts=[
 {name:'推 · 胸肩三头',short:'推',hint:'稳定下放，保留 1–2 次余力',ex:[e('杠铃卧推',4,'5–8'),e('上斜哑铃卧推',3),e('坐姿肩推',2,'6–10'),e('哑铃侧平举',3,'12–20'),e('绳索下压',2,'10–15')]},
 {name:'拉 · 背部二头',short:'拉',hint:'肩胛先动，避免借力',ex:[e('高位下拉',3),e('胸托划船',3),e('反向飞鸟',2,'12–20'),e('哑铃弯举',3,'10–15')]},
 {name:'腿 · 下肢基础',short:'腿',hint:'控制动作幅度，保持核心稳定',ex:[e('深蹲',4,'5–8'),e('腿举',3,'10–15'),e('腿弯举',3,'10–15'),e('提踵',3,'12–20'),e('核心卷腹',2,'12–20')]},
 {name:'休息 · 轻松走走',short:'休',hint:'优先补觉，按体感安排轻活动',ex:[]},
 {name:'上肢 · 综合训练',short:'上',hint:'动作质量优先于重量',ex:[e('杠铃卧推',3),e('胸托划船',3),e('高位下拉',3),e('哑铃侧平举',3,'12–20'),e('哑铃弯举',2,'10–15'),e('绳索下压',2,'10–15')]},
 {name:'下肢 · 后侧链',short:'下',hint:'髋部发力，脊柱保持中立',ex:[e('罗马尼亚硬拉',3,'6–10'),e('保加利亚分腿蹲',3),e('腿弯举',3,'10–15'),e('提踵',3,'12–20'),e('核心卷腹',2,'12–20')]},
 {name:'有氧 · 稳态耐力',short:'氧',hint:'以能正常交谈的强度完成',ex:[]},
 {name:'恢复 · 周期收尾',short:'复',hint:'轻柔拉伸，回顾本周期的真实变化',ex:[]}
];
export const workout=(day:number)=>workouts[day===22?7:(day-1)%7];
export const localDate=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function dateNumber(s:string){const [y,m,d]=s.split('-').map(Number);return Date.UTC(y,m-1,d)/86400000;}
export function validDate(s:unknown):s is string{return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&new Date(dateNumber(s)*86400000).toISOString().slice(0,10)===s;}
export function shiftDate(s:string,n:number){return new Date((dateNumber(s)+n)*86400000).toISOString().slice(0,10);}
export const dayFor=(date:string,start:string)=>Math.max(1,Math.min(22,dateNumber(date)-dateNumber(start)+1));
export type SetEntry={weight:string;reps:string;done:boolean};
export type Log={weight?:number;waist?:number;sleep?:number;water?:number;meals?:boolean[];sets?:Record<string,SetEntry>;activity?:boolean;cardioMinutes?:number;cardioDone?:boolean};
export type Shift='night'|'day';
export type TimelineItem={time:string;label:string;optional?:boolean};
export const shiftForDate=(date:string,start:string,end:string):Shift=>date>=start&&date<=end?'night':'day';
export const dateTimeline=(shift:Shift):TimelineItem[]=>shift==='night'?[{time:'14:00',label:'起床'},{time:'15:00',label:'训练前餐'},{time:'15:30–17:00',label:'训练'},{time:'17:00',label:'训练后餐'},{time:'17:30–19:00',label:'补觉 / 小睡'},{time:'20:00',label:'夜班正餐'},{time:'次日 01:00',label:'可选加餐',optional:true}]:[{time:'06:30',label:'起床'},{time:'07:00',label:'早餐'},{time:'08:00–20:00',label:'工作'},{time:'12:00',label:'午餐'},{time:'20:30–21:45',label:'训练'},{time:'22:00',label:'训练后餐'},{time:'22:30',label:'睡觉'}];
export type State={version:1;start:string;shiftStart:string;shiftEnd:string;profile:{height:number;weight:number};logs:Record<string,Log>;targets:Record<string,number>;cardio:number;restSeconds:number;timerEnd:number|null};
export const KEY='night-shift-tracker.v1';
const planMonth=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
export const fresh=():State=>{const m=planMonth();return {version:1,start:localDate(),shiftStart:`${m}-14`,shiftEnd:`${m}-19`,profile:{height:185,weight:185},logs:{},targets:{},cardio:30,restSeconds:90,timerEnd:null};};
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const num=(v:unknown,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
export function validate(raw:unknown):State{
 if(!obj(raw)||raw.version!==1||!validDate(raw.start)||!validDate(raw.shiftStart)||!validDate(raw.shiftEnd)||raw.shiftStart>raw.shiftEnd||!obj(raw.profile)||!num(raw.profile.height,100,250)||!num(raw.profile.weight,40,600)||!obj(raw.logs)||!obj(raw.targets)||!num(raw.cardio,5,180)||!num(raw.restSeconds,15,600)||(raw.timerEnd!==null&&!num(raw.timerEnd,0,8640000000000000)))throw Error('备份格式或版本不受支持');
 const state=fresh();state.start=raw.start;state.shiftStart=raw.shiftStart as string;state.shiftEnd=raw.shiftEnd as string;state.profile={height:raw.profile.height as number,weight:raw.profile.weight as number};state.cardio=raw.cardio as number;state.restSeconds=raw.restSeconds as number;state.timerEnd=raw.timerEnd as number|null;
 if(Object.keys(raw.logs).length>20000)throw Error('记录数量超出限制');
 for(const [date,value] of Object.entries(raw.logs)){
  if(!validDate(date)||!obj(value))throw Error('日期记录无效');const log:Log={};
  for(const [key,min,max] of [['weight',40,600],['waist',30,250],['sleep',0,24],['water',0,10]] as const){if(value[key]!==undefined){if(!num(value[key],min,max))throw Error('身体记录数值无效');log[key]=value[key] as number;}}
  if(value.meals!==undefined){if(!Array.isArray(value.meals)||value.meals.length!==3||value.meals.some(x=>typeof x!=='boolean'))throw Error('餐食记录无效');log.meals=[...value.meals] as boolean[];}
  if(value.activity!==undefined){if(typeof value.activity!=='boolean')throw Error('活动记录无效');log.activity=value.activity;}
  if(value.cardioMinutes!==undefined){if(!num(value.cardioMinutes,0,180))throw Error('有氧时长无效');log.cardioMinutes=value.cardioMinutes as number;}
  if(value.cardioDone!==undefined){if(typeof value.cardioDone!=='boolean')throw Error('有氧状态无效');log.cardioDone=value.cardioDone;}
  if(value.sets!==undefined){if(!obj(value.sets)||Object.keys(value.sets).length>500)throw Error('训练记录无效');log.sets={};for(const [key,v] of Object.entries(value.sets)){if(!/^\d{1,2}-\d-\d{1,2}$/.test(key)||!obj(v)||typeof v.done!=='boolean'||typeof v.weight!=='string'||typeof v.reps!=='string'||!/^\d{0,3}(\.\d{0,2})?$/.test(v.weight)||!/^\d{0,3}$/.test(v.reps))throw Error('组数记录无效');log.sets[key]={weight:v.weight,reps:v.reps,done:v.done};}}
  state.logs[date]=log;
 }
 for(const [key,value] of Object.entries(raw.targets)){if(!/^\d-\d$/.test(key)||!num(value,1,8)||!Number.isInteger(value))throw Error('目标组数无效');state.targets[key]=value as number;}
 return state;
}
export function load(storage:Pick<Storage,'getItem'>):{state:State;error:string}{try{const s=storage.getItem(KEY);return {state:s?validate(JSON.parse(s)):fresh(),error:''};}catch{return {state:fresh(),error:'本地数据无法读取。原始数据未覆盖，请先导出原始备份或重置。'};}}
export function mean7(logs:State['logs'],end:string){const values=Object.entries(logs).filter(([d,l])=>d<=end&&dateNumber(d)>dateNumber(end)-7&&l.weight!==undefined).map(([,l])=>l.weight!);return {count:values.length,value:values.length?values.reduce((a,b)=>a+b,0)/values.length:null};}
