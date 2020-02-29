let game = {
	'set':
	{
		'resources': (quantity) =>
		{
			if (!g_IsController)
				return;
			let val = +quantity;
			if (quantity === "" || val === NaN)
				return selfMessage('Invalid starting resources value (must be a number).');
			g_GameAttributes.settings.StartingResources = val;
			sendMessage(`Starting resources set to: ${val}`);
			updateGameAttributes();
		},
		'mapcircular': (circular = true) =>
		{
			if (!g_IsController)
				return;
			g_GameAttributes.settings.CircularMap = !!circular;
			sendMessage(`Map shape set to: ${!!circular ? "circular" : "squared"}`);
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
		"numberOfSlots": (num) =>
		{
			let d = g_GameAttributes.settings.PlayerData;
			g_GameAttributes.settings.PlayerData =
				num > d.length ?
					d.concat(clone(g_DefaultPlayerData.slice(d.length, num))) :
					d.slice(0, num);
			unassignInvalidPlayers(num);
			sanitizePlayerData(g_GameAttributes.settings.PlayerData);
		},
		'player':
		{
			'civ': (playerName, playerCivCode) =>
			{
				let playerPos = game.get.player.pos(playerName);
				if (playerPos === undefined || playerPos == -1)
					return;

				let civCodeIndex = g_PlayerCivList.code.indexOf(playerCivCode);
				if (civCodeIndex == -1)
					return;

				g_PlayerDropdowns.playerCiv.select(civCodeIndex, playerPos - 1);
				updateGameAttributes();
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

			if (g_GameAttributes.mapType == "scenario")
				return selfMessage("Can't set teams with map type scenario.");

			let teams = text.trim().toLowerCase();
			if ("ffa" == teams)
			{
				for (let i in g_GameAttributes.settings.PlayerData)
					g_GameAttributes.settings.PlayerData[i].Team = -1;
				updateGameAttributes();
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
					g_GameAttributes.settings.PlayerData[slot++].Team = team;

			updateGameAttributes();
		},
		"slotName": (slotNumber, name) =>
		{
			g_GameAttributes.settings.PlayerData[slotNumber - 1].Name = name;
			updateGameAttributes();
		}
	},
	'get':
	{
		'player':
		{
			// Returns undefined if no player with that name
			'id': playerName => Object.keys(g_PlayerAssignments).find(id => g_PlayerAssignments[id].name == playerName),
			// Returns -1 in case of observer  and undefined if player doesn't exist
			'pos': playerName =>
			{
				let playerId = game.get.player.id(playerName);
				if (playerId === undefined)
					return undefined;

				return g_PlayerAssignments[playerId].player
			},
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
		},
		"numberOfSlots":() => g_GameAttributes.settings.PlayerData.length
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

			return g_GameAttributes.settings.PlayerData.length == filledSlots;
		},
		"rated": () => g_GameAttributes.settings.RatingEnabled
	},
	"reset": {
		"civilizations": () =>
		{
			for (let i in g_GameAttributes.settings.PlayerData)
				g_GameAttributes.settings.PlayerData[i].Civ = "random";

			updateGameAttributes();
		},
		"teams": () =>
		{
			for (let i in g_GameAttributes.settings.PlayerData)
				g_GameAttributes.settings.PlayerData[i].Team = -1;

			updateGameAttributes();
		},
		"slotNames": () =>
		{
			for (let i = 0; i < 8; ++i)
				g_GameAttributes.settings.PlayerData[i].Name = `Player ${i + 1}`;
			updateGameAttributes();
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
g_NetworkCommands['/resources'] = value => game.set.resources(value);
g_NetworkCommands['/population'] = value => game.set.population(value);
g_NetworkCommands['/mapsize'] = value => game.set.mapsize(value);
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

	toggleReady();
	toggleReady();
};
g_NetworkCommands['/start'] = () =>
{
	if (!g_IsController)
		return;

	for (let playerName of game.get.players.name())
		if (game.is.player.assigned(playerName) &&
			game.get.player.status(playerName) == "blank")
			return selfMessage("Can't start game. Some players not ready.")

	launchGame();
};

g_NetworkCommands['/start'] = () =>
{
	if (!g_IsController)
		return;

	if (!game.is.allReady())
		return selfMessage("Can't start game. Some players not ready.")

	launchGame();
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

g_NetworkCommands['/team'] = text => game.set.teams(text);
