module.export = {
    // Contains information for a locally stored file
    File: class File {
        constructor(filePath) {
            this.filePath = filePath;
            this.content = String(fs.readFileSync(filePath));
        }
    }
}