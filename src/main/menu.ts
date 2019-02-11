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

const edit = {
  role: 'editMenu'
};

import MenuItemConstructorOptions = Electron.MenuItemConstructorOptions;
const view: MenuItemConstructorOptions = {
  label: 'View',
  submenu: [
    {

      label: 'Back',
      accelerator: 'CmdOrCtrl+B',
      click: () => {
        BrowserWindow.getFocusedWindow()!.webContents.goBack();
      },
    },
    {
      role: 'forceReload'
    },
    {
      type: 'separator'
    },
    {
      role: 'toggleFullScreen'
    },
    {
      role: 'zoomIn',
      accelerator: 'CmdOrCtrl+Plus'
    },
    {
      role: 'zoomOut'
    },
    {
      role: 'resetZoom'
    },
  ]
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
    {
      role: 'toggleDevTools'
    },
  ],
};

const window = {
  role: 'windowMenu'
};

export const enableApplicationMenu = () => {
  const menuTemplates = [file, edit, view, window, help];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplates));
};
