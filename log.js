/** @typedef {"info" | "warning" | "error" | "debug"} LogType */

export const colorBold = "\x1b[1m";
export const colorReset = "\x1b[0m";
export const colorInfo = "\x1b[44m\x1b[37m";
export const colorDebug = "\x1b[45m\x1b[37m";
export const colorWarning = "\x1b[43m\x1b[30m";
export const colorError = "\x1b[41m\x1b[37m";

/** @type {Record<LogType, string>} */
export const colorMap = {
    "info": colorInfo,
    "debug": colorDebug,
    "warning": colorWarning,
    "error": colorError
};
/** @type {Record<LogType, string>} */
export const msgMap = {
    "info": "INFO",
    "debug": "DEBUG",
    "warning": "WARNING",
    "error": "ERROR"
};

/**
 * Logs a message to the console.
 * 
 * @param {string} service The message source
 * @param {string} message The message
 * @param {LogType} type The message type
 */
export function log(service, message, type = "info") {
    console.log(`${colorBold}${colorMap[type]}${msgMap[type]}${colorReset} ${colorBold}${service}${colorReset} ${message}`);
}

/**
 * Logs a message to the console if DEBUG environment variable is set.
 * The default message type is DEBUG, not INFO.
 * 
 * @param {string} service The message source
 * @param {string} message The message
 * @param {LogType} type The message type
 */
export function dlog(service, message, type = "debug") {
    if(!process.env["DEBUG"]) return;
    log(service, message, type);
}