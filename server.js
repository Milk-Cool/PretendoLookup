import { getPosts, getReplies } from "./parsers/posts.js";
import { getCommunities } from "./parsers/communities.js";
import { HTMLBrowser } from "./parsers/data.js";

(async () => {
    const browser = new HTMLBrowser();
    await browser.make();
    // await getPosts(browser, "1572065594784747520", "", console.log);
    // await getReplies(browser, "1377782196559024821", console.log);
    await getCommunities(browser, console.log);
    console.log("DONE!");
})();