var app = require('electron').remote;
var dialog = app.dialog;
var fs = require('fs');
let savepath = "app/assets/saved.json";
const contentDiv = document.getElementById('content'),
    selected = document.getElementById('selected-file'),
    title = document.getElementById('title');

class File {
    constructor(filepath) {
        this.filepath = filepath;
        this.edited = false;
        this.content = String(fs.readFileSync(filepath));
    }
    load() {
        contentDiv.innerHTML = this.content;
        selected.innerHTML = this.filepath;
    }
    update() {
        title.innerHTML = this.edited ? 'unsaved' : 'MTE';
    }
}

class Editor {
    constructor(content) {
        this.content = content;
        this.lines = content.split('\n');
        let s = 0;
        this.lineRanges = this.lines.map(v => {
            s += v.length;
            return ({
                start: s - v.length,
                end: s
            });
        });
    }
}

class EditorFrame {
    constructor(content) {
        this.editor = new Editor(content);
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
        this.editor = new Editor(content);
        contentDiv.innerHTML = this.editor.content;
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

function openFile() {
    dialog.showOpenDialog(function (fileNames) {
        // fileNames is an array that contains all the selected
        if (fileNames === undefined) {
            console.log("No file selected");
        } else {
            let obj = {};
            obj.filepath = fileNames[0];
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

function saveFile() {
    fs.writeFile(diskFile.filepath, contentDiv.innerHTML, err => {
        if (err) {
            console.log(err);
        }
        else {
            diskFile.content = contentDiv.innerHTML;
            compare();
        }
    });
}

// Reads keyboard input of editor window
function processInput() {
    //event.preventDefault();
    // get caret position/selection
    let start = event.target.selectionStart;
    let end = event.target.selectionEnd;
    let {value} = event.target;

    switch (true) {
        // CTRL-S
        case event.which === 83 && event.ctrlKey:
            saveFile();
            break;

        // Shift-Tab
        case event.which === 9 && event.shiftKey:
            let ranges = editorFrame.editor.lineRanges;
            editorFrame.editor.lines.forEach((l, i, a) => {
                if (l[0] === '\t') {
                    if (!(start < ranges.start && start < ranges.start) && !(end > ranges.start && end > ranges.end)) {
                        a[i] = a[i].slice(1);
                    }
                }
            });
            editorFrame.update(editorFrame.editor.lines.join('\n'));
            console.log(event.target.selectionDirection);
            break;

        // Tab
        case event.which == 9:
            // set textarea value to: text before caret + tab + text after caret
            event.target.innerHTML = value.substring(0, start)
                + "\t"
                + value.substring(end);

            // put caret at right position again (add one for the tab)
            event.target.selectionStart = event.target.selectionEnd = start + 1;
            break;

        default:

    }
}

// Compares contents of editing area to File contents
function compare() {
    const s = String(contentDiv.innerHTML);
    if (!diskFile.edited && diskFile.content !== s) {
        diskFile.edited = true;
        diskFile.update();
    }
    else if (diskFile.edited && diskFile.content === s) {
        diskFile.edited = false;
        diskFile.update();
    }
}

let diskFile = {};
diskFile = new File(JSON.parse(fs.readFileSync(savepath)).filepath);
diskFile.load();
editorFrame = new EditorFrame(diskFile.content);
