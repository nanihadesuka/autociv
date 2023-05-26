var g_linkLong = null; // init should be available during the game and not changed
var game = {
  // stuff that needs to be updated after the gui updates it (as it removes it before it)
  // undefined will mean it doesnt exist
  attributes: {},
  updateSettings() {
    // g_SetupWindow.controls.gameSettingsController.updateGameAttributes()
    // g_SetupWindow.controls.gameSettingsController.setNetworkGameAttributes()
  },
  get controls() {
    return g_SetupWindow.pages.GameSetupPage.gameSettingControlManager
      .gameSettingControls;
  },
  get panels() {
    return g_SetupWindow.pages.GameSetupPage.panels;
  },
  get panelsButtons() {
    return g_SetupWindow.pages.GameSetupPage.panelButtons;
  },
  set: {
    resources: (quantity) => {
      if (!g_IsController) return;
      let val = +quantity;
      if (quantity === "" || val === NaN)
        return selfMessage(
          "Invalid starting resources value (must be a number)."
        );

      g_GameSettings.startingResources.resources = val;
      game.updateSettings();
      sendMessage(`Starting resources set to: ${val}`);
    },
    mapcircular: (circular = true) => {
      if (!g_IsController) return;

      g_GameSettings.circularMap.value = circular;
      game.updateSettings();
      sendMessage(`Map shape set to: ${!!circular ? "circular" : "squared"}`);
    },
    population: (quantity) => {
      if (!g_IsController) return;
      let val = parseInt(quantity);
      if (!Number.isInteger(val) || val < 0)
        return selfMessage(
          "Invalid population cap value (must be a number >= 0)."
        );

      g_GameSettings.population.cap = val;
      game.updateSettings();
      sendMessage(`Population cap set to: ${val}`);
    },
    mapsize: (mapsize) => {
      if (!g_IsController) return;
      if (g_GameSettings.mapType != "random")
        return selfMessage("Size can only be set for random maps");
      let val = parseInt(mapsize);
      if (!Number.isInteger(val) || val < 1)
        return selfMessage("Invalid map size value (must be a number >= 1).");

      g_GameSettings.mapSize.size = val;
      game.updateSettings();
      sendMessage(`Map size set to: ${val}`);
    },
    numberOfSlots: (num) => {
      const playerCount = game.controls.PlayerCount;
      let itemIdx = playerCount.values.indexOf(num);
      playerCount.onSelectionChange(itemIdx);
    },
    player: {
      civ: (playerName, playerCivCode) => {
        let playerPos = game.get.player.pos(playerName);
        if (playerPos === undefined || playerPos == -1) return;

        const playerCiv =
          g_SetupWindow.pages.GameSetupPage.gameSettingControlManager
            .playerSettingControlManagers[playerPos - 1].playerSettingControls
            .PlayerCiv;

        // List order can change depending of active language !!
        const dropDownCivCodes = playerCiv.dropdown.list_data;
        let civCodeIndex = dropDownCivCodes.indexOf(playerCivCode);
        if (civCodeIndex == -1) return;

        playerCiv.onSelectionChange(civCodeIndex);
      },
      observer: (playerName) => {
        let playerPos = game.get.player.pos(playerName);
        if (playerPos === undefined || playerPos == -1) return;

        Engine.AssignNetworkPlayer(playerPos, "");
      },
      play: (playerName) => {
        let playerId = game.get.player.id(playerName);
        let numberOfSlots = game.get.numberOfSlots();

        let assignedPos = new Set(); // set of assigned positions

        for (let guid in g_PlayerAssignments) {
          let playerPos = g_PlayerAssignments[guid].player;
          // return if player already assigned
          if (guid === playerId && playerPos > 0 && playerPos <= numberOfSlots)
            return;
          assignedPos.add(playerPos);
        }

        // find first available slot
        for (let pos = 1; pos <= numberOfSlots; ++pos) {
          if (assignedPos.has(pos)) continue;
          else {
            Engine.AssignNetworkPlayer(pos, playerId);
            return;
          }
        }
      },
    },
    /**
     * @param {string} text E.g : "1v1v3" "ffa" "4v4" "2v2v2v2"
     */
    teams: (text) => setTeams(text),
    slotName: (slotNumber, name) => {
      let values = g_GameSettings.playerName.values;
      values[slotNumber - 1] = name;
      g_GameSettings.playerName.values = values;
      game.updateSettings();
    },
  },
  get: {
    player: {
      // Returns undefined if no player with that name (no rating included)
      id: (playerName) => {
        return Object.keys(g_PlayerAssignments).find((id) => {
          let nick1 = splitRatingFromNick(g_PlayerAssignments[id].name).nick;
          let nick2 = splitRatingFromNick(playerName).nick;
          return nick1 == nick2;
        });
      },
      // Returns -1 in case of observer  and undefined if player doesn't exist
      pos: (playerName) => {
        let playerId = game.get.player.id(playerName);
        return g_PlayerAssignments[playerId]?.player;
      },
      selfName: () =>
        splitRatingFromNick(g_PlayerAssignments[Engine.GetPlayerGUID()].name)
          .nick,
      status: function (playerName) {
        switch (g_PlayerAssignments[this.id(playerName)].status) {
          case 1:
            return "ready";
          case 2:
            return "locked";
          default:
            return "blank";
        }
      },
    },
    players: {
      name: () =>
        Object.keys(g_PlayerAssignments).map(
          (id) => splitRatingFromNick(g_PlayerAssignments[id].name).nick
        ),
    },
    numberOfSlots: () => g_GameSettings.playerTeam.values.length,
  },
  is: {
    player: {
      assigned: (playerName) => game.get.player.pos(playerName) >= 0,
    },
    allReady: function () {
      for (let playerName of game.get.players.name())
        if (
          game.is.player.assigned(playerName) &&
          game.get.player.status(playerName) == "blank"
        )
          return false;
      return true;
    },
    full: function () {
      let nOfPlayersAssignedSlot = 0;
      for (let guid in g_PlayerAssignments)
        if (g_PlayerAssignments[guid].player >= 0) nOfPlayersAssignedSlot += 1;

      return g_GameSettings.playerTeam.values.length == nOfPlayersAssignedSlot;
    },
    rated: () => g_GameSettings.rating.enabled,
  },
  reset: {
    civilizations: () => {
      game.panels.resetCivsButton.onPress();
    },
    teams: () => {
      game.panels.resetTeamsButton.onPress();
    },
  },
};

