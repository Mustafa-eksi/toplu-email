import express from 'express';
import nodemailer from 'nodemailer';
import * as cors from "cors";
import * as common from './common';
import * as exceljs from 'exceljs';
import {Readable} from 'stream'
import credentials from './email-credentials.json';
import { MongoClient } from "mongodb";
let dbcl = new MongoClient("mongodb://127.0.0.1:27017"); // bu bir sunucuda çalıştırılacağında farklı olabilir
let emaildb = dbcl.db("toplu-email");
let gonderilenler = emaildb.collection('gonderilenler');

const app = express();
const port = 8080;
const link = "http://localhost";
app.use(express.json({limit: '50mb'}));

app.use(cors.default());

var mailer = nodemailer.createTransport(credentials);

let pending_mails: Mail[] = [];
setInterval(()=>{ // 12:45:01 12:44:59 -> 12:45:29
    if(pending_mails) {
        pending_mails.forEach(async(e)=>{
            if(e.mail_date.getTime() - new Date().getTime() < 30000) {
                await sendMultipleMails(e).catch((err)=>{
                    console.error(err)
                });
            }
        })
    }
}, 500)

interface Attachment {
    content?: string | Buffer;
    /** filename to be reported as the name of the attached file, use of unicode is allowed. If you do not want to use a filename, set this value as false, otherwise a filename is generated automatically */
    filename?: string | false | undefined;
    /** If set and content is string, then encodes the content to a Buffer using the specified encoding. Example values: base64, hex, binary etc. Useful if you want to use binary attachments in a JSON formatted e-mail object */
    encoding?: string | undefined;
    /** an optional value that overrides entire node content in the mime message. If used then all other options set for this node are ignored. */
    raw?: Buffer;
}

interface Mail {
    subject: string, email_text: string, email_files: Attachment[], mail_date: Date, to_adresses: string[]
};


interface Gonderilen {
    mail: Mail,
    to_adresses: string[]
};

async function sendMultipleMails(mail: Mail) {
    let gitmeyenler: string[];
    for(let i = 0; i < mail.to_adresses.length; i++) {
        await mailer.sendMail({
            to: mail.to_adresses[i],
            from:credentials.auth.user,
            subject:mail.subject,
            text:mail.email_text,
            attachments: mail.email_files.length === 0 ? undefined : mail.email_files
        }).catch(err=>{
            if(common.debugMode)
                console.error(err);
        })
    }
    // FIXME: gönderilirken hata çıkan kullanıcıları veri tabanına kaydetmemek daha mantıklı olabilir.
    gonderilenler.insertOne({
        mail: mail
    } as Gonderilen);
}

async function extractReceivers(file: Buffer): Promise<string[]> {
    let wkb = new exceljs.Workbook();
    return wkb.csv.read(Readable.from(file)).then((wksheet)=>{
        if(!wksheet)
            throw new Error("Wksheet is " + typeof wksheet)
        let result: string[] = [];
        for(let i = 2; i <= wksheet.actualRowCount; i++) {
            let cell = wksheet.getRow(i).getCell('A');
            console.log(cell.text, " i : ", i)
            result.push(cell.text)
        }
        return result;
    })
}

app.get('/webui', (req, res)=>{
    res.sendFile("C:\\Users\\musta\\programming\\toplu-email\\frontend\\webui.html")
});

app.post('/mailnow', async(req, res)=>{
    //FIXME: dosyasız mail göndermeyi düzelt
    const reqtype: common.CommonObject = [{key: "to_adresses", type: "string"}, {key: "subject", type:"string"}, {key:"email_text", type:"string"}, {key:"email_files", type:"arrayof object", typeobj: [{key:"content", type:"string"}, {key:"name", type:"string"}]}]
    const reqnames: string[] = ["to_adresses","subject", "email_text", "email_files", /*"mail_date"*/"gonderim"]
    if(!common./*expectType*/expectKeys(req.body,/*reqtype*/reqnames)) {
        return common.ResErr(res, 400, "Girdi yanlış!")
    }
    Date.now().toLocaleString()
    let file = Buffer.from(req.body.to_adresses.split(",")[1], 'base64')
    let emailAlacaklar: string[] = await extractReceivers(file).catch(err=>common.ResErr(res, 500, "extracting receivers: "+err)) ?? [""];
    console.log(emailAlacaklar);
    let email_files: Attachment[] = [];
    console.log(req.body.email_files)
    req.body.email_files.forEach((e:{content: string, name: string}) => {
        email_files.push({
            content: Buffer.from(e.content.split(",")[1], "base64"),
            filename: e.name + "." + e.content.substring(e.content.indexOf("/")+1, e.content.indexOf(";"))
        } as Attachment)
    });
    await sendMultipleMails({subject: req.body.subject, email_text:req.body.email_text, email_files:email_files, mail_date: new Date(req.body.gonderim), to_adresses: emailAlacaklar} as Mail).catch(err=>common.ResErr(res, 500, "error while sending mails: "+err))
    common.ResSuc(res, "başarıyla gönderildi")
})

app.listen(port, () => {
    console.log(`${link}:${port}/webui`)
})