const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const chorme = require("./brower")
const path = require('path')
const fs = require("fs")

var win

if (require('electron-squirrel-startup')) {
    app.quit();
  }

function createWindow(filename) {
    if (win) {
        win.close()
    }
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })
    win.loadFile(filename)
 }


const browerLanch = () => {
    chorme.lanchChomre()
}

const authen = async (event, username, password) => {
    win.webContents.send("export", "Signing odoo")
    const is_auth = await chorme.authen(username, password)
    if (is_auth) {
        console.log("Login successfully")
        createWindow("src/index2.html")
    }
    else {
        win.webContents.send("export", "Signing failed")
    }
}

const crawl = async (event, startdate, enddate) => {
    win.webContents.send("export", "app is crawling data")
    const pathFile = `data-leader-${startdate}-${enddate}.csv`
    const [datas, keys] = await chorme.crawl(startdate, enddate)
    const dictValuesAsCsv = datas.map(dict => (
        keys.map(key => {
          if (dict[key].includes(',')) {
            return `"${dict[key]}"`;
          }
          return dict[key];
        }).join(',')
    ));
    dictValuesAsCsv.unshift(keys.join(","))

    dialog.showSaveDialog({
        title: 'Select the File Path to save',
        defaultPath: path.join(pathFile),
        buttonLabel: 'Save',
        filters: [
            {
                name: 'Text Files',
                extensions: ['txt', 'docx']
            }, ],
        properties: []
    }).then(file => {
        console.log(file.canceled);
        if (!file.canceled) {
            console.log(file.filePath.toString());
            fs.writeFile(file.filePath.toString(), 
                        dictValuesAsCsv.join("\n"), function (err) {
                if (err) throw err;
                console.log('Saved!');
            });
            win.webContents.send("export", "Done")
        }
    }).catch(err => {
        console.log(err)
    });
}

  

app.whenReady().then(() => {
    browerLanch()
    ipcMain.on("authen", authen)
    ipcMain.on("crawl", crawl)

    createWindow("src/index.html")

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
        createWindow("src/index.html")
        }
    })
})

app.on('before-quit', async () => {
    console.log("before-quit")
    await chorme.close()
})

app.on('window-all-closed', async () => {
    console.log('window-all-closed')
    await chorme.close()
    if (process.platform !== 'darwin') {
        app.quit()
    }
})