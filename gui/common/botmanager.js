function BotManager()
{
	this.list = new Map();
	this.messageInterface = "ingame";
}

BotManager.prototype.addBot = function (name, object)
{
	if (!("toggle" in object))
		object.toggle = function () { this.active = !this.active; };

	if (!("react" in object))
		object.react = function () { };

	if (!("load" in object))
		object.load = function () { };

	object.load = ((originalFunction) =>
	{
		return function (active)
		{
			this.loaded = true;
			this.active = active;
			return originalFunction.apply(this, arguments);
		}
	}
	)(object.load);

	this.list.set(name, object);
}

BotManager.prototype.get = function (name)
{
	return this.list.get(name);
}

BotManager.prototype.sendMessage = function (text)
{
	warn("Can't send sendMessage");
}

BotManager.prototype.selfMessage = function (text)
{
	warn("Can't send selfMessage");
}

BotManager.prototype.react = function (msg)
{
	let data = this.pipe(msg);
	if (!data)
		return;

	for (let [name, bot] of this.list)
		if (bot.loaded && bot.active && bot.react(data))
			return true;
}

BotManager.prototype.pipe = function (msg)
{
	if (!msg)
		return;
	return this.pipeWith[this.messageInterface].pipe(Object.assign({}, msg));
}

BotManager.prototype.pipeWith = {
	"lobby": {
		"pipe": function (msg)
		{
			let type = "unknown";
			if (msg.from && msg.from != "system")
				type = "chat";
			else if (msg.text && msg.text.startsWith("/special "))
				type = "/special";

			return this.types[type] && this.types[type](msg);
		},
		"types":
		{
			"chat": msg =>
			{
				// If regular chat text message
				return {
					"type": "chat",
					"receiver": Engine.LobbyGetNick(),
					"sender": msg.from,
					"message": msg.text
				};
			},
			"/special": msg =>
			{
				let joinedMessageSufix = translate("%(nick)s has joined.").slice(9);
				let hasJoined = msg.text.match(`^\/special (.*) ${joinedMessageSufix}$`);

				// If joined
				if (hasJoined !== null && hasJoined[1] !== undefined)
					return {
						"type": "join",
						"receiver": Engine.LobbyGetNick(),
						"sender": hasJoined[1],
						"message": msg.text
					};
			}
		}
	},
	"gamesetup": {
		"pipe": function (msg)
		{
			let type = msg.type;
			return this.types[type] && this.types[type](msg);
		},
		"types":
		{
			"chat": function (msg)
			{
				// Ignore message if it comes from the AI (will have translate=true)
				if (msg.translate)
					return;
				if (Engine.GetPlayerGUID() === undefined ||
					g_PlayerAssignments[Engine.GetPlayerGUID()] === undefined ||
					msg.guid === undefined ||
					g_PlayerAssignments[msg.guid] === undefined)
					return;

				return {
					"type": "chat",
					"receiver": splitRatingFromNick(g_PlayerAssignments[Engine.GetPlayerGUID()].name).nick,
					"sender": splitRatingFromNick(g_PlayerAssignments[msg.guid].name).nick,
					"rating": splitRatingFromNick(g_PlayerAssignments[msg.guid].name).rating,
					"message": msg.text
				};
			},
			"connect": function (msg)
			{
				if (Engine.GetPlayerGUID() === undefined ||
					g_PlayerAssignments[Engine.GetPlayerGUID()] === undefined ||
					msg.guid === undefined ||
					g_PlayerAssignments[msg.guid] === undefined)
					return;

				return {
					"type": "join",
					"receiver": splitRatingFromNick(g_PlayerAssignments[Engine.GetPlayerGUID()].name).nick,
					"sender": splitRatingFromNick(g_PlayerAssignments[msg.guid].name).nick,
					"guid": msg.guid
				};
			}
		}
	},
	"ingame": {
		"pipe": function (msg)
		{
			let type = msg.type;
			return this.types[type] && this.types[type](msg);
		},
		"types":
		{
			"message": function (msg)
			{
				// Ignore message if it comes from the AI (will have translate=true)
				if (msg.translate)
					return;
				if (Engine.GetPlayerGUID() === undefined ||
					g_PlayerAssignments[Engine.GetPlayerGUID()] === undefined ||
					msg.guid === undefined ||
					g_PlayerAssignments[msg.guid] === undefined)
					return;

				return {
					"type": "chat",
					"receiver": splitRatingFromNick(g_PlayerAssignments[Engine.GetPlayerGUID()].name).nick,
					"sender": splitRatingFromNick(g_PlayerAssignments[msg.guid].name).nick,
					"message": msg.text,
				};
			},
			"rejoined": function (msg)
			{
				if (Engine.GetPlayerGUID() === undefined ||
					g_PlayerAssignments[Engine.GetPlayerGUID()] === undefined ||
					msg.guid === undefined ||
					g_PlayerAssignments[msg.guid] === undefined)
					return;

				return {
					"type": "join",
					"receiver": splitRatingFromNick(g_PlayerAssignments[Engine.GetPlayerGUID()].name).nick,
					"sender": splitRatingFromNick(g_PlayerAssignments[msg.guid].name).nick,
					"guid": msg.guid
				};
			}
		}
	}
};

