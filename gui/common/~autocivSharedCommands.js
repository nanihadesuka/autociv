// text expected input format "name (rating) : message"
function autociv_GetNameRatingText(text)
{
	let spliterIndex = text.indexOf(":");
	if (spliterIndex == -1)
		return false;

	let fullName = splitRatingFromNick(text.slice(0, spliterIndex).trim());
	return {
		"name": fullName.nick,
		"rating": fullName.rating,
		"text": text.slice(spliterIndex + 1)
	}
};

let autociv_SharedCommands = {
	"mute": {
		"description": "Mute player.",
		"handler": (player) =>
		{
			if (player == "")
				return selfMessage("You need to type a name to mute.")
			let name = splitRatingFromNick(player).nick;
			botManager.get("mute").instance.setValue(name, name);
			selfMessage(`You have muted ${name}.`);
			return false;
		}
	},
	"unmute": {
		"description": "Unmute player.",
		"handler": (player) =>
		{
			if (player == "")
				return selfMessage("You need to type a name to unmute.")
			let name = splitRatingFromNick(player).nick;
			botManager.get("mute").instance.removeValue(name);
			selfMessage(`You have unmuted ${name}.`);
			return false;
		}
	},
	"muteclear": {
		"description": "Clear list of muted players.",
		"handler": () =>
		{
			botManager.get("mute").instance.removeAllValues();
			selfMessage("You have cleared muted list.");
			return false;
		}
	},
	"mutelist": {
		"description": "List of muted players.",
		"handler": () =>
		{
			let list = botManager.get("mute").instance.getIds();
			selfMessage(`Muted ${list.length} people`);
			for (let name of list)
				selfMessage("| " + name);

			return false;
		}
	},
	"linklist": {
		"description": "Shows the list of links detected in the chat.",
		"handler": () =>
		{
			selfMessage(botManager.get("link").getInfo());
			return false;
		}
	},
	"link": {
		"description": "Open links from /linklist.",
		"handler": (index) =>
		{
			let err = botManager.get("link").openLink(index);
			if (err)
				selfMessage(err);
			return false;
		}
	},
	"randomPhrase": {
		"description": "Random phrases Vol. 1.",
		"handler": () =>
		{
			botManager.get("randomPhrase").sendRandomMessage();
			return false;
		}
	},
	"genPhrase": {
		"description": "Generate nonsense phrases.",
		"handler": () =>
		{
			botManager.get("genPhrase").sendRandomMessage();
			return false;
		}
	},
	"didYouKnow": {
		"description": "Random did-you-knows.com phrases Vol. 1.",
		"handler": () =>
		{
			botManager.get("didYouKnow").sendRandomMessage();
			return false;
		}
	},
	"vote": {
		"description": "Voting poll. Use /vote option1:option2:option3:option4",
		"handler": (votingChoices) =>
		{
			botManager.get("vote").toggle(votingChoices);
			return false;
		}
	},
	"votereset": {
		"description": "Reset vote poll votes to 0.",
		"handler": () =>
		{
			botManager.get("vote").resetVoting();
			botManager.get("vote").printVoting();
			return false;
		}
	},
	"voteshow": {
		"description": "Display current votes poll.",
		"handler": () =>
		{
			botManager.get("vote").printVoting();
			return false;
		}
	},
	"playerReminderToggle": {
		"description": "Keep a note about a player that will show when he joins.",
		"handler": () =>
		{
			botManager.get("playerReminder").toggle();
			selfMessage(`playerReminder has been ${botManager.get("playerReminder").active ? "enabled" : "disabled"}.`)
			return false;
		}
	},
	"playerReminder": {
		"description": "Keep a note about a player that will show when he joins.",
		"handler": (command) =>
		{
			let data = autociv_GetNameRatingText(command);
			if (!data || !data.name || !data.text)
				return selfMessage("Invalid name and/or note. (Use e.g /playerReminder name : note ).")

			botManager.get("playerReminder").instance.setValue(data.name, data.text);
			selfMessage(`Player ${data.name} has been added to playerReminder list.`);
			return false;
		}
	},
	"playerReminderRemove": {
		"description": "Keep a note about a player that will show when he joins",
		"handler": (player) =>
		{
			if (player == "")
				return selfMessage("You need to type a name to remove player reminder.")

			let name = splitRatingFromNick(player.trim()).nick;
			if (!name)
				return;

			botManager.get("playerReminder").instance.removeValue(name);
			selfMessage(`Player ${name} has been removed from playerReminder list.`);
			return false;
		}
	},
	"playerReminderList": {
		"description": "Keep a note about a player that will show when he joins",
		"handler": () =>
		{
			let bot = botManager.get("playerReminder").instance;
			let players = bot.getIds();
			if (!players.length)
			{
				selfMessage(`No playerReminder added.`)
				return false;
			}

			for (let player of players)
				selfMessage(`Reminder == ${player} : ${bot.getValue(player)}`);

			return false;
		}
	}
}

function autociv_InitSharedCommands()
{
	switch (botManager.messageInterface)
	{
		case "lobby":
			Object.keys(autociv_SharedCommands).forEach(key =>
			{
				g_ChatCommands[key] = {
					"description": autociv_SharedCommands[key].description,
					"handler": (args) =>
					{
						let text = args.filter(a => a != "").join(" ");
						autociv_SharedCommands[key].handler(text);
					}
				}
			});
			break;
		case "gamesetup":
		case "ingame":
			Object.keys(autociv_SharedCommands).forEach(key =>
			{
				g_NetworkCommands["/" + key] = autociv_SharedCommands[key].handler;
			});
			break;
		default:
	}
}
