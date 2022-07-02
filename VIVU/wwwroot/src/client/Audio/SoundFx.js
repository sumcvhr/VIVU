"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoundFx = void 0;
class SoundFx {
    constructor(files) {
        this.files = files;
        this.sounds = new Map();
    }
    init() {
        this.files.forEach((file) => {
            let p = document.createElement("audio");
            p.dataset.key = file.key;
            p.onload = () => {
                this.sounds.set(p.dataset.key, p);
            };
            p.src = file.url;
        });
    }
    play(key) {
        if (!this.sounds.has(key))
            throw `cannot play ${key}`;
        this.sounds.get(key).play();
    }
    stop(key) {
        if (!this.sounds.has(key))
            throw `cannot play ${key}`;
        this.sounds.get(key).pause();
        this.sounds.get(key).currentTime = 0;
    }
    static getInstance(files) {
        return new SoundFx(files);
    }
}
exports.SoundFx = SoundFx;
