import { app, BrowserWindow, Menu } from 'electron';
import openAboutWindow from 'electron-about-window';
import * as path from 'path';

const file: Electron.MenuItemConstructorOptions = {
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

const edit: Electron.MenuItemConstructorOptions = {
  role: 'editMenu',
};

const view: Electron.MenuItemConstructorOptions = {
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
      role: 'forceReload',
    },
    {
      role: 'toggleFullScreen',
    },
    {
      role: 'zoomIn',
      accelerator: 'CmdOrCtrl+Plus',
    },
    {
      role: 'zoomOut',
    },
    {
      role: 'resetZoom',
    },
  ] as Electron.MenuItemConstructorOptions[],
};

const help: Electron.MenuItemConstructorOptions = {
  label: 'Help',
  submenu: [
    {
      label: 'About This App',
      click: () =>
        openAboutWindow({
          icon_path: path.join(__dirname, 'icon.png'), // eslint-disable-line @typescript-eslint/camelcase
          description: '',
        }),
    },
    {
      role: 'toggleDevTools',
    },
  ] as Electron.MenuItemConstructorOptions[],
};

const window: Electron.MenuItemConstructorOptions = {
  role: 'windowMenu',
};
export const enableApplicationMenu = () => {
  const menuTemplates = [file, edit, view, window, help];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplates));
};
