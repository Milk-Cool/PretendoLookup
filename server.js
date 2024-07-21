import { fork } from "child_process";
import express from "express";
import fs from "fs";

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
    getContentByPID
} from "./index.js";

const SERVICE = "Server";

if(!process.env["DISABLE_WORKER"]) fork("./background.js");

const app = express();
app.use(express.static("html"));
app.get("/resultsusers", async (req, res) => {
    let document = fs.readFileSync("html/results.html", "utf-8");

    let out = [];
    if(req.query.type == "pid") out = [await getUserByID(req.query.query)];
    else if(req.query.type == "pnid") out = await getUserByPNID(req.query.query);
    else if(req.query.type == "name") out = await getUserByName(req.query.query);
    else if(req.query.type == "hash") out = await getUserByMiiHash(req.query.query);

    document = document.replaceAll("{{RESULTS}}", out.map(x => {
        return `<div class="block result">
            <img src="https://pretendo-cdn.b-cdn.net/mii/${x.pid}/normal_face.png"><br>
            <h2><a href="/user/${x.pid}">${x.name} @${x.pnid}</a></h2>
        </div>`
    }).join(""));
    res.status(200).end(document);
});
app.get("/resultsposts", async (req, res) => {
    let document = fs.readFileSync("html/results.html", "utf-8");

    let out = [];
    if(req.query.type == "id") out = [await getPostByID(req.query.query) ?? await getReplyByID(req.query.query)];
    else if(req.query.type == "pid") out = await getContentByPID(req.query.query);
    else if(req.query.type == "community") out = await getContentByCommunity(req.query.query);
    else if(req.query.type == "keyword") out = await getContentByKeyword(req.query.query);
    else if(req.query.type == "hash") out = await getContentByImageHash(req.query.query);

    document = document.replaceAll("{{RESULTS}}", out.map(x => {
        return `<div class="block result">
            <h3><a href="/${typeof x.replies !== "undefined" ? "post" : "reply"}/${x.id}">${x.contents}</a></h3>
            <h5><a href="/user/${x.pid}">${x.pid}</a></h5>
            ${x.image ? `<img src="${x.image}">` : ""}
            <h6>${typeof x.replies !== "undefined" ? `<a href="/replies/${x.id}">${x.replies + " replies"}</a>` : ""}</h6>
            <h6>${x.yeahs} yeahs</h6>
        </div>`
    }).join(""));
    res.status(200).end(document);
});

const port = 5012;
app.listen(port, () => log(SERVICE, `Started @port ${port}`));