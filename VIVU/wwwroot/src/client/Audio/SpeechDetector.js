"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeechDetector = void 0;
class SpeechDetector {
    constructor(mediaStream, minDecibel, historySize) {
        this.mediaStream = mediaStream;
        this.minDecibel = minDecibel;
        this.historySize = historySize;
        this._interval = 0;
        this.isSpeaking = false;
        this.avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
        this.history = new Array(historySize);
        this.history.fill(0);
        this.audioContext = new AudioContext();
        this.mediaStreamSource = this.audioContext.createMediaStreamSource(mediaStream);
        this.processor = this.audioContext.createScriptProcessor(512, 1, 1);
        this.mediaStreamSource.connect(this.processor);
        this.processor.connect(this.audioContext.destination);
        this.processor.onaudioprocess = (evt) => {
            var _a, _b;
            const channelData = evt.inputBuffer.getChannelData(0);
            var total = 0;
            for (let i = 0; i < channelData.length; i++) {
                total += Math.abs(channelData[i++]);
            }
            const rms = Math.sqrt(total / channelData.length);
            (_a = this.history) === null || _a === void 0 ? void 0 : _a.pop();
            (_b = this.history) === null || _b === void 0 ? void 0 : _b.unshift(rms);
            if (this.ondataavailable)
                this.ondataavailable(rms * 100);
        };
    }
    start(n) {
        let prior = 0;
        this._interval = setInterval(() => {
            if (this.history) {
                const avg = this.avg(this.history) * 100;
                if (avg > this.minDecibel) {
                    if (!this.isSpeaking) {
                        this.onspeechstarted && this.onspeechstarted(avg);
                    }
                    this.isSpeaking = true;
                }
                else {
                    if (this.isSpeaking) {
                        this.onspeechended && this.onspeechended(avg);
                    }
                    this.isSpeaking = false;
                }
                prior = avg;
            }
        }, n);
    }
    stop() {
        clearInterval(this._interval);
    }
}
exports.SpeechDetector = SpeechDetector;
