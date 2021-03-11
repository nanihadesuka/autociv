var autociv_focus = {
	"gameList": function ()
	{
		let GUIobject = Engine.GetGUIObjectByName("gamesBox");
		GUIobject.blur();
		GUIobject.focus();
	},
	"chatInput"()
	{
		let GUIobject = Engine.GetGUIObjectByName("chatInput");
		GUIobject.blur();
		GUIobject.focus();
	}
}

var g_autociv_hotkeys = {
	"autociv.lobby.focus.chatInput": autociv_focus.chatInput,
	"autociv.lobby.focus.gameList": autociv_focus.gameList,
	"autociv.lobby.gameList.selected.join": () => Engine.GetGUIObjectByName("joinButton").onPress(),
	"autociv.open.autociv_readme": ev => autocivCL.Engine.PushGuiPage("page_autociv_readme.xml"),
	"autociv.lobby.host": ev => g_LobbyHandler.lobbyPage.lobbyPage.buttons.hostButton.onPress()
};

function handleInputBeforeGui(ev)
{
	resizeBarManager.onEvent(ev);
	return false;
}

function autociv_InitBots()
{
	botManager.get("playerReminder").load(true);
	botManager.get("mute").load(true);
	botManager.get("vote").load(false);
	botManager.get("link").load(true);
	botManager.setMessageInterface("lobby");
	autociv_InitSharedCommands();
}

autociv_patchApplyN("init", function (target, that, args)
{
	// setTimeout doesn't have tick update in lobby -> make one
	Engine.GetGUIObjectByName("middlePanel").onTick = () =>
	{
		g_Time = Date.now();
		updateTimers()
	}

	autociv_InitBots();

	// SEND PATCH TO PHAB
	Engine.GetGUIObjectByName("chatText").buffer_zone = 2.01
	Engine.GetGUIObjectByName("chatText").size = Object.assign(Engine.GetGUIObjectByName("chatText").size, {
		left: 4, top: 4, bottom: -32
	})

	target.apply(that, args);

	// React to hotkeys
	for (let hotkey in g_autociv_hotkeys)
		Engine.SetGlobalHotkey(hotkey, "Press", g_autociv_hotkeys[hotkey]);

	// React to GUI objects resize bars
	{
		resizeBarManager("chatPanel", "top", undefined, [["gamesBox", "bottom"]])
		resizeBarManager("middlePanel", "left", undefined, [["leftPanel", "right"]]);
		resizeBarManager("middlePanel", "right", undefined, [["rightPanel", "left"]]);

		let gameInfo = Engine.GetGUIObjectByName("sgMapName").parent;
		let gameInfoUsers = gameInfo.children[gameInfo.children.length - 1];
		let gameInfoDescription = gameInfo.children[gameInfo.children.length - 2];
		resizeBarManager(gameInfoUsers, "top", undefined, [[gameInfoDescription, "bottom"]], () => !gameInfo.hidden);
	}

	// Disable/enable resize bars when these "pages" open/close
	g_LobbyHandler.leaderboardPage.registerOpenPageHandler(() => { resizeBarManager.ghostMode = true })
	g_LobbyHandler.leaderboardPage.registerClosePageHandler(() => { resizeBarManager.ghostMode = false })
	g_LobbyHandler.profilePage.registerClosePageHandler(() => { resizeBarManager.ghostMode = false })

	autociv_focus.chatInput();
});
