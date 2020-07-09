function Autociv_CLI_GUI(gui)
{
	this.CLI = new Autociv_CLI();

	this.GUI = {};
	this.GUI.gui = gui;
	this.GUI.input = this.GUI.gui.children[0];
	this.GUI.stdout = this.GUI.gui.children[1];
	this.GUI.hotkey = this.GUI.gui.children[2];
	this.GUI.suggestions = this.GUI.input.children[0];
	this.GUI.sortMode = this.GUI.input.children[1];
	this.GUI.inspector = this.GUI.suggestions.children[0];

	for (let name in this.style.GUI)
	{
		for (let proprety in this.style.GUI[name])
			this.GUI[name][proprety] = this.style.GUI[name][proprety];
		this.GUI[name].font = this.style.font;
	}

	this.GUI.gui.onPress = () => this.toggle();
	this.GUI.input.onTextEdit = () => this.updateSuggestions();
	this.GUI.input.onTab = () => this.tab();
	this.GUI.input.onPress = () => this.evalInput();
	this.GUI.stdout.onPress = () => this.stdoutToggle();
	this.GUI.hotkey.onPress = () => this.stdoutEval();
	this.GUI.suggestions.onSelectionChange = () => this.inspectSelectedSuggestion();
	this.GUI.suggestions.onMouseLeftDoubleClick = () => this.setSelectedSuggestion();
	this.GUI.gui.onTick = this.onTick.bind(this);
}

Autociv_CLI_GUI.prototype.suggestionsMaxVisibleSize = 350
Autociv_CLI_GUI.prototype.inspectorMaxVisibleSize = 350;
Autociv_CLI_GUI.prototype.stdOutMaxVisibleSize = 250;
Autociv_CLI_GUI.prototype.vlineSize = 19.2;

Autociv_CLI_GUI.prototype.style = {
	"GUI": {
		"input": {
			"sprite": "color:90 90 90",
			"textcolor": "245 245 245",
			"textcolor_selected": "255 255 255",
			"sprite_selectarea": "color:69 200 161",
			"tooltip": "Press Enter to eval expression"
		},
		"stdout": {
			"sprite": "color:60 60 60",
			"textcolor": "245 245 245",
			"textcolor_selected": "255 255 255",
			"sprite_selectarea": "color:69 200 161"
		},
		"suggestions": {
			"sprite": "color:10 10 10",
			"textcolor": "220 220 220",
		},
		"inspector": {
			"sprite": "color:45 45 45",
			"textcolor": "230 230 230",
		},
		"sortMode": {
			"sprite": "color:70 70 70",
			"textcolor": "255 255 255",
			"text_align": "center",
			"text_valign": "center",
			"buffer_zone": "0"
		}
	},
	"font": "sans-bold-14",
};

Autociv_CLI_GUI.prototype.onTick = function ()
{
	if (this.GUI.gui.hidden || !this.CLI.inspectorSettings.lastEntry)
		return;

	if (this.CLI.inspectorSettings.check())
		this.updateObjectInspector(
			this.CLI.inspectorSettings.lastEntry.parent[this.CLI.inspectorSettings.lastEntry.token.value],
			this.CLI.lastVariableNameExpressionInspector);

	if (this.CLI.suggestionsSettings.check())
		this.updateSuggestions(this.GUI.input.caption, false);
}

Autociv_CLI_GUI.prototype.stdoutToggle = function ()
{
	if (this.GUI.gui.hidden)
		return;

	this.GUI.stdout.hidden = !this.GUI.stdout.hidden;
	if (this.GUI.stdout.hidden)
		return;

	if (!this.CLI.inspectorSettings.lastEntry)
		return;

	let object = this.CLI.inspectorSettings.lastEntry.parent[this.CLI.inspectorSettings.lastEntry.token.value];
	let result = this.CLI.getObjectRepresentation(object, undefined, undefined, false);
	// Count number of lines
	this.GUI.stdout.caption = "";
	let nLines1 = (result.match(/\n/g) || '').length + 1;
	let nLines2 = Math.ceil(result.length / 100);
	this.GUI.stdout.size = Object.assign(this.GUI.stdout.size, {
		"top": -Math.min(Math.max(nLines1, nLines2) * this.vlineSize, this.stdOutMaxVisibleSize) - 5
	});

	this.GUI.stdout.caption = result;
}

Autociv_CLI_GUI.prototype.stdoutEval = function ()
{
	if (this.GUI.gui.hidden)
		return;

	let result = this.evalInput();

	// Count number of lines
	this.GUI.stdout.caption = "";
	let nLines1 = (result.match(/\n/g) || '').length + 1;
	let nLines2 = Math.ceil(result.length / 100);
	this.GUI.stdout.size = Object.assign(this.GUI.stdout.size, {
		"top": -Math.min(Math.max(nLines1, nLines2) * this.vlineSize, this.stdOutMaxVisibleSize) - 5
	});

	this.GUI.stdout.caption = result;
}

