"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const AppParticipantComponent_1 = require("./Components/AppParticipantComponent");
const UserSettings_1 = require("./UserSettings");
const AppDomain_1 = require("./AppDomain");
const mediastreamblender_1 = require("mediastreamblender");
const DetectResolutions_1 = require("./Helpers/DetectResolutions");
// @ts-ignore
const DOMUtils_1 = require("./Helpers/DOMUtils");
const GreenScreenComponent_1 = require("./Components/GreenScreenComponent");
const AudioNodes_1 = require("./Audio/AudioNodes");
const Transcriber_1 = require("./Audio/Transcriber");
const JournalComponent_1 = require("./Components/JournalComponent");
const applicationinsights_web_1 = require("@microsoft/applicationinsights-web");
const hotkeys_js_1 = __importDefault(require("hotkeys-js"));
const MediaUtils_1 = require("./Helpers/MediaUtils");
const SpeechDetector_1 = require("./Audio/SpeechDetector");
const AppBase_1 = require("./AppBase");
const FileshareComponent_1 = require("./Components/FileshareComponent");
const ChatComponent_1 = require("./Components/ChatComponent");
class App extends AppBase_1.AppBase {
    /**
     *Creates an instance of App.
     * @memberof App
     */
    constructor() {
        super();
        this.numUnreadMessages = 0;
        this.numOfPeers = 0;
        this.heartbeat = 0;
        this.numUnreadMessages = 0;
        this.participants = new Map();
        // add language options to UserSettings 
        DOMUtils_1.DOMUtils.get("#languages").append(Transcriber_1.Transcriber.getlanguagePicker());
        DOMUtils_1.DOMUtils.get("#appDomain").textContent = AppDomain_1.AppDomain.domain;
        DOMUtils_1.DOMUtils.get("#appVersion").title = AppDomain_1.AppDomain.version;
        this.slug = location.hash.replace("#", "");
        this.generateSubtitles = DOMUtils_1.DOMUtils.get("#subtitles");
        this.videoGrid = DOMUtils_1.DOMUtils.get("#video-grid");
        this.chatWindow = DOMUtils_1.DOMUtils.get(".chat");
        this.lockContext = DOMUtils_1.DOMUtils.get("#context-lock");
        this.unreadBadge = DOMUtils_1.DOMUtils.get("#unread-messages");
        this.leaveContext = DOMUtils_1.DOMUtils.get("#leave-context");
        this.startButton = DOMUtils_1.DOMUtils.get("#join-conference");
        this.shareSlug = DOMUtils_1.DOMUtils.get("#share-slug");
        this.languagePicker = DOMUtils_1.DOMUtils.get(".selected-language");
        this.pictureInPictureElement = DOMUtils_1.DOMUtils.get("#pip-stream");
        this.textToSpeech = DOMUtils_1.DOMUtils.get("#show-text-to-speech");
        this.textToSpeechMessage = DOMUtils_1.DOMUtils.get("#text-message");
        this.nickname = DOMUtils_1.DOMUtils.get("#txt-nick");
        this.contextName = DOMUtils_1.DOMUtils.get("#context-name");
        let muteAudio = DOMUtils_1.DOMUtils.get("#mute-local-audio");
        let muteVideo = DOMUtils_1.DOMUtils.get("#mute-local-video");
        let muteSpeakers = DOMUtils_1.DOMUtils.get("#mute-speakers");
        let videoDevice = DOMUtils_1.DOMUtils.get("#sel-video");
        let audioDeviceIn = DOMUtils_1.DOMUtils.get("#sel-audio-in");
        let audioDeviceOut = DOMUtils_1.DOMUtils.get("#sel-audio-out");
        let videoResolution = DOMUtils_1.DOMUtils.get("#sel-video-res");
        UserSettings_1.UserSettings.load();
        UserSettings_1.UserSettings.cameraResolutions(UserSettings_1.UserSettings.videoResolution);
        this.nickname.value = UserSettings_1.UserSettings.nickname;
        this.audioNodes = new AudioNodes_1.AudioNodes();
        this.mediaStreamBlender = new mediastreamblender_1.MediaStreamBlender();
        if (this.slug.length >= 6) {
            this.contextName.value = this.slug;
            this.startButton.disabled = false;
            this.startButton.textContent = "JOIN";
            DOMUtils_1.DOMUtils.get("#random-slug").classList.add("d-none"); // if slug predefined, no random option...
        }
        // Remove screenShare on tables / mobile hack..
        if (typeof window.orientation !== 'undefined') {
            DOMUtils_1.DOMUtils.getAll(".only-desktop").forEach(el => el.classList.add("hide"));
        }
        let blenderWaterMark = DOMUtils_1.DOMUtils.get("#watermark");
        this.mediaStreamBlender.onFrameRendered = (ctx) => {
            ctx.save();
            ctx.filter = "invert()";
            ctx.drawImage(blenderWaterMark, 10, 10, 100, 100);
            ctx.restore();
        };
        this.mediaStreamBlender.onTrack = () => {
            this.mediaStreamBlender.refreshCanvas();
        };
        this.mediaStreamBlender.onRecordingStart = () => {
            this.chatComponent.sendMessage(UserSettings_1.UserSettings.nickname, "I'm now recording the session.");
        };
        this.mediaStreamBlender.onRecordingEnded = (blobUrl) => {
            this.displayMeetingRecording(blobUrl);
        };
        this.mediaStreamBlender.onTrackEnded = () => {
            try {
                this.mediaStreamBlender.refreshCanvas();
            }
            catch (err) {
                AppDomain_1.AppDomain.logger.error("mediaStreamBlender onTrackEnded", err);
            }
        };
        this.greenScreenComponent = new GreenScreenComponent_1.GreenScreenComponent("gss");
        this.greenScreenComponent.onApply = (mediaStream) => {
            DOMUtils_1.DOMUtils.get("video#preview").remove();
            let a = this.localMediaStream.getVideoTracks()[0];
            this.localMediaStream.removeTrack(a);
            this.localMediaStream.addTrack(mediaStream.getVideoTracks()[0]);
            DOMUtils_1.DOMUtils.get("#apply-virtual-bg").classList.toggle("hide");
            DOMUtils_1.DOMUtils.get("#remove-virtual-bg").classList.toggle("hide");
        };
        DOMUtils_1.DOMUtils.get("#components").append(this.greenScreenComponent.render());
        DOMUtils_1.DOMUtils.on("click", "#apply-virtual-bg", () => {
            $("#settings-modal").modal("toggle");
            const track = this.localMediaStream.getVideoTracks()[0];
            track.applyConstraints({ width: 640, height: 360 });
            this.greenScreenComponent.setMediaTrack(track);
            $("#gss").modal("toggle");
        });
        DOMUtils_1.DOMUtils.on("click", "#remove-virtual-bg", () => {
            this.getLocalStream(UserSettings_1.UserSettings.defaultConstraints(UserSettings_1.UserSettings.videoDevice, UserSettings_1.UserSettings.videoResolution, true), (mediaStream) => {
                const track = this.localMediaStream.getVideoTracks()[0];
                this.localMediaStream.removeTrack(track);
                this.localMediaStream.addTrack(mediaStream.getVideoTracks()[0]);
                DOMUtils_1.DOMUtils.get("#apply-virtual-bg").classList.toggle("hide");
                DOMUtils_1.DOMUtils.get("#remove-virtual-bg").classList.toggle("hide");
                this.greenScreenComponent.stop();
            });
        });
        DOMUtils_1.DOMUtils.get("#toggle-top").addEventListener("click", () => {
            DOMUtils_1.DOMUtils.get("#sidebar").classList.toggle("active");
            //$('#sidebar').toggleClass('active');
            //            DOMUtils.get("#sidebar-controls").classList.toggle("d-inline-flex")
            //          DOMUtils.get("#sidebar-controls").classList.toggle("hide")
        });
        DOMUtils_1.DOMUtils.on("click", "#show-journal", () => {
            DOMUtils_1.DOMUtils.get("#generate-journal").textContent = "Download";
            if (this.journalComponent.data.length > 0)
                DOMUtils_1.DOMUtils.get("#journal-content div.journal").remove();
            DOMUtils_1.DOMUtils.get("#journal-content").append(this.journalComponent.render());
            $("#meeting-journal").modal("toggle");
        });
        DOMUtils_1.DOMUtils.on("click", "#generate-journal", () => {
            this.journalComponent.download();
        });
        DOMUtils_1.DOMUtils.makeDraggable(DOMUtils_1.DOMUtils.get(".local"));
        DOMUtils_1.DOMUtils.on("click", this.textToSpeech, () => {
            if (this.textToSpeech.checked) {
                DOMUtils_1.DOMUtils.get(".text-to-speech").classList.remove("hide");
            }
            else {
                DOMUtils_1.DOMUtils.get(".text-to-speech").classList.add("hide");
            }
        });
        DOMUtils_1.DOMUtils.on("enterpictureinpicture", this.pictureInPictureElement, () => {
            this.pictureInPictureElement.play();
            DOMUtils_1.DOMUtils.get("#toggle-pip").classList.toggle("flash");
        });
        DOMUtils_1.DOMUtils.on("leavepictureinpicture", this.pictureInPictureElement, () => {
            DOMUtils_1.DOMUtils.get("#toggle-pip").classList.toggle("flash");
            this.mediaStreamBlender.render(0);
            this.mediaStreamBlender.audioSources.clear();
            this.mediaStreamBlender.videosSources.clear();
            DOMUtils_1.DOMUtils.get("#toggle-pip").classList.toggle("flash");
            this.pictureInPictureElement.pause();
        });
        DOMUtils_1.DOMUtils.on("click", DOMUtils_1.DOMUtils.get("#toggle-pip"), (e, el) => {
            if (this.isRecording)
                return;
            if (document["pictureInPictureElement"]) {
                document["exitPictureInPicture"]().then(() => {
                    this.isPipActive = true;
                    el.classList.remove("flash");
                })
                    .catch((err) => {
                    this.isPipActive = false;
                    el.classList.remove("flash");
                    AppDomain_1.AppDomain.logger.error("exitPictureInPicture", err);
                });
            }
            else {
                this.pictureInPictureElement.onloadeddata = () => {
                    this.pictureInPictureElement["requestPictureInPicture"]();
                };
                this.refreshPiP();
                this.isPipActive = true;
                el.classList.add("flash");
            }
        });
        this.languagePicker.value = UserSettings_1.UserSettings.language;
        DOMUtils_1.DOMUtils.on("change", this.languagePicker, () => {
            UserSettings_1.UserSettings.language = this.languagePicker.value;
        });
        DOMUtils_1.DOMUtils.on("click", this.lockContext, () => {
            this.factory.getController("broker").invoke("lockContext", {});
        });
        MediaUtils_1.MediaUtils.getMediaDevices().then((devices) => {
            devices.forEach((d, index) => {
                let option = document.createElement("option");
                option.textContent = d.label || `Device #${index} (name unknown)`;
                option.value = d.deviceId;
                switch (d.kind) {
                    case 'videoinput':
                        option.selected = option.value === UserSettings_1.UserSettings.videoDevice;
                        videoDevice.append(option);
                        break;
                    case 'audioinput':
                        option.selected = option.value === UserSettings_1.UserSettings.audioDeviceIn;
                        audioDeviceIn.append(option);
                        break;
                    case 'audiooutput':
                        option.selected = option.value === UserSettings_1.UserSettings.audioDeviceOut;
                        audioDeviceOut.append(option);
                        break;
                }
            });
        }).catch(err => {
            AppDomain_1.AppDomain.logger.error("getMediaDevices", err);
        });
        DOMUtils_1.DOMUtils.on("click", DOMUtils_1.DOMUtils.get("#save-settings"), () => {
            UserSettings_1.UserSettings.nickname = this.nickname.value;
            UserSettings_1.UserSettings.audioDeviceIn = audioDeviceIn.value;
            UserSettings_1.UserSettings.audioDeviceOut = audioDeviceOut.value;
            UserSettings_1.UserSettings.language = this.languagePicker.value;
            if (this.transcriber)
                this.generateSubtitles.click();
            if (UserSettings_1.UserSettings.videoDevice != videoDevice.value ||
                UserSettings_1.UserSettings.videoResolution != videoResolution.value) {
                UserSettings_1.UserSettings.videoDevice = videoDevice.value;
                UserSettings_1.UserSettings.videoResolution = videoResolution.value;
                let localVideos = DOMUtils_1.DOMUtils.getAll("video.local-cam");
                if (!!localVideos && localVideos.length > 0) {
                    localVideos.forEach(el => el.remove());
                }
                this.localMediaStream.getTracks().forEach(track => {
                    this.localMediaStream.removeTrack(track);
                });
                this.getLocalStream(UserSettings_1.UserSettings.createConstraints(UserSettings_1.UserSettings.videoDevice, UserSettings_1.UserSettings.videoResolution), (ms) => {
                    this.addLocalVideo(ms, true);
                    ms.getTracks().forEach(track => this.localMediaStream.addTrack(track));
                });
            }
            UserSettings_1.UserSettings.save();
            $("#settings-modal").modal("toggle");
        });
        DOMUtils_1.DOMUtils.on("click", DOMUtils_1.DOMUtils.get("#settings"), () => {
            $("#settings-modal").modal("toggle");
        });
        DOMUtils_1.DOMUtils.on("change", "input.file-selected", (evt) => {
            const file = evt.target.files[0];
            this.fileshareComponent.sendFile(file);
        });
        UserSettings_1.UserSettings.slugHistory.getHistory().forEach((slug) => {
            const option = document.createElement("option");
            option.setAttribute("value", slug);
            DOMUtils_1.DOMUtils.get("#context-history").prepend(option);
        });
        DOMUtils_1.DOMUtils.on("click", DOMUtils_1.DOMUtils.get("#generate-slug"), () => {
            this.contextName.value = Math.random().toString(36).substring(2).toLocaleLowerCase();
            this.startButton.disabled = false;
        });
        DOMUtils_1.DOMUtils.on("click", DOMUtils_1.DOMUtils.get("#enable-e2ee"), (e, el) => {
            AppDomain_1.AppDomain.logger.log('toogle e2ee', el.checked);
            if (el.checked) {
                DOMUtils_1.DOMUtils.get("#shared-secret").focus();
                this.useE2EE = true;
                DOMUtils_1.DOMUtils.get("#shared-secret").disabled = false;
            }
            else {
                this.useE2EE = false;
                DOMUtils_1.DOMUtils.get("#shared-secret").disabled = true;
            }
        });
        DOMUtils_1.DOMUtils.on("click", this.generateSubtitles, () => {
            if (!this.transcriber) {
                this.transcriber = new Transcriber_1.Transcriber(this.rtc.localPeerId, new MediaStream(this.rtc.localStreams[0].getAudioTracks()), UserSettings_1.UserSettings.language);
                this.transcriber.onInterim = (interim, final) => {
                    DOMUtils_1.DOMUtils.get("#final-result").textContent = final;
                    DOMUtils_1.DOMUtils.get("#interim-result").textContent = interim;
                };
                this.transcriber.onFinal = (peerId, result, lang) => {
                    this.arbitraryChannel.invoke("transcript", {
                        peerId: peerId,
                        text: result,
                        lang: lang,
                        sender: UserSettings_1.UserSettings.nickname
                    });
                    this.journalComponent.add(UserSettings_1.UserSettings.nickname, result, "", lang);
                };
                this.transcriber.start();
                this.generateSubtitles.classList.toggle("flash");
                DOMUtils_1.DOMUtils.get(".transcript-bar").classList.remove("hide");
                this.transcriber.onStop = () => {
                    DOMUtils_1.DOMUtils.get(".transcript-bar").classList.add("hide");
                    this.generateSubtitles.classList.remove("flash");
                    this.transcriber = null;
                };
            }
            else {
                if (this.transcriber)
                    this.transcriber.stop();
            }
        });
        DOMUtils_1.DOMUtils.on("click", muteSpeakers, () => {
            muteSpeakers.classList.toggle("fa-volume-mute");
            muteSpeakers.classList.toggle("fa-volume-up");
            this.audioNodes.toggleMuteAll();
        });
        DOMUtils_1.DOMUtils.on("click", muteAudio, (e) => {
            if (!this.textToSpeech.checked)
                DOMUtils_1.DOMUtils.get(".text-to-speech").classList.toggle("hide");
            this.muteAudio(e);
        });
        DOMUtils_1.DOMUtils.on("click", muteVideo, (e) => {
            this.muteVideo(e);
        });
        DOMUtils_1.DOMUtils.on("click", DOMUtils_1.DOMUtils.get("#record-all"), (e, el) => {
            el.classList.toggle("flash");
            this.recordAllStreams();
        });
        DOMUtils_1.DOMUtils.on("click", DOMUtils_1.DOMUtils.get("#share-screen"), () => {
            this.shareScreen();
        });
        DOMUtils_1.DOMUtils.on("click", "button#share-link", (e) => {
            navigator.clipboard.writeText(`https://kollokvium.se/#${this.contextName.value}`).then(() => {
                e.target.textContent = "Copied!";
            });
        });
        DOMUtils_1.DOMUtils.on("click", this.shareSlug, () => {
            navigator.clipboard.writeText(`https://kollokvium.se/#${this.contextName.value}`).then(() => {
                $("#share-slug").popover("show");
                setTimeout(() => {
                    $("#share-slug").popover("hide");
                }, 5000);
            });
        });
        DOMUtils_1.DOMUtils.on("click", "#close-chat", () => {
            this.chatWindow.classList.toggle("d-none");
            this.unreadBadge.classList.add("d-none");
            this.numUnreadMessages = 0;
            this.unreadBadge.textContent = "0";
        });
        DOMUtils_1.DOMUtils.on("click", "#show-chat", () => {
            this.chatWindow.classList.toggle("d-none");
            this.unreadBadge.classList.add("d-none");
            this.numUnreadMessages = 0;
            this.unreadBadge.textContent = "0";
            if (!this.chatWindow.classList.contains("d-none")) {
                this.chatComponent.chatMessage.focus();
            }
        });
        DOMUtils_1.DOMUtils.on("change", "#sel-video", (evt) => {
            const deviceId = evt.target.value;
            const constraints = UserSettings_1.UserSettings.createConstraints(deviceId);
            this.getLocalStream(constraints, (cs) => {
                DOMUtils_1.DOMUtils.get("#video-preview").srcObject = cs;
            });
        });
        DOMUtils_1.DOMUtils.on("change", "#sel-video-res", (evt) => {
            const deviceId = DOMUtils_1.DOMUtils.get("#sel-video").value;
            const resolution = evt.target.value;
            const constraints = UserSettings_1.UserSettings.createConstraints(deviceId, resolution);
            DetectResolutions_1.DetectResolutions.tryCandidate(deviceId, constraints.video).then((ms) => {
                DOMUtils_1.DOMUtils.get("#video-preview").srcObject = ms;
                $("#sel-video-res").popover("hide");
                DOMUtils_1.DOMUtils.get("#save-settings").disabled = false;
            }).catch(() => {
                $("#sel-video-res").popover("show");
                DOMUtils_1.DOMUtils.get("#save-settings").disabled = true;
            });
        });
        $("#settings-modal").on('show.bs.modal', () => {
            const constraints = UserSettings_1.UserSettings.createConstraints(UserSettings_1.UserSettings.videoDevice, UserSettings_1.UserSettings.videoResolution);
            this.getLocalStream(constraints, (cs) => {
                DOMUtils_1.DOMUtils.get("#video-preview").srcObject = cs;
            });
        });
        DOMUtils_1.DOMUtils.on("click", this.contextName, () => {
            $("#context-name").popover('show');
            $("#random-slug").popover("hide");
        });
        DOMUtils_1.DOMUtils.on("keyup", "#shared-secret", (e, el) => {
            this.sharedSecret = el.value;
            if (this.sharedSecret.length < 6) {
                el.classList.add("is-invalid");
                this.rtc.isEncrypted = false;
                this.startButton.disabled = true;
            }
            else {
                if (this.contextName.value.length >= 6) {
                    el.classList.remove("is-invalid");
                    this.rtc.e2ee.setKey(el.value);
                    this.rtc.isEncrypted = true;
                    this.startButton.disabled = false;
                }
            }
        });
        DOMUtils_1.DOMUtils.on("keyup", this.contextName, () => {
            if (this.contextName.value.length >= 6 && !this.useE2EE) {
                $("#context-name").popover("hide");
                this.factory.getController("broker").invoke("isRoomLocked", AppDomain_1.AppDomain.getSlug(this.contextName.value));
                this.startButton.disabled = false;
            }
            else if (this.contextName.value.length <= 6 && !this.useE2EE) {
                $("#context-name").popover("show");
                this.startButton.disabled = true;
            }
            else if (this.contextName.value.length >= 6 && this.useE2EE && this.sharedSecret.length >= 6) {
                $("#context-name").popover("hide");
                this.factory.getController("broker").invoke("isRoomLocked", AppDomain_1.AppDomain.getSlug(this.contextName.value));
                this.startButton.disabled = true;
            }
            else if (this.contextName.value.length <= 6 && this.useE2EE && this.sharedSecret.length < 6) {
                $("#context-name").popover("show");
                this.startButton.disabled = true;
            }
        });
        DOMUtils_1.DOMUtils.on("change", this.nickname, () => {
            this.factory.getController("broker").invoke("setNickname", `@${this.nickname.value}`);
        });
        DOMUtils_1.DOMUtils.on("click", this.leaveContext, () => {
            this.factory.getController("broker").invoke("leaveContext", {});
            this.speechDetector.stop();
        });
        DOMUtils_1.DOMUtils.on("click", this.startButton, () => {
            this.enableConferenceElements();
            this.journalComponent = new JournalComponent_1.JournalComponent();
            UserSettings_1.UserSettings.slugHistory.addToHistory(this.contextName.value);
            UserSettings_1.UserSettings.save();
            this.factory.getController("broker").invoke("changeContext", {
                context: AppDomain_1.AppDomain.getSlug(this.contextName.value),
                audio: MediaUtils_1.MediaUtils.CheckStream(this.localMediaStream.getAudioTracks(), "live"),
                video: MediaUtils_1.MediaUtils.CheckStream(this.localMediaStream.getVideoTracks(), "live")
            });
            AppDomain_1.AppDomain.logger.log("Start/joining a a meeting");
            window.history.pushState({}, window.document.title, `#${this.contextName.value}`);
            setTimeout(() => {
                DOMUtils_1.DOMUtils.get("#share-container").classList.toggle("d-none");
            }, 5000);
        });
        if (AppDomain_1.AppDomain.supportsE2EE) {
            AppDomain_1.AppDomain.logger.log(`Seems like the client can do e2ee, showing dialog`);
            DOMUtils_1.DOMUtils.get("#e2ee-dialog").classList.toggle("hide");
        }
        DOMUtils_1.DOMUtils.on("keydown", this.textToSpeechMessage, (e) => {
            if (e.keyCode == 13) {
                this.arbitraryChannel.invoke("textToSpeech", {
                    text: this.textToSpeechMessage.value,
                    peerId: this.rtc.localPeerId,
                    lang: UserSettings_1.UserSettings.language || navigator.language
                });
                this.textToSpeechMessage.value = "";
            }
        });
        /*
            Parse hotkeys
        */
        DOMUtils_1.DOMUtils.getAll("*[data-hotkey]").forEach((el) => {
            const keys = el.dataset.hotkey;
            hotkeys_js_1.default(keys, function (e) {
                el.click();
                e.preventDefault();
            });
        });
        hotkeys_js_1.default("ctrl+b", () => {
            AppDomain_1.AppDomain.logger.log(`Recording each participant`);
            this.participants.forEach((p, id) => {
                p.recordStream(id);
            });
        });
        hotkeys_js_1.default("ctrl+u", (e) => {
            let reports = this.getRTCStatsReport();
            reports.then((chunks) => {
                chunks.forEach(c => {
                    // Create a file for each for download
                    let data = `<html><body>${c}</body></html>`;
                    let blob = new Blob([data], { type: "text/html" });
                    let blobUrl = window.URL.createObjectURL(blob);
                    var a = document.createElement("a");
                    a.href = blobUrl;
                    a.download = `${Math.random().toString(36).substring(8)}.html`;
                    a.click();
                });
            });
            // todo: dump all entrys if the ILogger into a html file also , and pass back.
            e.preventDefault();
        });
        hotkeys_js_1.default("ctrl+o", (e) => {
            // todo pull in stats so we know ...
            AppDomain_1.AppDomain.logger.log(`User requests low res from remotes`);
            this.factory.getController("broker").invoke("onliners", {});
            e.preventDefault();
        });
        hotkeys_js_1.default("ctrl+l", (e) => {
            this.arbitraryChannel.invoke("lowresRequest", { peerId: this.rtc.localPeerId });
            e.preventDefault();
        });
        DOMUtils_1.DOMUtils.on("click", "#toggle-grid", (e, el) => {
            AppDomain_1.AppDomain.logger.log(`Toggle speaker-view mode, number of participants is ${this.participants.size}`);
            DOMUtils_1.DOMUtils.get("#video-grid").classList.toggle("speaker-view");
            this.speakerViewMode = !this.speakerViewMode;
            el.classList.toggle("fa-th-large");
            el.classList.toggle("fa-users");
        });
        this.initialize({ ts: performance.now() }).then((broker) => {
            if (this.slug.length <= 6)
                $("#random-slug").popover("show");
            this.onInitlialized(broker);
            this.factory.onClose = (reason) => {
                AppDomain_1.AppDomain.logger.error("Lost connection", reason);
                if (this.numReconnects < 10) {
                    window.setTimeout(() => {
                        AppDomain_1.AppDomain.logger.log(`Reconnect #${this.numReconnects}`);
                        this.onConnectionLost();
                        this.numReconnects++;
                    }, 10000);
                }
                else {
                    AppDomain_1.AppDomain.logger.error("Failed to recconect");
                }
            };
        }).catch(err => {
            AppDomain_1.AppDomain.logger.error("Connect to broker/signaling error", err);
        });
    }
    /**
     *
     *
     * @memberof App
     */
    /**
     *
     *
     * @param {MediaStreamConstraints} constraints
     * @param {Function} cb
     * @memberof App
     */
    getLocalStream(constraints, cb) {
        AppDomain_1.AppDomain.logger.log(`Get UserMedia`, constraints);
        navigator.mediaDevices.getUserMedia(constraints).then((mediaStream) => {
            AppDomain_1.AppDomain.logger.log(`Successfully retrieved a media stream`);
            // try get the 'MediaStreamTrack capabillities'
            try {
                AppDomain_1.AppDomain.logger.log(`try get MediaStreamTrack capabilities & constraints`);
                mediaStream.getTracks().forEach(track => {
                    AppDomain_1.AppDomain.logger.log(`Track kind ${track.kind}`, track.getCapabilities(), track.getConstraints());
                });
            }
            catch (err) {
                AppDomain_1.AppDomain.logger.log(`Unable to get MediaStreamTrack capabilities & constraints.`);
            }
            cb(mediaStream);
        }).catch((err) => {
            navigator.mediaDevices.getUserMedia(UserSettings_1.UserSettings.failSafeConstraints()).then((mediaStream) => {
                cb(mediaStream);
            }).catch(err => {
                AppDomain_1.AppDomain.logger.error(`getLocalStream error`, err);
                let supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
                AppDomain_1.AppDomain.logger.log("The following media constraints are supported:");
                for (let constraint in supportedConstraints) {
                    if (supportedConstraints.hasOwnProperty(constraint)) {
                        AppDomain_1.AppDomain.logger.log(constraint);
                    }
                }
                // unable to get camera, show camera dialog ?
                DOMUtils_1.DOMUtils.get("#await-need-error").classList.toggle("hide");
                DOMUtils_1.DOMUtils.get("#await-need-accept").classList.toggle("hide");
            });
        });
    }
    /**
     * Prompt user for a screen , tab, window.
     * and add the media stream to share
     * @memberof App
     */
    shareScreen() {
        const gdmOptions = {
            video: {
                cursor: "always"
            },
            audio: false
        };
        navigator.mediaDevices["getDisplayMedia"](gdmOptions).then((stream) => {
            stream.getVideoTracks().forEach((t) => {
                this.rtc.localStreams[0].addTrack(t);
                this.rtc.addTrackToPeers(t);
            });
            this.addLocalVideo(stream, false);
        }).catch(err => {
            AppDomain_1.AppDomain.logger.error("shareScreen", err);
        });
    }
    refreshPiP() {
        this.mediaStreamBlender.audioSources.clear();
        this.mediaStreamBlender.videosSources.clear();
        Array.from(this.participants.values()).forEach((p) => {
            this.mediaStreamBlender.addTracks(p.id, p.videoTracks.concat(p.audioTracks), false);
        });
        this.mediaStreamBlender.addTracks("self", this.localMediaStream.getTracks(), true);
        this.mediaStreamBlender.refreshCanvas();
        this.pictureInPictureElement.srcObject = this.mediaStreamBlender.captureStream();
        if (!this.mediaStreamBlender.isRendering)
            this.mediaStreamBlender.render(15);
    }
    /**
     * Mute local video  ( self )
     *
     * @param {*} evt
     * @memberof App
     */
    muteVideo(evt) {
        let el = evt.target;
        el.classList.toggle("fa-video");
        el.classList.toggle("fa-video-slash");
        let mediaTrack = this.localMediaStream.getVideoTracks();
        mediaTrack.forEach((track) => {
            track.enabled = !track.enabled;
        });
    }
    /**
     * Mute local video ( self )
     *
     * @param {*} evt
     * @memberof App
     */
    muteAudio(evt) {
        let el = evt.target;
        el.classList.toggle("fa-microphone");
        el.classList.toggle("fa-microphone-slash");
        let mediaTrack = this.localMediaStream.getAudioTracks();
        mediaTrack.forEach((track) => {
            track.enabled = !track.enabled;
        });
    }
    /**
     * Record all streams, including local
     *
     * @memberof App
     */
    recordAllStreams() {
        if (!this.mediaStreamBlender.isRecording) {
            this.mediaStreamBlender.audioSources.clear();
            this.mediaStreamBlender.videosSources.clear();
            Array.from(this.participants.values()).forEach((p) => {
                this.mediaStreamBlender.addTracks(p.id, p.videoTracks.concat(p.audioTracks), false);
            });
            this.mediaStreamBlender.addTracks("self", this.localMediaStream.getTracks(), true);
            this.mediaStreamBlender.refreshCanvas();
            this.mediaStreamBlender.render(25);
            this.mediaStreamBlender.record();
        }
        else {
            this.mediaStreamBlender.render(0);
            this.mediaStreamBlender.record();
        }
    }
    /**
     * Display the number of participants & room name in page title
     *
     * @memberof App
     */
    updatePageTitle() {
        document.title = `(${this.numOfPeers + 1}) Kollokvium  - ${this.slug} | A free multi-party video conference for you and your friends!`;
    }
    /**
     * Add a local media stream to the UI
     *
     * @param {MediaStream} mediaStream
     * @memberof App
     */
    addLocalVideo(mediaStream, isCam) {
        let video = document.createElement("video");
        video.autoplay = true;
        video.muted = true;
        video.poster = "img/novideo.png";
        ;
        video.srcObject = isCam ? mediaStream : mediaStream.clone();
        if (isCam)
            video.classList.add("local-cam");
        video.setAttribute("playsinline", '');
        let track = mediaStream.getVideoTracks()[0];
        video.classList.add("l-" + track.id);
        track.onended = () => {
            this.rtc.removeTrackFromPeers(track);
            this.localMediaStream.removeTrack(track);
            this.arbitraryChannel.invoke("track-removed", { peerId: this.rtc.localPeerId, id: track.id });
            DOMUtils_1.DOMUtils.get(".l-" + track.id).remove();
        };
        let container = DOMUtils_1.DOMUtils.get(".local");
        container.append(video);
    }
    /**
   *  Add a participant to the "conference"
   *
   * @param {string} id
   * @returns {AppParticipantComponent}
   * @memberof App
   */
    tryAddParticipant(id) {
        if (this.participants.has(id)) {
            return this.participants.get(id);
        }
        else {
            let participant = new AppParticipantComponent_1.AppParticipantComponent(id);
            participant.onVideoTrackAdded = (id, mediaStream) => {
                let node = participant.render();
                participant.addVideo(id, mediaStream, node);
                DOMUtils_1.DOMUtils.get("#remote-videos").append(node);
                this.numOfPeers++;
                this.updatePageTitle();
            };
            participant.onAudioTrackAdded = (id, mediaStream) => {
                this.audioNodes.add(id, mediaStream);
            };
            participant.onVideoTrackLost = (id, stream) => {
                let p = DOMUtils_1.DOMUtils.getAll(`li video.s${stream.id}`);
                p.forEach(n => n.parentElement.remove());
                this.numOfPeers--;
                this.updatePageTitle();
            };
            participant.onAudioTrackLost = (id) => {
                this.audioNodes.remove(id);
            };
            this.participants.set(id, participant);
            return participant;
        }
    }
    /**
     *
     *
     * @param {HTMLElement} parent
     * @param {string} text
     * @param {string} lang
     * @param {string} [title]
     * @memberof App
     */
    addSubtitles(parent, text, title) {
        if (parent) {
            let p = document.createElement("p");
            if (title)
                p.title = title;
            p.onanimationend = () => {
                p.remove();
            };
            p.textContent = text;
            parent.append(p);
        }
    }
    /**
     *
     *
     * @memberof App
     */
    disableConferenceElements() {
        location.hash = "";
        DOMUtils_1.DOMUtils.get("#toggle-top").classList.toggle("d-none");
        DOMUtils_1.DOMUtils.get("#sidebar").classList.toggle("hide");
        DOMUtils_1.DOMUtils.get("#sidebar-controls").classList.add("hide");
        DOMUtils_1.DOMUtils.get("#mute-speakers").classList.toggle("hide");
        this.generateSubtitles.classList.toggle("hide");
        let slug = DOMUtils_1.DOMUtils.get("#context-name");
        if ('pictureInPictureEnabled' in document)
            DOMUtils_1.DOMUtils.get("#toggle-pip").classList.toggle("hide");
        DOMUtils_1.DOMUtils.get("#share-screen").parentElement.classList.toggle("d-none");
        slug.value = "";
        DOMUtils_1.DOMUtils.get("#random-slug").classList.remove("d-none");
        this.videoGrid.classList.remove("d-flex");
        this.lockContext.classList.add("hide");
        this.leaveContext.classList.add("hide");
        this.startButton.disabled = true;
        this.startButton.classList.remove("hide");
        this.shareSlug.classList.add("hide");
        this.textToSpeechMessage.disabled = true;
        DOMUtils_1.DOMUtils.get("#show-journal").classList.toggle("hide");
        DOMUtils_1.DOMUtils.get("#toggle-grid").classList.toggle("hide");
        DOMUtils_1.DOMUtils.get("#record").classList.add("d-none");
        DOMUtils_1.DOMUtils.get("#show-chat").classList.toggle("d-none");
        DOMUtils_1.DOMUtils.get(".remote").classList.add("hide");
        DOMUtils_1.DOMUtils.get(".overlay").classList.remove("d-none");
        DOMUtils_1.DOMUtils.get(".join").classList.remove("d-none");
    }
    /**
     *
     *
     * @memberof App
     */
    enableConferenceElements() {
        DOMUtils_1.DOMUtils.get("#toggle-top").classList.toggle("d-none");
        DOMUtils_1.DOMUtils.get("#sidebar").classList.toggle("sidebar");
        DOMUtils_1.DOMUtils.get("#sidebar").classList.toggle("hide");
        DOMUtils_1.DOMUtils.get("#mute-speakers").classList.toggle("hide");
        if ('pictureInPictureEnabled' in document)
            DOMUtils_1.DOMUtils.get("#toggle-pip").classList.toggle("hide");
        DOMUtils_1.DOMUtils.get("#share-screen").parentElement.classList.toggle("d-none");
        this.startButton.classList.add("hide");
        this.generateSubtitles.classList.toggle("hide");
        this.shareSlug.classList.remove("hide");
        this.textToSpeechMessage.disabled = false;
        this.startButton.classList.remove("hide");
        this.videoGrid.classList.add("d-flex");
        this.lockContext.classList.remove("hide");
        this.leaveContext.classList.remove("hide");
        DOMUtils_1.DOMUtils.get("#toggle-grid").classList.toggle("hide");
        DOMUtils_1.DOMUtils.get("#show-journal").classList.toggle("hide");
        DOMUtils_1.DOMUtils.get("#record").classList.remove("d-none");
        DOMUtils_1.DOMUtils.get("#show-chat").classList.toggle("d-none");
        DOMUtils_1.DOMUtils.get(".remote").classList.remove("hide");
        DOMUtils_1.DOMUtils.get(".overlay").classList.add("d-none");
        DOMUtils_1.DOMUtils.get(".join").classList.add("d-none");
    }
    displayMeetingRecording(blobUrl) {
        let p = document.createElement("p");
        const download = document.createElement("a");
        download.setAttribute("href", blobUrl);
        download.textContent = "Your recording of all users has ended.(click to download)";
        download.setAttribute("download", `${Math.random().toString(36).substring(6)}.webm`);
        p.append(download);
        DOMUtils_1.DOMUtils.get("#recorder-download").append(p);
        $("#recorder-result").modal("show");
    }
    createSpeechDetecor(ms, interval) {
        try {
            this.speechDetector = new SpeechDetector_1.SpeechDetector(ms, 5, 512);
            this.speechDetector.start(interval);
            AppDomain_1.AppDomain.logger.log(`SpeechDetector has started`);
            this.speechDetector.onspeechstarted = (rms) => {
                this.arbitraryChannel.invoke("isSpeaking", {
                    state: true,
                    rms: rms, peerId: this.rtc.localPeerId
                });
                if (this.speakerViewMode)
                    DOMUtils_1.DOMUtils.get("#video-grid").classList.remove("speaker-view");
            };
            this.speechDetector.onspeechended = (rms) => {
                this.arbitraryChannel.invoke("isSpeaking", {
                    state: false,
                    rms: rms, peerId: this.rtc.localPeerId
                });
                if (this.speakerViewMode)
                    DOMUtils_1.DOMUtils.get("#video-grid").classList.add("speaker-view");
            };
        }
        catch (err) {
            AppDomain_1.AppDomain.logger.log(`failed to create SpeechDetector has started`, err);
        }
    }
    onConnectionLost() {
        this.initialize({
            peerId: this.rtc.localPeerId, context: AppDomain_1.AppDomain.getSlug(this.contextName.value)
        }).then(// @ts-ignore
        (broker) => {
            this.rtc.peers.forEach((peer) => {
                peer.RTCPeer.close();
            });
            DOMUtils_1.DOMUtils.getAll("video", DOMUtils_1.DOMUtils.get(".local")).forEach(e => e.remove());
            this.rtc.localStreams = new Array();
            this.speechDetector.stop();
            this.onInitlialized(broker);
        }).catch(reason => {
            AppDomain_1.AppDomain.logger.log(`failed to reconnect to context`, reason);
        });
    }
    onContextDisconnected(peer) {
        this.participants.delete(peer.id);
        if (this.isPipActive)
            this.refreshPiP();
        DOMUtils_1.DOMUtils.getAll(`li.p${peer.id}`).forEach(n => n.remove());
        this.factory.getController("broker").invoke("onliners", {}); // refresh onliner
    }
    onContextConnected() {
        DOMUtils_1.DOMUtils.get(".remote").classList.add("hide");
        this.factory.getController("broker").invoke("onliners", {}); // refresh onliners
    }
    onContextCreated() {
    }
    onContextChanged() {
        this.rtc.connectContext();
    }
    onLocalStream() {
    }
    onTranscript(data) {
        let parent = DOMUtils_1.DOMUtils.get(`.subs${data.peerId}`);
        if (parent) {
            let targetLanguage = UserSettings_1.UserSettings.language
                || navigator.language;
            targetLanguage = targetLanguage.indexOf("-") > -1 ? targetLanguage.substr(0, 2) : targetLanguage;
            if (data.lang !== targetLanguage && AppDomain_1.AppDomain.translateKey) {
                Transcriber_1.Transcriber.translateCaptions(AppDomain_1.AppDomain.translateKey, data.text, data.lang, UserSettings_1.UserSettings.language
                    || navigator.language).then((result) => {
                    this.addSubtitles(parent, result, data.text);
                    this.journalComponent.add(data.sender, result, data.text, data.lang);
                }).catch(() => {
                    this.addSubtitles(parent, data.text);
                    this.journalComponent.add(data.sender, data.text, "", data.lang);
                });
            }
            else {
                this.journalComponent.add(data.sender, data.text, "", data.lang);
                this.addSubtitles(parent, data.text);
            }
        }
    }
    onSpeaking(data) {
        let match = DOMUtils_1.DOMUtils.get(`li.p${data.peerId}`);
        if (match) {
            if (data.state) {
                match.classList.add("is-speaking");
            }
            else {
                match.classList.remove("is-speaking");
            }
        }
    }
    onTextToSpeech(data) {
        let targetLanguage = UserSettings_1.UserSettings.language
            || navigator.language;
        if (data.lang !== targetLanguage && AppDomain_1.AppDomain.translateKey) {
            Transcriber_1.Transcriber.translateCaptions(AppDomain_1.AppDomain.translateKey, data.text, data.lang, UserSettings_1.UserSettings.language
                || navigator.language).then((result) => {
                Transcriber_1.Transcriber.textToSpeech(result, targetLanguage);
            }).catch(() => {
            });
        }
        else {
            Transcriber_1.Transcriber.textToSpeech(data.text, targetLanguage);
        }
    }
    onLowresRequest(data) {
        let rtpsenders = this.rtc.getRtpSenders(data.peerId);
        rtpsenders.forEach((sender) => {
            if (sender.track.kind === "video") {
                sender.track.applyConstraints({
                    width: 426,
                    height: 240,
                });
            }
        });
    }
    /**
     *
     *
     * @private
     * @param {MediaStreamTrack} track
     * @param {WebRTCConnection} connection
     * @param {RTCTrackEvent} event
     * @memberof App
     */
    onRemoteTrack(track, connection, event) {
        let participant = this.tryAddParticipant(connection.id);
        if (this.useE2EE) {
            let streams = event.receiver.createEncodedStreams();
            streams.readableStream
                .pipeThrough(new TransformStream({
                transform: this.rtc.e2ee.decode.bind(this.rtc.e2ee),
            }))
                .pipeTo(streams.writableStream);
        }
        if (event.streams[0]) {
            participant.addTrack(event.streams[0].id, event.track, event.streams[0]);
        }
        else {
            let stream = new MediaStream([track]);
            participant.addTrack(stream.id, event.track, stream);
        }
        this.factory.getController("broker").invoke("whois", connection.id);
        if (this.isPipActive)
            this.refreshPiP();
    }
    onLeaveContext() {
        this.rtc.peers.forEach((connection) => {
            connection.RTCPeer.close();
        });
        this.participants.clear();
        DOMUtils_1.DOMUtils.get("#remote-videos").innerHTML = "";
        this.disableConferenceElements();
    }
    onLockContext() {
        this.lockContext.classList.toggle("fa-lock-open");
        this.lockContext.classList.toggle("fa-lock");
    }
    onIsRoomLocked(data) {
        let slug = DOMUtils_1.DOMUtils.get("#context-name");
        this.startButton.disabled = data.state;
        if (data.state) {
            slug.classList.add("is-invalid");
        }
        else {
            slug.classList.remove("is-invalid");
        }
    }
    onWhoIs(data) {
        let n = DOMUtils_1.DOMUtils.get(`.n${data.peerId}`);
        if (n)
            n.textContent = data.nickname;
    }
    onNicknameChange(data) {
        let n = DOMUtils_1.DOMUtils.get(`.n${data.peerId}`);
        if (n)
            n.textContent = data.nickname;
    }
    onBrokerOpen() {
        this.factory.getController("broker").invoke("setNickname", `@${this.nickname.value}`);
        let contextName = DOMUtils_1.DOMUtils.get("#context-name");
        if (contextName.value.length >= 6) {
            this.factory.getController("broker").invoke("isRoomLocked", AppDomain_1.AppDomain.getSlug(contextName.value));
        }
        this.getLocalStream(UserSettings_1.UserSettings.defaultConstraints(UserSettings_1.UserSettings.videoDevice, UserSettings_1.UserSettings.videoResolution, true), (mediaStream) => {
            AppDomain_1.AppDomain.logger.log(`OnOpen - Mediastream ${mediaStream.id}`);
            if (location.search.includes("novideo"))
                mediaStream.removeTrack(mediaStream.getVideoTracks()[0]);
            AppDomain_1.AppDomain.logger.log(`OnOpen mediastream has ${mediaStream.getTracks().length} tracks`);
            this.createSpeechDetecor(mediaStream, 2000);
            DOMUtils_1.DOMUtils.get("#await-streams").classList.toggle("hide");
            DOMUtils_1.DOMUtils.get("#has-streams").classList.toggle("hide");
            this.localMediaStream = mediaStream;
            this.rtc.addLocalStream(this.localMediaStream);
            this.addLocalVideo(this.localMediaStream, true);
        });
        this.factory.getController("broker").on("pong", (data) => {
            this.heartbeat = data.ts;
        });
        setInterval(() => {
            if (this.factory.IsConnected)
                this.factory.getController("broker").invoke("ping", performance.now().toFixed(0));
        }, 1000 * 20);
    }
    onInitlialized(broker) {
        this.rtc.onLocalStream = this.onLocalStream.bind(this);
        this.rtc.onContextCreated = this.onContextCreated.bind(this);
        this.rtc.onContextChanged = this.onContextChanged.bind(this);
        this.rtc.onContextDisconnected = this.onContextDisconnected.bind(this);
        this.rtc.onContextConnected = this.onContextConnected.bind(this);
        this.rtc.onError = (err) => {
            AppDomain_1.AppDomain.logger.error(err);
        };
        this.rtc.onRemoteVideoTrack = this.onRemoteTrack.bind(this);
        this.rtc.onRemoteAudioTrack = (track, connection, event) => {
            // no op
        };
        this.arbitraryChannel = this.rtc.createDataChannel(`arbitrary-${AppDomain_1.AppDomain.contextPrefix}-dc`);
        this.chatComponent = new ChatComponent_1.ChatComponent(this.arbitraryChannel, UserSettings_1.UserSettings);
        this.fileshareComponent = new FileshareComponent_1.FileShareComponent(this.rtc.createDataChannel(`blob-${AppDomain_1.AppDomain.contextPrefix}-dc`), UserSettings_1.UserSettings);
        this.chatComponent.onChatMessage = () => {
            this.numUnreadMessages++;
            if (this.chatWindow.classList.contains("d-none")) {
                this.unreadBadge.classList.remove("d-none");
                this.unreadBadge.textContent = this.numUnreadMessages.toString();
            }
        };
        this.fileshareComponent.onFileReceived = () => {
            this.numUnreadMessages++;
            if (this.chatWindow.classList.contains("d-none")) {
                this.unreadBadge.classList.remove("d-none");
                this.unreadBadge.textContent = this.numUnreadMessages.toString();
            }
        };
        this.arbitraryChannel.on("track-removed", (data) => {
            const el = DOMUtils_1.DOMUtils.get(`.t${data.id}`);
            if (el) {
                el.parentElement.remove();
            }
        });
        this.arbitraryChannel.on("lowresRequest", this.onLowresRequest.bind(this));
        this.arbitraryChannel.on("textToSpeech", this.onTextToSpeech.bind(this));
        this.arbitraryChannel.on("transcript", this.onTranscript.bind(this));
        this.arbitraryChannel.on("isSpeaking", this.onSpeaking.bind(this));
        broker.onOpen = this.onBrokerOpen.bind(this);
        broker.on("leaveContext", this.onLeaveContext.bind(this));
        broker.on("lockContext", this.onLockContext.bind(this));
        broker.on("isRoomLocked", this.onIsRoomLocked.bind(this));
        broker.on("nicknameChange", this.onNicknameChange.bind(this));
        broker.on("whois", this.onWhoIs.bind(this));
        broker.on("contextReconnect", (data) => {
            AppDomain_1.AppDomain.logger.log(`Client reconnected to server..`, data);
        });
        broker.connect();
    }
    static getInstance() {
        return new App();
    }
}
exports.App = App;
/*
    Launch the application
*/
document.addEventListener("DOMContentLoaded", () => {
    window.AudioContext = window.AudioContext || window["webkitAudioContext"];
    if (!(location.href.includes("file://"))) { // temp hack for electron
        if (!(location.href.includes("https://") || location.href.includes("http://localhost")))
            location.href = location.href.replace("http://", "https://");
    }
    const instrumentationKey = process.env.APPINSIGHTS_INSTRUMENTATIONKEY;
    if (!!instrumentationKey) {
        const appInsights = new applicationinsights_web_1.ApplicationInsights({ config: { instrumentationKey: instrumentationKey } });
        appInsights.loadAppInsights();
        appInsights.trackPageView();
    }
    App.getInstance();
});
