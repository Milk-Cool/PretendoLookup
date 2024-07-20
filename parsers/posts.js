import { get, HTMLBrowser } from "./data.js";
import { JSDOM } from "jsdom";
import Jimp from "jimp";

/**
 * Gets and parses posts until lastPost.
 * 
 * @param {HTMLBrowser} browser The browser to use
 * @param {string} community The community ID
 * @param {string} lastPost The last post ID
 * @param {(import("../storage.js").Post) => void} cb The callback used for saving posts
 */
export async function getPosts(browser, community, lastPost, cb) {
    /** @type {string[]} */
    const viewedPosts = []; // here we just pray that while we scan a page there are less than 10 posts published
    let offset = 0;

    while(true) {
        let content;
        try {
            content = await get(browser, `/titles/${community}/new/more?offset=${offset}`);
        } catch(_) {
            // 204
            break;
        }
        const dom = new JSDOM(content, { "contentType": "text/html" });
        const { document } = dom.window;
        let flag = true;
        for(const post of document.querySelectorAll(".posts-wrapper")) {
            if(post.id == lastPost) {
                flag = false;
                break;
            }
            if(viewedPosts.includes(post.id)) continue;

            const img = post.querySelector(".post-content > img");
            let imgsrc = "", hash = "";
            if(img) {
                imgsrc = img.getAttribute("src");
                const data = Buffer.from(await (await fetch(imgsrc)).arrayBuffer());
                const imgj = await Jimp.read(data);
                hash = await imgj.hash();
            }

            /** @type {import("../storage.js").Post} */
            const postObj = {
                "id": post.id,
                "pid": parseInt(post.querySelector(".post-meta-wrapper > h3 > a").getAttribute("href").match(/(?<=\?pid=)\d+/)[0]),
                "contents": post.querySelector(".post-content > h4")?.textContent ?? "",
                "yeahs": parseInt(post.querySelector(".post-buttons-wrapper > span:nth-child(1) > h4").textContent),
                "replies": parseInt(post.querySelector(".post-buttons-wrapper > span:nth-child(2) > h4").textContent),
                "image": imgsrc,
                "imagehash": hash
            };
            cb(postObj);

            viewedPosts.push(post.id);
        }
        if(!flag) break;
        offset += 10;
    }
}

/**
 * Gets and parses replies to a specific post.
 * 
 * @param {HTMLBrowser} browser The browser to use
 * @param {string} id The post ID
 * @param {(import("../storage.js").Reply) => void} cb The callback used for saving replies
 */
export async function getReplies(browser, id, cb) {
    const content = await get(browser, `/posts/${id}`);
    const dom = new JSDOM(content, { "contentType": "text/html" });
    const { document } = dom.window;

    const parent = document.querySelector("#wrapper > .posts-wrapper:nth-child(1)");
    const parentID = parent.id;

    for(const reply of document.querySelectorAll("#wrapper > .posts-wrapper:nth-child(n+1)")) {
        const img = reply.querySelector(".post-content > img");
        let imgsrc = "", hash = "";
        if(img) {
            imgsrc = img.getAttribute("src");
            const data = Buffer.from(await (await fetch(imgsrc)).arrayBuffer());
            const imgj = await Jimp.read(data);
            hash = await imgj.hash();
        }

        /** @type {import("../storage.js").Reply} */
        const replyObj = {
            "id": reply.id,
            "pid": parseInt(reply.querySelector(".post-meta-wrapper > h3 > a").getAttribute("href").match(/(?<=\?pid=)\d+/)[0]),
            "parent": parentID,
            "contents": reply.querySelector(".post-content > h4")?.textContent ?? "",
            "yeahs": parseInt(reply.querySelector(".post-buttons-wrapper > span:nth-child(1) > h4").textContent),
            "image": imgsrc,
            "imagehash": hash
        };
        cb(replyObj);
    }
}