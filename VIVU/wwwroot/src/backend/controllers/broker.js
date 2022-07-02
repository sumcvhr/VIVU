"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Broker = void 0;
const thor_io_vnext_1 = require("thor-io.vnext");
const ExtendedPeerConnection_1 = require("../Models/ExtendedPeerConnection");
const thor_io_client_vnext_1 = require("thor-io.client-vnext");
const applicationinsights_1 = require("applicationinsights");
let Broker = class Broker extends thor_io_vnext_1.ControllerBase {
    constructor(connection) {
        super(connection);
        this.connections = new Array();
    }
    onopen() {
        if (this.queryParameters.has("context") && this.queryParameters.has("peerId")) {
            this.peer = new ExtendedPeerConnection_1.ExtendedPeerConnection(this.queryParameters.get("context"), this.queryParameters.get("peerId"));
            applicationinsights_1.defaultClient && applicationinsights_1.defaultClient.trackTrace({ message: "contecrReconnected" });
        }
        else {
            this.peer = new ExtendedPeerConnection_1.ExtendedPeerConnection(thor_io_client_vnext_1.Utils.newGuid(), thor_io_client_vnext_1.Utils.newGuid());
            applicationinsights_1.defaultClient && applicationinsights_1.defaultClient.trackTrace({ message: "contextCreated" });
        }
        this.invoke(this.peer, "contextCreated", this.alias);
    }
    lockContext() {
        this.peer.locked = !this.peer.locked;
        this.getExtendedPeerConnections(this.peer).forEach((c) => {
            c.peer.locked = this.peer.locked;
        });
        let expression = (pre) => {
            return pre.peer.context == this.peer.context;
        };
        this.invokeTo(expression, this.peer, "lockContext", this.alias);
        applicationinsights_1.defaultClient && applicationinsights_1.defaultClient.trackTrace({ message: "lockContext" });
    }
    isRoomLocked(slug) {
        let match = this.findOn(this.alias, (pre) => {
            return pre.peer.context === slug && pre.peer.locked === true;
        });
        this.invoke({ "state": match.length > 0 ? true : false }, "isRoomLocked");
        applicationinsights_1.defaultClient && applicationinsights_1.defaultClient.trackTrace({ message: "isRoomLocked" });
    }
    leaveContext() {
        this.peer = new ExtendedPeerConnection_1.ExtendedPeerConnection(thor_io_client_vnext_1.Utils.newGuid(), this.peer.peerId);
        this.invoke(this.peer, "leaveContext", this.alias);
        applicationinsights_1.defaultClient && applicationinsights_1.defaultClient.trackTrace({ message: "leaveContext" });
    }
    changeContext(change) {
        let match = this.getExtendedPeerConnections(this.peer).find((pre) => {
            return pre.peer.locked == false && pre.peer.context == change.context;
        });
        if (!match) {
            const isOrganizer = this.findOn(this.alias, (pre) => {
                return pre.peer.context === change.context && pre.isOrganizer == true;
            }).length == 0 ? true : false;
            this.peer.context = change.context;
            this.peer.audio = change.audio;
            this.peer.video = change.video;
            this.isOrganizer = isOrganizer;
            this.invoke(this.peer, "contextChanged", this.alias);
            applicationinsights_1.defaultClient && applicationinsights_1.defaultClient.trackTrace({ message: "contextChanged" });
        }
        else {
            this.invoke(this.peer, "contextChangedFailure", this.alias);
            applicationinsights_1.defaultClient && applicationinsights_1.defaultClient.trackTrace({ message: "contextChangedFailure" });
        }
    }
    contextSignal(signal) {
        let expression = (pre) => {
            return pre.peer.peerId === signal.recipient;
        };
        this.invokeTo(expression, signal, "contextSignal", this.alias);
        applicationinsights_1.defaultClient && applicationinsights_1.defaultClient.trackTrace({ message: "contextSignal" });
    }
    connectContext() {
        if (!this.peer.locked) {
            let connections = this.getExtendedPeerConnections(this.peer).map((p) => {
                return p.peer;
            });
            this.invoke(connections, "connectTo", this.alias);
            applicationinsights_1.defaultClient && applicationinsights_1.defaultClient.trackTrace({ message: "connectTo" });
        }
    }
    setNickname(name) {
        this.nickname = name;
        this.invokeTo((pre) => {
            return pre.peer.context == this.peer.context;
        }, {
            nickname: this.nickname, peerId: this.peer.peerId
        }, "nicknameChange");
    }
    onliners() {
        let onliners = this.getOnliners();
        onliners.push({
            peerId: this.peer.peerId, nickname: this.nickname, created: this.peer.created,
            organizer: this.isOrganizer
        }); // self also..
        this.invoke(onliners, "onliners");
        applicationinsights_1.defaultClient && applicationinsights_1.defaultClient.trackTrace({ message: "onliners" });
    }
    ping(ts) {
        this.invoke({ ts: ts }, "pong");
    }
    isAlive() {
        this.invoke({ timestamp: Date.now() }, "isAlive");
        applicationinsights_1.defaultClient && applicationinsights_1.defaultClient.trackMetric({
            name: 'context',
            value: this.connections.length
        });
        applicationinsights_1.defaultClient && applicationinsights_1.defaultClient.trackTrace({ message: "isAlive" });
    }
    whois(peerId) {
        const match = this.getOnliners().find((pre) => {
            return pre.peerId === peerId;
        });
        if (match) {
            this.invoke(match, "whois");
        }
    }
    getOnliners() {
        return this.getExtendedPeerConnections(this.peer).map((p) => {
            return {
                peerId: p.peer.peerId, nickname: p.nickname, created: p.peer.created,
                organizer: p.isOrganizer
            };
        });
    }
    getExtendedPeerConnections(peerConnetion) {
        let match = this.findOn(this.alias, (pre) => {
            return pre.peer.context === this.peer.context && pre.peer.peerId !== peerConnetion.peerId;
        });
        return match;
    }
};
__decorate([
    thor_io_vnext_1.CanInvoke(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Broker.prototype, "lockContext", null);
__decorate([
    thor_io_vnext_1.CanInvoke(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], Broker.prototype, "isRoomLocked", null);
__decorate([
    thor_io_vnext_1.CanInvoke(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Broker.prototype, "leaveContext", null);
__decorate([
    thor_io_vnext_1.CanInvoke(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], Broker.prototype, "changeContext", null);
__decorate([
    thor_io_vnext_1.CanInvoke(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [thor_io_vnext_1.Signal]),
    __metadata("design:returntype", void 0)
], Broker.prototype, "contextSignal", null);
__decorate([
    thor_io_vnext_1.CanInvoke(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Broker.prototype, "connectContext", null);
__decorate([
    thor_io_vnext_1.CanInvoke(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], Broker.prototype, "setNickname", null);
__decorate([
    thor_io_vnext_1.CanInvoke(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Broker.prototype, "onliners", null);
__decorate([
    thor_io_vnext_1.CanInvoke(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], Broker.prototype, "ping", null);
__decorate([
    thor_io_vnext_1.CanInvoke(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Broker.prototype, "isAlive", null);
__decorate([
    thor_io_vnext_1.CanInvoke(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], Broker.prototype, "whois", null);
Broker = __decorate([
    thor_io_vnext_1.ControllerProperties("broker", false, 5 * 1000),
    __metadata("design:paramtypes", [thor_io_vnext_1.Connection])
], Broker);
exports.Broker = Broker;
