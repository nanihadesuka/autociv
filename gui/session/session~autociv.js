// Autociv control class with sub classes that will be have an instance at init()
class AutocivControls
{
	constructor()
	{
		this.controls = {}
		for (let className of Object.keys(AutocivControls))
			this.controls[className] = new AutocivControls[className]()
	}
}
var g_AutocivControls; // Created at init


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
	let version = modInfo && modInfo[1] && modInfo[1] || "";
	label.caption = `${label.caption} [color="255 255 255 127"]${version}[/color]`;
}

function autociv_patchSession()
{
	Engine.GetGUIObjectByName("pauseOverlay").size = "0% 0% 100% 30%"
}

function autociv_SetChatTextFromConfig()
{
	if (Engine.ConfigDB_GetValue("user", "autociv.session.chatPanel.size.change") == "true")
		Engine.GetGUIObjectByName("chatPanel").size = Engine.ConfigDB_GetValue("user", "autociv.session.chatPanel.size");

	if (Engine.ConfigDB_GetValue("user", "autociv.session.chatText.font.change") == "true")
		Engine.GetGUIObjectByName("chatLines").font = Engine.ConfigDB_GetValue("user", "autociv.session.chatText.font");
}

autociv_patchApplyN("init", function (target, that, args)
{
	let result = target.apply(that, args);
	autociv_initBots();
	autociv_patchSession();
	autociv_addVersionLabel();
	autociv_SetCorpsesMax(Engine.ConfigDB_GetValue("user", "autociv.session.graphics.corpses.max"));
	autociv_SetChatTextFromConfig();
	g_AutocivControls = new AutocivControls()
	return result;
})
