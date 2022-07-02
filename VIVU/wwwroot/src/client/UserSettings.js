"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSettings = void 0;
const SlugHistory_1 = require("./SlugHistory");
const DetectResolutions_1 = require("./Helpers/DetectResolutions");
// @ts-ignore
const DOMUtils_1 = require("./Helpers/DOMUtils");
const AppDomain_1 = require("./AppDomain");
class UserSettings {
    static failSafeConstraints() {
        return {
            video: true, audio: true,
        };
    }
    static cameraResolutions(current) {
        let parent = DOMUtils_1.DOMUtils.get("#sel-video-res");
        DetectResolutions_1.DetectResolutions.candidates.forEach((candidate) => {
            let option = document.createElement("option");
            option.textContent = `${candidate.label} ${candidate.width} x ${candidate.height} ${candidate.ratio}`;
            option.value = candidate.label;
            if (current === candidate.label)
                option.selected = true;
            parent.append(option);
        });
    }
    static defaultConstraints(videoDeviceId, resolution, shouldFaceUser) {
        return UserSettings.createConstraints(videoDeviceId, resolution, shouldFaceUser);
    }
    static save() {
        const data = {
            slugHistory: this.slugHistory.history,
            videoDevice: this.videoDevice,
            audioDeviceIn: this.audioDeviceIn,
            audioDeviceOut: this.audioDeviceOut,
            videoResolution: this.videoResolution,
            nickname: this.nickname,
            showQuickStart: this.showQuickStart,
            language: this.language
        };
        localStorage.setItem("settings", JSON.stringify(data));
    }
    static createConstraints(videoDeviceId, candidate, shouldFaceUser) {
        let constraints;
        // if no specific resolution provided use default when a preered device is set.
        if (videoDeviceId && !candidate) {
            constraints = {
                audio: true,
                video: {
                    width: { min: 320, max: 1280, ideal: 1280 },
                    height: { min: 240, max: 720, ideal: 720 },
                    facingMode: { ideal: shouldFaceUser ? 'user' : 'environment' }
                }
            };
        }
        else if (videoDeviceId && candidate) { // we both have a prefered resolution and device 
            const preferedResolution = DetectResolutions_1.DetectResolutions.getCandidate(candidate);
            constraints = {
                audio: true,
                video: {
                    width: { exact: preferedResolution.width },
                    height: { exact: preferedResolution.height },
                    facingMode: { ideal: shouldFaceUser ? 'user' : 'environment' }
                }
            };
        }
        else if (!videoDeviceId && candidate) { // no prefered device, but a resolution..
            const preferedResolution = DetectResolutions_1.DetectResolutions.getCandidate(candidate);
            constraints = {
                audio: true,
                video: {
                    width: { exact: preferedResolution.width },
                    height: { exact: preferedResolution.height },
                    facingMode: { ideal: shouldFaceUser ? 'user' : 'environment' }
                }
            };
        }
        else { // Nothing set at all, default..
            let defaultConstraints = AppDomain_1.AppDomain.defaultConstraints;
            defaultConstraints.video["facingMode"] = { ideal: shouldFaceUser ? 'user' : 'environment' };
            AppDomain_1.AppDomain.logger.log(`Using defaultConstraints`, defaultConstraints);
            return defaultConstraints;
            // return {
            //     video: {
            //         width: { min: 320, max: 1280, ideal: 640 },
            //         height: { min: 240, max: 720, ideal: 360 },
            //         frameRate: 30,
            //         facingMode: { ideal: shouldFaceUser ? 'user' : 'environment' },
            //     }, audio: true,
            // };
        }
        ;
        if (videoDeviceId) {
            constraints.video["deviceId"] = videoDeviceId;
        }
        AppDomain_1.AppDomain.logger.log(`Current constraints`, constraints);
        return constraints;
    }
    static load() {
        UserSettings.slugHistory = new SlugHistory_1.SlugHistory();
        const ls = localStorage.getItem("settings");
        if (ls) {
            let settings = JSON.parse(ls);
            UserSettings.audioDeviceIn = settings.audioDeviceIn;
            UserSettings.audioDeviceOut = settings.audioDeviceOut;
            UserSettings.videoDevice = settings.videoDevice;
            UserSettings.videoResolution = settings.videoResolution;
            UserSettings.nickname = settings.nickname;
            UserSettings.slugHistory.history = settings.slugHistory;
            UserSettings.showQuickStart = settings.showQuickStart;
            UserSettings.language = settings.language || "";
        }
        else {
            UserSettings.slugHistory.history = new Array();
            UserSettings.nickname = Math.random().toString(36).substring(8);
            UserSettings.audioDeviceIn = "";
            UserSettings.audioDeviceOut = "";
            UserSettings.videoDevice = "";
            UserSettings.videoResolution = "";
            UserSettings.showQuickStart = true;
            UserSettings.language = "";
        }
    }
}
exports.UserSettings = UserSettings;
