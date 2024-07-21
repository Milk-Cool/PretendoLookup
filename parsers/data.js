import { Page } from "puppeteer";
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
        return this;
    }

    /**
     * Creates a page.
     * 
     * @returns {Page} The created page
     */
    async createPage() {
        const page = await this.browser.newPage();
        await page.setRequestInterception(true);
        page.on("request", req => {
            if (!["document", "xhr", "fetch", "script"].includes(req.resourceType())) {
                return req.abort();
            }
            req.continue();
        });
        return page;
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
 * @param {Page} page The page to use
 * @param {string} path The page path
 * @returns {Buffer} Binary data
 */
export async function get(page, path) {
    const url = genUrl(path);

    await page.bringToFront();
    await page.goto(url);
    await page.waitForFunction(() => document.readyState === "complete");
    return await page.content();
}