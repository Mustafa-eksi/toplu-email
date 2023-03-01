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
const app = (0, express_1.default)();
const port = 8080;
const link = "http://localhost";
app.use(express_1.default.json({ limit: '50mb' }));
app.use(cors.default());
function getService(raw_adress) {
    return raw_adress.split("@")[1].split(".")[0];
}
function sendSingleMail(mailer, from, mail, to_adress) {
    return __awaiter(this, void 0, void 0, function* () {
        let info = yield mailer.sendMail({
            to: to_adress,
            from: from,
            subject: mail.subject,
            text: mail.email_text,
            attachments: mail.email_files
        }).catch(err => { throw err; });
        return info;
    });
}
function sendMultipleMails(s_mail, s_password, mail, to_adresses) {
    return __awaiter(this, void 0, void 0, function* () {
        var mailer = nodemailer_1.default.createTransport({
            service: getService(s_mail),
            auth: {
                user: s_mail,
                pass: s_password
            }
        });
        for (let i = 0; i < to_adresses.length; i++) {
            yield sendSingleMail(mailer, s_mail, mail, to_adresses[i]).catch(err => {
                if (common.debugMode)
                    console.error(err);
            });
        }
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
    const keys = ["sender_mail", "sender_password", "to_adresses", "subject", "email_text", "email_files"];
    if (!common.expectKeys(req.body, keys)) {
        return common.ResErr(res, 400, "Girdi yanlış!");
    }
    let file = Buffer.from(req.body.to_adresses, 'base64');
    let sonuc = (_a = yield extractReceivers(file).catch(err => common.ResErr(res, 500, "extracting receivers: " + err))) !== null && _a !== void 0 ? _a : [""];
    console.log(sonuc);
    let email_files = [];
    req.body.email_files.forEach((e) => {
        email_files.push({
            content: Buffer.from(e.content, 'base64'),
            filename: e.name
        });
    });
    yield sendMultipleMails(req.body.sender_mail, req.body.sender_password, { subject: req.body.subject, email_text: req.body.email_text, email_files: email_files }, sonuc).catch(err => common.ResErr(res, 500, "error while sending mails: " + err));
    common.ResSuc(res, "başarıyla gönderildi");
}));
app.listen(port, () => {
    console.log(`${link}:${port}`);
});