// escapeText from a24
Autociv_CLI_GUI.prototype.escape = function (obj)
{
	return obj.toString().replace(/\\/g, "\\\\").replace(/\[/g, "\\[");
};

Autociv_CLI_GUI.prototype.inspectSelectedSuggestion = function ()
{
	if (this.GUI.suggestions.selected == -1)
		return;

	let text = this.CLI.prefix + this.CLI.list_data[this.GUI.suggestions.selected];
	let entry = this.CLI.getEntry(text);
	if (!entry)
		return;

	if (typeof entry.parent == "object" && entry.token.value in entry.parent)
	{
		this.CLI.inspectorSettings.lastEntry = entry;
		this.updateObjectInspector(entry.parent[entry.token.value], text);
	}
};

Autociv_CLI_GUI.prototype.setSelectedSuggestion = function ()
{
	if (this.GUI.suggestions.selected == -1)
		return;

	this.GUI.input.caption = this.CLI.prefix + this.CLI.list_data[this.GUI.suggestions.selected];
	this.updateSuggestions()
	this.GUI.input.blur();
	this.GUI.input.focus();
	this.GUI.input.buffer_position = this.GUI.input.caption.length;
};

Autociv_CLI_GUI.prototype.toggle = function ()
{
	this.GUI.gui.hidden = !this.GUI.gui.hidden;
	if (this.GUI.gui.hidden)
	{
		this.GUI.input.blur();
		return;
	}

	this.GUI.input.blur();
	this.GUI.input.focus();
	this.GUI.input.buffer_position = this.GUI.input.caption.length;
	if (!this.CLI.initiated)
	{
		this.updateSuggestions();
		this.CLI.initiated = true;
	}
};

Autociv_CLI_GUI.prototype.evalInput = function (text = this.GUI.input.caption)
{
	let representation = "";
	try
	{
		let result = eval(text);
		representation = this.CLI.getObjectRepresentation(result, undefined, undefined, false);
		warn(text + " -> " + representation.slice(0, 200))
	}
	catch (er)
	{
		error(er.toString());
		return representation;
	}

	text = text.split("=")[0].trim();
	let entry = this.CLI.getEntry(text);
	if (!entry)
		return representation;

	if (typeof entry.parent == "object" && entry.token.value in entry.parent)
	{
		this.CLI.inspectorSettings.lastEntry = entry;
		this.updateObjectInspector(entry.parent[entry.token.value], text);
	}

	return representation;
};

Autociv_CLI_GUI.prototype.updateSuggestionList = function (entry, suggestions)
{
	this.GUI.suggestions.list = this.CLI.getFormattedSuggestionList(entry, suggestions);
	this.CLI.list_data = [];
	this.CLI.prefix = entry.prefix;

	this.GUI.suggestions.size = Object.assign(this.GUI.suggestions.size, {
		"bottom": Math.min(suggestions.length * this.vlineSize, this.suggestionsMaxVisibleSize)
	});

	this.CLI.list_data = suggestions.map(value => this.CLI.accessFormat(value, entry.token.access, entry.entry.type != "array"));
}

Autociv_CLI_GUI.prototype.processPrefixes = function (text)
{
	let original = text;

	// Toggle own property names search
	if (text.startsWith("p?"))
	{
		this.CLI.seeOwnPropertyNames = !this.CLI.seeOwnPropertyNames;
		text = text.slice(2);
	}
	// searchFilter prefix
	else if (/^\w{0,1}\?.*/.test(text))
	{
		if (text[0] == "?")
		{
			this.CLI.searchFilter = "";
			text = text.slice(1);
			this.GUI.sortMode.size = Object.assign(this.GUI.sortMode.size, {
				"left": 0
			});
		}
		else if (text[0] in this.CLI.searchFilterKeys)
		{
			this.CLI.searchFilter = text[0];
			text = text.slice(2);

			let type = this.CLI.searchFilterKeys[this.CLI.searchFilter];
			this.GUI.sortMode.caption = type.slice(0, 6);
			this.GUI.sortMode.textcolor = this.CLI.style.type[type] || this.CLI.style.type["default"];
			this.GUI.sortMode.size = Object.assign(this.GUI.sortMode.size, {
				"left": -50
			});
		}
	}

	// Caption setter doesn't trigger a textedit event (no infinite loop)
	this.GUI.input.caption = text;
	this.GUI.input.buffer_position = Math.max(0, this.GUI.input.buffer_position - (original.length - text.length));

	return text;
};

Autociv_CLI_GUI.prototype.updateSuggestions = function (text = this.GUI.input.caption, lookForPrefixes = true)
{
	let time = Engine.GetMicroseconds();
	if (lookForPrefixes)
		text = this.processPrefixes(text);

	let entry = this.CLI.getEntry(text);
	if (!entry)
		return;

	let suggestions = this.CLI.getSuggestions(entry)
	if (!suggestions)
		return;

	this.updateSuggestionList(entry, suggestions);

	if (typeof entry.parent == "object" && entry.token.value in entry.parent)
	{
		this.CLI.inspectorSettings.lastEntry = entry;
		this.updateObjectInspector(entry.parent[entry.token.value]);
	}

	this.CLI.suggestionsSettings.genTime = Engine.GetMicroseconds() - time;
};

Autociv_CLI_GUI.prototype.tab = function ()
{
	if (this.CLI.list_data.length)
	{
		this.GUI.input.caption = this.CLI.prefix + this.CLI.list_data[0];
		this.GUI.input.buffer_position = this.GUI.input.caption.length;
	}
	this.updateSuggestions();
};

Autociv_CLI_GUI.prototype.updateObjectInspector = function (object, text = this.GUI.input.caption)
{
	let time = Engine.GetMicroseconds();
	this.CLI.lastVariableNameExpressionInspector = text;
	let result = `${this.escape(text.split("=")[0].trim())} : ${this.CLI.getObjectRepresentation(object)} `;
	this.GUI.inspector.caption = "";
	// Count number of lines
	let nLines1 = (result.match(/\n/g) || '').length + 1;
	let nLines2 = Math.ceil(result.length / 100);
	this.GUI.inspector.size = Object.assign(this.GUI.inspector.size, {
		"bottom": Math.min(Math.max(nLines1, nLines2) * this.vlineSize, this.inspectorMaxVisibleSize)
	});
	this.GUI.inspector.caption = result;
	this.CLI.inspectorSettings.genTime = Engine.GetMicroseconds() - time;
};
