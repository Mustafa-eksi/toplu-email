import express from 'express';
import nodemailer from 'nodemailer';
import * as cors from "cors";
import * as common from './common';
import * as exceljs from 'exceljs';
import {Readable} from 'stream'
import * as fs from 'fs'

const app = express();
const port = 8080;
const link = "http://localhost";
app.use(express.json({limit: '50mb'}));

app.use(cors.default());

function getService(raw_adress: string): string { // mustafa@gmail.com
    return raw_adress.split("@")[1].split(".")[0];
}

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
    subject: string, email_text: string, email_files: Attachment[]
}

async function sendSingleMail(mailer: nodemailer.Transporter, from:string, mail: Mail, to_adress:string) {
    let info = await mailer.sendMail({
        to: to_adress,
        from:from,
        subject:mail.subject,
        text:mail.email_text,
        attachments: mail.email_files
    }).catch(err=>{throw err})
    return info
}

async function sendMultipleMails(s_mail: string, s_password: string, mail: Mail, to_adresses: string[]) {
    var mailer = nodemailer.createTransport({
        service: getService(s_mail),
        auth: {
            user: s_mail,
            pass: s_password
        }
    });
    for(let i = 0; i < to_adresses.length; i++) {
        await sendSingleMail(mailer, s_mail, mail, to_adresses[i]).catch(err => {
            if(common.debugMode)
                console.error(err);
        })
    }
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
    const keys = ["sender_mail", "sender_password", "to_adresses", "subject", "email_text", "email_files"]
    if(!common.expectKeys(req.body,keys)) {
        return common.ResErr(res, 400, "Girdi yanlış!")
    }
    let file = Buffer.from(req.body.to_adresses, 'base64')
    let sonuc: string[] = await extractReceivers(file).catch(err=>common.ResErr(res, 500, "extracting receivers: "+err)) ?? [""];
    console.log(sonuc);
    let email_files: Attachment[] = [];
    req.body.email_files.forEach((e:{content: string, name: string}) => {
        email_files.push({
            content: Buffer.from(e.content, 'base64'),
            filename: e.name
        } as Attachment)
    });
    await sendMultipleMails(req.body.sender_mail, req.body.sender_password, {subject: req.body.subject, email_text:req.body.email_text, email_files:email_files} as Mail, sonuc).catch(err=>common.ResErr(res, 500, "error while sending mails: "+err))
    common.ResSuc(res, "başarıyla gönderildi")
})

app.listen(port, () => {
    console.log(`${link}:${port}/webui`)
})