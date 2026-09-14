import {describe,it,expect} from 'vitest';
import {fresh,validate,load,KEY,workout,mean7,shiftDate,dayFor,validDate} from './domain';
describe('22-day schedule and local calendar',()=>{
 it('repeats three rounds and ends in recovery',()=>{expect(workout(1).short).toBe('推');expect(workout(8)).toBe(workout(1));expect(workout(21).short).toBe('氧');expect(workout(22).short).toBe('复');expect(workout(1).ex.map(e=>e.sets)).toEqual([4,3,2,3,2]);});
 it('uses calendar days over DST and leap days',()=>{expect(shiftDate('2026-03-08',1)).toBe('2026-03-09');expect(shiftDate('2024-02-28',1)).toBe('2024-02-29');expect(dayFor('2026-11-02','2026-11-01')).toBe(2);expect(validDate('2026-02-30')).toBe(false);});
 it('clamps dates outside the plan',()=>{expect(dayFor('2026-01-01','2026-02-01')).toBe(1);expect(dayFor('2026-03-01','2026-02-01')).toBe(22);});
});
describe('validated local persistence',()=>{
 it('round trips real set records without fabricating health data',()=>{const s=fresh();s.logs['2026-09-14']={sets:{'1-0-0':{weight:'60',reps:'8',done:true}}};expect(validate(JSON.parse(JSON.stringify(s)))).toEqual(s);expect(s.logs['2026-09-14'].weight).toBeUndefined();});
 it('rejects bad versions, dates, numeric ranges and malformed sets',()=>{for(const v of [{...fresh(),version:2},{...fresh(),start:'bad'},{...fresh(),cardio:Infinity},{...fresh(),logs:{'2026-09-14':{weight:2}}},{...fresh(),logs:{'2026-09-14':{sets:{'x':{}}}}}])expect(()=>validate(v)).toThrow();});
 it('surfaces corrupted storage without mutating it',()=>{const getItem=()=>'{bad';const result=load({getItem});expect(result.error).toBeTruthy();expect(result.state.logs).toEqual({});expect(load({getItem:k=>k===KEY?JSON.stringify(fresh()):null}).error).toBe('');});
 it('preserves timer end timestamps across reload',()=>{const s=fresh();s.timerEnd=Date.now()+90000;expect(validate(s).timerEnd).toBe(s.timerEnd);});
});
describe('honest progress statistics',()=>{
 it('round trips optional daily cardio while accepting older backups',()=>{const s=fresh();s.logs['2026-09-14']={cardioMinutes:18,cardioDone:true};expect(validate(s).logs['2026-09-14']).toEqual(s.logs['2026-09-14']);expect(validate(fresh()).logs).toEqual({});s.logs['2026-09-14'].cardioMinutes=-1;expect(()=>validate(s)).toThrow();});
 it('averages actual data only and excludes future and older values',()=>{const logs={'2026-09-14':{weight:180},'2026-09-08':{weight:184},'2026-09-07':{weight:200},'2026-09-15':{weight:170},'2026-09-12':{sleep:8}};expect(mean7(logs,'2026-09-14')).toEqual({count:2,value:182});});
 it('has an explicit empty state',()=>expect(mean7({},'2026-09-14')).toEqual({count:0,value:null}));
});
