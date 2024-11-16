import { app, BrowserWindow, ipcMain, protocol, net, Notification } from 'electron';
import path from 'path';
import url from 'url';
import { stat } from 'node:fs/promises';
import { initDisplayData } from './utils/displayData';

enum OSType {
	Windows = 'win32',
	MacOS = 'darwin',
	Linux = 'linux'
}

const CURRENT_OS = process.platform as OSType;
const scheme = 'app';
const srcFolder = path.join(app.getAppPath(), `.vite/renderer/main_window/`);
const staticAssetsFolder = import.meta.env.DEV ? path.join(import.meta.dirname, '../../static/') : srcFolder;
const devDisplayPosition = { x: 2048, y: 0, width: 1860, height: 1100 };
const windowOptionsCommon = {
	width: 900,
	height: 700,
	minWidth: 400,
	minHeight: 200,
	backgroundColor: '#374151',
	autoHideMenuBar: true,
	show: false,
	webPreferences: {
		preload: path.join(import.meta.dirname, '../preload/preload.js'),
	},
};

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
import electronSquirrelStartup from 'electron-squirrel-startup';
if (electronSquirrelStartup) app.quit();

// Only one instance of the electron main process should be running due to how chromium works.
// If another instance of the main process is already running `app.requestSingleInstanceLock()`
// will return false, `app.quit()` will be called, and the other instances will receive a
// `'second-instance'` event.
// https://www.electronjs.org/docs/latest/api/app#apprequestsingleinstancelockadditionaldata
if (!app.requestSingleInstanceLock()) {
	app.quit();
}

// This event will be called when a second instance of the app tries to run.
// https://www.electronjs.org/docs/latest/api/app#event-second-instance
app.on('second-instance', (event, args, workingDirectory, additionalData) => {
	createWindow();
});



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
				if ((await stat(filePath)).isFile()) return filePath;
			}
			catch (e) { }
		}

		const responseFilePath = await isFile(path.join(srcFolder, requestPath))
			?? await isFile(path.join(srcFolder, path.dirname(requestPath), `${path.basename(requestPath) || 'index'}.html`))
			?? path.join(srcFolder, '200.html');

		return await net.fetch(url.pathToFileURL(responseFilePath).toString());
	});
});

function createWindow() {
	const displayData = initDisplayData();
	console.log("Line 18 - main.ts - displayData: ", displayData);

	// Show notification about display configuration if needed
	console.log('Checking if notifications are supported:', Notification.isSupported());
	if (Notification.isSupported()) {
		console.log('Attempting to show notification...');
		const notification = new Notification({
			title: 'Display Configuration',
			body: 'Stacked and grid displays are not supported yet. Using primary display.'
		});
		notification.show();
		console.log('Notification shown');
	} else {
		console.log('Notifications are not supported on this system');
	}

	const windowOptions = {
		...windowOptionsCommon,
		...devDisplayPosition,
	}
	const mainWindow = new BrowserWindow({
		...windowOptions,
	});

	if (import.meta.env.DEV) {
		mainWindow.loadURL(VITE_DEV_SERVER_URLS['main_window']);

		// Open the DevTools.
		mainWindow.webContents.openDevTools();
	}
	else {
		mainWindow.loadURL('app://-/');
	}
	mainWindow.on('ready-to-show', () => {
		mainWindow.show()
	})
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});
