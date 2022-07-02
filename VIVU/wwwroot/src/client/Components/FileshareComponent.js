"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileShareComponent = void 0;
const thor_io_client_vnext_1 = require("thor-io.client-vnext");
// @ts-ignore
const DOMUtils_1 = require("../Helpers/DOMUtils");
const ReadFile_1 = require("../Helpers/ReadFile");
const UserSettings_1 = require("../UserSettings");
const AppComponent_1 = require("./AppComponent");
class FileShareComponent extends AppComponent_1.AppComponent {
    constructor(dataChannel, userSettings) {
        super();
        this.dataChannel = dataChannel;
        this.userSettings = userSettings;
        dataChannel.on("fileShare", (fileInfo, arrayBuffer) => {
            this.render(fileInfo, new Blob([arrayBuffer], {
                type: fileInfo.mimeType
            }));
        });
    }
    sendFile(file) {
        if (!file)
            return;
        DOMUtils_1.DOMUtils.get("#share-file-box").classList.toggle("hide");
        let sendProgress = DOMUtils_1.DOMUtils.get("#file-progress");
        sendProgress.setAttribute("aria-valuenow", "0");
        sendProgress.classList.toggle("hide");
        let meta = {
            name: file.name,
            size: file.size,
            mimeType: file.type,
            sender: UserSettings_1.UserSettings.nickname
        };
        const shareId = thor_io_client_vnext_1.Utils.newGuid();
        let bytes = 0;
        ReadFile_1.ReadFile.readChunks(file, (data, chunkSize, isFinal) => {
            bytes += chunkSize;
            DOMUtils_1.DOMUtils.get(".progress-bar", sendProgress).style.width = `${((chunkSize / meta.size) * 100) * 1000}%`;
            this.dataChannel.invokeBinary("fileShare", meta, data, isFinal, shareId);
            if (isFinal) {
                setTimeout(() => {
                    DOMUtils_1.DOMUtils.get("#share-file-box").classList.toggle("hide");
                    sendProgress.classList.toggle("hide");
                }, 2000);
            }
        });
    }
    render(fileInfo, blob) {
        if (this.onFileReceived)
            this.onFileReceived(fileInfo);
        let message = document.createElement("div");
        let sender = document.createElement("mark");
        let time = document.createElement("time");
        time.textContent = `(${(new Date()).toLocaleTimeString().substr(0, 5)})`;
        let messageText = document.createElement("span");
        messageText.innerHTML = DOMUtils_1.DOMUtils.makeLink("Hey,the file is ready to download, click to download ");
        sender.textContent = fileInfo.sender;
        message.prepend(time);
        message.prepend(sender);
        message.append(messageText);
        const blobUrl = window.URL.createObjectURL(blob);
        const download = document.createElement("a");
        download.setAttribute("href", blobUrl);
        download.textContent = fileInfo.name;
        download.setAttribute("download", fileInfo.name);
        messageText.append(download);
        DOMUtils_1.DOMUtils.get("#chat-messages").prepend(message);
    }
}
exports.FileShareComponent = FileShareComponent;
