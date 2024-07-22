import sqlite3 from "sqlite3";

export const db = new sqlite3.Database("data.db");

/** @typedef {{id: string, name: string, firstscanamount: number?, lastid: string? }} Community */
db.run(`CREATE TABLE IF NOT EXISTS communities (
    id TEXT,
    name TEXT,
    firstscanamount INTEGER,
    lastid TEXT
);`);
/** @typedef {{id: string, pid: number, community: string, contents: string, yeahs: number, replies: number, image: string, imagehash: string }} Post */
db.run(`CREATE TABLE IF NOT EXISTS posts (
    id TEXT,
    pid INTEGER,
    community TEXT,
    contents TEXT,
    yeahs INTEGER,
    replies INTEGER,
    image TEXT,
    imagehash TEXT
);`);
/** @typedef {{pid: number, pnid: string, name: string, miihash: string }} User */
db.run(`CREATE TABLE IF NOT EXISTS users (
    pid INTEGER,
    pnid TEXT,
    name TEXT,
    miihash TEXT
);`);
/** @typedef {{id: string, pid: number, parent: string, contents: string, yeahs: number, image: string, imagehash: string }} Reply */
db.run(`CREATE TABLE IF NOT EXISTS replies (
    id TEXT,
    pid INTEGER,
    parent TEXT,
    contents TEXT,
    yeahs INTEGER,
    image TEXT,
    imagehash TEXT
);`);

/**
 * Pushes a post to the database.
 * 
 * @param {string} id The post ID
 * @param {number} pid The user's PID
 * @param {string} community The community ID
 * @param {string} contents The post text contents
 * @param {number} yeahs The number of Yeah's
 * @param {number} replies The number of replies
 * @param {string?} image The image URL
 * @param {string?} imagehash The JIMP image hash
 */
export function pushPost(id, pid, community, contents, yeahs, replies, image = "", imagehash = "") {
    return new Promise(async resolve => {
        if(await getPostByID(id)) return resolve(null);
        db.run(`INSERT INTO posts (id, pid, community, contents, yeahs, replies, image, imagehash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);`, [id, pid, community, contents, yeahs, replies, image, imagehash], resolve);
    });
}

/**
 * Retrieves a post from the database by its ID.
 * 
 * @param {string} id The post ID
 * @returns {Post} The post data
 */
export function getPostByID(id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM posts WHERE id = ?;`, [id], (err, data) => {
            if(err) reject(err);
            resolve(data);
        });
    });
}

/**
 * Pushes a reply to the database.
 * 
 * @param {string} id The post ID
 * @param {number} pid The user's PID
 * @param {string} parent The parent post ID
 * @param {string} contents The post text contents
 * @param {number} yeahs The number of Yeah's
 * @param {string?} image The image URL
 * @param {string?} imagehash The JIMP image hash
 */
export function pushReply(id, pid, parent, contents, yeahs, image = "", imagehash = "") {
    return new Promise(async resolve => {
        if(await getReplyByID(id)) return resolve(null);
        db.run(`INSERT INTO replies (id, pid, parent, contents, yeahs, image, imagehash)
            VALUES (?, ?, ?, ?, ?, ?, ?);`, [id, pid, parent, contents, yeahs, image, imagehash], resolve);
    });
}

/**
 * Retrieves a reply from the database by its ID.
 * 
 * @param {string} id The post ID
 * @returns {Post} The post data
 */
export function getReplyByID(id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM replies WHERE id = ?;`, [id], (err, data) => {
            if(err) reject(err);
            resolve(data);
        });
    });
}

/**
 * Retrieves posts and replies from the database by its author PID.
 * 
 * @param {number} pid The author PID
 * @returns {Post | Reply} The content data
 */
export function getContentByPID(pid) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM posts WHERE pid = ? LIMIT 50;`, [pid], (err, data) => {
            if(err) reject(err);
            db.all(`SELECT * FROM replies WHERE pid = ? LIMIT 50;`, [pid], (err2, data2) => {
                if(err2) reject(err);
                resolve(data.concat(data2));
            });
        });
    });
}

/**
 * Retrieves posts and replies from the database by its community PID.
 * TODO: also return replies
 * 
 * @param {string} id The community ID
 * @returns {Post | Reply} The content data
 */
export function getContentByCommunity(id) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM posts WHERE community = ? LIMIT 50;`, [id], (err, data) => {
            if(err) reject(err);
            resolve(data);
        });
    });
}

/**
 * Retrieves posts and replies from the database by a keyword.
 * 
 * @param {string} keyword The keyword
 * @returns {Post | Reply} The content data
 */
