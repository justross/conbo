function close() {
  const window = remote.getCurrentWindow();
  const a = [];
  editorFrame.editors.forEach(e => {
    if (!e.saved())
      a.push(e);
  });
  a.forEach(e => {
    const cb = (filepath) =>{
      saveFile(e, filepath);
    };
    if (e.filepath !== null)
      dialog.showSaveDialog({ defaultPath: e.filepath }, cb);
    else
      dialog.showSaveDialog(cb);
  });
  window.close();
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