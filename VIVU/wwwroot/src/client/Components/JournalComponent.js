"use strict";
// @ts-ignore
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalComponent = void 0;
class JournalComponent {
    constructor() {
        this.data = new Array();
    }
    add(sender, text, originText, language) {
        this.data.push({
            time: new Date().toLocaleTimeString().substr(0, 5),
            sender: sender,
            originText: originText,
            text: text,
            language: language
        });
    }
    download() {
        let result = this.render();
        let data = `
        <html>
        <head>
        <title>Kollokvium meeting journal</title>
        <style>
        p{
            line-height:1.5;
        }
        time,mark{
            margin-right:20px;

        }
        </style>
        </head>
        <body>
        <h1>Kollokvium meeting journal</h1>
        ${result.outerHTML}
        </body>
        </html>
        `;
        let blob = new Blob([data], { type: "text/html" });
        let blobUrl = window.URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${Math.random().toString(36).substring(8)}.html`;
        a.click();
    }
    render() {
        let journal = document.createElement("div");
        journal.classList.add("journal");
        this.data.forEach((entry) => {
            let line = document.createElement("p");
            let time = document.createElement("time");
            time.textContent = entry.time;
            line.append(time);
            let sender = document.createElement("mark");
            sender.textContent = entry.sender;
            line.append(sender);
            let text = document.createElement("span");
            text.textContent = `${entry.text}`;
            line.append(text);
            if (entry.originText.length > 0) {
                let origin = document.createElement("em");
                origin.classList.add("mx-2");
                line.append(origin);
            }
            journal.append(line);
        });
        return journal;
    }
}
exports.JournalComponent = JournalComponent;
