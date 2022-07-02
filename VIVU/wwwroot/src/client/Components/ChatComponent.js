"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatComponent = void 0;
// @ts-ignore
const DOMUtils_1 = require("../Helpers/DOMUtils");
const UserSettings_1 = require("../UserSettings");
const AppComponent_1 = require("./AppComponent");
class ChatComponent extends AppComponent_1.AppComponent {
    constructor(dc, userSettings) {
        super();
        this.dc = dc;
        this.userSettings = userSettings;
        this.dc.on("chatMessage", (data) => {
            if (this.onChatMessage)
                this.onChatMessage(data);
            this.render(data);
        });
        this.chatMessage = DOMUtils_1.DOMUtils.get("#chat-message");
        DOMUtils_1.DOMUtils.on("keydown", this.chatMessage, (e) => {
            if (e.keyCode == 13) {
                this.sendMessage(UserSettings_1.UserSettings.nickname, this.chatMessage.value);
                this.chatMessage.value = "";
            }
        });
    }
    sendMessage(sender, message) {
        const data = {
            text: message,
            from: sender
        };
        this.dc.invoke("chatMessage", data);
        this.render(data);
    }
    render(msg) {
        let chatMessages = DOMUtils_1.DOMUtils.get("#chat-messages");
        let message = document.createElement("div");
        let sender = document.createElement("mark");
        let time = document.createElement("time");
        time.textContent = `(${(new Date()).toLocaleTimeString().substr(0, 5)})`;
        let messageText = document.createElement("span");
        messageText.innerHTML = DOMUtils_1.DOMUtils.makeLink(msg.text);
        sender.textContent = msg.from;
        message.prepend(time);
        message.prepend(sender);
        message.append(messageText);
        chatMessages.prepend(message);
    }
}
exports.ChatComponent = ChatComponent;
