class EditorWindow {
    constructor(obj = null) {
        try {
            const {editorViews, active} = obj;
            this.deserialize(editors);
        }
        catch (e) {
            console.warn(e.stack); // for debugging purposes
            this.activeEditorView = editorFrame.activeEditor;
            this.active = true;
            this.editorViews = [editorFrame.activeEditor.activeEditorViews[0]];
            this.setActive();
        }
        finally {
            // HTML Elements
            this.windowElement = document.importNode(editorTemplate.content.children[0], true);
        }

    }

    setActive(editorView) {
        if (this.activeEditor !== editorView) {
            this.editors.forEach(e => {
                const b = e === editorView;
                e.contentElement.classList.toggle('active', b);
                e.tabElement.classList.toggle('active', b);
                e.active = b;
                if (b) this.activeEditor = e;
            });
        }
    }

    serialize() {
        const obj = {}, a = [];
        obj.active = this.active;
        this.editorViews.forEach(e => {
            a.push(e.serialize());
        });
        obj.editors = a;
        return obj;
    }

    deserialize(eWObj) {
        this.editorViews = eWObj.editorViews.map(eVObj => {
            const eV = new EditorView(eVObj);
            if (eVObj.active)
                this.setActive(e);
            return eV;
        });
    }

}

module.exports.EditorWindow = EditorWindow;