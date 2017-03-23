import path from 'path';
import url from 'url';
import { app, Menu, ipcMain } from 'electron';
import { devMenuTemplate } from './menu/dev_menu_template';
import { editMenuTemplate } from './menu/edit_menu_template';
import createWindow from './helpers/window';
import tk from 'tree-kill';

import env from './env';

// PIDs
let pids = [];
ipcMain.on('new-pid', (event, arg) => {
    pids.push(arg);
});

// App menu
const setApplicationMenu = () => {
    const menus = [editMenuTemplate];
    if (env.name !== 'production') {
        menus.push(devMenuTemplate);
    }
    
    Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

if (env.name !== 'production') {
    const userDataPath = app.getPath('userData');
    app.setPath('userData', `${userDataPath} (${env.name})`);
}

// Events
app.on('ready', () => {
    setApplicationMenu();

    const mainWindow = createWindow('main', {
        width: 1024,
        height: 600,
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'app.html'),
        protocol: 'file:',
        slashes: true,
    }));

    if (env.name === 'development') {
        mainWindow.openDevTools();
    }
});

app.on('window-all-closed', () => {
    // Cleanup
    pids.forEach(function(pid) {
        tk(pid);
    });
    
    app.quit();
});