if (!("g_NetworkCommandsDescriptions" in global))
  global.g_NetworkCommandsDescriptions = {};

g_NetworkCommandsDescriptions = Object.assign(g_NetworkCommandsDescriptions, {
  "/help": "Shows all gamesetup chat commands",
  "/playToggle":
    "Toggle want to play action. If enabled observers that type play will be set added to the game",
  "/resources": "Set a specific amount of resources. Can be negative",
  "/resourcesUnlimited": "Set resources to be unlimited",
  "/population": "Set a specific amount of population for each player",
  "/mapsize":
    "Set a specific size for the map. Only for random maps. Small values (<64) might crash the game",
  "/mapcircular": "Force the map to be circular. Only for random maps",
  "/mapsquare": "Force the map to be square. Only for random maps",
  "/resetcivs": "Reset all slots civilizations to random",
  "/autociv": "Toggle autociv (will also disable spec and play actions)",
  "/ready": "Toggle your ready state",
  "/start": "Start the game",
  "/countdown":
    "Toggle countdown. Default is 5 seconds. For different time type /countdown time_in_seconds ",
  "/gameName":
    "Change game name that the lobby shows. (Doesn't work currently)",
  "/team":
    "Make teams combinations. Ex: /team 3v4  /team 2v2v2  /team ffa  /team 4v4",
  "/randomCivs":
    "Set random civs for all players. Can exclude some civs (needs full name) by typing ex: /randomCivs Mauryas Iberians Romans",
  "/kick": "Kick player",
  "/kickspecs": "Kick all specs",
  "/ban": "Ban player",
  "/banspecs": "Ban all specs",
  "/list": "List all the players and observers currently here",
  "/clear": "Clear the chat comments",
  "/pMainland_1v1_defaults": "set to mainland, popMax, 300res, and more",
  "/pMainland_defaults": "set to mainland, popMax, 300res, and more",
  "/pMBMainland_defaults": "set to mainland balanced popMax, 300res",
  "/pUnknown_defaults": "set to map unknown, popMax, 300res, and more",
  "/pExtinct_volcano_defaults": "set to extinct_volcano and other defaults",
  "/jitsi":
    "Create a game call and set a TG config. Uses jitsi (meet.jit.si/anyNameYoutWantHere) service. ",
  "/jitsiPlus":
    "Create a game call and set a TG config. Uses jitsi (meet.jit.si/anyNameYoutWantHere) service. And rename the Game Name(experimental). ",
});

