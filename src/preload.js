const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('app', {
    authen: (username, password) => ipcRenderer.send('authen', username, password),
    crawl: (startdate, enddate) => ipcRenderer.send('crawl', startdate, enddate)
})

ipcRenderer.on("export", (event, mesage) => {
    document.getElementById('export_toast').innerHTML = mesage;
    document.getElementById('export_toast').style = "display:block;"
});