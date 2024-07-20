import { get, HTMLBrowser } from "./data.js";
import { JSDOM } from "jsdom";
import Jimp from "jimp";
import { log } from "../log.js";

const SERVICE = "USERS";

/**
 * Gets and parses user data.
 * 
 * @param {HTMLBrowser} browser The browser to use
 * @param {number} id The user ID
 * @param {(import("../storage.js").Post) => void} cb The callback used for saving user data
 */
export async function getUserData(browser, id, cb) {
    const content = await get(browser, `/users/${id}`, "page3");
    const dom = new JSDOM(content, { "contentType": "text/html" });
    const { document } = dom.window;
    
    try {
        const mii = document.querySelector(".user-icon")?.getAttribute("src");
        const uname = document.querySelector(".community-title").textContent.replace("✓", "").split(" @");
        const userObj = {
            "pid": id,
            "pnid": uname[1],
            "name": uname[0],
            "miihash": ""
        };
        if(mii) {
            const data = Buffer.from(await (await fetch(mii)).arrayBuffer());
            const imgj = await Jimp.read(data);
            userObj.miihash = await imgj.hash();
        }
        const r = cb(userObj);
        if(r instanceof Promise) await r;
    } catch(e) { log(SERVICE, `Internal error while parsing a user: ${e}\n${e.stack}`, "error"); }
}