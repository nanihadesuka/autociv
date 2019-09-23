let game = {
	'set':
	{
		'resources': (quantity) =>
		{
			if (!g_IsController)
				return;
			let val = parseInt(quantity);
			if (!Number.isInteger(val))
				return selfMessage('Invalid starting resources value (must be a number).');
			g_GameAttributes.settings.StartingResources = val;
			sendMessage(`Starting resources set to: ${val}`);
			updateGameAttributes();
		},
		'population': (quantity) =>
		{
			if (!g_IsController)
				return;
			let val = parseInt(quantity);
			if (!Number.isInteger(val) || val < 0)
				return selfMessage('Invalid population cap value (must be a number >= 0).');
			g_GameAttributes.settings.PopulationCap = val;
			sendMessage(`Population cap set to: ${val}`);
			updateGameAttributes();
		},
		'mapsize': (mapsize) =>
		{
			if (!g_IsController)
				return;
			let val = parseInt(mapsize);
			if (!Number.isInteger(val) || val < 1)
				return selfMessage('Invalid map size value (must be a number >= 1).');
			g_GameAttributes.settings.Size = val;
			sendMessage(`Map size set to: ${val}`);
			updateGameAttributes();
		},
		'player':
		{
			'civ': (playerName, playerCivCode) =>
			{
				let playerId, playerPos, civCodeIndex;
				if ((playerId = game.get.player.id(playerName)) == undefined)
					return;
				if ((playerPos = game.get.player.pos(playerId)) == -1)
					return;
				if ((civCodeIndex = g_PlayerCivList.code.indexOf(playerCivCode)) == -1)
					return;
				g_PlayerDropdowns.playerCiv.select(civCodeIndex, playerPos - 1);
				updateGameAttributes();
			},
			'observer': (playerName) =>
			{
				let playerId, playerPos;
				if ((playerId = game.get.player.id(playerName)) == undefined)
					return;
				if ((playerPos = game.get.player.pos(playerId)) == -1)
					return;
				Engine.AssignNetworkPlayer(playerPos, '');
			}
		}
	},
	'get':
	{
		'player':
		{
			// Returns undefined if no player with that name
			'id': playerName => Object.keys(g_PlayerAssignments).find(id => g_PlayerAssignments[id].name == playerName),
			// Returns -1 in case of observer, undefined if Id does not exist
			'pos': playerId => g_PlayerAssignments[playerId].player,
			'selfName': () => g_PlayerAssignments[Engine.GetPlayerGUID()].name,
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
			'name': () => Object.keys(g_PlayerAssignments).map(id => g_PlayerAssignments[id].name)
		}
	},
	'is':
	{
		'player':
		{
			'assigned': playerName =>
			{
				return game.get.player.id(playerName) === undefined ?
					false : this.pos(this.id(playerName)) >= 0;
			}
		}
	}
}

g_NetworkCommands['/help'] = () =>
{
	const g_ChatCommandColor = "200 200 255";
	let text = translate("Chat commands:");
	for (let command in g_NetworkCommands)
		// Translation: Chat command help format
		text += "\n" + sprintf(translate("%(command)s - %(description)s"), {
			"command": coloredText(command.slice(1), g_ChatCommandColor),
			"description": g_NetworkCommands[command].description || ""
		});

	selfMessage(text);
}

g_NetworkCommands['/resources'] = value => game.set.resources(value);
g_NetworkCommands['/population'] = value => game.set.population(value);
g_NetworkCommands['/mapsize'] = size => game.set.mapsize(size);

function botToggleAction(botName)
{
	let bottyMcBotFace = botManager.get(botName);
	bottyMcBotFace.toggle();
	selfMessage(`${bottyMcBotFace.name} ${bottyMcBotFace.active ? 'activated' : 'deactivated'}.`);
}

g_NetworkCommands['/autociv'] = () => { if (g_IsController) botToggleAction('autociv'); };
g_NetworkCommands['/nub'] = () => { if (g_IsController) botToggleAction('nub'); };
g_NetworkCommands['/noproblemo'] = () => { if (g_IsController) botToggleAction('noproblemo'); };

g_NetworkCommands['/ready'] = () => { if (!g_IsController) toggleReady(); toggleReady(); };
g_NetworkCommands['/start'] = () => { if (g_IsController) launchGame(); };

function openMapBrowser()
{
	autocivCL.Engine.PushGuiPage("page_mapbrowser.xml", {
		"map": {
			"type": g_GameAttributes.mapType,
			"filter": g_GameAttributes.mapFilter,
			"name": g_GameAttributes.map // includes the map path
		}
	}, mapBrowserCallback);
}

function mapBrowserCallback(data)
{
	if (!g_IsController ||
		!data ||
		!data.map ||
		!data.map.type ||
		!data.map.filter ||
		!data.map.type ||
		!data.map.name)
		return;

	if (g_Dropdowns.mapType.get() != data.map.type)
	{
		let typeIndex = g_Dropdowns.mapType.ids().indexOf(data.map.type);
		if (typeIndex == -1)
			return
		g_Dropdowns.mapType.select(typeIndex);
	}

	let filterIndex = g_Dropdowns.mapFilter.ids().indexOf(data.map.filter);
	if (filterIndex == -1)
		return;
	g_Dropdowns.mapFilter.select(filterIndex);

	let mapIndex = g_Dropdowns.mapSelection.ids().indexOf(data.map.path + data.map.name);
	if (mapIndex == -1)
		return;
	g_Dropdowns.mapSelection.select(mapIndex);

	updateGameAttributes();
}

g_MiscControls["glMapBrowser"] = {
	"tooltip": () =>
	{
		return sprintf(
			translate("%(hotkey_openMapBrowser)s : Open map browser."),
			{ "hotkey_openMapBrowser": colorizeHotkey("%(hotkey)s", "autociv.gamesetup.openMapBrowser") })
	},
	"onMouseLeftRelease": () => function ()
	{
		openMapBrowser();
	},
	"onMouseLeftPress": () => function ()
	{
		animateObject("glMapBrowser", {
			"color": "160 160 160",
		});
	},
	"onMouseEnter": () => function ()
	{
		animateObject("glMapBrowser", {
			"color": "120 120 120",
		});
	},
	"onMouseLeave": () => function ()
	{
		animateObject("glMapBrowser", {
			"color": "90 90 90"
		});
	},
	"hidden": () => false
};
