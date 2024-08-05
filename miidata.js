import miiJS from "@pretendonetwork/mii-js";
import { XMLParser } from "fast-xml-parser";

const Mii = miiJS.default;
const parser = new XMLParser();

/**
 * Fetches Mii data from pretendo's servers.
 * 
 * @param {number} pid The user PID
 * @returns {Mii} The Mii data
 */
export async function fetchMiiData(pid) {
    try {
        const f = await fetch("http://account.pretendo.cc/v1/api/miis?pids=" + pid, {
            "headers": {
                "X-Nintendo-Client-ID": "a2efa818a34fa16b8afbc8a74eba3eda",
                "X-Nintendo-Client-Secret": "c91cdb5658bd4954ade78533a339cf9a"
            }
        });
        const t = await f.text();
        const xml = parser.parse(t);
        const miiData = xml.miis.mii.data;
        const mii = new Mii(Buffer.from(miiData, "base64"));
        return mii;
    } catch(_) { return { "error": true }; }
}

/**
 * Fetches the PID based on a PNID
 * 
 * @param {string} pnid The user PNID
 * @returns {number} The user PID
 */
export async function fetchPID(pnid) {
    try {
        const f = await fetch("http://account.pretendo.cc/v1/api/admin/mapped_ids?input_type=user_id&output_type=pid&input=" + pnid, {
            "headers": {
                "X-Nintendo-Client-ID": "a2efa818a34fa16b8afbc8a74eba3eda",
                "X-Nintendo-Client-Secret": "c91cdb5658bd4954ade78533a339cf9a"
            }
        });
        const t = await f.text();
        const xml = parser.parse(t);
        return xml.mapped_ids.mapped_id.out_id;
    } catch(_) { return 0; }
}