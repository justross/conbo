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

        // Bind Elements to Editor
        this.contentElement.addEventListener('keydown', this.processInput);
        this.filenameElement.addEventListener('click', this.setActive()); // TODO: implement setActive which probably involves passing EditorWindow in the constructor
        this.tabElement.addEventListener('click', this.setActive());

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

    saveFile(filepath) {
        saveFile(this, filepath);
    }

    saved() {
        if (this.edited || this.filepath === null) return false;
        return true;
    }

    // Reads keyboard input of editor window
    processInput() {
        // get caret position/selection
        let start = event.target.selectionStart;
        let end = event.target.selectionEnd;
        let {value} = event.target;
        clearTimeout(typingTimer);

        switch (true) {
            // CTRL-S
            case event.which === 83 && event.ctrlKey: {
                event.preventDefault();
                const e = editorFrame.findEditor(event.target);
                saveFile(e, e.filepath);
            }
                break;

            // Shift-Tab
            case event.which === 9 && event.shiftKey: {
                event.preventDefault();
                let sel = window.getSelection(), text = sel.toString(),
                    range = sel.getRangeAt(0), closestNewLine = range.startContainer.parentNode;
                while (closestNewLine.previousSibling.textContent !== '\n') {
                    closestNewLine = closestNewLine.previousSibling;
                }
                if (closestNewLine.textContent === '\t') {
                    closestNewLine.parentNode.removeChild(closestNewLine);
                }
                if (closestNewLine.textContent.substring(0, 4) === '    ') {
                    closestNewLine.textContent = closestNewLine.textContent.substring(4, closestNewLine.textContent.length);
                    if (!closestNewLine.length) {
                        closestNewLine.parentNode.removeChild(closestNewLine);
                    }
                }

                if (sel.type === 'Range') {
                    let n = range.startContainer.parentNode;
                    while (n.nextSibling !== sel.extentNode.parentNode) {
                        // TODO: check for stuff
                    }

                    range.deleteContents();
                    let arr = [];
                    text.split('\n').forEach((line) => {
                        if (line.charAt(0) === '\t')
                            arr.push(line.substring(1, line.length));
                        else if (line.charAt(0) === ' ' && line.charAt(1) === ' '
                            && line.charAt(2) === ' ' && line.charAt(3) === ' ')

                            arr.push(line.substring(4, line.length));
                        else
                            arr.push(line);
                    });
                    range.insertNode(document.createTextNode(arr.join('\n')));
                }
            }
                break;

            // Tab
            case event.which == 9: {
                event.preventDefault();
                let sel = window.getSelection(), range = sel.getRangeAt(0);
                if (sel.type === 'Range') {
                    let text = sel.toString();
                    range.deleteContents();
                    let arr = [];
                    text.split('\n').forEach((line) => {
                        arr.push('    ' + line);
                    });
                    range.insertNode(document.createTextNode(arr.join('\n')));
                }
                else {
                    const tabNode = document.createTextNode('\t');
                    range.insertNode(tabNode);
                    range.setStartAfter(tabNode);
                    range.setEndAfter(tabNode);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
                break;

            default:

        }
    }
}

module.exports.Editor = Editor;