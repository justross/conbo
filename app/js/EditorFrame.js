class EditorFrame {
    constructor() {
        try {
            const defaultEditorFrame = JSON.parse(localStorage.getItem('default'));
            this.deserialize(defaultEditorFrame);
        } catch (e) {
            console.warn(e.stack);
            this.editors = [new Editor()];
            this.editorWindows = [new EditorWindow(this.editors[0])];
            this.activeEditorWindow = this.editorWindows[0];
            this.activeEditorView = this.activeEditorWindow.activeEditorView;
            this.setActive(this.activeEditorWindow, this.activeEditor);
            localStorage.default = this.serialize();
        }
        finally {
            this.setActive(this.activeEditorView);
        }
    }

    // Searches Editors for filepath. returns Editor if found.
    contains(filepath) {
        for (let e in this.editors) {
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
        const eFObj = {};
        eFObj.serializedEditorWindows = this.editorWindows.map(eW => {
            return eW.serialize();
        });
        eFObj.serializedEditors = this.editors.map(e => {
            return e.serialize();
        });
        return JSON.stringify(eFObj);
    }

    deserialize(eFObj) {
        this.editorWindows = eFObj.serializedEditorWindows.map(eWObj => {
            return eWObj.deserialize();
        });

        this.editors = eFObj.serializedEditors.map(eObj => {
            return eObj.deserialize();
        });
    }

    setActive(editor) {
        this.editorWindows.forEach(w => {
            if (w.contains(editor)) {
                if (this.activeEditorWindow !== w) {
                    this.activeEditorWindow = w;
                    this.editorWindows.forEach(win => {
                        win.windowElement.classList.toggle('active', win === w);
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

    findOrCreateEditor(filepath) {
        for (const i in this.editors) {
            if (this.editors[i].filepath === filepath)
                return this.editors[i];
        }
        const e = new Editor({
            filepath: filepath
        });
    }

    findEditor(element) {
        switch (true) {
            case element.classList.contains('editor-box'):
                for (const i in this.editors) {
                    if (this.editors[i].contentElement === element) return this.editors[i];
                }
                return false;
        }
    }

}

module.exports.EditorFrame = EditorFrame;