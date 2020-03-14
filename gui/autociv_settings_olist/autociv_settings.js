var hotkeyData = {};


var g_containerBackground = {
	"fadeIn": function ()
	{
		animate("dialogBackground").add({
			"start": { "color": { "a": 0 } },
			"color": { "a": 0.4 },
			"duration": 500
		});
	},
	"fadeOut": function ()
	{
		if (this.done)
			return;
		animate("dialogBackground").add({
			"color": { "a": 0.0 },
			"onComplete": () => autocivCL.Engine.PopGuiPage({}),
			"duration": 500
		});
		this.done = true;
	}
};

var g_container = {
	"fadeIn": function () { },
	"fadeOut": function ()
	{
		if (this.done)
			return;
		GUIReact.emit("restartMessage", "onClose");
		Engine.GetGUIObjectByName("dialog").hidden = true;
		this.done = true;
	}
};

function updateHotkey(hotkey)
{
	let data = hotkeyData[hotkey];
	if (!data || !data.value)
		return;

	let panel = Engine.GetGUIObjectByName("panel");
	let i = panel.list.indexOf(hotkey);
	if (i == -1)
		return;

	let list_key = panel.list_key;
	list_key[i] = data.value == "unused" ? "" : data.value;
	panel.list_key = list_key;
	panel.list = panel.list;
	panel.list_data = panel.list_data;
}

function saveHotkey(hotkey, key)
{
	key = (key == "") ? "unused" : key;

	let data = hotkeyData[hotkey];
	if (!data || data.value == key)
		return false;

	data.value = key;
	Engine.ConfigDB_CreateValue("user", hotkey, key);
	Engine.ConfigDB_WriteValueToFile("user", hotkey, key, "config/user.cfg");
	GUIReact.emit("restartMessage", "onOpen");
	updateHotkey(hotkey);
}

var userConfig = {
	"init": function ()
	{
		this.currentConfig = {};
		this.processDefaultConfig(this.currentConfig);
		this.processUserConfig(this.currentConfig);
		// Has some non hotkeys keys but doesnt matter
		this.autocivDefaultConfig = Engine.ReadJSONFile("autociv_data/default_config.json");
		this.iterator = this.generator(this.currentConfig, 0);
		this.loadHotkeys();
	},
	"cuotaPerCall": 1,
	"i": 0,
	"nestKeyValueInObject": (key, value, object) =>
	{
		let childObject = object;
		for (let i = 0; i < key.length; ++i)
		{
			let prefix = key[i];
			if (i == key.length - 1)
			{
				// Use the fact that no setting can use = in its own name to use it as key for its value
				if (!(prefix in childObject))
					childObject[prefix] = {};
				childObject[prefix]["="] = value;
			}
			else
			{
				if (!(prefix in childObject))
					childObject[prefix] = {};
				childObject = childObject[prefix];
			}
		}
	},
	"processDefaultConfig": function (currentConfig)
	{
		this.defaultConfig = {}
		let configFileByLines = Engine.ReadFileLines("config/default.cfg");
		let currentPrefix = "";

		for (let line of configFileByLines)
		{
			// If line is a prefix
			let prefix = line.match(/^\[(.*)\].*/);
			if (prefix !== null)
			{
				currentPrefix = prefix[1];
				continue;
			}

			// If line is a setting
			let setting = line.match(/^;?(\S+)\W*=\W*\S*/);
			if (setting === null)
				continue;

			let key = [];
			if (currentPrefix != "")
				key.push(...currentPrefix.split("."))
			key.push(...setting[1].split("."))

			if (key[0] == "userreport" || key[0] != "hotkey")
				continue;

			let value = Engine.ConfigDB_GetValue("user", key.join("."));
			this.nestKeyValueInObject(key, value, this.defaultConfig);
			this.nestKeyValueInObject(key, value, currentConfig);
		}
	},
	"processUserConfig": function (currentConfig)
	{
		this.userConfig = {}
		let configFileByLines = Engine.ReadFileLines("config/user.cfg");

		for (let line of configFileByLines)
		{
			// If line is a setting
			let setting = line.match(/^;?(\S+)\W*=\W*\S*/);
			if (setting === null)
				continue;

			let key = setting[1].split(".");

			if (key[0] == "userreport" || key[0] != "hotkey")
				continue;

			let value = Engine.ConfigDB_GetValue("user", key.join("."));
			this.nestKeyValueInObject(key, value, this.userConfig);
			this.nestKeyValueInObject(key, value, currentConfig);
		}
	},
	/**
	 * @param {Array} settingAsArray e.g. ["hotkey","camera","down"]
	 */
	"hasDefaultValue": function (settingAsArray)
	{
		let level = this.defaultConfig;
		for (let key of settingAsArray)
		{
			if (level[key] === undefined)
				return undefined;
			level = level[key];
		}
		if (("=" in level) && ("" !== level["="]))
			return level["="]
		return undefined;
	},
	"hasAutocivDefaultValue": function (settingAsArray)
	{
		let hotkey = settingAsArray.join(".");
		if (hotkey in this.autocivDefaultConfig)
			if (this.autocivDefaultConfig[hotkey] != "unused")
				return this.autocivDefaultConfig[hotkey];
		return undefined;
	},
	"generator": (data) =>
	{
		let __generatorCounter = 0;

		function* _generator(data, list)
		{
			let keys = Object.keys(data).filter(v => v != "=");
			const noMerge = keys.length > 1;

			if ("=" in data) yield {
				"hotkey": list.join("."),
				"key": list[list.length - 1],
				"value": data["="],
				"list": list,
				"i": __generatorCounter++
			}
			else if (noMerge) yield {
				"hotkey": list.join("."),
				"key": list[list.length - 1],
				"value": "",
				"list": list,
				"folder": true,
				"i": __generatorCounter++
			}

			keys.sort();
			for (let key of keys)
			{
				if (noMerge)
					yield* _generator(data[key], [...list, key]);
				else if (list.length == 0)
					yield* _generator(data[key], [key]);
				else
				{
					list[list.length - 1] += "." + key;
					yield* _generator(data[key], list);
				}
			}
		}

		return _generator(data, []);
	},
	"generateItem": function (data)
	{
		let key = " ".repeat(Math.max(0, data.list.length - 2) * 9) +
			(data.folder ? "▼  " : '[color="255 255 255 50"]●[/color]  ') +
			data.key;
		return {
			"list_hotkey": key,
			"list_key": data.folder ? "" : data.value == "unused" ? "" : data.value,
			"list": data.hotkey
		};
	},
	"loadHotkeys": function ()
	{
		let list_hotkey = [];
		let list_key = [];
		let list = [];
		for (let data of this.iterator)
		{
			if (data.key == "hotkey")
				continue;
			if (!data.folder)
				hotkeyData[data.hotkey] = data;
			let out = this.generateItem(data);
			list_hotkey.push(out.list_hotkey);
			list_key.push(out.list_key);
			list.push(out.list);
		}
		let panel = Engine.GetGUIObjectByName("panel");
		panel.list_hotkey = list_hotkey;
		panel.list_key = list_key;
		panel.list_data = list;
		panel.list = list;
	},
};