g_NetworkCommands["/help"] = () => {
  const g_ChatCommandColor = "200 200 255";
  let text = translate("Chat commands:");
  for (let command in g_NetworkCommands) {
    let noSlashCommand = command.slice(1);
    const asc = g_autociv_SharedCommands[noSlashCommand];
    const ncd = g_NetworkCommandsDescriptions[command];
    text += "\n";
    text += sprintf(translate("%(command)s - %(description)s"), {
      command: "/" + coloredText(noSlashCommand, g_ChatCommandColor),
      description: ncd ?? asc?.description ?? "",
    });
  }
  selfMessage(text);
};

g_NetworkCommands["/playToggle"] = () => {
  const key = "autociv.gamesetup.play.enabled";
  const enabled = Engine.ConfigDB_GetValue("user", key) == "true";
  Engine.ConfigDB_CreateAndWriteValueToFile(
    "user",
    key,
    enabled ? "false" : "true",
    "config/user.cfg"
  );
  selfMessage(
    `Player play autoassign slot ${enabled ? "enabled" : "disabled"}`
  );
};

g_NetworkCommands["/resources"] = (quantity) => game.set.resources(quantity);
g_NetworkCommands["/resourcesUnlimited"] = () => game.set.resources(Infinity);
g_NetworkCommands["/population"] = (population) =>
  game.set.population(population);
g_NetworkCommands["/mapsize"] = (size) => game.set.mapsize(size);
g_NetworkCommands["/mapcircular"] = () => game.set.mapcircular(true);
g_NetworkCommands["/mapsquare"] = () => game.set.mapcircular(false);
g_NetworkCommands["/resetcivs"] = () => game.reset.civilizations();
g_NetworkCommands["/autociv"] = () => {
  if (!g_IsController) return;
  let bot = botManager.get("autociv");
  bot.toggle();
  selfMessage(`${bot.name} ${bot.active ? "activated" : "deactivated"}.`);
};
g_NetworkCommands["/ready"] = () => {
  if (g_IsController) return;
  game.panelsButtons.readyButton.onPress();
};

g_NetworkCommands["/start"] = () => {
  if (!g_IsController) return;

  if (!game.is.allReady())
    return selfMessage("Can't start game. Some players not ready.");

  game.panelsButtons.startGameButton.onPress();
};

g_NetworkCommands["/countdown"] = (input) => {
  if (!g_IsController) return;

  let value = parseInt(input, 10);
  if (isNaN(value)) {
    g_autociv_countdown.toggle();
    return;
  }

  value = Math.max(0, value);
  g_autociv_countdown.toggle(true, value);
};

g_NetworkCommands["/gameName"] = (text) => {
  return setGameNameInLobby(text);
};

g_NetworkCommands["/pMainland_1v1_defaults"] = (text) => {
  pMainland_1v1_defaults();
};
g_NetworkCommands["/pMainland_defaults"] = (text) => {
  pMainland_defaults();
};
g_NetworkCommands["/pMBMainland_defaults"] = (text) => {
  pMBMainland_defaults();
};
g_NetworkCommands["/pExtinct_volcano_defaults"] = (text) => {
  pExtinct_volcano_defaults();
};
g_NetworkCommands["/pUnknown_defaults"] = (text) => {
  pUnknown();
};

