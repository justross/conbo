'use strict';

const {remote} = require('electron');
const {app, dialog} = remote;
const fs = require('fs');

const contentDiv = document.getElementById('content'),
    selected = document.getElementById('selected-file'),
    title = document.getElementById('title');

// Adds splice() to String
String.prototype.splice = function (idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};

// Contains information for a locally stored file
class File {
    constructor(filePath) {
        this.filePath = filePath;
        this.content = String(fs.readFileSync(filePath));
    }
}


// A state an unsaved file exists in
class FileState {
    constructor(file) {
        this.file = file;
        this.fileName = filePath.substring(filePath.lastIndexOf('\\') + 1, filePath.length);
        this.directory = "";
        this.edited = false;
        this.rawText = file.content;
        this.lines = file.content.split('\n');
        this.parsedText = contentDiv.innerHTML = this.parse(this.rawText);
        let s = 0;
        this.lineRanges = this.lines.map(v => {
            s += v.length;
            return ({
                start: s - v.length,
                end: s
            });
        });
        this.selectionDirection = 'none';
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
}

class EditorWindow {
    constructor() {
        // Use LRU cache
        this.files = [];
    }
}

class EditorFrame {
    constructor(openFiles) {
        this.openFiles = [];
        openFiles.filepaths.forEach(file => {
            this.openFiles.push(new FileState(new File(fs.readFileSync(file))));
        });
        this.editor = openFiles;
        this.activeEditor = {};
        this.undoStack = [];
        this.redoStack = [];
        this.undoStack.push(this.editor);
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
        this.editor = new FileState(content);
        contentDiv.innerHTML = content;
    }
    // Searches all EditorWindows for filepath. Returns true if found.
    contains(filepath) {
        
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

function openFile(filepath) {
    switch (typeof filepath) {
        case 'string': {
            try {
                fs.readFileSync(filepath);
            } catch (e) {
                console.error(e);
                filepath = undefined;
            }
        }
        case 'undefined': {
            filepath = editorFrame.activeEditorWindow.activeEditor.directory;
            if (filepath === undefined) {
                console.warn('Directory not found');
                dialog.showOpenDialog(fileNames => {
                    if(fileNames === undefined)
                        console.log('No file selected');
                    else {
                        
                    }
                });
            }


        }
            break;
        default: throw new TypeError(`Expected "string" or "undefined" Got: "${typeof filepath}"`);

    }
    try {
        const filePath = editorFrame.activeEditorWindow.files[0].filePath.substring(0, editorFrame.activeEditorWindow.files[0].filePath.lastIndexOf('\\'));
        dialog.showOpenDialog(filePath, fileNames => {
            if (fileNames === undefined) {
                console.log("No file selected");
            } else {
                let obj = fs.readFileSync(savepath);

                obj.filepaths = [fileNames[0]];
                obj = JSON.stringify(obj);
                fs.writeFile(savepath, obj, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
                diskFile = new File(fileNames[0]);
                diskFile.load();
                editorFrame = new EditorFrame(diskFile.content);
            }
        });
    } catch (e) {
        dialog.showOpenDialog(fileNames => {
            if (fileNames === undefined) {
                console.log("No file selected");
            } else {
                let obj = fs.readFileSync(savepath);

                obj.filepaths = [fileNames[0]];
                obj = JSON.stringify(obj);
                fs.writeFile(savepath, obj, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
                diskFile = new File(fileNames[0]);
                diskFile.load();
                editorFrame = new EditorFrame(diskFile.content);
            }
        });
    }
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

// window.localStorage.setItem('myCat', 'Tom');
let saveFileContent = JSON.parse(fs.readFileSync(savepath));
editorFrame = new EditorFrame(saveFileContent);
editorFrame.load();