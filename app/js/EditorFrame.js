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
        this.setActive(this.activeEditor);
    }

    defaultConstructor() {
        this.editorWindows = [new EditorWindow()];
        this.activeEditorWindow = this.editorWindows[0];
        this.activeEditor = this.activeEditorWindow.activeEditor;
        this.editors = [this.activeEditor];
        this.setActive(this.activeEditorWindow, this.activeEditor);
        localStorage.default = this.serialize();
    }

    // Searches Editors for filepath. returns Editor if found.
    contains(filepath) {
        for(let e in this.editors) {
            if (this.editors[e].filepath === filepath)
                return e;
        }
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
            this.editors = this.editors.concat(eW.editors);
        });
    }

    setActive(editor) {
        this.editorWindows.forEach(w => {
            if (w.contains(editor)) {
                if (this.activeEditorWindow !== w) {
                    this.activeEditorWindow = w;
                    this.editorWindows.forEach(win => {
                        win.windowElement.classList.toggle("active", win === w);
                        if (win !== w) {
                            this.activeEditorWindow = win;
                            win.setActive(editor);
                            return;
                        }
                    });
                }
                else {
                    w.setActive(editor);
                }
                return;
            }
        });
        this.activeEditor = this.activeEditorWindow.activeEditor;
    }

    findEditor(element) {
        switch(true) {
            case element.classList.contains('editor-box'):
                for(let i in this.editors) {
                    if(this.editors[i].contentElement === element) return this.editors[i];
                }
                return false;
        }
    }

}

module.exports.EditorFrame = EditorFrame;