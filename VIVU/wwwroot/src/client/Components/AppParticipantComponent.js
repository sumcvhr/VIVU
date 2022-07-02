"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppParticipantComponent = void 0;
const image_capture_1 = require("image-capture");
// @ts-ignore
const DOMUtils_1 = require("../Helpers/DOMUtils");
const mediastreamblender_1 = require("mediastreamblender");
class AppParticipantComponent {
    constructor(id) {
        this.id = id;
        this.streams = new Map();
        //  this.videoTracks = new Array<MediaStreamTrack>();
        //  this.audioTracks = new Array<MediaStreamTrack>();
    }
    get audioTracks() {
        let r = new Array();
        this.streams.forEach(stream => {
            stream.getAudioTracks().forEach(t => {
                r.push(t);
            });
        });
        return r;
    }
    get videoTracks() {
        let r = new Array();
        this.streams.forEach(stream => {
            stream.getVideoTracks().forEach(t => {
                r.push(t);
            });
        });
        return r;
    }
    displayRecording(blobUrl) {
        let p = document.createElement("p");
        const download = document.createElement("a");
        download.setAttribute("href", blobUrl);
        download.textContent = `Your recording has ended,click to download.`;
        download.setAttribute("download", `${Math.random().toString(36).substring(6)}.webm`);
        p.append(download);
        DOMUtils_1.DOMUtils.get("#recorder-download").append(p);
        $("#recorder-result").modal("show");
    }
    recordStream(id) {
        if (!this.isRecording) {
            DOMUtils_1.DOMUtils.get("i.recording", DOMUtils_1.DOMUtils.get(`li.p${id} .video-tools`)).classList.add("flash");
            let tracks = this.getTracks();
            this.recorder = new mediastreamblender_1.MediaStreamRecorder(tracks);
            this.recorder.start(10);
            this.isRecording = true;
        }
        else {
            DOMUtils_1.DOMUtils.get("i.recording", DOMUtils_1.DOMUtils.get(`li.p${id} .video-tools`)).classList.remove("flash");
            this.isRecording = false;
            this.recorder.stop();
            this.recorder.flush().then((blobUrl) => {
                this.displayRecording(blobUrl);
            });
        }
    }
    addVideo(id, mediaStream, node) {
        let video = document.createElement("video");
        video.classList.add("p" + this.id);
        video.classList.add("s" + mediaStream.id);
        mediaStream.getVideoTracks().forEach(t => {
            video.classList.add("t" + t.id);
        });
        video.poster = "img/novideo.png";
        video.srcObject = mediaStream;
        video.width = 1280;
        video.height = 720;
        video.autoplay = true;
        video.setAttribute("playsinline", '');
        let pre = DOMUtils_1.DOMUtils.get("img", node);
        if (pre)
            pre.remove();
        node.append(video);
        DOMUtils_1.DOMUtils.get(".video-tools", node).classList.remove("d-none");
    }
    render() {
        let container = document.createElement("li");
        container.classList.add("p" + this.id);
        let namebadge = document.createElement("span");
        namebadge.classList.add("namebadge");
        namebadge.classList.add("n" + this.id);
        namebadge.textContent = "Unkown";
        container.append(namebadge);
        let novideoImage = document.createElement("img");
        novideoImage.src = "img/novideo.png";
        container.append(novideoImage);
        let tools = document.createElement("div");
        tools.classList.add("video-tools", "p2", "darken", "d-none");
        let fullscreen = document.createElement("i");
        fullscreen.classList.add("fas", "fa-arrows-alt", "fa-2x", "white");
        fullscreen.addEventListener("click", (e) => {
            let elem = DOMUtils_1.DOMUtils.get("video", container);
            if (!document.fullscreenElement) {
                elem.requestFullscreen().catch(err => {
                    alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            }
            else {
                document.exitFullscreen();
            }
        });
        let record = document.createElement("i");
        record.classList.add("fas", "fa-circle", "fa-2x", "red", "recording");
        record.addEventListener("click", () => {
            this.recordStream(this.id);
        });
        if (typeof window.orientation === 'undefined')
            tools.append(record);
        tools.append(fullscreen);
        container.prepend(tools);
        let subtitles = document.createElement("div");
        subtitles.classList.add("subtitles");
        subtitles.classList.add("subs" + this.id);
        container.append(subtitles);
        return container;
    }
    getTracks() {
        let tracks = new Array();
        tracks.push(this.videoTracks[0]);
        tracks.push(this.audioTracks[0]);
        return tracks;
    }
    captureImage() {
        let track = this.videoTracks[0];
        let imageCapture = new image_capture_1.ImageCapture(track);
        return new Promise((resolve, reject) => {
            imageCapture.grabFrame()
                .then(blob => {
                resolve(blob);
            })
                .catch(reject);
        });
    }
    addVideoTrack(t, stream) {
        stream.getVideoTracks()[0].onended = () => {
            if (this.onVideoTrackLost)
                this.onVideoTrackLost(this.id, stream, t);
        };
        this.onVideoTrackAdded(this.id, stream, t);
    }
    addAudioTrack(t, stream) {
        this.audioTracks.push(t);
        //let stream = new MediaStream([t]);
        t.onended = () => {
            // todo: would be an delagated event
            if (this.onAudioTrackLost)
                this.onAudioTrackLost(this.id, stream, t);
        };
        this.onAudioTrackAdded(this.id, stream, t);
    }
    addTrack(id, t, s) {
        if (!this.streams.has(id))
            this.streams.set(id, s);
        if (t.kind == "video") {
            this.addVideoTrack(t, s);
        }
        else {
            this.addAudioTrack(t, s);
        }
    }
}
exports.AppParticipantComponent = AppParticipantComponent;
