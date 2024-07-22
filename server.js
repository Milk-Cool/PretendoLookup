import { fork } from "child_process";
import express from "express";
import fileUpload from "express-fileupload";
import fs from "fs";
import Jimp from "jimp";

import {
    log,
    genUrl,
    fetchMiiData,
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
    getUserAll,
    getReplyByParent
} from "./index.js";

const SERVICE = "Server";

if(!process.env["DISABLE_WORKER"]) fork("./background.js");

const s = text => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;");

const app = express();
app.use(fileUpload({ "limits": { "fileSize": 10 * 1024 * 1024 } }));

app.use(express.static("html"));

const renderPost = (document, out) => {
    return document.replaceAll("{{RESULTS}}", out.map(x => {
        if(!x) return "";
        return `<div class="block result">
            <h3><a href="/${typeof x.replies !== "undefined" ? "post" : "reply"}/${x.id}">${s(x.contents) || "Post"}</a></h3>
            <h5><a href="/user/${x.pid}">${x.pid}</a></h5>
            ${x.image ? `<img src="${x.image}">` : ""}
            <h6>${typeof x.replies !== "undefined" ? `<a href="/resultsposts?type=parent&query=${x.id}">${x.replies + " replies"}</a>` : ""}</h6>
            <h6>${x.yeahs} yeahs</h6>
        </div>`
    }).join(""));
}

const renderUser = (document, out) => {
    return document.replaceAll("{{RESULTS}}", out.map(x => {
        if(!x) return "";
        return `<div class="block result">
            <img src="https://pretendo-cdn.b-cdn.net/mii/${x.pid}/normal_face.png"><br>
            <h2><a href="/user/${x.pid}">${s(x.name)} @${s(x.pnid)}</a></h2>
        </div>`
    }).join(""));
}

app.get("/user/:id", async (req, res) => {
    if(!req.params.id) return res.status(400).end("bad-der request");

    let document = fs.readFileSync("html/user.html", "utf-8");

    const user = await getUserByID(req.params.id);
    if(!user) return res.status(404).end("not found!");
    const mii = await fetchMiiData(req.params.id);
    document = document.replaceAll("{{USER}}", `
        <img src="https://pretendo-cdn.b-cdn.net/mii/${user.pid}/normal_face.png">
        <h1>${s(user.name)} @${s(user.pnid)}</h1>
        <h2><a href="${genUrl("/users/" + user.pid)}" target="_blank">View on Juxt</a></h2>
        <h2><a href="/resultsposts?type=pid&query=${user.pid}">View posts</a></h2>
        ${mii.error ? "" : `
            <h3>Mii info:</h3>
            <ul>
            <li>${mii.version == 3 ? "Made from scratch" : "Made from a photo"}</li>
            <li>Made on ${["Wii", "DS", "3DS", "Wii U"][mii.deviceOrigin - 1]}</li>
            <li>Console ID: ${mii.systemId.toString("hex")}</li>
            <li>Console MAC: ${mii.consoleMAC.toString("hex")}</li>
            <li>Is special: ${!mii.normalMii ? "Yes" : "No"}</li>
            <li>Is favorite: ${mii.favorite ? "Yes" : "No"}</li>
            <li>Creator name: ${s(mii.creatorName)}</li>
            <li>Creation time: ${(new Date(Number(new Date("2010-01-01T00:00:00.000+00:00")) + mii.creationTime * 2000)).toGMTString()}</li>
            <li>Gender: ${mii.gender ? "Girl" : "Boy"}</li>
            <li>Birthday: ${mii.birthMonth}/${mii.birthDay}</li>
            </ul>
        `}
    `);
    res.status(200).end(document);
});

app.get("/post/:id", async (req, res) => {
    if(!req.params.id) return res.status(400).end("bad-dest request");

    let document = fs.readFileSync("html/post.html", "utf-8");

    const post = await getPostByID(req.params.id);
    if(!post) return res.status(404).end("not found at all!");
    document = document.replaceAll("{{POST}}", `
        <h2>${s(post.contents) || "Post"}</h2>
        <h3>By ${post.pid}</h3>
        ${post.image ? `<img src="${post.image}" width="600">` : "No image"}<br>
        <i>${post.imagehash}</i><br>
        <h4>${post.yeahs} yeahs, ${post.replies} replies</h4>

        <h2><a href="/resultsposts?type=parent&query=${post.id}">View replies</a></h2>
        <h2><a href="${genUrl("/posts/" + post.id)}" target="_blank">View on Juxt</a></h2>
        <h2><a href="${genUrl("/users/" + post.pid)}" target="_blank">View user on Juxt</a></h2>
        <h2><a href="${genUrl("/titles/" + post.community)}" target="_blank">View community on Juxt</a></h2>
    `);
    res.status(200).end(document);
});

app.get("/reply/:id", async (req, res) => {
    if(!req.params.id) return res.status(400).end("de-un-bad request");

    let document = fs.readFileSync("html/reply.html", "utf-8");

    const reply = await getReplyByID(req.params.id);
    if(!reply) return res.status(404).end("not found unofrtunately :(");
    document = document.replaceAll("{{REPLY}}", `
        <h2>${s(reply.contents) || "Post"}</h2>
        <h3>By ${reply.pid}</h3>
        ${reply.image ? `<img src="${reply.image}" width="600">` : "No image"}<br>
        <i>${reply.imagehash}</i><br>
        <h4>${reply.yeahs} yeahs</h4>

        <h2><a href="/post/${reply.parent}">View parent post</a></h2>
        <h2><a href="${genUrl("/posts/" + reply.id)}" target="_blank">View on Juxt</a></h2>
        <h2><a href="${genUrl("/users/" + reply.pid)}" target="_blank">View user on Juxt</a></h2>
    `);
    res.status(200).end(document);
});

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
    else if(req.query.type == "parent") out = await getReplyByParent(req.query.query);

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