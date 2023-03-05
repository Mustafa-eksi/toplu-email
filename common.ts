import express from 'express';

export const debugMode = true;
export enum ERRORS {
    USER_NOT_FOUND,
    ALREADY_EXISTS
};

export function ResErr(res: express.Response<Record<string, any> | string>, code:number, err:string) {
    if(res.headersSent)
        return;
    if(err) {
        res.status(code);
        res.send(err);
        if(debugMode) {
            console.error(err);
        }
    }
}

export function ResSuc(res: express.Response<Record<string, any> | string>, msg:string){
    if(res.headersSent)
        return;
    res.status(200);
    res.send(msg);
}

export function expectKeys(obj: Object, keys: string[]): boolean {
    let objkeys_unsorted = Object.keys(obj)
    let objkeys = objkeys_unsorted.sort()
    keys = keys.sort()
    if(JSON.stringify(objkeys) === JSON.stringify(keys))
        return true;
    else {
        if(debugMode) {
            let objkeys = Object.keys(obj);
            console.log("objkeys: ", objkeys);
            console.log("keys: ", keys)
            console.log("Keys wanted but not found:")
            keys.forEach((e,i)=>{
                if(!objkeys.includes(e))
                    console.log(e)
            })
            console.log("Keys not wanted but found:")
            objkeys.forEach((e)=>{
                if(!keys.includes(e))
                    console.log(e)
            })
            console.log("Count of keys wanted: " + keys.length)
            console.log("Count of keys got: " + objkeys.length)
        }
        return false;
    }
}

export interface CommonType {
    key:string,
    type:string,
    typeobj?: CommonObject
}

export type CommonObject = CommonType[];

export function expectType(obj: Indexable, type: CommonObject): boolean {
    for(let i = 0; i < type.length; i++) {
        if(!obj[type[i].key]) {
            if(debugMode)
                console.log(`expectType: expected ${type[i].key}: ${type[i].type}. But not found`)
            return false;
        }
        if(type[i].key.startsWith("arrayof")) {
            if(!Array.isArray(obj[type[i].key]))
                return false;
            const typeofarray = type[i].type.substring(8);
            if(typeofarray === "object" && type[i].typeobj) {
                console.log("Hmm")
                return expectType(obj[type[i].key][0], type[i].typeobj ?? []);
            }
            if(typeof obj[type[i].key][0] !== typeofarray) {
                if(debugMode)
                    console.log(`expectType: expected ${type[i].key}: ${type[i].type}. But found ${type[i].key}: arrayof ${typeof obj[type[i].key][0]}`)
                return false;
            }
            continue
        }
        if(type[i].type === "object" && type[i].typeobj) {
            return expectType(obj[type[i].key], type[i].typeobj ?? []);
        }
        if(typeof obj[type[i].key] !== type[i].type) {
            if(debugMode)
                console.log(`expectType: expected ${type[i].key}: ${type[i].type}. But found ${type[i].key}: ${typeof obj[type[i].key]}`)
            return false;
        }
      
    }
    return true;
}

export function soruisaretiyap(sayi:number): string {
    return "?".repeat(sayi).split('').join(",");
}

interface Indexable {
    [key: string]: any
}

export function degerleriAl(obj: Indexable, keyler: string[]): Array<any> {
    let degerler: any[] = [];
    keyler.forEach(e=>{
        degerler.push(obj[e])
    })
    return degerler;
}