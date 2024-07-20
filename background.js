import {
    HTMLBrowser,
    dlog,
    log,
    getCommunities,
    getPosts,
    getReplies,
    getCommunityByID,
    pushCommunity,
    pushPost,
    pushReply,
    updateCommunityLastID
} from "./index.js";

const SERVICE = "Worker";

/**
 * Scans a community's posts.
 * 
 * @param {HTMLBrowser} browser The browser to use
 * @param {import("./storage.js").Community} community The community to scan
 * @returns {number} The last (or first) scanned post
 */
const scanCommunity = async (browser, community) => {
    let last = "";
    await getPosts(browser, community.id, community.lastid, async post => {
        // we only have 1 page
        if(post.replies > 0) await getReplies(browser, post.id, async reply => {
            await pushReply(reply.id, reply.pid, reply.parent, reply.contents,
                reply.yeahs, reply.image, reply.imagehash);
            dlog(SERVICE, `Pushed reply ${reply.id} to the database!`);
        });
        await pushPost(post.id, post.pid, community.id, post.contents,
            post.yeahs, post.replies, post.image, post.imagehash);
        dlog(SERVICE, `Pushed post ${post.id} to the database!`);
    }, id => {
        if(last == "") last = id;
    });
    await updateCommunityLastID(community.id, last);
    dlog(SERVICE, `Scanned community ${community.name}!`);
    return last;
};

(async () => { try {
    const browser = new HTMLBrowser();
    await browser.make();

    /** @type {import("./storage.js").Community[]} */
    const communities = [];
    await getCommunities(browser, community => {
        communities.push(community);
        dlog(SERVICE, `Found community ${community.name}`);
    });
    for(const community of communities) {
        if(!(await getCommunityByID(community.id))) {
            // firstscanamount is unused here
            pushCommunity(community.id, community.name, 0);
            dlog(SERVICE, `New community added to database: ${community.name} (${community.id})`);
        }
    }

    for(const community of communities) {
        const data = await getCommunityByID(community.id);
        await scanCommunity(browser, data);
    }
    dlog("Done!");
} catch(e) { log(SERVICE, `Critical error! ${e}\n${e.stack}`, "error") } })();