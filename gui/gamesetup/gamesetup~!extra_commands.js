
var game = {
	// stuff that needs to be updated after the gui updates it (as it removes it before it)
	// undefined will mean it doesnt exist
	attributes: {},
	addAttribute(obj)
	{
		for (let key in obj)
		{
			if (typeof obj[key] != "object")
			{
				g_GameSettings[key] = obj[key]
				this.attributes[key] = obj[key]
			}
			else for (let subkey in obj[key])
			{
				g_GameSettings[key][subkey] = obj[key][subkey]
				if (!(key in this.attributes))
					this.attributes[key] = {}
				this.attributes[key][subkey] = obj[key][subkey]

			}
		}
	},
	updateSettings()
	{
		g_SetupWindow.controls.gameSettingsControl.updateGameAttributes()
		g_SetupWindow.controls.gameSettingsControl.setNetworkGameAttributes()
	},
	get 'controls'() { return g_SetupWindow.pages.GameSetupPage.gameSettingControlManager.gameSettingControls },
	get 'panels'() { return g_SetupWindow.pages.GameSetupPage.panels },
	get 'panelsButtons'() { return g_SetupWindow.pages.GameSetupPage.panelButtons },
	'set':
	{
		'resources': (quantity) =>
		{
			if (!g_IsController)
				return;
			let val = +quantity;
			if (quantity === "" || val === NaN)
				return selfMessage('Invalid starting resources value (must be a number).');

			g_GameSettings.settings.StartingResources = val;
			game.updateSettings()
			sendMessage(`Starting resources set to: ${val}`);
		},
		'mapcircular': (circular = true) =>
		{
			if (!g_IsController)
				return;

			game.addAttribute({
				settings: {
					CircularMap: !!circular
				}
			})
			game.updateSettings()
			sendMessage(`Map shape set to: ${!!circular ? "circular" : "squared"}`);
		},
		'population': (quantity) =>
		{
			if (!g_IsController)
				return;
			let val = parseInt(quantity);
			if (!Number.isInteger(val) || val < 0)
				return selfMessage('Invalid population cap value (must be a number >= 0).');

			g_GameSettings.settings.PopulationCap = val;
			game.updateSettings()
			sendMessage(`Population cap set to: ${val}`);

		},
		'mapsize': (mapsize) =>
		{
			if (!g_IsController)
				return;
			if (g_GameSettings.mapType != "random")
				return selfMessage('Size can only be set for random maps');
			let val = parseInt(mapsize);
			if (!Number.isInteger(val) || val < 1)
				return selfMessage('Invalid map size value (must be a number >= 1).');

			g_GameSettings.settings.Size = val;
			game.updateSettings()
			sendMessage(`Map size set to: ${val}`);
		},
		"numberOfSlots": (num) =>
		{
			const playerCount = game.controls.PlayerCount
			let itemIdx = playerCount.values.indexOf(num)
			playerCount.onSelectionChange(itemIdx)
		},
		'player':
		{
			'civ': (playerName, playerCivCode) =>
			{
				let playerPos = game.get.player.pos(playerName);
				if (playerPos === undefined || playerPos == -1)
					return;

				let civCodeIndex = ["random", ...Object.keys(g_CivData)].indexOf(playerCivCode);
				if (civCodeIndex == -1)
					return;

				g_SetupWindow.
					pages.
					GameSetupPage.
					gameSettingControlManager.
					playerSettingControlManagers[playerPos - 1].
					playerSettingControls.
					PlayerCiv.
					onSelectionChange(civCodeIndex)
			},
			'observer': (playerName) =>
			{
				let playerPos = game.get.player.pos(playerName);
				if (playerPos === undefined || playerPos == -1)
					return;

				Engine.AssignNetworkPlayer(playerPos, '');
			}
		},
		/**
		 * @param {string} text E.g : "1v1v3" "ffa" "4v4" "2v2v2v2"
		 */
		"teams": (text) =>
		{
			if (!g_IsController)
				return;

			if (g_GameSettings.mapType == "scenario")
				return selfMessage("Can't set teams with map type scenario.");

			let teams = text.trim().toLowerCase();
			if ("ffa" == teams)
			{
				for (let i in g_GameSettings.settings.PlayerData)
					g_GameSettings.settings.PlayerData[i].Team = -1;
				game.updateSettings()
				return;
			}

			teams = text.match(/(\d+)/g);
			if (teams == null)
				return selfMessage("Invalid input.");

			// Transform string to number discarding 0 size teams
			teams = teams.map(v => +v).filter(v => v != 0);

			if (teams.length < 1 || teams.length > 4)
				return selfMessage("Invalid number of teams (min 1 max 4).");

			let numOfSlots = teams.reduce((v, a) => a += v, 0);
			if (numOfSlots < 1 || numOfSlots > 8)
				return selfMessage("Invalid number of players (max 8).");

			game.set.numberOfSlots(numOfSlots)

			for (let team = 0, slot = 0; team < teams.length; ++team)
				for (let i = 0; i < teams[team]; ++i)
					g_GameSettings.settings.PlayerData[slot++].Team = team;

			game.updateSettings()
		},
		"slotName": (slotNumber, name) =>
		{
			g_GameSettings.settings.PlayerData[slotNumber - 1].Name = name;
			game.updateSettings()
		}
	},
	'get':
	{
		'player':
		{
			// Returns undefined if no player with that name (no rating included)
			'id': playerName =>
			{
				return Object.keys(g_PlayerAssignments).find(id =>
				{
					let nick1 = splitRatingFromNick(g_PlayerAssignments[id].name).nick;
					let nick2 = splitRatingFromNick(playerName).nick;
					return nick1 == nick2;
				});
			},
			// Returns -1 in case of observer  and undefined if player doesn't exist
			'pos': playerName =>
			{
				let playerId = game.get.player.id(playerName);
				return g_PlayerAssignments[playerId]?.player
			},
			'selfName': () => splitRatingFromNick(g_PlayerAssignments[Engine.GetPlayerGUID()].name).nick,
			"status": function (playerName)
			{
				switch (g_PlayerAssignments[this.id(playerName)].status)
				{
					case 1: return "ready";
					case 2: return "locked";
					default: return "blank";
				}
			}
		},
		'players':
		{
			'name': () => Object.keys(g_PlayerAssignments).map(id => splitRatingFromNick(g_PlayerAssignments[id].name).nick)
		},
		"numberOfSlots": () => g_GameSettings.settings.PlayerData.length
	},
	'is':
	{
		'player':
		{
			'assigned': playerName => game.get.player.pos(playerName) >= 0
		},
		"allReady": function ()
		{
			for (let playerName of game.get.players.name())
				if (game.is.player.assigned(playerName) &&
					game.get.player.status(playerName) == "blank")
					return false;
			return true;
		},
		"full": function ()
		{
			let filledSlots = 0;
			for (let guid in g_PlayerAssignments)
				if (g_PlayerAssignments[guid].player >= 0)
					filledSlots += 1

			return g_GameSettings.settings.PlayerData.length == filledSlots;
		},
		"rated": () => g_GameSettings.settings.RatingEnabled
	},
	"reset": {
		"civilizations": () =>
		{
			game.panels.resetCivsButton.onPress()
		},
		"teams": () =>
		{
			game.panels.resetTeamsButton.onPress()
		},
		"slotNames": () =>
		{
			for (let i = 0; i < 8; ++i)
				g_GameSettings.settings.PlayerData[i].Name = translate(`Player ${i + 1}`);

			game.updateSettings()
		}
	}
};

