class Editor {
    constructor(obj) {
        if (typeof obj === 'object' && obj !== null) {
            this.filepath = obj.filepath;
            this.fileName = obj.filepath.substring(obj.filepath.lastIndexOf('\\') + 1, obj.filepath.length);
            this.directory = obj.filepath.substring(0, obj.filepath.lastIndexOf('\\'));
            this.fileContent = String(fs.readFileSync(obj.filepath));
            this.rawText = this.fileContent;
            this.lines = this.rawText.split('\n');
            this.parsedText = this.parse(this.rawText);
            this.active = obj.active;
        }
        else {
            this.fileName = 'untitled';
            this.filepath = null;
            this.fileContent = "";
            this.directory = "";
            this.rawText = "";
            this.lines = [];
            this.parsedText = "";
            this.active = true;
            this.caretPosition = 0;
        }
        this.edited = false;

        // HTML Elements
        this.tabElement = document.importNode(editorTemplate.content.children[1], true);
        this.filenameElement = this.tabElement.children[0];
        this.contentElement = document.importNode(editorTemplate.content.children[2], true);

        this.filenameElement.innerText = this.fileName;
        this.contentElement.innerHTML = this.parsedText;
        contentContainerElement.appendChild(this.contentElement);
        tabBarElement.appendChild(this.tabElement);


        let s = 0;
        this.lineRanges = this.lines.map(v => {
            s += v.length;
            return ({
                start: s - v.length,
                end: s
            });
        });
        this.selectionDirection = 'none';
        this.undoStack = [];
        this.undoStack.push({ 'fileContent': this.fileContent, 'caretPosition': this.caretPosition });
        this.redoStack = [];
    }
    parse() {
        let a = [];
        this.rawText.split(/(\s|\.)/).forEach((token) => {
            let color = 'purple';
            switch (true) {
                case token === 'var' || token === '.':
                    color = 'tomato';
                    break;
            }
            if (token !== ' ' && token.length) a.push(`<span style="-webkit-text-fill-color: ${color};">${token}</span>`);
            else a.push(token);
        });
        return a.join("");
    }
    undo() {
        if (this.undoStack.length > 0) {
            this.redoStack.push(this.undoStack.pop());
        }
    }
    redo() {
        if (this.redoStack.length > 0) {
            this.undoStack.push(this.redoStack.pop());
        }
    }
    update(content) {
        this.undoStack.push(this.editor);
        this.editor = new Editor(content);
        contentDiv.innerHTML = content;
    }

    serialize() {
        const obj = {};
        obj.filepath = this.filepath;
        obj.active = this.active;
        return obj;
    }

    saved() {
        if (this.edited || this.filepath === null) return false;
        return true;
    }
}

module.exports.Editor = Editor;