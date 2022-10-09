g_OptionType["autociv_slider_int"] = {
	"objectType": "slider",
	"configToValue": value => parseInt(value, 10),
	"valueToGui": (value, control) =>
	{
		control.value = parseInt(value, 10);
	},
	"guiToValue": control => parseInt(control.value, 10),
	"guiSetter": "onValueChange",
	"initGUI": (option, control) =>
	{
		control.max_value = option.max;
		control.min_value = option.min;
	},
	"tooltip": (value, option) =>
		sprintf(translateWithContext("slider number", "Value: %(val)s (min: %(min)s, max: %(max)s)"), {
			"val": parseInt(value, 10),
			"min": parseInt(option.min, 10),
			"max": parseInt(option.max, 10)
		})
}

g_OptionType["autociv_number_int"] = {
	"objectType": "number",
	"configToValue": value => parseInt(value, 10),
	"valueToGui": (value, control) =>
	{
		control.caption = parseInt(value, 10);
	},
	"guiToValue": control => +control.caption,
	"guiSetter": "onTextEdit",
	"sanitizeValue": (value, control, option) =>
	{
		const min = parseInt(option.min, 10) ?? Number.MIN_SAFE_INTEGER
		const max = parseInt(option.max, 10) ?? Number.MAX_SAFE_INTEGER
		const sanitized = parseInt(value, 10) ?? 0
		const valid = Number.isInteger(value) && (min <= value) && (value <= max)

		if (control)
			control.sprite = valid ? "ModernDarkBoxWhite" : "ModernDarkBoxWhiteInvalid";

		return sanitized;
	},
	"tooltip": (value, option) =>
		sprintf(
			option.min !== undefined && option.max !== undefined ?
				translateWithContext("option number", "Min: %(min)s, Max: %(max)s") :
				option.min !== undefined && option.max === undefined ?
					translateWithContext("option number", "Min: %(min)s") :
					option.min === undefined && option.max !== undefined ?
						translateWithContext("option number", "Max: %(max)s") :
						"",
			{
				"min": parseInt(option.min, 10),
				"max": parseInt(option.max, 10)
			})
}

g_OptionType["autociv_dropdown_runtime_load"] = {
	"objectType": "dropdown",
	"configToValue": value => value,
	"valueToGui": (value, control) =>
	{
		control.selected = control.list_data.indexOf(value);
	},
	"guiToValue": control => control.list_data[control.selected],
	"guiSetter": "onSelectionChange",
	"initGUI": (option, control) =>
	{
		if (!option.list)
			option.list = global[option.autociv_list_load]()

		control.list = option.list.map(e => e.label);
		control.list_data = option.list.map(e => e.value);
		control.onHoverChange = () =>
		{
			let item = option.list[control.hovered];
			control.tooltip = item && item.tooltip || option.tooltip;
		};
	}
}

function autociv_getAvailableFonts()
{
	return Engine.ListDirectoryFiles("fonts/", "*").
		map(v => v.match(/fonts\/(.+)\.fnt/)?.[1]).
		filter(v => v).
		map(v => { return { "value": v, "label": v } })
}

if (!global.g_autociv_optionsFiles)
	var g_autociv_optionsFiles = ["gui/options/options.json"]
g_autociv_optionsFiles.push("autociv_data/options.json")

init = function (data, hotloadData)
{
	g_ChangedKeys = hotloadData ? hotloadData.changedKeys : new Set();
	g_TabCategorySelected = hotloadData ? hotloadData.tabCategorySelected : 0;

	// CHANGES START /////////////////////////
	g_Options = []
	for (let options of g_autociv_optionsFiles)
		Array.prototype.push.apply(g_Options, Engine.ReadJSONFile(options))
	// CHANGES END /////////////////////////

	translateObjectKeys(g_Options, ["label", "tooltip"]);

	// DISABLE IF DATA IS LOADED DYNAMICALLY
	// deepfreeze(g_Options);

	placeTabButtons(
		g_Options,
		false,
		g_TabButtonHeight,
		g_TabButtonDist,
		selectPanel,
		displayOptions);
}

