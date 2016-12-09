'use strict';

const {remote} = require('electron');
const {app, dialog} = remote;
const fs = require('fs');
const {EditorFrame} = require('./app/js/EditorFrame');
const {EditorWindow} = require('./app/js/EditorWindow');
const {Editor} = require('./app/js/Editor');

const localStorage = window.localStorage;

const contentContainerElement = document.getElementById('content-container');
const tabBarElement = document.getElementById('tab-bar');
const editorTemplate = document.getElementById('editor-template');

let typingTimer = null, typingInterval = 5000;

// Adds splice() to String
String.prototype.splice = function (idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};


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
    if (filepath === null) {
        dialog.showSaveDialog(filepath => {
            saveFile(e, filepath);
        });
    }
    fs.writeFile(filepath, editor.rawText, err => {
        if (err)
            throw err;
    });
}

function stackPush(editor) {
    alert('you made it');
}

function addTimer() {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(stackPush(editorFrame.findEditor(event.target)), typingInterval);
}



// Determines selectionDirection from mouse input
function mSetSelectionDirection() {
    let direction = 'none';
    if (window.getSelection) {
        const sel = window.getSelection();
        if (!sel.isCollapsed) {
            const range = document.createRange();
            range.setStart(sel.anchorNode, sel.anchorOffset);
            range.setEnd(sel.focusNode, sel.focusOffset);
            direction = range.collapsed ? 'backward' : 'forward';
            range.detach();
        }
    }
    // editorFrame.editor.selectionDirection = direction;
}
const editorFrame = new EditorFrame();
