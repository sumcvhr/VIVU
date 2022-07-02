"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppLogger = void 0;
const BrowserInfo_1 = require("./BrowserInfo");
class AppLogger {
    constructor(displayInConsole) {
        this.displayInConsole = displayInConsole;
        this.items = new Map();
        this.browsweInfo = BrowserInfo_1.BrowserInfo.getBrowser();
        this.os = BrowserInfo_1.BrowserInfo.getOS();
    }
    addItem(level, data) {
        this.items.set(Math.random().toString(36).substr(2, 9), {
            args: data, ts: performance.now(), level: level
        });
    }
    log(...args) {
        this.addItem("log", args);
        this.displayInConsole && console.log.apply(console, args);
    }
    error(...args) {
        this.addItem("error", args);
        this.displayInConsole && console.error.apply(console, args);
    }
    warning(...args) {
        this.addItem("warning", args);
        this.displayInConsole && console.warn.apply(console, args);
    }
    toString() {
        return JSON.stringify(this);
    }
    render() {
        throw "not yet implemented";
    }
}
exports.AppLogger = AppLogger;