g_NetworkCommands['/help'] = () =>
{
	const g_ChatCommandColor = "200 200 255";
	let text = translate("Chat commands:");
	for (let command in g_NetworkCommands)
	{
		let noSlashCommand = command.slice(1);
		const nc = g_NetworkCommands[command];
		const asc = g_autociv_SharedCommands[noSlashCommand]
		text += "\n";
		text += sprintf(translate("%(command)s - %(description)s"), {
			"command": "/" + coloredText(noSlashCommand, g_ChatCommandColor),
			"description": nc.description || asc && asc.description || ""
		});
	}
	selfMessage(text);
}
g_NetworkCommands['/resources'] = quantity => game.set.resources(quantity);
g_NetworkCommands['/resourcesUnlimited'] = () => game.set.resources(Infinity);
g_NetworkCommands['/population'] = population => game.set.population(population);
g_NetworkCommands['/mapsize'] = size => game.set.mapsize(size);
g_NetworkCommands['/mapcircular'] = () => game.set.mapcircular(true);
g_NetworkCommands['/mapsquare'] = () => game.set.mapcircular(false);
g_NetworkCommands['/resetcivs'] = () => game.reset.civilizations();
g_NetworkCommands['/autociv'] = () =>
{
	if (!g_IsController)
		return;
	let bot = botManager.get("autociv");
	bot.toggle();
	selfMessage(`${bot.name} ${bot.active ? 'activated' : 'deactivated'}.`);
};
g_NetworkCommands['/ready'] = () =>
{
	if (g_IsController)
		return;
	game.panelsButtons.readyButton.onPress()
};

g_NetworkCommands['/start'] = () =>
{
	if (!g_IsController)
		return;

	if (!game.is.allReady())
		return selfMessage("Can't start game. Some players not ready.")

	game.panelsButtons.startGameButton.onPress()
};

g_NetworkCommands['/countdown'] = input =>
{
	if (!g_IsController)
		return;

	let value = parseInt(input, 10);
	if (isNaN(value))
	{
		g_autociv_countdown.toggle()
		return;
	}

	value = Math.max(0, value);
	g_autociv_countdown.toggle(true, value)
};

g_NetworkCommands['/gameName'] = text =>
{
	if (!g_IsController || !Engine.HasNetServer())
		return;
	if (!g_SetupWindow.lobbyGameRegistrationController)
		return
	text = `${text}`
	g_SetupWindow.lobbyGameRegistrationController.serverName = text
	selfMessage(`Game name changed to: ${g_ServerName}`)
	g_SetupWindow.lobbyGameRegistrationController.sendDelayed()
}

g_NetworkCommands['/team'] = text => game.set.teams(text);

g_NetworkCommands['/randomCivs'] = function (excludedCivs)
{
	if (!g_IsController)
		return;

	const excludeCivList = excludedCivs.trim().toLowerCase().split(/\s+/)
	let civList = new Map(Object.values(g_CivData).
		map(data => [data.Name.toLowerCase(), data.Code])
		.filter(e => e[1] != "random"))

	excludeCivList.forEach(civ => civList.delete(civ))

	civList = Array.from(civList)

	const getRandIndex = () => Math.floor(Math.random() * civList.length)

	for (let slot = 1; slot <= game.get.numberOfSlots(); ++slot)
	{
		const playerCivCode = civList[getRandIndex()][1]
		let civCodeIndex = Object.keys(g_CivData).indexOf(playerCivCode);
		if (civCodeIndex == -1)
			return;

		g_SetupWindow.
			pages.
			GameSetupPage.
			gameSettingControlManager.
			playerSettingControlManagers[slot - 1].
			playerSettingControls.
			PlayerCiv.
			onSelectionChange(civCodeIndex + 1)
	}
}
