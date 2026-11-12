import { openDB } from 'idb';
export type SetLog={weight:number|null,reps:number|null,rir:number|null,done:boolean};
export type SessionExercise={exerciseId:string,name:string,sets:SetLog[],notes:string};
export type Session={id:string,templateName:string,split:string,date:string,startedAt:string,finishedAt?:string,notes:string,exercises:SessionExercise[]};
const dbPromise=openDB('ppl-training-library',1,{upgrade(db){db.createObjectStore('sessions',{keyPath:'id'});db.createObjectStore('templates',{keyPath:'id'});db.createObjectStore('settings',{keyPath:'key'});db.createObjectStore('measurements',{keyPath:'id'});}});
export async function allSessions():Promise<Session[]>{return (await dbPromise).getAll('sessions');}
export async function saveSession(s:Session){return (await dbPromise).put('sessions',s);}
export async function deleteSession(id:string){return (await dbPromise).delete('sessions',id);}
export async function getSetting<T>(key:string,fallback:T):Promise<T>{const v=await (await dbPromise).get('settings',key);return v?.value??fallback;}
export async function saveSetting(key:string,value:unknown){return (await dbPromise).put('settings',{key,value});}
export async function allMeasurements(){return (await dbPromise).getAll('measurements');}
export async function saveMeasurement(m:{id:string,date:string,weight:number}){return (await dbPromise).put('measurements',m);}
