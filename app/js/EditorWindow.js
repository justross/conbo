class EditorWindow {
    constructor(obj) {
        try {
            const {editors, active} = obj;
            this.deserialize(editors);
        }
        catch (e) {
            console.warn(e.stack);
            this.activeEditor = {};
            this.active = true;
            this.editors = [new Editor()];
            this.setActive(this.editors[0]);
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
                if(b) this.activeEditor = e;
            });
        }
    }
    contains(editor) {
        for (let i in this.editors) {
            if (this.editors[i] === editor) return true;
        }
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
            const e = new Editor(eObj);
            a.push(e);
            if(eObj.active)
                this.setActive(e);
        });
        this.editors = a;
    }

}

module.exports.EditorWindow = EditorWindow;