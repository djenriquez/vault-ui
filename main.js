const { app, protocol, BrowserWindow, Menu, dialog } = require('electron')

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let initialPath;

// Handle commandline
if (process.argv && process.argv.length > 1) {
  setInitialPath(process.argv[1]);
}

function setInitialPath(urlloc) {
  
  let l = url.parse(urlloc, true);
  if (l && l.protocol == 'vaultui:' && l.hash) {

    // Windows Protocol Handler bug workaround
    initialPath = l.hash.replace('~', '?');
  }
  if (mainWindow) {
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.desktop.html'),
        protocol: 'file:',
        hash: initialPath,
        slashes: true
    }))
  }
}

const shouldQuit = app.makeSingleInstance((commandLine) => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }

  if (commandLine && commandLine.length > 1) { 
    setInitialPath(commandLine[1]);
  }
})

if (shouldQuit) {
  app.quit()
}

app.setAsDefaultProtocolClient('vaultui')
app.on('open-url', function (event, openurl) {
  setInitialPath(openurl);
})

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 1024, height: 768 })

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.desktop.html'),
    protocol: 'file:',
    hash: initialPath,
    slashes: true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  // Create the Application's main menu
  var template = [{
    label: "Application",
    submenu: [
      { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
      { type: "separator" },
      { label: "Quit", accelerator: "Command+Q", click: function () { app.quit(); } }
    ]
  }, {
    label: "Edit",
    submenu: [
      { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
      { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
      { type: "separator" },
      { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
      { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
      { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
      { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]
  }, {
    label: "Tools",
    submenu: [
      { label: "Open Development Tools", click: function () { mainWindow.webContents.openDevTools(); } }
    ]
  }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  protocol.registerFileProtocol('vaultui', (request, callback) => {
    const url = request.url.substr(7)
    callback({ path: path.normalize(`${__dirname}/${url}`) })
  }, (error) => {
    if (error) console.error('Failed to register protocol')
  })

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  var result = dialog.showMessageBox({
    type: 'warning',
    title: 'Server TLS Certificate Error',
    message: 'The validity of the TLS connection with the remote server cannot be verified. Would you like to proceed anyway?',
    detail: error,
    buttons: ['Yes', 'No']
  });
  if (result == 0) {
    event.preventDefault()
    callback(true)
  } else {
    callback(false)
  }
})
