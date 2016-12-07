'use strict';

const {remote} = require('electron');
const {app, dialog} = remote;
const fs = require('fs');

const localStorage = window.localStorage;

const contentContainerElement = document.getElementById('content-container');
const tabBarElement = document.getElementById('tab-bar');
const editorTemplate = document.getElementById('editor-template');

// Adds splice() to String
String.prototype.splice = function (idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};


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
}


class EditorWindow {
    constructor(obj) {
        try {
            const {editors, active} = obj;
            this.deserialize(editors);
            this.active = active;
        }
        catch (e) {
            console.warn(e.stack);
            this.activeEditor = new Editor();
            this.active = true;
            this.editors = [this.activeEditor];
            this.setActive(this.activeEditor);
        }
        // HTML Elements
        this.windowElement = document.importNode(editorTemplate.content.children[0], true);
    }
    setActive(editor) {
        if (this.activeEditor !== editor) {
            this.editors.forEach(e => {
                const b = e === editor;
                e.contentElement.classList.toggle('active', b);
                e.tabElement.classList.toggle('active', b);
                e.active = b;
            });
            this.activeEditor = editor;
            editorFrame.activeEditor = editor;
        }
    }
    contains(filepath) {
        this.editors.forEach(e => {
            if (e.filepath === filepath)
                return f;
        });
        return false;
    }

    serialize() {
        const obj = {}, a = [];
        obj.active = this.active;
        this.editors.forEach(e => {
            a.push(e.serialize());
        });
        obj.editors = a;
        return obj;
    }

    deserialize(editors) {
        const a = [];
        editors.forEach(eObj => {
            const e = new Editor(eObj.filepath);
            a.push(e);
            if (eObj.active) {
                this.activeEditor = e;
                if (this.active)
                    this.setActive(this.activeEditor);
            }
        });
        this.editors = a;
    }

}

class EditorFrame {
    constructor() {
        this.editorWindows = [];
        this.activeEditorWindow = null;
        this.editors = [];
        this.activeEditor = null;
        try {
            const defaultEditorFrame = JSON.parse(localStorage.getItem('default'));
            if (defaultEditorFrame !== null)
                this.deserialize(defaultEditorFrame);
            else
                this.defaultConstructor();
        } catch (e) {
            console.warn(e.stack);
            this.defaultConstructor();
        }
        this.activeEditorWindow.setActive(this.activeEditorWindow.activeEditor);
    }

    defaultConstructor() {
        this.editorWindows = [new EditorWindow()];
        this.activeEditorWindow = this.editorWindows[0];
        this.activeEditor = this.activeEditorWindow.activeEditor;
        this.editors = [this.activeEditor];
        this.setActive(this.activeEditorWindow, this.activeEditor);
        localStorage.default = this.serialize();
    }

    // Searches all EditorWindows for filepath. Returns File if found.
    contains(filepath) {
        this.editorWindows.forEach(win => {
            win.editors.forEach(f => {
                if (f.filepath === filepath)
                    return f;
            });
        });
        return false;
    }

    openFile() {
        // callback for showOpenDialog
        const cb = fileNames => {
            if (fileNames === undefined)
                console.log('No file selected');
            else {
                if (!this.contains(fileNames[0])) {
                    const e = new Editor({ filepath: fileNames[0], active: true });
                    if (!this.activeEditorWindow.contains(e))
                        this.activeEditorWindow.editors.push(e);
                    this.activeEditorWindow.setActive(e);
                }
            }
        };
        try {
            const {filepath} = editorFrame.activeEditor.activeEditor;
            dialog.showOpenDialog({ defaultPath: filepath }, cb);
        } catch (e) {
            console.warn(e.stack);
            dialog.showOpenDialog(cb);
        }
    }
    serialize() {
        let a = [];
        this.editorWindows.forEach(eWObj => {
            a.push(eWObj);
        });
        return JSON.stringify(a);
    }
    deserialize(editorWindows) {
        editorWindows.forEach(eWObj => {
            const eW = new EditorWindow(eWObj);
            if (eWObj.active) {
                this.activeEditorWindow = eW;
                this.activeEditor = eW.activeEditor;
            }
            this.editorWindows.push(eW);
            this.editors.push(eW.editors);
        });
    }

    setActive(window, editor) {
        if (this.activeEditorWindow !== window) {
            this.editorWindows.forEach(win => {
                win.windowElement.classList.toggle("active", win === window);
                if (win === window)
                    this.activeEditorWindow = win;
            });
        }
        window.setActive(editor);
    }

}
// End EditorFrame

function setActive() {
    editorFrame.editorWindows.forEach(win => {
        win.editors.forEach(e => {
            if (e.tabElement === event.target || e.filenameElement === event.target) {
                if (e !== editorFrame.activeEditor)
                    editorFrame.setActive(win, e);
            }
        });
    });
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


function saveFile(editor, filepath) {
    fs.writeFile(filepath, editor.rawText, err => {
        if (err)
            throw err;
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
