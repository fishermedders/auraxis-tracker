// This is main process of Electron, started as first thing when your
// app starts. It runs through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from "path";
import url from "url";
import { app, Menu, ipcMain, shell, ipcRenderer } from "electron";
import appMenuTemplate from "./menu/app_menu_template";
import editMenuTemplate from "./menu/edit_menu_template";
import devMenuTemplate from "./menu/dev_menu_template";
import createWindow from "./helpers/window";
const fetch = require("node-fetch");

const { CensusClient } = require('ps2census');
var mainWindow;
var ps2client; //the census client
var currentlyTracking;
var userCache = {};
var api_key;

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from "env";

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== "production") {
  const userDataPath = app.getPath("userData");
  app.setPath("userData", `${userDataPath} (${env.name})`);
}

const setApplicationMenu = () => {
  const menus = [appMenuTemplate, editMenuTemplate];
  if (env.name !== "production") {
    menus.push(devMenuTemplate);
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

// We can communicate with our window (the renderer process) via messages.
const initIpc = () => {
  ipcMain.on("need-app-path", (event, arg) => {
    event.reply("app-path", app.getAppPath());
  });
  ipcMain.on("open-external-link", (event, href) => {
    shell.openExternal(href);
  });
};

app.on("ready", () => {
  setApplicationMenu();
  initIpc();

  mainWindow = createWindow("main", {
    width: 1000,
    height: 600,
    webPreferences: {
      // Two properties below are here for demo purposes, and are
      // security hazard. Make sure you know what you're doing
      // in your production app.
      nodeIntegration: true,
      contextIsolation: false,
      // Spectron needs access to remote module
      enableRemoteModule: env.name === "test"
    }
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "app.html"),
      protocol: "file:",
      slashes: true
    })
  );

  if (env.name === "development") {
    mainWindow.openDevTools();
  }
});

app.on("window-all-closed", () => {
  app.quit();
  ps2client?.destroy();
});

/*

  Planetside 2 Census Work

*/

function checkUsernameCache(id, callback) {
  if(typeof userCache[id] == "string") {
    callback(userCache[id])
  } else {
    fetch('http://census.daybreakgames.com/s:' + api_key + '/get/ps2:v2/character/?character_id=' + id)
      .then(response => response.json())
      .then(user => {
        console.log(user)
        userCache[id] = user.character_list[0].name.first
        callback(user.character_list[0].name.first)
      })
  }
}

ipcMain.on('start_tracking', (event, start_info) => {
  api_key = start_info.api_key
  fetch('http://census.daybreakgames.com/s:' + api_key + '/get/ps2:v2/character/?name.first_lower=' + start_info.tracking_name)
    .then(response => response.json())
    .then(tracking => {
      console.log(tracking)
      currentlyTracking = {name: start_info.tracking_name, id: tracking.character_list[0].character_id}
      mainWindow.webContents.send('update_currently_tracking', currentlyTracking)

      ps2client?.destroy();
      ps2client = new CensusClient(api_key, 'ps2', {
        streamManager: {
            subscription: {
              eventNames: ['all'],
              characters: ['all'],
              worlds: ['all'],
            }
        },
      });

      ps2client.on('ps2Event', (event) => {
        var newEvent = null;
        // Handle the event, for more information see http://census.daybreakgames.com/#websocket-details
        if(event.raw?.character_id == tracking.character_list[0].character_id) {
          //console.log(event.raw)
        }
        //console.log(event.raw)
        if(event.raw?.event_name == "Death") {
          /* if our tracking player killed someone */
          if(event.raw?.attacker_character_id == currentlyTracking.id) {
            checkUsernameCache(event.raw?.character_id, (victim_name) => {
              newEvent = event.raw;
              newEvent.is_tracked_kill = true;
              newEvent.character_name = victim_name;
              console.log(newEvent)
              mainWindow.webContents.send('ps2event',newEvent)
            })
          } else if(event.raw?.character_id == currentlyTracking.id) {
            checkUsernameCache(event.raw?.character_id, (victim_name) => {
              checkUsernameCache(event.raw?.attacker_character_id, (attacker_name) => {
                newEvent = event.raw;
                newEvent.character_name = victim_name;
                newEvent.attacker_name = attacker_name;
                console.log(newEvent)
                mainWindow.webContents.send('ps2event',newEvent)
              })
            })
          }
        }
      });

      // or
      ps2client.on('facilityControl', (event) => {
      }); // Note that the event always starts with a lower case letter
      
      ps2client.on('subscribed', (subscription) => {
      }); // Notification of a subscription made by the event stream
      ps2client.on('duplicate', (event) => {
      }); // When a duplicate event has been received
      ps2client.on('ready', () => {
      }); // Client is ready
      ps2client.on('reconnecting', () => {
      }); // Client is reconnecting
      ps2client.on('disconnected', () => {
      }); // Client got disconnected
      ps2client.on('error', (error) => {
      }); // Error
      ps2client.on('warn', (error) => {
      }); // Error, when receiving a corrupt message
      
      ps2client.watch();
      mainWindow.webContents.send('started_tracking')
      
      // To terminate the client
      //client.destroy();
    })
});