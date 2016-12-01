'use strict';

const {remote} = require('electron');
const {app, dialog} = remote;
const fs = require('fs');

const editorTemplate = document.getElementById('editor');

// Adds splice() to String
String.prototype.splice = function (idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};

class Editor {
    constructor(filepath) {
        switch (filepath) {
            case "string":
                let fp = filePath.split(filePath.lastIndexOf('\\') + 1, filePath.length);
                this.fileName = fp[0];
                this.directory = fp[1];
                this.filepath = filepath;
                this.fileContent = String(fs.readFileSync(filepath));
            default:
                this.fileName = 'untitled';
                this.filepath = null;
                this.fileContent = "";
                this.directory = "";
                this.rawText = "";
        }
        this.caretPosition = 0;
        this.edited = false;
        this.lines = rawText.content.split('\n');
        this.rawText = fileContent;
        this.parsedText = contentDiv.innerHTML = this.parse(this.rawText);
        this.contentElement = "";
        this.tabElement = "";
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
}

class EditorWindow {
    constructor() {
        // Use LRU cache
        this.files = [];
    }
    setActive(file) {
        this.files.forEach(f => {
            f.contentElement.classList.toggle('active', f === file);
            f.tabElement.classList.add('active', f === file);
        });
    }
}

class EditorFrame {
    constructor(editorFrame) {
        this.openFiles = [];
        this.editorWindows = [];
        this.activeEditor = {};
        if (editorFrame instanceof EditorFrame) this.deserialize(obj);
        else if (editorFrame !== undefined) console.warn('constructor object is not of type EditorFrame');
    }

    // Searches all EditorWindows for filepath. Returns File if found.
    contains(filepath) {
        this.editorWindows.forEach(win => {
            win.files.forEach(f => {
                if (f.filepath === filepath)
                    return f;
            });
        });
    }

    openFile() {
        try {
            filepath = editorFrame.activeEditorWindow.activeEditor.directory;
            dialog.showOpenDialog(filepath, fileNames => {
                if (fileNames === undefined)
                    console.log('No file selected');
                else {
                    return fileNames[0];
                }
            });
        } catch (e) {
            console.warn(e);
            dialog.showOpenDialog(fileNames => {
                if (fileNames === undefined)
                    console.log('No file selected');
                else {
                    if (!this.contains(fileNames[0])) {
                        let f = new File(fileNames[0]);
                        this.editors.activeEditorWindow.files.push(f);
                        this.activeEditor = f;

                    }
                }
            });
        }
    }

    deserialize(obj) {
        for (let prop in obj) this[prop] = obj[prop];
    }
}

// Promisify fs.readFile()
function readFileAsync(filepath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, (err, data) => {
            if (err)
                reject(err);
            else
                resolve(data);
        })
    });
}

function getLastSavedFile() {
    readFileAsync(savepath)
        .then(data => {
            data = JSON.parse(data).filepath;
            selected.innerHTML = data;
            return readFileAsync(data);
        })
        .then(data => {
            data = String(data);
            contentDiv.innerHTML = data;
            currentFileContent = contentDiv.innerHTML;
        });
}


function saveFile() {
    fs.writeFile(diskFile.filepath, editorFrame.editor.rawText, err => {
        if (err) {
            console.log(err);
        }
        else {
            diskFile.content = contentDiv.innerText;
        }
    });
}

// Reads keyboard input of editor window
function processInput() {
    // get caret position/selection
    let start = event.target.selectionStart;
    let end = event.target.selectionEnd;
    let {value} = event.target;

    switch (true) {
        // CTRL-S
        case event.which === 83 && event.ctrlKey: {
            event.preventDefault();
            saveFile();
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

// Determines selectionDirection from mouse input
function mSetSelectionDirection() {
    let direction = 'none';
    if (window.getSelection) {
        let sel = window.getSelection();
        if (!sel.isCollapsed) {
            let range = document.createRange();
            range.setStart(sel.anchorNode, sel.anchorOffset);
            range.setEnd(sel.focusNode, sel.focusOffset);
            direction = range.collapsed ? 'backward' : 'forward';
            range.detach();
        }
    }
    // editorFrame.editor.selectionDirection = direction;
}

const editorFrame = new EditorFrame();
const localStorage = window.localStorage;
if (fs.existsSync(localStorage.getItem('default_path'))) {
    editorFrame.deserialize(JSON.parse(localStorage.getItem('default_content')));
}