g_NetworkCommands["/jitsiPlus"] = (text) => {
  // selfMessage(`meet.jit.si/anyNameYoutWantHere`);

  /*
Jitsi for Quick Team Calls
Jitsi is a great way to have quick team calls without any setup process. It can also be used as an audio chat for your 0ad-team.

Jitsi is an easy, no-setup way to have quick team calls and audio chats. Perfect for 0ad-teams.

Jitsi: Quick team calls, no setup, audio chat.

*/

  let jitsi8words =
    "Jitsi: team audio chat, no setup, OS (necessary a web browser and Mic).";

  selfMessage(
    `Jitsi Meet is a fully encrypted, 100% open source video conferencing solution that you can use all day, every day, for free — with no account needed.`
  );

  let gitHubLinkAutoCivModificationSL5 = "https://github.com/sl5net/autociv";

  let textBest = `Jitsi is best for having a quick team call without setup process. could used as audio chat for you 0ad-team. `;
  selfMessage(textBest);

  selfMessage(
    `write /link to open a link in your WebBrowser if you have autoCiv-mod installed to open a link more easy.`
  );

  if (g_linkLong == null) {
    let linkidShort = Date.now().toString().substring(10);
    // not open this link always. if you have it already probably
    g_linkLong = `https://meet.jit.si/0ad${linkidShort}audio`;
    openURL(g_linkLong);
  }

  let linkTeam1example = `https://meet.jit.si/0ad${linkidShort}team123`;
  selfMessage(
    ` recommendation: send later in your private team-game-chat a other unique link for audio chat. Example:  ${linkTeam1example}`
  );

  selfMessage(
    ` this autoCiv-mod modification you could donwload here: ${gitHubLinkAutoCivModificationSL5}`
  );

  let populationMax = pMainland_defaults();

  selfMessage(g_linkLong);

  // let gameTextJitsiExplainded = `want use Jitsi as a fully encrypted, open source video conferencing, with no account needed.`
  // gameText = ` ${textBest} ${g_linkLong} `;

  let resources = g_GameSettings.startingResources.resources; // works ist a radio selct field

  let gameTitleInLobby = ``;
  gameTitleInLobby = `unrated | ${jitsi8words} ${g_linkLong} | ${populationMax}popMax, ${resources}res`; // popMax, 300res
  return setGameNameInLobby(gameTitleInLobby);
};

g_NetworkCommands["/jitsi"] = (text) => {
  if (g_linkLong == null) {
    let linkidShort = Date.now().toString().substring(10);
    // not open this link always. if you have it already probably
    g_linkLong = `https://meet.jit.si/0ad${linkidShort}audio`;
    openURL(g_linkLong);
  }
  let linkTeam1example = `https://meet.jit.si/0ad${linkidShort}team123`;
  selfMessage(
    ` recommendation: send later in your private team-game-chat a other unique link for audio chat. Example:  ${linkTeam1example}`
  );
};

g_NetworkCommands["/team"] = (text) => game.set.teams(text);

g_NetworkCommands["/randomCivs"] = function (excludedCivs) {
  if (!g_IsController) return;

  const excludeCivList = excludedCivs.trim().toLowerCase().split(/\s+/);
  let civList = new Map(
    Object.values(g_CivData)
      .map((data) => [data.Name.toLowerCase(), data.Code])
      .filter((e) => e[1] != "random")
  );

  excludeCivList.forEach((civ) => civList.delete(civ));

  civList = Array.from(civList);

  const getRandIndex = () => Math.floor(Math.random() * civList.length);

  for (let slot = 1; slot <= game.get.numberOfSlots(); ++slot) {
    const playerCivCode = civList[getRandIndex()][1];
    let civCodeIndex = Object.keys(g_CivData).indexOf(playerCivCode);
    if (civCodeIndex == -1) return;

    g_SetupWindow.pages.GameSetupPage.gameSettingControlManager.playerSettingControlManagers[
      slot - 1
    ].playerSettingControls.PlayerCiv.onSelectionChange(civCodeIndex + 1);
  }
};

function setGameNameInLobby(text) {
  if (!g_IsController || !Engine.HasNetServer()) return;
  if (!g_SetupWindow.controls.lobbyGameRegistrationController) return;

  let oldGameName =
    g_SetupWindow.controls.lobbyGameRegistrationController.serverName;
  selfMessage(`oldGameName: ${oldGameName}`);

  text = `${text}`;
  g_SetupWindow.controls.lobbyGameRegistrationController.serverName = text;
  selfMessage(`Game name changed to: ${text}`);
  g_SetupWindow.controls.lobbyGameRegistrationController.sendImmediately();
  return true;
}

var getKeys = function (obj) {
  var keys = [];
  for (var key in obj) {
    //    keys.push(key);
    warn("key=" + key);
  }
  return keys;
};

