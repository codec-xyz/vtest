import { ipcMain, BrowserWindow } from 'electron';

ipcMain.on('toggleDevTools', (event) => event.sender.toggleDevTools());

ipcMain.on('setTitleBarColors', (event, bgColor, iconColor) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window === null) return;

    // MacOS title bar overlay buttons do need styling so the function is undefined
    if (window.setTitleBarOverlay === undefined) return;

    window.setTitleBarOverlay({
        color: bgColor,
        symbolColor: iconColor,
        height: 40
    });
});