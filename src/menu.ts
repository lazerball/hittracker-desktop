import { app, BrowserWindow, Menu } from 'electron';
import openAboutWindow from 'electron-about-window';
import * as path from 'path';

const file = {
  label: 'File',
  submenu: [
    {
      label: 'Quit',
      accelerator: 'CmdOrCtrl+Q',
      click: () => {
        app.quit();
      },
    },
  ],
};

import MenuItemConstructorOptions = Electron.MenuItemConstructorOptions;
const edit: MenuItemConstructorOptions = {
  label: 'Edit',
  submenu: [
    { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
    { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
    { type: 'separator' },
    { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
    { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
    { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
    { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectall' },
  ],
};

const development = {
  label: 'Development',
  submenu: [
    {
      label: 'Reload',
      accelerator: 'CmdOrCtrl+R',
      click: () => {
        BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache();
      },
    },
    {
      label: 'Toggle DevTools',
      accelerator: 'Alt+CmdOrCtrl+I',
      click: () => {
        BrowserWindow.getFocusedWindow().webContents.openDevTools();
      },
    },
  ],
};

const help = {
  label: 'Help',
  submenu: [
    {
      label: 'About This App',
      click: () =>
        openAboutWindow({
          icon_path: path.join(__dirname, 'icon.png'),
          description: '',
        }),
    },
  ],
};


export const enableApplicationMenu = (env: string, debug: boolean = false) => {
  const menuTemplates = [file, edit];
  if (env !== 'production' || debug) {
    menuTemplates.push(development);
  }
  menuTemplates.push(help);
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplates));
};
