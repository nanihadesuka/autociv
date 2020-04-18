var g_autociv_addChatMessage = {
	"addChatMessageNoRedraw": function (msg)
	{
		if (msg.from)
		{
			if (Engine.LobbyGetPlayerRole(msg.from) == "moderator")
				msg.from = g_ModeratorPrefix + msg.from;

			// Highlight local user's nick
			if (g_Username != msg.from)
			{
				msg.text = msg.text.replace(g_Username, colorPlayerName(g_Username));

				if (!msg.historic && msg.text.toLowerCase().indexOf(g_Username.toLowerCase()) != -1)
					soundNotification("nick");
			}
		}

		let formatted = ircFormat(msg);
		if (!formatted)
			return;

		g_ChatMessages.push(formatted);
		// Engine.GetGUIObjectByName("chatText").caption = g_ChatMessages.join("\n");
	},
	"notifications": {
		"max": +Engine.ConfigDB_GetValue("user", "autociv.lobby.chat.notifications.max"),
		"count": 0,
		"is": text => !(/<.*>/.test(text))
	},
	"comments": {
		"max": +Engine.ConfigDB_GetValue("user", "autociv.lobby.chat.comments.max"),
		"count": 0,
		"is": text => /<.*>/.test(text)
	},
	"currentTick" : 0,
	"updateAfterTick": 3,
	"updateAfterTickRenderOnce": function ()
	{
		this.currentTick++;
		if (this.currentTick === this.updateAfterTick + 1)
			Engine.GetGUIObjectByName("chatText").caption = g_ChatMessages.join("\n");
	},
	"rate": function (target, that, args)
	{
		let [msg] = args;
		let oldLength = g_ChatMessages.length;
		let noRedraw = this.currentTick <= this.updateAfterTick;
		if (noRedraw) this.addChatMessageNoRedraw(msg);
		else target.apply(that, args);

		if (oldLength == g_ChatMessages.length || !g_ChatMessages.length)
			return;

		let lastText = g_ChatMessages[g_ChatMessages.length - 1];
		let type = this.comments.is(lastText) ?
			this.comments :
			this.notifications;

		if (++type.count <= type.max)
			return;

		g_ChatMessages = g_ChatMessages.filter(message =>
		{
			if (type.count <= type.max || !type.is(message))
				return true;

			--type.count;
			return false;
		});
	}
};

g_ChatCommands["pingall"] = {
	"description": translate("Ping all 'Online' and 'Observer' players."),
	"handler": function (args)
	{
		let selfNick = Engine.LobbyGetNick();
		let ignore = new Set([selfNick, "Ratings", "WFGbot", "Triumvir", "user1", "Dunedan"]);
		let candidatesToAnnoy = new Set();

		for (let host of g_GameList)
		{
			let players = stringifiedTeamListToPlayerData(host.players);
			let selfInHost = players.some(player => splitRatingFromNick(player.Name).nick == selfNick);
			for (let player of players)
				if (selfInHost)
					ignore.add(splitRatingFromNick(player.Name).nick);
				else if (player.Team == "observer")
					candidatesToAnnoy.add(splitRatingFromNick(player.Name).nick);
		}

		for (let player of g_PlayerList)
			if (player.presence == "available")
				candidatesToAnnoy.add(player.name);

		for (let v of ignore)
			candidatesToAnnoy.delete(v);

		let annoyList = Array.from(candidatesToAnnoy).join(", ");
		Engine.LobbySendMessage(annoyList);
		if (args[0].trim())
			Engine.LobbySendMessage(args.join(" "))

		return false;
	}
};

g_ChatCommands["playing"] = {
	"description": translate("Set your state to 'Playing'."),
	"handler": function ()
	{
		Engine.LobbySetPlayerPresence("playing");
		return false;
	}
};

g_NetMessageTypes["chat"]["subject"] = msg =>
{
	// Don't add subject kilometric message
	updateSubject(msg.subject);
	return false;
};

