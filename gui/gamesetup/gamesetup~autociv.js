addChatMessage = (function (originalFunction)
{
	return function (msg)
	{
		if (botManager.react(msg))
			return true;

		originalFunction(msg);
	}
})(addChatMessage);

// Create the function that fgod uses if fgod not enabled
if ("getFilteredMods" in global)
	var getFilteredMods = function ()
	{
		const modName = "fgod"; // mod to ignore
		return Engine.GetEngineInfo().mods.filter(mod =>
			!mod[0].toLowerCase().startsWith(modName.toLowerCase()));
	};

getFilteredMods = (function (originalFunction)
{
	return function ()
	{
		const modName = "autociv"; // mod to ignore
		return originalFunction().filter(mod =>
			!mod[0].toLowerCase().startsWith(modName.toLowerCase()));
	}
})(getFilteredMods);


// ["ja-lang", "zh-lang", "zh_TW-lang"].forEach(modName =>
// {
// 	getFilteredMods = (function (originalFunction)
// 	{
// 		return function ()
// 		{
// 			return originalFunction().filter(mod =>
// 				!mod[0].toLowerCase().startsWith(modName.toLowerCase()));
// 		}
// 	})(getFilteredMods);
// });

sendRegisterGameStanzaImmediate = function ()
{
	if (!g_IsController || !Engine.HasXmppClient())
		return;

	if (g_GameStanzaTimer !== undefined)
	{
		clearTimeout(g_GameStanzaTimer);
		g_GameStanzaTimer = undefined;
	}

	let clients = formatClientsForStanza();
	let stanza = {
		"name": g_ServerName,
		"port": g_ServerPort,
		"hostUsername": Engine.LobbyGetNick(),
		"mapName": g_GameAttributes.map,
		"niceMapName": getMapDisplayName(g_GameAttributes.map),
		"mapSize": g_GameAttributes.mapType == "random" ? g_GameAttributes.settings.Size : "Default",
		"mapType": g_GameAttributes.mapType,
		"victoryConditions": g_GameAttributes.settings.VictoryConditions.join(","),
		"nbp": clients.connectedPlayers,
		"maxnbp": g_GameAttributes.settings.PlayerData.length,
		"players": clients.list,
		"stunIP": g_StunEndpoint ? g_StunEndpoint.ip : "",
		"stunPort": g_StunEndpoint ? g_StunEndpoint.port : "",
		"mods": JSON.stringify(getFilteredMods())
	};

	// Only send the stanza if the relevant settings actually changed
	if (g_LastGameStanza && Object.keys(stanza).every(prop => g_LastGameStanza[prop] == stanza[prop]))
		return;

	g_LastGameStanza = stanza;
	Engine.SendRegisterGame(stanza);
};

var g_autociv_stanza = new ConfigJSON("stanza", false);
g_autociv_stanza.removeAllValues();

sendRegisterGameStanzaImmediate = (function (originalFunction)
{
	return function ()
	{
		originalFunction();

		if (!g_IsController)
			return;

		let clients = formatClientsForStanza();
		g_autociv_stanza.setValue("gamesetup", {
			"name": g_ServerName,
			"port": g_ServerPort,
			"hostUsername": Engine.LobbyGetNick(),
			"mapName": g_GameAttributes.map,
			"niceMapName": getMapDisplayName(g_GameAttributes.map),
			"mapSize": g_GameAttributes.mapType == "random" ? g_GameAttributes.settings.Size : "Default",
			"mapType": g_GameAttributes.mapType,
			"victoryConditions": g_GameAttributes.settings.VictoryConditions.join(","),
			"nbp": clients.connectedPlayers,
			"maxnbp": g_GameAttributes.settings.PlayerData.length,
			"players": clients.list,
			"stunIP": g_StunEndpoint ? g_StunEndpoint.ip : "",
			"stunPort": g_StunEndpoint ? g_StunEndpoint.port : "",
			"mods": JSON.stringify(getFilteredMods())
		});
	}
})(sendRegisterGameStanzaImmediate);

var g_AutocivHotkeyActions = {
	"autociv.gamesetup.openMapBrowser": function (ev)
	{
		openMapBrowser();
	},
	"autociv.open.autociv_settings": function (ev)
	{
		autocivCL.Engine.PushGuiPage("page_autociv_settings.xml");
	}
};

function handleInputBeforeGui(ev)
{
	resizeBar.onEvent(ev);

	if (ev.hotkey && g_AutocivHotkeyActions[ev.hotkey])
		g_AutocivHotkeyActions[ev.hotkey](ev);

	return false;
}

function autociv_InitBots()
{
	botManager.get("playerReminder").load(true);
	botManager.get("mute").load(true);
	botManager.get("vote").load(false);
	botManager.get("autociv").load(true);
	botManager.get("link").load(true);
	botManager.setMessageInterface("gamesetup");
	autociv_InitSharedCommands()
}

selectPanel = (function (originalFunction)
{
	return function (arg)
	{
		originalFunction(arg);
		if (arg === undefined)
			Engine.GetGUIObjectByName("chatInput").focus();
	}
})(selectPanel);

init = (function (originalFunction)
{
	return function (args)
	{
		autociv_InitBots();
		originalFunction(args);
		// Fix hack for hack fix
		updateSettingsPanelPosition(-1);

		// FGod command not working
		if ('/showip' in g_NetworkCommands)
			delete g_NetworkCommands['/showip'];
	}
})(init);

onTick = (function (originalFunction)
{
	return function ()
	{
		originalFunction();
	}
})(onTick);
