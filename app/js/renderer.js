var app = require('electron').remote;
var dialog = app.dialog;
var fs = require('fs');
let savepath = "app/assets/saved.json";
const content = document.getElementById('content'), selected = document.getElementById('selected-file');
let currentFileContent = "";

class File {
    constructor(filepath) {
        this.filepath = filepath;
        this.edited = false;
        this.content = fs.readFileSync(filepath);
    }
    update() {
        content.value = this.content;
        selected.innerHTML = this.filepath;
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
            editingFile.update();
        }
    });
}

function saveFile() {

}

// Compares of
function compare() {

}

let edited = false;
content.addEventListener('input', event => {
    let tmp = String(content.value);
    if (!edited && currentFileContent !== tmp) {
        document.getElementById('title').innerHTML = 'unsaved';
        edited = true;
    }
    else if (edited && currentFileContent === tmp) {
        document.getElementById('title').innerHTML = 'MTE';
        edited = false;
    }
});

content.addEventListener('keypress', event => {
    if (!(event.which == 115 && event.ctrlKey) && !(event.which == 19))
        return true;
    fs.writeFile(selected.innerHTML, content.value, err => {
        if (err) {
            console.log(err);
        }
        else {
            currentFileContent = content.value;
        }
    });
});

let editingFile = new File(JSON.parse(fs.readFileSync(savepath)).filepath);
editingFile.update();