import { get, HTMLBrowser } from "./data.js";
import { JSDOM } from "jsdom";

/**
 * Gets all the communities.
 * 
 * @param {HTMLBrowser} browser The browser to use
 * @param {(import("../storage.js").Community) => void} cb The callback used for storing and scanning the communities.
 */
export async function getCommunities(browser, cb) {
    const content = await get(browser, `/titles/all`);
    const dom = new JSDOM(content, { "contentType": "text/html" });
    const { document } = dom.window;

    for(const community of document.querySelectorAll(".community-list-wrapper")) {
        /** @type {import("../storage.js").Community} */
        const communityObj = {
            "id": community.getAttribute("href").match(/\d+(?=\/new)/)[0],
            "name": community.querySelector("h2").textContent
        };
        cb(communityObj);
    }
}