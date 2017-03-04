import openAboutWindow from 'electron-about-window';
import * as path from 'path';

export default {
    label: 'Help',
    submenu: [
        {
            label: 'About This App',
            click: () => openAboutWindow({
                icon_path: path.join(__dirname, 'icon.png'),
                description: '',
            }),
        },
    ],
};
