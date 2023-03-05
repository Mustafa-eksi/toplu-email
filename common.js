"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.degerleriAl = exports.soruisaretiyap = exports.expectType = exports.expectKeys = exports.ResSuc = exports.ResErr = exports.ERRORS = exports.debugMode = void 0;
exports.debugMode = true;
var ERRORS;
(function (ERRORS) {
    ERRORS[ERRORS["USER_NOT_FOUND"] = 0] = "USER_NOT_FOUND";
    ERRORS[ERRORS["ALREADY_EXISTS"] = 1] = "ALREADY_EXISTS";
})(ERRORS = exports.ERRORS || (exports.ERRORS = {}));
;
function ResErr(res, code, err) {
    if (res.headersSent)
        return;
    if (err) {
        res.status(code);
        res.send(err);
        if (exports.debugMode) {
            console.error(err);
        }
    }
}
exports.ResErr = ResErr;
function ResSuc(res, msg) {
    if (res.headersSent)
        return;
    res.status(200);
    res.send(msg);
}
exports.ResSuc = ResSuc;
function expectKeys(obj, keys) {
    let objkeys_unsorted = Object.keys(obj);
    let objkeys = objkeys_unsorted.sort();
    keys = keys.sort();
    if (JSON.stringify(objkeys) === JSON.stringify(keys))
        return true;
    else {
        if (exports.debugMode) {
            let objkeys = Object.keys(obj);
            console.log("objkeys: ", objkeys);
            console.log("keys: ", keys);
            console.log("Keys wanted but not found:");
            keys.forEach((e, i) => {
                if (!objkeys.includes(e))
                    console.log(e);
            });
            console.log("Keys not wanted but found:");
            objkeys.forEach((e) => {
                if (!keys.includes(e))
                    console.log(e);
            });
            console.log("Count of keys wanted: " + keys.length);
            console.log("Count of keys got: " + objkeys.length);
        }
        return false;
    }
}
exports.expectKeys = expectKeys;
function expectType(obj, type) {
    var _a, _b;
    for (let i = 0; i < type.length; i++) {
        if (!obj[type[i].key]) {
            if (exports.debugMode)
                console.log(`expectType: expected ${type[i].key}: ${type[i].type}. But not found`);
            return false;
        }
        if (type[i].key.startsWith("arrayof")) {
            if (!Array.isArray(obj[type[i].key]))
                return false;
            const typeofarray = type[i].type.substring(8);
            if (typeofarray === "object" && type[i].typeobj) {
                console.log("Hmm");
                return expectType(obj[type[i].key][0], (_a = type[i].typeobj) !== null && _a !== void 0 ? _a : []);
            }
            if (typeof obj[type[i].key][0] !== typeofarray) {
                if (exports.debugMode)
                    console.log(`expectType: expected ${type[i].key}: ${type[i].type}. But found ${type[i].key}: arrayof ${typeof obj[type[i].key][0]}`);
                return false;
            }
            continue;
        }
        if (type[i].type === "object" && type[i].typeobj) {
            return expectType(obj[type[i].key], (_b = type[i].typeobj) !== null && _b !== void 0 ? _b : []);
        }
        if (typeof obj[type[i].key] !== type[i].type) {
            if (exports.debugMode)
                console.log(`expectType: expected ${type[i].key}: ${type[i].type}. But found ${type[i].key}: ${typeof obj[type[i].key]}`);
            return false;
        }
    }
    return true;
}
exports.expectType = expectType;
function soruisaretiyap(sayi) {
    return "?".repeat(sayi).split('').join(",");
}
exports.soruisaretiyap = soruisaretiyap;
function degerleriAl(obj, keyler) {
    let degerler = [];
    keyler.forEach(e => {
        degerler.push(obj[e]);
    });
    return degerler;
}
exports.degerleriAl = degerleriAl;
