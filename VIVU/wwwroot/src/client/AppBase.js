"use strict";
// @ts-ignore
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppBase = void 0;
const thor_io_client_vnext_1 = require("thor-io.client-vnext");
const AppDomain_1 = require("./AppDomain");
const EncodeDecode_1 = require("./E2EE/EncodeDecode");
class AppBase {
    constructor() {
        this.numReconnects = 0;
        AppDomain_1.AppDomain.logger.log(`Client supports E2EE`, AppDomain_1.AppDomain.supportsE2EE);
    }
    getRTCStatsReport() {
        let a = Array.from(this.rtc.peers.values()).map((conn) => {
            return new Promise((resolve, reject) => {
                conn.RTCPeer.getStats().then((stats) => {
                    let statsOutput = `<h1>PeerID - ${conn.id}</h1><hr/>`;
                    stats.forEach(report => {
                        statsOutput += `<h2>Report: ${report.type}</h3>\n<strong>ID:</strong> ${report.id}<br>\n` +
                            `<strong>Timestamp:</strong> ${report.timestamp}<br>\n`;
                        Object.keys(report).forEach(statName => {
                            if (statName !== "id" && statName !== "timestamp" && statName !== "type") {
                                statsOutput += `<strong>${statName}:</strong> ${report[statName]}<br>\n`;
                            }
                        });
                    });
                    resolve(statsOutput);
                }).catch(err => resolve(err));
            });
        });
        return Promise.all(a);
    }
    initialize(params) {
        return new Promise((resolve, reject) => {
            try {
                this.factory = new thor_io_client_vnext_1.Factory(AppDomain_1.AppDomain.serverUrl, ["broker"], params || {});
                this.factory.onOpen = (broker) => {
                    if (AppDomain_1.AppDomain.supportsE2EE) {
                        AppDomain_1.AppDomain.logger.log("Client can run in e2ee mode");
                        this.e2eeContext = new EncodeDecode_1.E2EEBase(performance.now().toString());
                        this.rtc = new thor_io_client_vnext_1.WebRTC(broker, AppDomain_1.AppDomain.rtcConfig, this.e2eeContext);
                    }
                    else
                        this.rtc = new thor_io_client_vnext_1.WebRTC(broker, AppDomain_1.AppDomain.rtcConfig);
                    this.rtc.isEncrypted = false; // set isEncrypted to false, until a key is set, and user want's it..
                    resolve(broker);
                };
            }
            catch (err) {
                AppDomain_1.AppDomain.logger.error("Failed to initialize", err);
                reject(err);
            }
        });
    }
}
exports.AppBase = AppBase;