function pExtinct_volcano_defaults() {
  g_GameSettings.mapExploration.allied = true; // woks :)  AlliedView
  g_GameSettings.rating.enabled = false; // no error and test in the lobby. it works
  g_GameSettings.disableTreasures.enabled = true;
  g_GameSettings.nomad.enabled = false; // works

  // Map Type
  g_GameSettings.map.type = "random"; // works

  let doItYourSelfStr = " Please select this manually. ";
  // doItYourSelfStr = ''

  g_GameSettings.map.map = "maps/random/extinct_volcano";

  // game.updateSettings(); // sometimes onle names but not thgit clone https://gitlab.com/myproject.gitgit clone https://gitlab.com/myproject.gitgit clone https://gitlab.com/myproject.gitgit clone https://gitlab.com/myproject.gitgit clone https://gitlab.com/myproject.gitgit clone https://gitlab.com/myproject.gitgit clone https://gitlab.com/myproject.gite map was realls loadet. therfore i try the   game.updateSettings(); also add this place

  //   #: gui/gamesetup/Pages/GameSetupPage/GameSettings/Single/Sliders/SeaLevelRiseTime.js:38
  // msgid "Sea Level Rise Time"
  // g_GameSettings.SeaLevelRiseTime = 10; // no error but no effect. extinct_volcano SeaLevelRiseTime
  // g_GameSettings.SeaLevelRiseTime.val = 10; // error but no effect. extinct_volcano SeaLevelRiseTime
  // g_GameSettings.SeaLevelRiseTime.value = 10; // error but no effect. extinct_volcano SeaLevelRiseTime
  // g_GameSettings.seaLevelRiseTime.value = 10; // error undefined but no effect. extinct_volcano SeaLevelRiseTime
  // g_GameSettings.SeaLevelRiseTime.cap = 10; // erro. extinct_volcano SeaLevelRiseTime

  if (!g_GameSettings.map.map) {
    let info = "No selected map";
    selfMessage(`${info}`);
  } else {
    selfMessage(`map.map = ${g_GameSettings.map.map}`);
  }

  setTeams("team 2v2");

  g_GameSettings.startingResources.resources = 300; // works ist a radio selct field
  g_GameSettings.population.cap = 250; // works its a number option vield

  game.updateSettings();

  let populationMax = g_GameSettings.population.cap; // works its a number option vield
  let resources = g_GameSettings.startingResources.resources; // works ist a radio selct field
  selfMessage(`pop= ${populationMax}`);
  selfMessage(`res= ${resources}`);
  return populationMax;
}

function pMBMainland_defaults() {
  g_GameSettings.mapExploration.allied = true; // woks :)  AlliedView
  g_GameSettings.rating.enabled = false; // no error and test in the lobby. it works
  // gui/gamesetup/Pages/GameSetupPage/GameSettings/Single/Checkboxes/Treasures.js
  g_GameSettings.disableTreasures.enabled = true;
  g_GameSettings.nomad.enabled = false; // works
  g_GameSettings.mapExploration.enabled = false; // todo: dont work

  // Map Type
  g_GameSettings.map.type = "random"; // works

  setMapFilterTo();
  selfMessage(
    `"Select Map": often used "Mainland" or "Mainland balanced"(needs FeldFeld-Mod) . `
  );

  g_GameSettings.map.map = "maps/random/mainland_balanced";

  if (!g_GameSettings.map.map) {
    let info = "No selected map";
    selfMessage(`${info}`);
  } else {
    selfMessage(`map.map = ${g_GameSettings.map.map}`);
  }

  setTeams("team 2v2");

  let popMaxDefault = Engine.ConfigDB_GetValue(
    "user",
    "autociv.TGmainland.PopMaxDefault"
  );
  if (!popMaxDefault) {
    popMaxDefault = 200;
    selfMessage(
      "you could set PopMax in your user.cfg. Example: autociv.TGmainland.PopMaxDefault = 200"
    );
  }
  g_GameSettings.population.cap = popMaxDefault; // works its a number option vield

  g_GameSettings.startingResources.resources = 300; // works ist a radio selct field

  game.updateSettings();

  let resources = g_GameSettings.startingResources.resources; // works ist a radio selct field
  let populationMax = g_GameSettings.population.cap; // works its a number option vield
  selfMessage(`pop= ${populationMax}`);
  selfMessage(`res= ${resources}`);
  return populationMax;
}

