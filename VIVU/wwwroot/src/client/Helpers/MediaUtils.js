"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaUtils = void 0;
class MediaUtils {
    static CheckStream(tracks, state) {
        return tracks.filter((t) => { return t.readyState === state; }) ? true : false;
    }
    /**
   * Get this clients media devices
   *
   * @returns {Promise<Array<MediaDeviceInfo>>}
   * @memberof App
   */
    static getMediaDevices() {
        return new Promise((resolve, reject) => {
            navigator.mediaDevices.enumerateDevices().then((devices) => {
                resolve(devices);
            }).catch(reject);
        });
    }
    ;
}
exports.MediaUtils = MediaUtils;
