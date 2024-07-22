import { fork } from "child_process";
import express from "express";
import fileUpload from "express-fileupload";
import fs from "fs";
import Jimp from "jimp";

import {
    log,
    getUserByID,
    getUserByName,
    getUserByPNID,
    getPostByID,
    getReplyByID,
    getUserByMiiHash,
    getContentByCommunity,
    getContentByImageHash,
    getContentByKeyword,
    getContentByPID,
    getContentAll,
    getUserAll
} from "./index.js";

const SERVICE = "Server";

if(!process.env["DISABLE_WORKER"]) fork("./background.js");

const app = express();
app.use(fileUpload({ "limits": { "fileSize": 10 * 1024 * 1024 } }));

app.use(express.static("html"));

const renderPost = (document, out) => {
    return document.replaceAll("{{RESULTS}}", out.map(x => {
        return `<div class="block result">
            <h3><a href="/${typeof x.replies !== "undefined" ? "post" : "reply"}/${x.id}">${x.contents}</a></h3>
            <h5><a href="/user/${x.pid}">${x.pid}</a></h5>
            ${x.image ? `<img src="${x.image}">` : ""}
            <h6>${typeof x.replies !== "undefined" ? `<a href="/replies/${x.id}">${x.replies + " replies"}</a>` : ""}</h6>
            <h6>${x.yeahs} yeahs</h6>
        </div>`
    }).join(""));
}

const renderUser = (document, out) => {
    return document.replaceAll("{{RESULTS}}", out.map(x => {
        return `<div class="block result">
            <img src="https://pretendo-cdn.b-cdn.net/mii/${x.pid}/normal_face.png"><br>
            <h2><a href="/user/${x.pid}">${x.name} @${x.pnid}</a></h2>
        </div>`
    }).join(""));
}

app.get("/resultsusers", async (req, res) => {
    if(req.query.query == "") return res.status(400).end("bad request!");

    let document = fs.readFileSync("html/results.html", "utf-8");

    let out = [];
    if(req.query.type == "pid") out = [await getUserByID(req.query.query)];
    else if(req.query.type == "pnid") out = await getUserByPNID(req.query.query);
    else if(req.query.type == "name") out = await getUserByName(req.query.query);
    else if(req.query.type == "hash") out = await getUserByMiiHash(req.query.query);

    document = renderUser(document, out);
    res.status(200).end(document);
});
app.get("/resultsposts", async (req, res) => {
    if(req.query.query == "") return res.status(400).end("bad request!");

    let document = fs.readFileSync("html/results.html", "utf-8");

    let out = [];
    if(req.query.type == "id") out = [await getPostByID(req.query.query) ?? await getReplyByID(req.query.query)];
    else if(req.query.type == "pid") out = await getContentByPID(req.query.query);
    else if(req.query.type == "community") out = await getContentByCommunity(req.query.query);
    else if(req.query.type == "keyword") out = await getContentByKeyword(req.query.query);
    else if(req.query.type == "hash") out = await getContentByImageHash(req.query.query);

    document = renderPost(document, out);
    res.status(200).end(document);
});

app.post("/reverseposts", async (req, res) => {
    if(!req.files || !req.files.file) return res.status(400).end("very bad request!");
    
    /** @type {Jimp} */
    let img;
    try { img = await Jimp.read(req.files.file.data); } catch(_) { return res.status(400).end("bad."); }
    const hash = img.hash();

    const all = (await getContentAll()).map(x => {
        x.imagedist = x.image ? Jimp.compareHashes(x.imagehash, hash) : 1;
        return x;
    }).sort((a, b) => a.imagedist - b.imagedist).slice(0, 50);

    let document = fs.readFileSync("html/results.html", "utf-8");
    document = renderPost(document, all);
    res.status(200).end(document);
});

app.post("/reversemiis", async (req, res) => {
    if(!req.files || !req.files.file) return res.status(400).end("bro is badrequestmaxxing");
    
    /** @type {Jimp} */
    let img;
    try { img = await Jimp.read(req.files.file.data); } catch(_) { return res.status(400).end("bad."); }
    const hash = img.hash();

    const all = (await getUserAll()).map(x => {
        x.miidist = x.miihash ? Jimp.compareHashes(x.miihash, hash) : 1;
        return x;
    }).sort((a, b) => a.miidist - b.miidist).slice(0, 50);

    let document = fs.readFileSync("html/results.html", "utf-8");
    document = renderUser(document, all);
    res.status(200).end(document);
});

const port = 5012;
app.listen(port, () => log(SERVICE, `Started @port ${port}`));