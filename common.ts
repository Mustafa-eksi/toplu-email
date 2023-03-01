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