/**
 * Sets up labels and controls of all options of the currently selected category.
 */
displayOptions = function ()
{
	// Hide all controls
	for (let body of Engine.GetGUIObjectByName("option_controls").children)
	{
		body.hidden = true;
		for (let control of body.children)
			control.hidden = true;
	}

	// Initialize label and control of each option for this category
	for (let i = 0; i < g_Options[g_TabCategorySelected].options.length; ++i)
	{
		// Position vertically
		let body = Engine.GetGUIObjectByName("option_control[" + i + "]");
		let bodySize = body.size;
		bodySize.top = g_OptionControlOffset + i * (g_OptionControlHeight + g_OptionControlDist);
		bodySize.bottom = bodySize.top + g_OptionControlHeight;
		body.size = bodySize;
		body.hidden = false;

		// Load option data
		let option = g_Options[g_TabCategorySelected].options[i];
		let optionType = g_OptionType[option.type];
		let value = optionType.configToValue(Engine.ConfigDB_GetValue("user", option.config));

		// Setup control
		let control = Engine.GetGUIObjectByName("option_control_" + (g_OptionType[option.type].objectType ?? option.type) + "[" + i + "]");
		control.tooltip = option.tooltip + (optionType.tooltip ? "\n" + optionType.tooltip(value, option) : "");
		control.hidden = false;

		if (optionType.initGUI)
			optionType.initGUI(option, control);

		control[optionType.guiSetter] = function () { };
		optionType.valueToGui(value, control);
		if (optionType.sanitizeValue)
			optionType.sanitizeValue(value, control, option);

		control[optionType.guiSetter] = function ()
		{

			let value = optionType.guiToValue(control);

			if (optionType.sanitizeValue)
				optionType.sanitizeValue(value, control, option);

			control.tooltip = option.tooltip + (optionType.tooltip ? "\n" + optionType.tooltip(value, option) : "");

			Engine.ConfigDB_CreateValue("user", option.config, String(value));
			Engine.ConfigDB_SetChanges("user", true);

			g_ChangedKeys.add(option.config);
			fireConfigChangeHandlers(new Set([option.config]));

			if (option.function)
				Engine[option.function](value);

			enableButtons();
		};

		// Setup label
		let label = Engine.GetGUIObjectByName("option_label[" + i + "]");
		label.caption = option.label;
		label.tooltip = option.tooltip;
		label.hidden = false;

		let labelSize = label.size;
		labelSize.left = option.dependencies ? g_DependentLabelIndentation : 0;
		labelSize.rright = control.size.rleft;
		label.size = labelSize;
	}

	enableButtons();
}


enableButtons = function ()
{
	g_Options[g_TabCategorySelected].options.forEach((option, i) =>
	{
		const isDependencyMet = (dependency) => {
			if (typeof dependency === "string")
				return Engine.ConfigDB_GetValue("user", dependency) == "true";
			else if (typeof dependency === "object") {
				const availableOps = {
				"==": (config, value) => config == value,
				"!=": (config, value) => config != value,
				};
				const op = availableOps[dependency.op] || availableOps["=="];
				return op(
				Engine.ConfigDB_GetValue("user", dependency.config),
				dependency.value
				);
			}
			error("Unsupported dependency: " + uneval(dependency));
			return false;
		};

    	const enabled = !option.dependencies || option.dependencies.every(isDependencyMet);

		const objectType = g_OptionType[option.type].objectType ?? option.type
		Engine.GetGUIObjectByName("option_label[" + i + "]").enabled = enabled;
		Engine.GetGUIObjectByName("option_control_" + objectType + "[" + i + "]").enabled = enabled;
	});

	let hasChanges = Engine.ConfigDB_HasChanges("user");
	Engine.GetGUIObjectByName("revertChanges").enabled = hasChanges;
	Engine.GetGUIObjectByName("saveChanges").enabled = hasChanges;
}