function openHotkeyCallback(data)
{
	if (!data ||
		(typeof data.hotkey != "string") ||
		!data.hotkey.startsWith("hotkey.") ||
		(typeof data.value != "string")
	)
		return;

	saveHotkey(data.hotkey, data.value);
};

function openHotkey(hotkey)
{
	let data = hotkeyData[hotkey];
	if (!data)
		return;

	let page = "autociv_settings_olist/page_dialog.xml";
	autocivCL.Engine.PushGuiPage(page, data, openHotkeyCallback);
};

function resetHotkey(hotkey)
{
	let data = hotkeyData[hotkey];
	if (!data)
		return;

	let value = this.hasDefaultValue(data.list) || this.hasAutocivDefaultValue(data.list);
	if (value)
		saveHotkey(hotkey, data.value);
};

function clearHotkey(hotkey)
{
	let data = hotkeyData[hotkey];
	if (!data)
		return;

	let value = this.hasDefaultValue(data.list) || this.hasAutocivDefaultValue(data.list);
	if (value)
		saveHotkey(hotkey, "");
};

var restartMessage = {
	"assignedGUIObjectName": "restartMessage",
	"onOpen": function ()
	{
		animate("restartMessage").add({
			"onStart": object =>
			{
				object.hidden = false;
			},
			"color": "0 0 0 190",
			"textcolor": "200 40 40 255",
		});

	},
	"onClose": function ()
	{
		animate("restartMessage").add({
			"onComplete": object =>
			{
				object.hidden = true;
			},
			"color": "0 0 0 0",
			"textcolor": "200 0 0 0",
		});
	},
	"onMouseLeftRelease": function ()
	{
		this.onClose();
	}
}

function close()
{
	g_containerBackground.fadeOut();
	g_container.fadeOut();
}

function init()
{
	GUIReact.register("restartMessage", restartMessage);
	g_containerBackground.fadeIn();
	g_container.fadeIn();
	userConfig.init();


	let panel = Engine.GetGUIObjectByName("panel");
	panel.onMouseLeftDoubleClick = function ()
	{
		let i = panel.selected;
		if (i == -1)
			return;

		let hotkey = panel.list[i];
		if (!hotkey)
			return;

		openHotkey(hotkey);
	}

}

function onTick() { }

// In case I want to update this later on
function saveDirectMappingToFile()
{
	let SDL_keycode_value_to_constant = Engine.ReadJSONFile("autociv_data/SDL_keycode_value_to_constant.json");
	let SDL_keycode_constant_to_0ad_key = Engine.ReadJSONFile("autociv_data/SDL_keycode_constant_to_0ad_key.json");
	let SDL_keycode_value_to_0ad_key = {};

	for (let value in SDL_keycode_value_to_constant)
	{
		if (SDL_keycode_value_to_constant[value] in SDL_keycode_constant_to_0ad_key)
			SDL_keycode_value_to_0ad_key[value] = SDL_keycode_constant_to_0ad_key[SDL_keycode_value_to_constant[value]];
	}

	Engine.WriteJSONFile("config/mapping.json", SDL_keycode_value_to_0ad_key);
}