function pUnknown() {
  g_GameSettings.mapExploration.allied = true; // woks :)  AlliedView
  g_GameSettings.rating.enabled = false; // no error and test in the lobby. it works
  // gui/gamesetup/Pages/GameSetupPage/GameSettings/Single/Checkboxes/Treasures.js
  g_GameSettings.disableTreasures.enabled = true;
  g_GameSettings.nomad.enabled = false; // works
  g_GameSettings.mapExploration.enabled = false; // todo: dont work

  // Map Type
  g_GameSettings.map.type = "random"; // works

  setMapFilterTo();
  selfMessage(
    `"Select Map": often used "Mainland" or "Mainland balanced"(needs FeldFeld-Mod) . `
  );

  g_GameSettings.map.map = "maps/random/mainland_unknown";

  if (!g_GameSettings.map.map) {
    let info = "No selected map";
    selfMessage(`${info}`);
  } else {
    selfMessage(`map.map = ${g_GameSettings.map.map}`);
  }

  setTeams("team 2v2");

  g_GameSettings.startingResources.resources = 300; // works ist a radio selct field
  g_GameSettings.population.cap = 250; // works its a number option vield

  game.updateSettings();

  let resources = g_GameSettings.startingResources.resources; // works ist a radio selct field
  let populationMax = g_GameSettings.population.cap; // works its a number option vield
  selfMessage(`pop= ${populationMax}`);
  selfMessage(`res= ${resources}`);
  return populationMax;
}
function pMainland_1v1_defaults() {
  setTeams("team 1v1");
  game.updateSettings();
  g_GameSettings.mapExploration.allied = true; // woks :)  AlliedView
  g_GameSettings.rating.enabled = false; // no error and test in the lobby. it works
  // gui/gamesetup/Pages/GameSetupPage/GameSettings/Single/Checkboxes/Treasures.js
  g_GameSettings.disableTreasures.enabled = true;
  g_GameSettings.nomad.enabled = false; // works
  g_GameSettings.mapExploration.enabled = false; // todo: dont work

  // Map Type
  g_GameSettings.map.type = "random"; // works

  setMapFilterTo();
  selfMessage(
    `"Select Map": often used "Mainland" or "Mainland balanced"(needs FeldFeld-Mod) . `
  );

  g_GameSettings.map.map = "maps/random/mainland";

  if (!g_GameSettings.map.map) {
    let info = "No selected map";
    selfMessage(`${info}`);
  } else {
    selfMessage(`map.map = ${g_GameSettings.map.map}`);
  }

  let popMaxDefault = Engine.ConfigDB_GetValue(
    "user",
    "autociv.TGmainland.PopMaxDefault"
  );
  if (!popMaxDefault) {
    popMaxDefault = 200;
    selfMessage(
      "you could set PopMax in your user.cfg. Example: autociv.TGmainland.PopMaxDefault = 200"
    );
  }
  g_GameSettings.population.cap = popMaxDefault; // works its a number option vield
  g_GameSettings.startingResources.resources = 300; // works ist a radio selct field

  game.updateSettings();

  let resources = g_GameSettings.startingResources.resources; // works ist a radio selct field
  let populationMax = g_GameSettings.population.cap; // works its a number option vield
  selfMessage(`pop= ${populationMax}`);
  selfMessage(`res= ${resources}`);
  return populationMax;
}
function pMainland_defaults() {
  g_GameSettings.mapExploration.allied = true; // woks :)  AlliedView
  g_GameSettings.rating.enabled = false; // no error and test in the lobby. it works
  // gui/gamesetup/Pages/GameSetupPage/GameSettings/Single/Checkboxes/Treasures.js
  g_GameSettings.disableTreasures.enabled = true;
  g_GameSettings.nomad.enabled = false; // works
  g_GameSettings.mapExploration.enabled = false; // todo: dont work

  // Map Type
  g_GameSettings.map.type = "random"; // works

  setMapFilterTo();
  selfMessage(
    `"Select Map": often used "Mainland" or "Mainland balanced"(needs FeldFeld-Mod) . `
  );

  g_GameSettings.map.map = "maps/random/mainland";

  if (!g_GameSettings.map.map) {
    let info = "No selected map";
    selfMessage(`${info}`);
  } else {
    selfMessage(`map.map = ${g_GameSettings.map.map}`);
  }

  setTeams("team 2v2");

  let popMaxDefault = Engine.ConfigDB_GetValue(
    "user",
    "autociv.TGmainland.PopMaxDefault"
  );
  if (!popMaxDefault) {
    popMaxDefault = 200;
    selfMessage(
      "you could set PopMax in your user.cfg. Example: autociv.TGmainland.PopMaxDefault = 200"
    );
  }
  g_GameSettings.population.cap = popMaxDefault; // works its a number option vield
  g_GameSettings.startingResources.resources = 300; // works ist a radio selct field

  game.updateSettings();

  let resources = g_GameSettings.startingResources.resources; // works ist a radio selct field
  let populationMax = g_GameSettings.population.cap; // works its a number option vield
  selfMessage(`pop= ${populationMax}`);
  selfMessage(`res= ${resources}`);
  return populationMax;
}
function setTeams(text) {
  if (!g_IsController) return;

  if (g_GameSettings.mapType == "scenario")
    return selfMessage("Can't set teams with map type scenario.");

  // selfMessage(`version= ${version}`); // dont work? howto get 0ad version?

  let teams = text.trim().toLowerCase();
  if ("ffa" == teams) {
    g_GameSettings.playerTeam.values = g_GameSettings.playerTeam.values.map(
      (v) => -1
    );
    game.updateSettings();
    return;
  }

  teams = text.match(/(\d+)/g);
  if (teams == null) return selfMessage("Invalid input.");

  // Transform string to number discarding 0 size teams
  teams = teams.map((v) => +v).filter((v) => v != 0);

  if (teams.length < 1 || teams.length > 4)
    return selfMessage("Invalid number of teams (min 1 max 4).");

  let numOfSlots = teams.reduce((v, a) => (a += v), 0);
  if (numOfSlots < 1 || numOfSlots > 8)
    return selfMessage("Invalid number of players (max 8).");

  g_GameSettings.playerCount.nbPlayers = numOfSlots;
  g_GameSettings.playerTeam.values = teams.flatMap((size, i) =>
    Array(size).fill(i)
  );
  game.updateSettings();
}