BotManager.prototype.setMessageInterface = function (messageInterface)
{
	this.messageInterface = messageInterface;

	if ("lobby" == this.messageInterface)
	{
		this.sendMessage = text =>
		{
			if (Engine.HasXmppClient())
				Engine.LobbySendMessage(text);
		};

		this.selfMessage = text => addChatMessage({
			"type": "system",
			"isSpecial": true,
			"text": "/special " + text
		});
	}
	else if ("gamesetup" == this.messageInterface)
	{
		this.sendMessage = text =>
		{
			if (Engine.HasNetClient())
				Engine.SendNetworkChat(text);
		};

		this.selfMessage = text => addChatMessage({
			"type": "system",
			"text": text
		});
	}
	else if ("ingame" == this.messageInterface)
	{
		this.sendMessage = text =>
		{
			if (Engine.HasNetClient())
				Engine.SendNetworkChat(text);
			else
				// Only used for offline games.
				addChatMessage({
					"type": "message",
					"guid": "local",
					"text": text
				});
		};

		this.selfMessage = text => addChatMessage({
			"type": "system",
			"text": text
		});
	}
	else
		warn(`Invalid message interface ${this.messageInterface}`);
}

var botManager = new BotManager();
var sendMessage = text => botManager.sendMessage(text);
var selfMessage = text => botManager.selfMessage(text);

// ********* Bot botManager.addBot order matters ***********

botManager.addBot("playerReminder", {
	"name": `Keeps a diary of notes of each player you've added. Will show it each time they join a match.`,
	"react": function (data)
	{
		if (data.type != "join")
			return;

		if (!this.instance.hasValue(data.sender))
			return;

		selfMessage(`playerReminder => ${data.sender} : ${this.instance.getValue(data.sender)}`);
		return true;
	},
	"load": function (active)
	{
		this.instance = new ConfigJSON("playerReminder");
	}
});

botManager.addBot("mute", {
	"name": "Mute bot",
	"react": function (data)
	{
		if (data.type != "chat")
			return;

		return this.instance.hasValue(data.sender);
	},
	"load": function (active)
	{
		this.instance = new ConfigJSON(`mute`);
	}
});

botManager.addBot("vote", {
	"name": "Vote bot",
	"toggle": function (votingChoicesText)
	{
		if (votingChoicesText.trim() == "")
		{
			if (!this.active)
			{
				selfMessage(`You need to add choices. e.g  /vote diplo:teams:nomad:wonder`);
				return;
			}
			this.active = false;
			selfMessage("Voting poll closed.")
			return;
		}
		this.active = true;
		this.resetVoting();
		this.voteChoices = votingChoicesText.split(":").slice(0, 7).map(String.trim);
		this.printVoting();
	},
	"playerVote": {/* "playerName" : 1m ... */ },
	"voteChoices": [/* "regi", "nomad", ... */],
	"list": "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
	"resetVoting": function ()
	{
		this.playerVote = {};
	},
	"printVoting": function ()
	{
		let choicesCount = new Array(this.voteChoices.length).fill(0);
		for (let key in this.playerVote)
			choicesCount[this.playerVote[key]] += 1;

		let show = (v, i) => `\n    ${choicesCount[i]}           ${this.list[i]}         ${v} `;
		sendMessage(`\nVotes  Option   ${this.voteChoices.map(show).join("")}`)
	},
	"react": function (data)
	{
		if (data.type != "chat")
			return;

		let choice = data.message.trim().toUpperCase();
		if (choice.length != 1)
			return;

		let index = this.list.indexOf(choice);
		if (this.voteChoices[index] === undefined)
			return;

		let oldVote = this.playerVote[data.sender];
		if (oldVote === index)
			return;

		this.playerVote[data.sender] = index;
		this.printVoting();
	}
});