var autociv_focus = {
	"gameList": function ()
	{
		let GUIobject = Engine.GetGUIObjectByName(g_autociv_isFGod ? "gameList" : "gamesBox");
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
	"autociv.lobby.openMapBrowser": autociv_openMapBrowser,
	"autociv.lobby.focus.chatInput": autociv_focus.chatInput,
	"autociv.lobby.focus.gameList": autociv_focus.gameList,
	"autociv.lobby.gameList.selected.join": joinButton,
	"autociv.open.autociv_settings": ev => autocivCL.Engine.PushGuiPage("page_autociv_settings.xml")
};

function handleInputBeforeGui(ev)
{
	resizeBar.onEvent(ev);

	if ("hotkey" in ev && ev.hotkey in g_autociv_hotkeys && ev.type == "hotkeydown")
		return !!g_autociv_hotkeys[ev.hotkey](ev);

	return false;
}

function autociv_mapBrowserCallback() { }

function autociv_openMapBrowser()
{
	autocivCL.Engine.PushGuiPage("page_mapbrowser.xml", {}, autociv_mapBrowserCallback);
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

function autociv_reconnect()
{
	Engine.ConnectXmppClient();
	autociv_reregister();
}

function autociv_reregister()
{
	let autociv_stanza = new ConfigJSON("stanza", false);

	if (!autociv_stanza.hasValue("gamesetup"))
		return;
	let gamesetup = autociv_stanza.getValue("gamesetup");

	let registered = () => g_GameList.findIndex(entry => entry.hostUsername == gamesetup.hostUsername) != -1;

	setTimeout(() =>
	{
		if (!Engine.HasNetServer() ||
			!Engine.IsXmppClientConnected())
			return;

		warn("Autociv: Reregistering game to lobby")
		Engine.SendRegisterGame(gamesetup);

		setTimeout(() =>
		{
			if (!Engine.HasNetServer() ||
				!Engine.IsXmppClientConnected() ||
				!autociv_stanza.hasValue("session"))
				return;

			if (!registered())
				return;

			warn("Autociv: Sending last game changes")
			let session = autociv_stanza.getValue("session");
			Engine.SendChangeStateGame(session.connectedPlayers, session.minPlayerData);

		}, 2500)

	}, 2500)

}

autociv_patchApplyN("addChatMessage", function (target, that, args)
{
	let [msg] = args;
	return botManager.react(msg) || g_autociv_addChatMessage.rate(target, that, args);
})

autociv_patchApplyN("onTick", function (target, that, args)
{
	g_autociv_addChatMessage.updateAfterTickRenderOnce();
	return target.apply(that, args)
})

// Hack. This one should have his own pushGuiPage but it does not.
autociv_patchApplyN("setLeaderboardVisibility", function (target, that, args)
{
	let [open] = args;
	resizeBar.ghostMode = open;
	return target.apply(that, args)
})

// Hack. This one should have his own pushGuiPage but it does not.
autociv_patchApplyN("setUserProfileVisibility", function (target, that, args)
{
	let [open] = args;
	resizeBar.ghostMode = open;
	return target.apply(that, args);
});

autociv_patchApplyN("reconnectMessageBox", function (target, that, args)
{
	messageBox(
		400, 200,
		translate("You have been disconnected from the lobby. Do you want to reconnect?"),
		translate("Confirmation"),
		[translate("No"), translate("Yes")],
		[null, autociv_reconnect]);
})

autociv_patchApplyN("init", function (target, that, args)
{
	autociv_InitBots();
	target.apply(that, args);

	let hookList = [
		["profilePanel", "right"],
		["leftButtonPanel", "right"],
		[g_autociv_isFGod ? "playerList" : "playersBox", "right"]
	];
	if (g_autociv_isFGod)
		hookList.push(["presenceDropdown", "right"], ["playerGamesNumber", "right"])

	resizeBar("chatPanel", "top", undefined, [[g_autociv_isFGod ? "gameList" : "gamesBox", "bottom"]])
	resizeBar("middlePanel", "left", undefined, hookList);
	resizeBar("rightPanel", "left", undefined, [["middlePanel", "right"]]);

	let gameInfo = Engine.GetGUIObjectByName("gameInfo");
	let gameInfoUsers = gameInfo.children[gameInfo.children.length - 1];
	let gameInfoDescription = gameInfo.children[gameInfo.children.length - 2];
	resizeBar(gameInfoUsers, "top", undefined, [[gameInfoDescription, "bottom"]], () => !gameInfo.hidden);

	autociv_focus.chatInput();
});