/*
HowTo create a JavaScript function in the 0ad mod autoCiv that changes the map filter? When you get
HowTo fix the error 'mapFilter is null' in the following JS-function inside file 'gamesetup~!extra_commands' inside the mod autoCiv?

Whey the following function inside 'gamesetup~!extra_commands' of autoCiv dont work and how to fix it?  function setMapFilterTo2() {     var mapFilter = Engine.GetGUIObjectByName("mapFilter");     mapFilter.selected = 2; }


Whey is it unpossible to develop a mod like autoCiv to set the mapFilter but easily possble to set resources?

The mapFilter is a more complex setting, as it requires more logic and data manipulation than simply setting resources. For example, when setting resources, you just need to assign a certain value to a certain tile. However, when setting the mapFilter, you have to create a logic that determines which tiles should be included in the filter. This requires more complex coding and data manipulation.

How to set the more complex mapFilter and which tiles should be included in the filter while developing a new verson of AutoCiv mod?
*/

function setMapFilterTo() {
  // var mapNameFilter = Engine.GetGUIObjectByName("mapNameFilter"); // null    - so dont work here
  // selfMessage(
  // 	`mapNameFilter = ${mapNameFilter}`
  // )

  // let selected = g_GameSettings.map.filter.seleced // dont work errors
  // selfMessage(
  // 	`mapNameFilter.selected = ${selected}`
  // )
  // let selected2 = g_SetupWindow.controls.map.filter
  // selfMessage(
  // 	`2 = ${selected2}`
  // )

  if (!g_GameSettings.map.filter) {
    // g_GameSettings.filter dont wor
    let info = "No selected filter";
    selfMessage(`${info}`);
  } else {
    selfMessage(`map.filter = ${g_GameSettings.map.filter}`);
  }

  // Map Filter
  // this.gameSettingsController.guiData.mapFilter.filter,
  // g_GameSettings.map.filter.filter = 1 // dont work
  let doItYourSelfStr = " Please select this manually. ";
  // doItYourSelfStr = ''
  selfMessage(`"Map Filter": often used "Default". ${doItYourSelfStr} `);

  // TODO: how to do this? 23-0522_1624-23

  // this.mapTypeFilter = Engine.GetGUIObjectByName("mapTypeFilter"); //  result is null

  let mapFilter = {
    tiles: ["grass", "dirt", "mountain", "water", "forest"],
  };

  // let mapFilter2 = Engine.GetGUIObjectByName(mapFilter); // result is null

  // let mapFilter = Engine.GetGUIObjectByName("mapFilter"); // result is null
  // if (mapFilter) mapFilter2.selected = 2;
}
