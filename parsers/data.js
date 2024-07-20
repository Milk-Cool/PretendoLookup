import genUrl from "./url.js";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

export class HTMLBrowser {
    constructor() {
        this.browserAsync = puppeteer.use(StealthPlugin()).launch({ "headless": false });
    }

    /**
     * Finishes constructing the object.
     * 
     * @returns {HTMLBrowser} This object
     */
    async make() {
        this.browser = await this.browserAsync;
        this.page = await this.browser.newPage();

        // https://stackoverflow.com/a/70137587/13046254
        await this.page.setRequestInterception(true);
        this.page.on("request", req => {
            if (!["document", "xhr", "fetch", "script"].includes(req.resourceType())) {
                return req.abort();
            }
            req.continue();
        });
    }

    /**
     * Closes the browser.
     */
    async close() {
        this.page.close();
        this.browser.close();
    }
}

/**
 * GETs data
 * 
 * @param {HTMLBrowser} browser The browser to use
 * @param {string} path The page path
 * @returns {Buffer} Binary data
 */
export async function get(browser, path) {
    const url = genUrl(path);

    await browser.page.goto(url);
    await browser.page.waitForFunction(() => document.readyState === "complete");
    return await browser.page.content();
}