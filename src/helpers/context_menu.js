// This gives you default context menu (cut, copy, paste)
// in all input fields and textareas across your app.

(function buildContextMenu() {
  const remote = require('electron').remote; // eslint-disable-line global-require
  const Menu = remote.Menu;
  const MenuItem = remote.MenuItem;

  const isAnyTextSelected = () => window.getSelection().toString() !== '';

  const cut = new MenuItem({
    label: 'Cut',
    click: () => {
      document.execCommand('cut');
    },
  });

  const copy = new MenuItem({
    label: 'Copy',
    click: () => {
      document.execCommand('copy');
    },
  });

  const paste = new MenuItem({
    label: 'Paste',
    click: () => {
      document.execCommand('paste');
    },
  });

  const normalMenu = new Menu();
  normalMenu.append(copy);

  const textEditingMenu = new Menu();
  textEditingMenu.append(cut);
  textEditingMenu.append(copy);
  textEditingMenu.append(paste);

  document.addEventListener(
    'contextmenu',
    e => {
      switch (e.target.nodeName) {
        case 'TEXTAREA':
        case 'INPUT':
          e.preventDefault();
          textEditingMenu.popup(remote.getCurrentWindow());
          break;
        default:
          if (isAnyTextSelected()) {
            e.preventDefault();
            normalMenu.popup(remote.getCurrentWindow());
          }
      }
    },
    false
  );
})();
