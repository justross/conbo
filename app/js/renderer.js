var app = require('electron').remote;
var dialog = app.dialog;
var fs = require('fs');
let savepath = "app/assets/saved.json";
const content = document.getElementById('content'),
    selected = document.getElementById('selected-file'),
    title = document.getElementById('title');

class File {
    constructor(filepath) {
        this.filepath = filepath;
        this.edited = false;
        this.content = String(fs.readFileSync(filepath));
    }
    load() {
        content.value = this.content;
        selected.innerHTML = this.filepath;
    }
    update() {
        title.innerHTML = this.edited ? 'unsaved' : 'MTE';
    }
}

// Defines an action made by the user in the editor
class KeyAction {
    constructor(inputPosition, command) {
        this.inputPosition = inputPosition;
        this.command = command;
    }
}

let undoStack = [], redoStack = [];

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
            content.value = data;
            currentFileContent = content.value;
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
            editingFile = new File(fileNames[0]);
            editingFile.load();
        }
    });
}

function saveFile() {
    fs.writeFile(editingFile.filepath, content.value, err => {
        if (err) {
            console.log(err);
        }
        else {
            editingFile.content = content.value;
            compare();
        }
    });
}

// Reads keyboard input of editor window and handles appropriately
function processInput() {
    // CTRL-S
    if ((event.which == 115 && event.ctrlKey) && (event.which == 19))
        saveFile();
    // Tab
    else if (event.which == 9) {
        // get caret position/selection
        let start = event.target.selectionStart;
        let end = event.target.selectionEnd;

        let {value} = event.target;

        // set textarea value to: text before caret + tab + text after caret
        event.target.value = value.substring(0, start)
            + "\t"
            + value.substring(end);

        // put caret at right position again (add one for the tab)
        event.target.selectionStart = event.target.selectionEnd = start + 1;

        // prevent the focus lose
        event.preventDefault();
    }
}

// Compares contents of editing area to File contents
function compare() {
    const s = String(content.value);
    if (!editingFile.edited && editingFile.content !== s) {
        editingFile.edited = true;
        editingFile.update();
    }
    else if (editingFile.edited && editingFile.content === s) {
        editingFile.edited = false;
        editingFile.update();
    }
}

let editingFile = {};
editingFile = new File(JSON.parse(fs.readFileSync(savepath)).filepath);
editingFile.load();
