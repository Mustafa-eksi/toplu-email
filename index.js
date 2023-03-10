"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const cors = __importStar(require("cors"));
const common = __importStar(require("./common"));
const exceljs = __importStar(require("exceljs"));
const stream_1 = require("stream");
const email_credentials_json_1 = __importDefault(require("./email-credentials.json"));
const mongodb_1 = require("mongodb");
let dbcl = new mongodb_1.MongoClient("mongodb://127.0.0.1:27017"); // bu bir sunucuda çalıştırılacağında farklı olabilir
let emaildb = dbcl.db("toplu-email");
let gonderilenler = emaildb.collection('gonderilenler');
const app = (0, express_1.default)();
const port = 8080;
const link = "http://localhost";
app.use(express_1.default.json({ limit: '50mb' }));
app.use(cors.default());
var mailer = nodemailer_1.default.createTransport(email_credentials_json_1.default);
let pending_mails = [];
setInterval(() => {
    if (pending_mails) {
        pending_mails.forEach((e, i) => __awaiter(void 0, void 0, void 0, function* () {
            if (!e.mail_date)
                return;
            if (e.mail_date.getTime() - new Date().getTime() < 30000) {
                sendMultipleMails(e).catch((err) => {
                    console.error(err);
                });
                pending_mails.splice(i, 1);
            }
        }));
    }
}, 500);
;
;
function sendMultipleMails(mail) {
    return __awaiter(this, void 0, void 0, function* () {
        let gitmeyenler;
        for (let i = 0; i < mail.to_adresses.length; i++) {
            yield mailer.sendMail({
                to: mail.to_adresses[i],
                from: email_credentials_json_1.default.auth.user,
                subject: mail.subject,
                text: mail.email_text,
                attachments: mail.email_files.length === 0 ? undefined : mail.email_files
            }).catch(err => {
                if (common.debugMode)
                    console.error(err);
            });
        }
        // FIXME: gönderilirken hata çıkan kullanıcıları veri tabanına kaydetmemek daha mantıklı olabilir.
        gonderilenler.insertOne({
            mail: mail
        });
    });
}
function extractReceivers(file) {
    return __awaiter(this, void 0, void 0, function* () {
        let wkb = new exceljs.Workbook();
        return wkb.csv.read(stream_1.Readable.from(file)).then((wksheet) => {
            if (!wksheet)
                throw new Error("Wksheet is " + typeof wksheet);
            let result = [];
            for (let i = 2; i <= wksheet.actualRowCount; i++) {
                let cell = wksheet.getRow(i).getCell('A');
                console.log(cell.text, " i : ", i);
                result.push(cell.text);
            }
            return result;
        });
    });
}
app.get('/webui', (req, res) => {
    res.sendFile("C:\\Users\\musta\\programming\\toplu-email\\frontend\\webui.html");
});
app.post('/mailnow', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    //FIXME: dosyasız mail göndermeyi düzelt
    const reqtype = [{ key: "to_adresses", type: "string" }, { key: "subject", type: "string" }, { key: "email_text", type: "string" }, { key: "email_files", type: "arrayof object", typeobj: [{ key: "content", type: "string" }, { key: "name", type: "string" }] }];
    const reqnames = ["to_adresses", "subject", "email_text", "email_files", /*"mail_date"*/ "gonderim"];
    if (!common. /*expectType*/expectKeys(req.body, /*reqtype*/ reqnames)) {
        return common.ResErr(res, 400, "Girdi yanlış!");
    }
    Date.now().toLocaleString();
    let file = Buffer.from(req.body.to_adresses.split(",")[1], 'base64');
    let emailAlacaklar = (_a = yield extractReceivers(file).catch(err => common.ResErr(res, 500, "extracting receivers: " + err))) !== null && _a !== void 0 ? _a : [""];
    console.log(emailAlacaklar);
    let email_files = [];
    console.log(req.body.email_files);
    req.body.email_files.forEach((e) => {
        email_files.push({
            content: Buffer.from(e.content.split(",")[1], "base64"),
            filename: e.name + "." + e.content.substring(e.content.indexOf("/") + 1, e.content.indexOf(";"))
        });
    });
    var mail = { subject: req.body.subject, email_text: req.body.email_text, email_files: email_files, to_adresses: emailAlacaklar };
    if (req.body.gonderim !== "") {
        mail.mail_date = new Date(req.body.gonderim);
        pending_mails.push(mail);
    }
    else {
        yield sendMultipleMails(mail).catch(err => common.ResErr(res, 500, "error while sending mails: " + err));
    }
    common.ResSuc(res, "başarıyla gönderildi/gönderilmesi planlandı");
}));
app.listen(port, () => {
    console.log(`${link}:${port}/webui`);
});
