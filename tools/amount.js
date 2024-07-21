import {
    HTMLBrowser,
    getCommunities,
    get,
    log
} from "../index.js";

const SERVICE = "Amount";

(async () => {
    const browser = new HTMLBrowser();
    await browser.make();

    /** @type {import("./storage.js").Community[]} */
    const communities = [];
    await getCommunities(browser, community => {
        communities.push(community);
        log(SERVICE, `Found community ${community.name}`);
    });

    let total = 0;
    for(const c of communities) {
        let l = 0, r = 100000, i = 0;
        while(r - l > .6) {
            const m = (l + r) / 2;
            log(SERVICE, `Scanning community ${c.name}, iteration ${i++}, m value ${m}`);
            try {
                const p = await browser.createPage();
                await get(p, `/titles/${c.id}/new/more?offset=${Math.round(m)}`);
                await p.close();
                l = m;
            } catch(_) {
                // 204
                r = m;
            }
        }
        total += r;
        log(SERVICE, `Scanned community ${c.name}, got ${r} posts, total ${total}`);
    }
    log(SERVICE, `TOTAL: ${total}`);
})();