botManager.addBot("autociv", {
	"name": "AutoCiv bot",
	"fuzzySearch": { /* Will be populated with a FuzzySet instance for each civ code on load*/ },
	"searchForCivInText": function (text)
	{
		// Lazy load
		if (!this.generateFuzzySearcher.loaded)
			this.generateFuzzySearcher();

		// Returns returns the civ code if civ name is found, otherwise undefined
		for (let id in this.fuzzySearch)
			if (this.fuzzySearch[id].get(text, false, 0.7))
				return id;
	},
	"react": function (data)
	{
		if (data.type != "chat")
			return;

		let clean = text => text.trim().split(" ")[0].toLowerCase();
		let firstWord = clean(data.message);
		if (firstWord.length < 4) // Ignore if less than 4 char
			return;

		// Ignore if text is player name (to avoid similarity with civ names)
		if (game.get.players.name().some(name => firstWord == clean(name)))
			return;

		let fullName = data.sender + (!!data.rating ? ` (${data.rating})` : "");

		// Ignore if in "double click" ready state (exception: host)
		if (game.get.player.selfName() !== fullName &&
			game.get.player.status(fullName) == "locked")
			return;

		// Special case: spec makes a player observer.
		if (firstWord == "spec")
		{
			game.set.player.observer(fullName);
			return;
		}

		game.set.player.civ(fullName, this.searchForCivInText(firstWord));
	},
	"generateFuzzySearcher": function ()
	{
		/**
		 * customNamesCivs: Mod independent (ignores civs not in current
		 * enabled mod).
		 * Loaded from file "autociv_data/civilizations.json".
		 * You can add any new civ code name you want from any civ you made.
		 * E.g. if you make a new civ called "FoobarCiv", then your civ
		 * code will be "foo" and the possible entries ["foo"(civ code
		 * added automatically no need to add), "custom name 1", "custom
		 * name 2", "custom name N"].
		 * Doesn't care if uppercase or lowercase for custom name entries
		 * (but yes for the civ code).
		 */
		// Load custom civ names.
		let customNamesCivs = Engine.ReadJSONFile("autociv_data/civilizations.json");

		// Clear and fill this.fuzzySearch
		this.generateFuzzySearcher.loaded = true;
		this.fuzzySearch = {}

		for (let i = 0; i < g_PlayerCivList.code.length; ++i)
		{
			let code = g_PlayerCivList.code[i];
			// Oficial full name (translated).
			let civNameVariations = [g_PlayerCivList.name[i]];
			// Custom names if any.
			if (code in customNamesCivs)
				civNameVariations.push(...customNamesCivs[code]);

			this.fuzzySearch[code] = FuzzySet(civNameVariations, true, 3, 3)
		}
	}
});

botManager.addBot("link", {
	"name": "Text link grabber bot",
	"linkList": [],
	"parseURLs": function (text)
	{
		// https://www.regexpal.com/93652
		return text.match(/^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/gmi);
	},
	"findAndAdd": function (text)
	{
		let urls = this.parseURLs(text);
		if (urls != null)
			this.linkList.unshift(...urls.reverse())
	},
	// Returns false if successful
	"openLink": function (text)
	{
		let i = parseInt(typeof text != "string" ? text : text.trim() != "" ? text : 0);
		if (!Number.isInteger(i) || !this.linkList[i])
			return "No links or invalid index.";

		let url = String(this.linkList[i]);

		// If the URL doesn't have a protocol prefix the game crashes :S
		warn(url)
		if (!/(https?|ftp):.*/i.test(url))
			url = "http://" + url.trim();

		Engine.OpenURL(url);
		return false;
	},
	// Returns pretty info list of all links
	"getInfo": function ()
	{
		let title = `Detected (${this.linkList.length}) links`;
		let textList = this.linkList.map((link, index) => `${index} : ${link}`).reverse()
		return [title].concat(textList).join("\n");
	},
	"react": function (data)
	{
		if (data.type != "chat")
			return;

		this.findAndAdd(data.message);
	}
});
