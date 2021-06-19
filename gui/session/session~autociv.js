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
	if (!label?.caption)
		return;

	let mod = (mod) => /^AutoCiv.*/i.test(mod.name);
	let version = Engine.GetEngineInfo().mods.find(mod)?.version ?? "";
	label.caption = `${label.caption} [color="255 255 255 127"]${version}[/color]`;
}

function autociv_patchSession()
{
	Engine.GetGUIObjectByName("pauseOverlay").size = "0% 0% 100% 30%"
}

function autociv_SetChatTextFromConfig()
{
	const that = autociv_SetChatTextFromConfig
	that.default_size = that.default_size ?? Engine.GetGUIObjectByName("chatPanel").size
	that.default_font = that.default_font ?? Engine.GetGUIObjectByName("chatLines").children[0].font

	const changeSize = Engine.ConfigDB_GetValue("user", "autociv.session.chatPanel.size.change") == "true"
	const size = changeSize ? Engine.ConfigDB_GetValue("user", "autociv.session.chatPanel.size") : that.default_size
	Engine.GetGUIObjectByName("chatPanel").size = size

	const changeFont = Engine.ConfigDB_GetValue("user", "autociv.session.chatText.font.change") == "true"
	const font = changeFont ? Engine.ConfigDB_GetValue("user", "autociv.session.chatText.font") : that.default_font
	for (let child of Engine.GetGUIObjectByName("chatLines").children)
		child.font = font
}

function getGuiObjectsWithHotkey()
{
	let dict = {}
	let internal = 0

	let traverse = parent => parent.children.forEach(child =>
	{
		if (child.name.startsWith("__internal("))
			++internal

		if (child.hotkey)
			dict[child.hotkey] = child

		traverse(child)
	})

	while (true)
	{
		let object = Engine.GetGUIObjectByName(`__internal(${internal})`)
		if (!object)
			break

		// Go to root
		while (object.parent != null)
			object = object.parent

		traverse(object)
		++internal
	}
	return dict
}

var g_hotkeyObjectChange = {
	"camera.follow": ["onPress", "onKeyDown"]
}


function autociv_changeSomeHotkeysToKeyDownAsPressTypeCantBeDiscardedFromBeingCalledForSomeReason()
{
	let guiObjectWithHotkeys = getGuiObjectsWithHotkey()
	for (let hotkey in g_hotkeyObjectChange)
	{
		const obj = guiObjectWithHotkeys[hotkey]
		if (!obj)
			continue

		const [from, to] = g_hotkeyObjectChange[hotkey]
		obj[to] = obj[from].bind(obj[from])
		delete obj[from]
	}

	{
		const that = g_Chat
		Engine.UnsetGlobalHotkey("chat", "Press");
		Engine.UnsetGlobalHotkey("teamchat", "Press");
		Engine.UnsetGlobalHotkey("privatechat", "Press");
		Engine.SetGlobalHotkey("chat", "KeyDown", that.openPage.bind(that));
		Engine.SetGlobalHotkey("privatechat", "KeyDown", that.openPage.bind(that));
		Engine.SetGlobalHotkey("teamchat", "KeyDown", () => { that.openPage(g_IsObserver ? "/observers" : "/allies"); });
	}
}

autociv_patchApplyN("init", function (target, that, args)
{
	let result = target.apply(that, args)

	autociv_changeSomeHotkeysToKeyDownAsPressTypeCantBeDiscardedFromBeingCalledForSomeReason()
	autociv_initBots()
	autociv_patchSession()
	autociv_addVersionLabel()
	autociv_SetCorpsesMax(Engine.ConfigDB_GetValue("user", "autociv.session.graphics.corpses.max"))
	autociv_SetChatTextFromConfig()
	g_AutocivControls = new AutocivControls()

	registerConfigChangeHandler(changes =>
	{
		if (changes.has("autociv.session.graphics.corpses.max"))
			autociv_SetCorpsesMax(Engine.ConfigDB_GetValue("user", "autociv.session.graphics.corpses.max"))

		autociv_SetChatTextFromConfig()
	})

	return result
})
