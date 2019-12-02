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
		 * @param {string} text E.g : "1v1v3"
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
		}
	},
	'is':
	{
		'player':
		{
			'assigned': playerName => game.get.player.pos(playerName) >= 0
		}
	}
}

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
g_NetworkCommands['/mapsize'] = size => game.set.mapsize(size);
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


g_NetworkCommands['/team'] = text => game.set.teams(text);
