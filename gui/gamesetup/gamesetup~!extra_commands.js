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
	{
		let noSlashCommand = command.slice(1);
		const nc = g_NetworkCommands[command];
		const asc = g_autociv_SharedCommands[noSlashCommand]
		text += "\n" + sprintf(translate("%(command)s - %(description)s"), {
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
g_NetworkCommands['/start'] = () => { if (g_IsController) launchGame(); };
