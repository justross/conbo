function winClose() {
  const window = remote.getCurrentWindow();
  const a = [];
  editorFrame.editors.forEach(e => {
    if (!e.saved())
      a.push(e);
  });
  if (a) {
    const o = {
      type: 'warning',
      buttons: ['Save', 'Don\'t save', 'Cancel'],
      noLink: true,
      detail: 'Your progress will be lost if you don\'t save'
    };
    let m = '';
    if (a.length > 1) {
      m = `The following files have not been saved:

          ${a.map(v => { return v.fileName; }).join('\n')}

          Would you like to save them now?`;
    }
    else {
      m = `${a[0].fileName} has not been saved. Would you like to save it now?`;
    }
    o.message = m;
    dialog.showMessageBox(o, res => {
      switch (res) {
        case 2: return;
        case 1:
          localStorage.default = editorFrame.serialize();
          window.close();
        case 0:
          let requests = a.reduce((promiseChain, e) => {
            function saveItUp(cb) {
              const o = {};
              if (e.filepath !== null) o.defaultPath = e.filepath;
              dialog.showSaveDialog(o, filepath => {
                e.saveFile(filepath);
                cb();
              });
            };
            return promiseChain.then(() => new Promise((resolve) => {
              saveItUp(resolve);
            }));
          }, Promise.resolve());
          requests.then(() => {
            localStorage.default = editorFrame.serialize();
            // window.close();
          });
      }
    });
  }
}

function minimize() {
  const window = remote.getCurrentWindow();
  window.minimize();
  document.activeElement = null;
  document.activeElement.blur();
}

function maximize() {
  const window = remote.getCurrentWindow();
  if (!window.isMaximized())
    window.maximize();
  else
    window.unmaximize();
}