import genUrl from "./url.js";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

export class HTMLBrowser {
    constructor() {
        this.browserAsync = puppeteer.use(StealthPlugin()).launch();
    }

    /**
     * Finishes constructing the object.
     * 
     * @returns {HTMLBrowser} This object
     */
    async make() {
        this.browser = await this.browserAsync;
        // Page 1 is used for communities and post checking
        this.page = await this.browser.newPage();
        // Page 2 is used for thread checking
        this.page2 = await this.browser.newPage();
        // Page 3 is used for user checking
        this.page3 = await this.browser.newPage();

        // https://stackoverflow.com/a/70137587/13046254
        for(const p of ["page", "page2", "page3"]) {
            await this[p].setRequestInterception(true);
            this[p].on("request", req => {
                if (!["document", "xhr", "fetch", "script"].includes(req.resourceType())) {
                    return req.abort();
                }
                req.continue();
            });
        }
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
 * @param {string} page The page to use, "page" by default
 * @returns {Buffer} Binary data
 */
export async function get(browser, path, page = "page") {
    const url = genUrl(path);

    await browser[page].bringToFront();
    await browser[page].goto(url);
    await browser[page].waitForFunction(() => document.readyState === "complete");
    return await browser[page].content();
}