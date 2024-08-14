// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

export function toggleDevTools() {
	ipcRenderer.send('toggleDevTools');
}
contextBridge.exposeInMainWorld('toggleDevTools', toggleDevTools);

export function setTitleBarColors(bgColor: string, iconColor: string) {
	document.documentElement.style.background = bgColor;
	ipcRenderer.send('setTitleBarColors', bgColor, iconColor);
}
contextBridge.exposeInMainWorld('setTitleBarColors', setTitleBarColors);