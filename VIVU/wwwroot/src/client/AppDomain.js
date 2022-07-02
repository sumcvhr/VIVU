"use strict";
/**
 *  Class enables customization of "Kollokvium".
 *
 * @export
 * @class AppDomain
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDomain = void 0;
const AppLogger_1 = require("./Helpers/AppLogger");
const appConfig = require("./settings.json");
class AppDomain {
    static get supportsE2EE() {
        return !!window["RTCRtpSender"].prototype["createEncodedStreams"] && appConfig.e2eeSupport;
    }
    static get version() {
        return process.env.KOLLOKVIUM_VERSION || appConfig.version;
    }
    ;
    static get serverUrl() {
        return this.getServerUrl();
    }
    ;
    static get defaultConstraints() {
        return appConfig.defaultConstraints;
    }
    static get domain() {
        return appConfig.domain;
    }
    ;
    static get contextPrefix() {
        return appConfig.contextPrefix;
    }
    ;
    static get host() {
        return this.getHost();
    }
    ;
    static get translateKey() {
        return appConfig.translateKey || "";
    }
    ;
    static getSlug(value) {
        return `${this.contextPrefix}-${value}`;
    }
    static get rtcConfig() {
        return appConfig.rtcConfig;
    }
    static getHost() {
        const port = window.location.port;
        const host = (appConfig.host || window.location.hostname);
        let result = location.protocol + "//" + host + (port.length > 0 ? ":" + port : "");
        return result;
    }
    static getServerUrl() {
        const serverUrl = process.env.WSS_SERVER_URL || appConfig.serverUrl;
        if (serverUrl && serverUrl.includes("://")) {
            return serverUrl;
        }
        const port = window.location.port;
        const host = (serverUrl || window.location.hostname);
        const scheme = location.protocol.includes("https:") ? "wss://" : "ws://";
        let result = scheme + host
            + (port.length > 0 ? ":" + port : "");
        return result;
    }
}
exports.AppDomain = AppDomain;
AppDomain.logger = new AppLogger_1.AppLogger(appConfig.logToConsole);
