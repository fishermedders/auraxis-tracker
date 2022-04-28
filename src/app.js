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
var currentlyTracking;

ipcRenderer.on("ps2event", (event, ps2event) => {
  if(ps2event.event_name == "Death") {
    console.log(ps2event)
    deaths++;
    $('#global_death_amount').text(deaths);
    if(typeof(ps2event.is_tracked_kill) == "boolean") {
      if(ps2event.is_tracked_kill) {
        addKD("kill", ps2event)
      }
    } else if(ps2event.character_id == currentlyTracking.id) {
      addKD("death", ps2event)
    }
  }
});

ipcRenderer.on("started_tracking", (event) => {
  $('#currently_tracking').text('yes')
});

ipcRenderer.on("update_currently_tracking", (event, tracking) => {
  currentlyTracking = tracking;
  $('#who_currently_tracking').text(tracking.name + ':' + tracking.id)
});

$('#toggle_tracking').on('click', function() {
  console.log('test')
  ipcRenderer.send('start_tracking', {tracking_name: $('#tracking_name').val(), api_key: $('#api_key').val()})
})

function addKD(type, event) {
  //var attacker = type == "kill" ? event.attacker_name : event.character_name;
  //var victim = type == "death" ? event.character_name : event.attacker_name;
  $("#kd_table").find('tbody')
  .append($('<tr>').css("background-color", type == "kill" ? "#00FF00" : "#FF0000")
    .append($('<td>').append(type))
    .append($('<td>').append(event.attacker_name))
    .append($('<td>').append(event.character_name))
  )

}