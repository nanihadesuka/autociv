var autociv_focus = {
	"gameList": function ()
	{
		let GUIobject = Engine.GetGUIObjectByName("gamesBox");
		GUIobject.blur();
		GUIobject.focus();
	},
	"chatInput" ()
	{
		let GUIobject = Engine.GetGUIObjectByName("chatInput");
		GUIobject.blur();
		GUIobject.focus();
	}
}

var g_autociv_hotkeys = {
	"autociv.lobby.focus.chatInput": autociv_focus.chatInput,
	"autociv.lobby.focus.gameList": autociv_focus.gameList,
	"autociv.lobby.gameList.selected.join": () => g_LobbyHandler.lobbyPage.lobbyPage.buttons.joinButton.onPress(),
	"autociv.open.autociv_readme": ev => Engine.PushGuiPage("page_autociv_readme.xml"),
	"autociv.lobby.host": ev => g_LobbyHandler.lobbyPage.lobbyPage.buttons.hostButton.onPress(),
	"summary": ev => autociv_showLastGameSummary(),
	/**
	 * Can't unfocus chat input without mouse, use cancel hotkey to unfocus from it
	 * (seems they still get triggered if the hotkey was assigned defined in a xml
	 * object but won't if they were from Engine.SetGlobalHotkey call)
	 */
	"cancel": ev =>
	{
		const obj = Engine.GetGUIObjectByName("gameStateNotifications")
		obj?.blur()
		obj?.focus()
	}
};


function autociv_showLastGameSummary ()
{
	const replays = Engine.GetReplays(false)
	if (!replays.length)
	{
		messageBox(500, 200, translate("No replays data available."), translate("Error"))
		return
	}

	const lastReplay = replays.reduce((a, b) => a.attribs.timestamp > b.attribs.timestamp ? a : b)
	if (!lastReplay)
	{
		messageBox(500, 200, translate("No last replay data available."), translate("Error"))
		return
	}

	const simData = Engine.GetReplayMetadata(lastReplay.directory)
	if (!simData)
	{
		messageBox(500, 200, translate("No summary data available."), translate("Error"))
		return
	}

	Engine.PushGuiPage("page_summary.xml", {
		"sim": simData,
		"gui": {
			"replayDirectory": lastReplay.directory,
			"isInLobby": true,
			"ingame": false,
			"dialog": true
		}
	})
}
function handleInputBeforeGui (ev)
{
	g_resizeBarManager.onEvent(ev);
	return false;
}

function autociv_InitBots ()
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
		Engine.SetGlobalHotkey(hotkey, "Press", g_autociv_hotkeys[ hotkey ]);

	// React to GUI objects resize bars
	{
		g_resizeBarManager.add("chatPanel", "top", undefined, [ [ "gamesBox", "bottom" ] ])
		g_resizeBarManager.add("middlePanel", "left", undefined, [ [ "leftPanel", "right" ] ]);
		g_resizeBarManager.add("middlePanel", "right", undefined, [ [ "rightPanel", "left" ] ]);

		let gameInfo = Engine.GetGUIObjectByName("sgMapName")?.parent;
		if (gameInfo)
		{
			let gameInfoUsers = gameInfo.children[ gameInfo.children.length - 1 ];
			let gameInfoDescription = gameInfo.children[ gameInfo.children.length - 2 ];
			g_resizeBarManager.add(gameInfoUsers, "top", undefined, [ [ gameInfoDescription, "bottom" ] ], () => !gameInfo.hidden);
		}
	}

	// Disable/enable resize bars when these "pages" open/close
	g_LobbyHandler.leaderboardPage.registerOpenPageHandler(() => { g_resizeBarManager.ghostMode = true })
	g_LobbyHandler.leaderboardPage.registerClosePageHandler(() => { g_resizeBarManager.ghostMode = false })
	g_LobbyHandler.profilePage.registerClosePageHandler(() => { g_resizeBarManager.ghostMode = false })

	autociv_focus.chatInput();
	g_LobbyHandler.lobbyPage.autocivLobbyStats = new AutocivLobbyStats()

	initChatFilterInput()
});

// Start the lobby chat input with s? to filter all the chat messages, remove s? to disable
function initChatFilterInput()
{
	let active = false
	let searchText = ""

	const chatInput = Engine.GetGUIObjectByName("chatInput")
	const chatText = Engine.GetGUIObjectByName("chatText")
	let originalList = []

	autociv_patchApplyN(ChatMessagesPanel.prototype, "addText", function (target, that, args)
	{
		if (active)
		{
			chatText.list = originalList
		}
		const res = target.apply(that, args)
		if (active)
		{
			originalList = chatText.list
			chatText.list = originalList.filter(t => t.includes(searchText))
		}
		return res
	})

	// This might cause some other functionality to stop working
	chatInput.onTextEdit = () =>
	{
		const text = chatInput.caption
		const inFilterMode = text.startsWith("s?")

		if(inFilterMode && !active)
		{
			originalList = chatText.list
		}

		if (inFilterMode)
		{
			active = true
			searchText = text.slice(2).trimStart()
			chatText.list = originalList.filter(t => t.includes(searchText))
		}
		else
		{
			if (!active) return
			active = false
			chatText.list = originalList
		}
	}
}

class AutocivLobbyStats
{
	lobbyPageTitle = Engine.GetGUIObjectByName("lobbyPageTitle")
	nOfPlayers = 0
	nOfGames = 0
	pageTitle = this.lobbyPageTitle.caption

	constructor()
	{
		// I suppose the page handlers have been loaded before this one, so should work out
		this.nOfGames = g_LobbyHandler.lobbyPage.lobbyPage.panels.gameList.gameList.length
		this.nOfPlayers = g_LobbyHandler.lobbyPage.lobbyPage.panels.playerList.nickList.length
		this.update()

		g_LobbyHandler.xmppMessages.registerXmppMessageHandler("game", "gamelist", () =>
		{
			// I suppose the page handlers have been loaded before this one, so should work out
			this.nOfGames = g_LobbyHandler.lobbyPage.lobbyPage.panels.gameList.gameList.length
			this.update()
		});

		g_LobbyHandler.xmppMessages.registerPlayerListUpdateHandler(() =>
		{
			// I suppose the page handlers have been loaded before this one, so should work out
			this.nOfPlayers = g_LobbyHandler.lobbyPage.lobbyPage.panels.playerList.nickList.length
			this.update()
		})
	}

	update ()
	{
		this.lobbyPageTitle.caption = `${this.pageTitle}  P:${this.nOfPlayers}  G:${this.nOfGames}`
	}
}