export function getContentByKeyword(keyword) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM posts WHERE instr(lower(contents), lower(?)) LIMIT 50;`, [keyword], (err, data) => {
            if(err) reject(err);
            db.all(`SELECT * FROM replies WHERE instr(lower(contents), lower(?)) LIMIT 50;`, [keyword], (err2, data2) => {
                if(err2) reject(err);
                resolve(data.concat(data2));
            });
        });
    });
}

/**
 * Retrieves posts and replies from the database by a keyword.
 * 
 * @param {string} imghash The keyword
 * @returns {Post | Reply} The content data
 */
export function getContentByImageHash(imghash) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM posts WHERE imagehash = ? LIMIT 50;`, [imghash], (err, data) => {
            if(err) reject(err);
            db.all(`SELECT * FROM replies WHERE imagehash = ? LIMIT 50;`, [imghash], (err2, data2) => {
                if(err2) reject(err);
                resolve(data.concat(data2));
            });
        });
    });
}

/**
 * Retrieves all posts and replies.
 * 
 * @returns {Post | Reply} The content data
 */
export function getContentAll() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM posts;`, [], (err, data) => {
            if(err) reject(err);
            db.all(`SELECT * FROM replies;`, [], (err2, data2) => {
                if(err2) reject(err);
                resolve(data.concat(data2));
            });
        });
    });
}

/**
 * Pushes a community to the database.
 * 
 * @param {string} id The community ID
 * @param {string} name The community name
 * @param {number} firstscanamount The number of posts on the first scan
 * @param {string?} lastid The last scanned post ID
 */
export function pushCommunity(id, name, firstscanamount, lastid = "") {
    return new Promise(resolve => {
        db.run(`INSERT INTO communities (id, name, firstscanamount, lastid)
            VALUES (?, ?, ?, ?);`, [id, name, firstscanamount, lastid], resolve);
    });
}

/**
 * Updates the last checked post in the database for this community.
 * 
 * @param {string} id The community ID
 * @param {string} lastid The new last post ID
 */
export function updateCommunityLastID(id, lastid) {
    return new Promise(resolve => {
        db.run(`UPDATE communities
            SET lastid = ?
            WHERE id = ?;`, [lastid, id], resolve);
    });
}

/**
 * Retrieves a community from the database by its ID.
 * 
 * @param {string} id The community ID
 * @returns {Community} The community data
 */
export function getCommunityByID(id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM communities WHERE id = ?;`, [id], (err, data) => {
            if(err) reject(err);
            resolve(data);
        });
    });
}

/**
 * Pushes a user to the database.
 * 
 * @param {number} pid The user PID
 * @param {string} pnid The user PNID
 * @param {string} name The user's name
 * @param {string} miihash The user's Mii JIMP hash
 */
export function pushUser(pid, pnid, name, miihash) {
    return new Promise(resolve => {
        db.run(`INSERT INTO users (pid, pnid, name, miihash)
            VALUES (?, ?, ?, ?);`, [pid, pnid, name, miihash], resolve);
    });
}

/**
 * Retrieves a user from the database by their PID.
 * 
 * @param {string} pid The user ID
 * @returns {User} The user data
 */
export function getUserByID(pid) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM users WHERE pid = ?;`, [pid], (err, data) => {
            if(err) reject(err);
            resolve(data);
        });
    });
}

/**
 * Retrieves all users from the database containing the string in their PNID.
 * 
 * @param {string} pnid The user PNID
 * @returns {User} The user data
 */
export function getUserByPNID(pnid) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM users WHERE instr(lower(pnid), lower(?)) > 0
            ORDER BY length(pnid) LIMIT 50;`, [pnid], (err, data) => {
            if(err) reject(err);
            resolve(data);
        });
    });
}

/**
 * Retrieves all users from the database containing the string in their name.
 * 
 * @param {string} name The user name
 * @returns {User} The user data
 */
export function getUserByName(name) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM users WHERE instr(lower(name), lower(?)) > 0
            ORDER BY length(name) LIMIT 50;`, [name], (err, data) => {
            if(err) reject(err);
            resolve(data);
        });
    });
}

/**
 * Retrieves all users from the database matching a Mii hash.
 * 
 * @param {string} hash The hash
 * @returns {User} The user data
 */
export function getUserByMiiHash(hash) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM users WHERE miihash = ?
        LIMIT 250;`, [hash], (err, data) => {
            if(err) reject(err);
            resolve(data);
        });
    });
}

/**
 * Retrieves all users from the database.
 * 
 * @returns {User} The user data
 */
export function getUserAll() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM users;`, [], (err, data) => {
            if(err) reject(err);
            resolve(data);
        });
    });
}