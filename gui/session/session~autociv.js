addChatMessage = (function (originalFunction)
{
	return function (msg)
	{
		if (botManager.react(msg))
			return true;

		originalFunction(msg);
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
	return function (...args)
	{
		autociv_InitBots();
		originalFunction(...args);
	}
})(init)

onTick = (function (originalFunction)
{
	return function (...args)
	{
		g_autociv_SpecialHotkeyCalled = false;
		return originalFunction(...args);
	}
})(onTick);


var g_autociv_stanza = new ConfigJSON("stanza", false);

sendLobbyPlayerlistUpdate = (function (originalFunction)
{
	return function ()
	{
		originalFunction();

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
