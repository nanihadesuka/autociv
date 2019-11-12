var g_autociv_validFormations = [];
var g_autociv_stanza = new ConfigJSON("stanza", false);

function autociv_initBots()
{
	botManager.get("playerReminder").load(true);
	botManager.get("mute").load(true);
	botManager.get("vote").load(false);
	botManager.get("link").load(true);
	botManager.setMessageInterface("ingame");
	autociv_InitSharedCommands();
}

function autociv_addVersionLabel()
{
	let label = Engine.GetGUIObjectByName("buildTimeLabel");
	if (!(label && label.caption))
		return;
	let mod = ([name, version]) => /^AutoCiv.*/i.test(name);
	let modInfo = Engine.GetEngineInfo().mods.find(mod);
	let version = modInfo && modInfo[1] && modInfo[1].split(".").slice(1).join(".") || "";
	label.caption = `${label.caption} [color="255 255 255 127"]${version}[/color]`;
}

function autociv_getValidFormations()
{
	let folder = "simulation/templates/special/formations/";
	return Engine.ListDirectoryFiles(folder, "*.xml", false).
		map(text => (text.match(/^.*\/(.+)\.xml$/) || [])[1]).filter(v => !!v);
}

function autociv_saveStanzaSession()
{
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

function autociv_patchSession()
{
	autociv_patchApplyN("addChatMessage", function (target, that, args)
	{
		return botManager.react(args[0]) || target.apply(that, args);
	})

	if (g_autociv_is24)
		return;

	autociv_patchApplyN("sendLobbyPlayerlistUpdate", function (target, that, args)
	{
		autociv_saveStanzaSession();
		return target.apply(that, args);
	})
}
autociv_patchApplyN("init", function (target, that, args)
{
	let result = target.apply(that, args);
	autociv_initBots();
	autociv_patchSession();
	autociv_setFormation.validFormations = autociv_getValidFormations();
	autociv_bugFix_openChat();
	autociv_bugFix_entity_unkown_reason();
	autociv_addVersionLabel();

	autociv_SetCorpsesMax(Engine.ConfigDB_GetValue("user", "autociv.session.graphics.corpses.max"));
	return result;
})
