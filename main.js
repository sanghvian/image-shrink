const path = require('path');
const os = require('os');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
// const imageminPngquant = require('imagemin-pngquant');
const imageminOptipng = require('imagemin-optipng');
const slash = require('slash');

let mainWindow;
let aboutWindow;
process.env.NODE_ENV = 'developmentnpm';

const isDev = process.env.NODE_ENV == 'production' ? false : true;
const isMac = process.platform == 'darwin' ? true : false;
app.allowRendererProcessReuse = true;

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    height: 600,
    width: isDev ? 800 : 500,
    title: 'Image Shrink',
    icon: './assets/icons/icons/Icon_256x256.png',
    resizable: isDev,
    backgroundColor: '#fff',
    webPreferences: {
      nodeIntegration: true,
    },
  });
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  // mainWindow.loadURL(`file://${__dirname}/app/index.html`);
  mainWindow.loadFile('./app/index.html');
};

const createAboutWindow = () => {
  aboutWindow = new BrowserWindow({
    height: 300,
    width: 300,
    title: 'About Image Shrink',
    icon: './assets/icons/icons/Icon_256x256.png',
    resizable: false,
    backgroundColor: '#fff',
  });
  aboutWindow.loadFile('./app/about.html');
};

ipcMain.on('image:minimize', (e, options) => {
  options.dest = path.join(os.homedir(), 'imageshrink');
  // console.log(options);
  imageShrink(options);
});

async function imageShrink({ imgPath, quality, dest }) {
  try {
    const pngQual = (quality * 7) / 100;
    const files = await imagemin([slash(imgPath)], {
      destination: dest,
      plugins: [
        imageminMozjpeg({ quality }),
        // imageminPngquant({
        //   quality: [pngQual, pngQual],
        // }),
      ],
      use: [imageminOptipng(pngQual)],
    });
    shell.openPath(dest);
    mainWindow.webContents.send('image:done');
  } catch (error) {
    console.log(error);
  }
}

//TO EXPLICITLY CLOSE APP WITH CTRL+Q or SOME OTHER WAY

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
});

//To re-create a window when the dock ion is clicked and there are no windows open

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: 'About',
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  {
    role: 'fileMenu',
  },
  ...(!isMac
    ? [
        {
          label: 'Help',
          submenu: [
            {
              label: 'About',
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  ...(isDev
    ? [
        {
          label: 'Developer',
          submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { type: 'separator' },
            { role: 'toggledevtools' },
          ],
        },
      ]
    : []),
];
app.on('ready', () => {
  createMainWindow();

  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  mainWindow.on('closed', () => (mainWindow = null));
});
