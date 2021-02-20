var g_autociv_stanza = new ConfigJSON("stanza", false);

var g_autociv_hotkeys = {
	"autociv.open.autociv_readme": function (ev)
	{
		autocivCL.Engine.PushGuiPage("page_autociv_readme.xml");
	},
	"autociv.gamesetup.focus.chatInput": function (ev)
	{
		Engine.GetGUIObjectByName("chatInput").blur();
		Engine.GetGUIObjectByName("chatInput").focus();
	}
};

function handleInputBeforeGui(ev)
{
	resizeBarManager.onEvent(ev);

	if ("hotkey" in ev && ev.hotkey in g_autociv_hotkeys && ev.type == "hotkeydown")
		return !!g_autociv_hotkeys[ev.hotkey](ev);

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

function autociv_patchModFilter()
{
	autociv_patchApplyN("addChatMessage", function (target, that, args)
	{
		let [msg] = args;
		return botManager.react(msg) || target.apply(that, args);
	})

	if (!global["getFilteredMods"])
		global["getFilteredMods"] = function () { return Engine.GetEngineInfo().mods };

	// FGod sendRegisterGameStanzaImmediate dependency
	autociv_patchApplyN("getFilteredMods", function (target, that, args)
	{
		let mod = ([name, version]) => !/^FGod.*/i.test(name);
		return target.apply(that, args).filter(mod);
	});

	autociv_patchApplyN("getFilteredMods", function (target, that, args)
	{
		let mod = ([name, version]) => !/^AutoCiv.*/i.test(name);
		return target.apply(that, args).filter(mod);
	});

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
			"mods": JSON.stringify(getFilteredMods()) // <----- THIS CHANGES
		};

		// Only send the stanza if the relevant settings actually changed
		if (g_LastGameStanza && Object.keys(stanza).every(prop => g_LastGameStanza[prop] == stanza[prop]))
			return;

		g_LastGameStanza = stanza;
		Engine.SendRegisterGame(stanza);
	};

	autociv_patchApplyN("savePersistMatchSettings", function (target, that, args)
	{
		let result = target.apply(that, args);
		if (g_IsController && g_LastGameStanza != undefined)
			g_autociv_stanza.setValue("gamesetup", g_LastGameStanza);
		return result;
	})

	autociv_patchApplyN("initGUIObjects", function (target, that, args)
	{
		let result = target.apply(that, args);
		if (g_IsController && g_LastGameStanza != undefined)
			g_autociv_stanza.setValue("gamesetup", g_LastGameStanza);
		return result;
	})
}

autociv_patchApplyN("init", function (target, that, args)
{
	autociv_InitBots();
	target.apply(that, args);
	autociv_patchModFilter();
	g_autociv_stanza.removeAllValues();
	g_autociv_stanza.setValue("gamesetup", g_LastGameStanza);
	g_autociv_countdown.init();

	// FGod command not working
	delete g_NetworkCommands['/showip'];
	// Fix hack for hack fix
	updateSettingsPanelPosition(-1);
})
