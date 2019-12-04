
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

function autociv_patchSession()
{
	autociv_patchApplyN("addChatMessage", function (target, that, args)
	{
		let [msg] = args;
		return botManager.react(msg) || target.apply(that, args);
	})

	if (g_autociv_is24)
		return;

	autociv_patchApplyN("sendLobbyPlayerlistUpdate", function (target, that, args)
	{
		autociv_saveStanzaSession();
		return target.apply(that, args);
	})
}

autociv_patchApplyN("onTick", function (target, that, args)
{
	autociv_APM.onTick();
	return target.apply(that, args);
})

autociv_patchApplyN("init", function (target, that, args)
{
	let result = target.apply(that, args);
	autociv_initBots();
	autociv_patchSession();
	autociv_bugFix_openChat();
	autociv_bugFix_entity_unkown_reason();
	autociv_addVersionLabel();
	autociv_APM.init();
	autociv_saveStanzaSession();
	autociv_SetCorpsesMax(Engine.ConfigDB_GetValue("user", "autociv.session.graphics.corpses.max"));
	return result;
})
