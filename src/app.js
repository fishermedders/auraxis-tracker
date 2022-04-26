import "./stylesheets/main.css";
window.$ = window.jQuery = require('jquery');

// Everything below is just a demo. You can delete all of it.

import { ipcRenderer } from "electron";
import jetpack from "fs-jetpack";
import env from "env";

document.querySelector("#app").style.display = "block";

/* We can communicate with main process through messages.
ipcRenderer.on("app-path", (event, appDirPath) => {
  // Holy crap! This is browser window with HTML and stuff, but I can read
  // files from disk like it's node.js! Welcome to Electron world :)
  const appDir = jetpack.cwd(appDirPath);
  const manifest = appDir.read("package.json", "json");
  document.querySelector("#author").innerHTML = manifest.author;
});
ipcRenderer.send("need-app-path");*/

var tracking = false;
var deaths = 0;

ipcRenderer.on("ps2event", (event, ps2event) => {
  console.log(ps2event.event_name)
  if(ps2event.event_name == "Death") {
    deaths++;
    $('#global_death_amount').text(deaths);
  }
});

ipcRenderer.on("started_tracking", (event) => {
  $('#currently_tracking').text('yes')
});

$('#toggle_tracking').on('click', function() {
  console.log('test')
  ipcRenderer.send('start_tracking', $('#tracking_name').val())
})

$('#toggle_tracking').on('click', function() {
  console.log('test')
  ipcRenderer.send('start_tracking', $('#tracking_name').val())
})