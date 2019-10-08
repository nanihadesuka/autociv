var g_autociv_validFormations = [];

addChatMessage = (function (originalFunction)
{
	return function (msg)
	{
		return botManager.react(msg) || originalFunction.apply(this, arguments);
	}

})(addChatMessage)

function autociv_InitBots()
{
	botManager.get("playerReminder").load(true);
	botManager.get("mute").load(true);
	botManager.get("vote").load(false);
	botManager.get("link").load(true);

	botManager.setMessageInterface("ingame");
	autociv_InitSharedCommands();
}

init = (function (originalFunction)
{
	return function ()
	{
		autociv_InitBots();
		originalFunction.apply(this, arguments);

		g_autociv_validFormations = Engine.ListDirectoryFiles("simulation/templates/special/formations", "*.xml", false).
			map(text =>
			{
				let match = text.match(/^.*\/(.+)\.xml$/);
				return match && match[1];
			}).filter(v => !!v);

		autociv_bugFix_openChat();
		autociv_bugFix_entity_unkown_reason();
	}
})(init)

onTick = (function (originalFunction)
{
	return function ()
	{
		g_autociv_SpecialHotkeyCalled = false;
		let result = originalFunction.apply(this, arguments);
		return result;
	}
})(onTick);


var g_autociv_stanza = new ConfigJSON("stanza", false);

sendLobbyPlayerlistUpdate = (function (originalFunction)
{
	return function ()
	{
		originalFunction.apply(this, arguments)

		if (!g_IsController)
			return;

		// Extract the relevant player data and minimize packet load
		let minPlayerData = [];
		for (let playerID in g_GameAttributes.settings.PlayerData)
		{
			if (+playerID == 0)
				continue;

			let pData = g_GameAttributes.settings.PlayerData[playerID];

			let minPData = { "Name": pData.Name, "Civ": pData.Civ };

			if (g_GameAttributes.settings.LockTeams)
				minPData.Team = pData.Team;

			if (pData.AI)
			{
				minPData.AI = pData.AI;
				minPData.AIDiff = pData.AIDiff;
				minPData.AIBehavior = pData.AIBehavior;
			}

			if (g_Players[playerID].offline)
				minPData.Offline = true;

			// Whether the player has won or was defeated
			let state = g_Players[playerID].state;
			if (state != "active")
				minPData.State = state;

			minPlayerData.push(minPData);
		}

		// Add observers
		let connectedPlayers = 0;
		for (let guid in g_PlayerAssignments)
		{
			let pData = g_GameAttributes.settings.PlayerData[g_PlayerAssignments[guid].player];

			if (pData)
				++connectedPlayers;
			else
				minPlayerData.push({
					"Name": g_PlayerAssignments[guid].name,
					"Team": "observer"
				});
		}

		g_autociv_stanza.setValue("session", {
			"connectedPlayers": connectedPlayers,
			"minPlayerData": playerDataToStringifiedTeamList(minPlayerData)
		});
	}
})(sendLobbyPlayerlistUpdate)
