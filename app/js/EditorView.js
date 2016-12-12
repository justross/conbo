class EditorView {
    /* Fields
        Serialized:
            caretPosition;
            editor; // editor.filepath is serialized 
    */

    constructor(obj) {
        if (obj instanceof Editor) {
            this.editor = obj;
            this.caretPosition = 0;
        }
        else {
            try {
                this.deserialize(obj);
            } catch (e) {
                console.warn(e);
                this.caretPosition = 0;
                this.editor = editorFrame.activeEditor;
            }
        }
    }

    serialize() {
        const eVObj = {};
        eVObj.caretPosition = this.caretPosition;
        eVObj.editor = this.editor.serialize();
        return eVObj;
    }

    deserialize(eVObj) {
        this.editor = editorFrame.findOrCreateEditor(eVObj.filepath);
        this.caretPosition = eVObj.caretPosition;
    }
}

module.exports.EditorView = EditorView;