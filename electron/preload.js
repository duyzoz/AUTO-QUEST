'use strict';

const { contextBridge, ipcRenderer } = require('electron');

function subscribe(channel, handler) {
	const listener = (_event, payload) => handler(payload);
	ipcRenderer.on(channel, listener);
	return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld('autoquest', {
	getConfig: () => ipcRenderer.invoke('config:get'),
	saveConfig: (config) => ipcRenderer.invoke('config:save', config),
	start: (config) => ipcRenderer.invoke('bot:start', config),
	stop: () => ipcRenderer.invoke('bot:stop'),
	getState: () => ipcRenderer.invoke('bot:state'),
	readClipboard: () => ipcRenderer.invoke('clipboard:read'),
	writeClipboard: (text) => ipcRenderer.invoke('clipboard:write', text),
	openDataFolder: () => ipcRenderer.invoke('shell:open-data-folder'),
	saveLog: (content) => ipcRenderer.invoke('log:save', content),
	onLog: (handler) => subscribe('log', handler),
	onEvent: (handler) => subscribe('event', handler),
	onState: (handler) => subscribe('state', handler),
});
