import { app, BrowserWindow, ipcMain, protocol, net } from 'electron';
import path from 'path';
import url from 'url';
import { stat } from 'node:fs/promises';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
import electronSquirrelStartup from 'electron-squirrel-startup';
if(electronSquirrelStartup) app.quit();

// Only one instance of the electron main process should be running due to how chromium works.
// If another instance of the main process is already running `app.requestSingleInstanceLock()`
// will return false, `app.quit()` will be called, and the other instances will receive a
// `'second-instance'` event.
// https://www.electronjs.org/docs/latest/api/app#apprequestsingleinstancelockadditionaldata
if(!app.requestSingleInstanceLock()) {
	app.quit();
}

// This event will be called when a second instance of the app tries to run.
// https://www.electronjs.org/docs/latest/api/app#event-second-instance
app.on('second-instance', (event, args, workingDirectory, additionalData) => {
	createWindow();
});

const scheme = 'app';
const srcFolder = path.join(app.getAppPath(), `.vite/main_window/`);
const staticAssetsFolder = import.meta.env.DEV ? path.join(import.meta.dirname, '../../static/') : srcFolder;

protocol.registerSchemesAsPrivileged([{
		scheme: scheme,
		privileges: {
			standard: true,
			secure: true,
			allowServiceWorkers: true,
			supportFetchAPI: true,
			corsEnabled: false,
		},
	},
]);

app.on('ready', () => {
	protocol.handle(scheme, async (request) => {
		const requestPath = path.normalize(decodeURIComponent(new URL(request.url).pathname));

		async function isFile(filePath: string) {
			try {
				if((await stat(filePath)).isFile()) return filePath;
			}
			catch(e) {}
		}

		const responseFilePath = await isFile(path.join(srcFolder, requestPath))
		?? await isFile(path.join(srcFolder, path.dirname(requestPath), `${path.basename(requestPath) || 'index'}.html`))
		?? path.join(srcFolder, '200.html');

		return await net.fetch(url.pathToFileURL(responseFilePath).toString());
	});
});

function createWindow() {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		icon: path.join(staticAssetsFolder, '/icon.png'),
		width: 900,
		height: 700,
		minWidth: 400,
		minHeight: 200,
		// Window Controls Overlay API - https://developer.mozilla.org/en-US/docs/Web/API/Window_Controls_Overlay_API
		// Allows for a custom window header while overlaying native window controls in the corner.
		// https://www.electronjs.org/docs/latest/tutorial/window-customization#window-controls-overlay
		titleBarStyle: 'hidden',
		titleBarOverlay: {
			color: '#374151',
			symbolColor: '#f8fafc',
			height: 40
		},
		backgroundColor: '#374151',
		webPreferences: {
			preload: path.join(import.meta.dirname, '../preload/preload.js'),
		},
	});

	if(import.meta.env.DEV) {
		mainWindow.loadURL(VITE_DEV_SERVER_URLS['main_window']);

		// Open the DevTools.
		// mainWindow.webContents.openDevTools();
	}
	else {
		mainWindow.loadURL('app://-/');
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if(BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.on('toggleDevTools', (event) => event.sender.toggleDevTools());
ipcMain.on('setTitleBarColors', (event, bgColor, iconColor) => {
	const window = BrowserWindow.fromWebContents(event.sender);
	if(window === null) return;
	
	// MacOS title bar overlay buttons do not need styling so the function is undefined
	if(window.setTitleBarOverlay === undefined) return;

	window.setTitleBarOverlay({
		color: bgColor,
		symbolColor: iconColor,
		height: 40
	});
});