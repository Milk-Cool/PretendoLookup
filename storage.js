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
/** @typedef {{pid: number, pnid: string, name: string }} User */
db.run(`CREATE TABLE IF NOT EXISTS users (
    pid INTEGER,
    pnid TEXT,
    name TEXT
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
    return new Promise(resolve => {
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
    return new Promise(resolve => {
        db.run(`INSERT INTO posts (id, pid, parent, contents, yeahs, image, imagehash)
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
 */
export function pushUser(pid, pnid, name) {
    return new Promise(resolve => {
        db.run(`INSERT INTO users (pid, pnid, name)
            VALUES (?, ?, ?);`, [pid, pnid, name], resolve);
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