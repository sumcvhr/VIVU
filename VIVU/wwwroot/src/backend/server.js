"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const express_1 = __importDefault(require("express"));
const ws_1 = __importDefault(require("ws"));
const applicationinsights_1 = require("applicationinsights");
const yargs_1 = __importDefault(require("yargs"));
const thor_io_vnext_1 = require("thor-io.vnext");
const broker_1 = require("./controllers/broker");
console.clear();
let port = +process.env.PORT;
let server;
let app = express_1.default();
let rtc = new thor_io_vnext_1.ThorIO([
    broker_1.Broker,
]);
let argv = yargs_1.default.boolean('s').alias('s', 'use-ssl').argv;
let rootPath = path_1.default.resolve('.');
if (fs_1.default.existsSync(path_1.default.join(rootPath, 'dist'))) {
    rootPath = path_1.default.join(rootPath, 'dist');
}
let clientPath = path_1.default.join(rootPath, "client");
let keyFile = path_1.default.join(rootPath, 'cert', 'selfsigned.key');
let certFile = path_1.default.join(rootPath, 'cert', 'selfsigned.crt');
if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
    applicationinsights_1.setup()
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true)
        .setUseDiskRetryCaching(true)
        .start();
}
if (fs_1.default.existsSync(clientPath)) {
    console.log(`Serving client files from ${clientPath}.`);
    app.use("/", express_1.default.static(clientPath));
}
else {
    console.log(`Serving no client files.`);
    app.get("/", (_, res) => res.send('Kollokvium WebSocket Server is running'));
}
if (argv['use-ssl'] && fs_1.default.existsSync(keyFile) && fs_1.default.existsSync(certFile)) {
    let key = fs_1.default.readFileSync(keyFile);
    let cert = fs_1.default.readFileSync(certFile);
    port = port || 4433;
    server = https_1.default.createServer({
        cert,
        key
    }, (req, res) => {
        app(req, res);
        applicationinsights_1.defaultClient && applicationinsights_1.defaultClient.trackNodeHttpRequest({ request: req, response: res });
    });
}
else {
    port = port || 1337;
    server = http_1.default.createServer((req, res) => {
        app(req, res);
        applicationinsights_1.defaultClient && applicationinsights_1.defaultClient.trackNodeHttpRequest({ request: req, response: res });
    });
}
const ws = new ws_1.default.Server({ server });
ws.on('connection', (ws, req) => {
    //    console.log(req.headers, req["query"]);
    rtc.addWebSocket(ws, req);
    applicationinsights_1.defaultClient && applicationinsights_1.defaultClient.trackEvent({ name: 'new client', time: new Date() });
});
server.listen(port);
console.log(`Kollokvium version ${process.env.KOLLOKVIUM_VERSION} is listening on ${port}`);
