"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtendedPeerConnection = void 0;
class ExtendedPeerConnection {
    constructor(context, peerId) {
        this.context = context;
        this.peerId = peerId;
        this.locked = false;
        this.created = Date.now();
    }
}
exports.ExtendedPeerConnection = ExtendedPeerConnection;
