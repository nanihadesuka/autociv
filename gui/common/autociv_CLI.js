function Autociv_CLI(GUI)
{
	this.GUI = GUI;
	this.GUIInput = this.GUI.children[0];
	this.GUIStdOut = this.GUI.children[1];
	this.GUIInputFilter = this.GUI.children[1];
	this.GUIList = this.GUIInput.children[0];
	this.GUIText = this.GUIList.children[0];

	this.GUIInput.sprite = "color:" + this.style.input.background;
	this.GUIInput.font = this.style.font;
	this.GUIInput.textcolor = this.style.input.text;
	this.GUIInput.textcolor_selected = this.style.input.text_selected;
	this.GUIInput.sprite_selectarea = "color:" + this.style.input.area_selected;
	this.GUIInput.tooltip = "Press Enter to eval expression";

	this.GUIStdOut.sprite = "color:" + this.style.stdout.background;
	this.GUIStdOut.font = this.style.font;
	this.GUIStdOut.textcolor = this.style.stdout.text;
	this.GUIStdOut.textcolor_selected = this.style.stdout.text_selected;
	this.GUIStdOut.sprite_selectarea = "color:" + this.style.stdout.area_selected;

	this.GUIList.sprite = "color:" + this.style.suggestions.background;
	this.GUIList.font = this.style.font;
	this.GUIList.textcolor = this.style.suggestions.text;

	this.GUIText.sprite = "color: " + this.style.inspector.background;
	this.GUIText.font = this.style.font;
	this.GUIText.textcolor = this.style.inspector.text;

	this.GUI.onPress = this.toggle.bind(this);
	this.GUIInput.onTextEdit = this.updateSuggestions.bind(this);
	this.GUIInput.onTab = this.tab.bind(this);
	this.GUIInput.onPress = this.evalInput.bind(this);
	this.GUIStdOut.onPress = this.toggleStdOut.bind(this);
	this.GUIList.onSelectionChange = this.inspectSelectedSuggestion.bind(this);
	this.GUIList.onMouseLeftDoubleClick = this.setSelectedSuggestion.bind(this);

	this.lastEntry = undefined;
	this.inspectorSettings = {
		"getTickPeriod": () => Math.min(1, Math.ceil(this.inspectorSettings.genTime / 16666)),
		"tickCount": 0,
		"update": true,
		"genTime": 0
	};
	this.suggestionsSettings = {
		"getTickPeriod": () => Math.min(1, Math.ceil(this.suggestionsSettings.genTime / 16666)),
		"tickCount": 0,
		"update": true,
		"genTime": 0
	};

	this.GUI.onTick = this.onTick.bind(this);

	if (false)
	{
		global["test_Set"] = new Set([1, "hello", { "test": 2 }, null])
		global["test_Map"] = new Map([
			[2, 1],
			[2, "hello"],
			[{ "test": 2 }, null],
			["test_Set", test_Set]
		])
		global["test_WeakSet"] = new WeakSet()
		global["test_WeakMap"] = new WeakMap()
		test_WeakSet.add({ "as": 3 })
		test_WeakMap.set({ "as": 2 }, "asd")

		global["test_Int8Array"] = new Int8Array([1, 2, 3, 4, 5, 6]);
		global["test_Uint8Array"] = new Uint8Array();
		global["test_Uint8ClampedArray"] = new Uint8ClampedArray();
		global["test_Int16Array"] = new Int16Array();
		global["test_Uint16Array"] = new Uint16Array();
		global["test_Int32Array"] = new Int32Array();
		global["test_Uint32Array"] = new Uint32Array();
		global["test_Float32Array"] = new Float32Array();
		global["test_Float64Array"] = new Float64Array();
		// global["test_BigInt64Array"] = new BigInt64Array();
		// global["test_BigUint64Array"] = new BigUint64Array();}

		// setTimeout(() =>
		// {
		// 	// this.GUIInput.caption = `g_TradeDialog.barterPanel.barterButtonManager.buttons[0].`;
		// 	// this.GUIInput.caption = `a?g_ChatMessages[`;
		// 	// this.GUIInput.caption = `autociv_matchsort.`;
		// 	// this.GUIInput.caption = `a?g_CivData.athen.`;
		// 	// this.GUIInput.caption = `test_Int8Array`;
		// 	this.GUIInput.caption = `Engine`;
		// 	this.toggle();
		// }, 20)


		// this.GUIInput.caption = `g_Autociv_Tic`;
		this.GUIInput.caption = `g_GameList`;
		this.toggle();
		this.toggleStdOut();
	}
}

Autociv_CLI.prototype.functionParameterCandidates = {}
Autociv_CLI.prototype.initiated = false;
Autociv_CLI.prototype.suggestionsMaxVisibleSize = 350
Autociv_CLI.prototype.inspectorMaxVisibleSize = 350;
Autociv_CLI.prototype.stdOutMaxVisibleSize = 250;
Autociv_CLI.prototype.vlineSize = 19.2;
Autociv_CLI.prototype.spacing = " ".repeat(8);
Autociv_CLI.prototype.list_data = [];
Autociv_CLI.prototype.prefix = "";
Autociv_CLI.prototype.showDepth = 2;
Autociv_CLI.prototype.previewLength = 100;
Autociv_CLI.prototype.searchFilter = "";
Autociv_CLI.prototype.seeOwnPropertyNames = false;
Autociv_CLI.prototype.lastVariableNameExpressionInspector = "";

Autociv_CLI.prototype.functionAutocomplete = new Map([
	[Engine && Engine.GetGUIObjectByName, "guiObjectNames"],
	["GetTemplateData" in global && GetTemplateData, "templateNames"],
	[Engine && Engine.GetTemplate, "templateNames"],
	[Engine && Engine.TemplateExists, "templateNames"],
]);

Autociv_CLI.prototype.functionParameterCandidatesLoader = {
	"guiObjectNames": () =>
	{
		let list = [];
		let internal = 0;

		let traverse = parent => parent.children.forEach(child =>
		{
			if (child.name.startsWith("__internal("))
				++internal;
			else
				list.push(child.name)
			traverse(child);
		});

		while (true)
		{
			let object = Engine.GetGUIObjectByName(`__internal(${internal})`);
			if (!object)
				break;

			// Go to root
			while (object.parent != null)
				object = object.parent;

			traverse(object);
			++internal;
		}
		return list;
	},
	"templateNames": () =>
	{
		const prefix = "simulation/templates/";
		const suffix = ".xml";
		return Engine.ListDirectoryFiles(prefix, "*" + suffix, true).
			map(t => t.slice(prefix.length, -suffix.length));
	}
}

Autociv_CLI.prototype.searchFilterKeys = {
	"u": "undefined",
	"b": "boolean",
	"n": "number",
	"i": "bigint",
	"s": "string",
	"f": "function",
	"l": "null",
	"a": "array",
	"o": "object"
};

Autociv_CLI.prototype.style = {
	"input": {
		"background": "90 90 90",
		"text": "245 245 245",
		"text_selected": "255 255 255",
		"area_selected": "69 200 161"
	},
	"stdout": {
		"background": "60 60 60",
		"text": "245 245 245",
		"text_selected": "255 255 255",
		"area_selected": "69 200 161"
	},
	"suggestions": {
		"background": "10 10 10",
		"text": "220 220 220",
	},
	"inspector": {
		"background": "45 45 45",
		"text": "230 230 230",
	},
	"searchFilter": {
		"background": "55 55 55",
		"text": "210 210 210",
	},
	"typeTag": "128 81 102",
	"type": {
		"array": "167 91 46",
		"object": "193 152 43",
		"string": "206 145 120",
		"bigint": "127 179 71",
		"number": "127 179 71",
		"boolean": "78 201 176",
		"undefined": "128 41 131",
		"symbol": "218 162 0",
		"function": "78 118 163",
		"null": "12 234 0",
		"default": "86 156 214",
		"Set": "86 156 214",
		"Map": "86 156 214",
	},
	"font": "sans-bold-14",
};

Autociv_CLI.prototype.onTick = function ()
{

	if (this.GUI.hidden || !this.lastEntry)
		return;

	this.inspectorSettings.tickCount += 1;
	this.inspectorSettings.tickCount %= this.inspectorSettings.getTickPeriod();
	if (this.inspectorSettings.update &&
		!this.inspectorSettings.tickCount &&
		this.inspectorSettings.genTime < 5000)
	{
		let object = this.lastEntry.parent[this.lastEntry.token.value];
		this.updateObjectInspector(object, this.lastVariableNameExpressionInspector);
		this.inspectorSettings.tickCount = 1;
	}

	this.suggestionsSettings.tickCount += 1;
	this.suggestionsSettings.tickCount %= this.suggestionsSettings.getTickPeriod();
	if (this.suggestionsSettings.update &&
		!this.suggestionsSettings.tickCount &&
		this.suggestionsSettings.genTime < 5000 * 2)
	{
		this.updateSuggestions(undefined, this.GUIInput.caption, false);
		this.suggestionsSettings.tickCount = 1;
	}
}

Autociv_CLI.prototype.toggleStdOut = function ()
{
	if (this.GUI.hidden)
		return;

	this.GUIStdOut.hidden = !this.GUIStdOut.hidden;
	if (this.GUIStdOut.hidden)
		return;

	if (!this.lastEntry)
		return;

	let object = this.lastEntry.parent[this.lastEntry.token.value];
	let result = this.getObjectRepresentationUnformatted(object);
	// Count number of lines
	this.GUIStdOut.caption = "";
	let nLines1 = (result.match(/\n/g) || '').length + 1;
	let nLines2 = Math.ceil(result.length / 100);
	this.GUIStdOut.size = Object.assign(this.GUIStdOut.size, {
		"top": -Math.min(Math.max(nLines1, nLines2) * this.vlineSize, this.stdOutMaxVisibleSize) - 5
	});

	this.GUIStdOut.caption = result;
}

Autociv_CLI.prototype.getFunctionParameterCandidates = function (functionObject)
{
	if (!this.functionAutocomplete.has(functionObject))
		return;

	let parameterName = this.functionAutocomplete.get(functionObject);
	if (!(parameterName in this.functionParameterCandidates))
		this.functionParameterCandidates[parameterName] = this.functionParameterCandidatesLoader[parameterName]();

	return this.functionParameterCandidates[parameterName];
}

Autociv_CLI.prototype.sort = function (value, candidates)
{
	return autociv_matchsort(value, candidates);
};

Autociv_CLI.prototype.sortSearchFilter = function (parent, candidates)
{
	if (!(this.searchFilter in this.searchFilterKeys))
		return candidates;

	let type = this.searchFilterKeys[this.searchFilter];

	return candidates.sort((a, b) =>
	{
		let isa = this.getType(parent[a]) == type;
		let isb = this.getType(parent[b]) == type;
		if (isa && isb || !isa && !isb)
			return 0;
		if (isa)
			return -1;
		return +1;
	});
};

Autociv_CLI.prototype.getType = function (val)
{
	let type = typeof val;
	switch (type)
	{
		case "object": {
			if (val === null) return "null";
			if (Array.isArray(val)) return "array";
			if (val instanceof Set) return "Set";
			if (val instanceof Map) return "Map";
			if (val instanceof WeakMap) return "WeakMap";
			if (val instanceof WeakSet) return "WeakSet";
			if (val instanceof Int8Array) return "Int8Array"
			if (val instanceof Uint8Array) return "Uint8Array"
			if (val instanceof Uint8ClampedArray) return "Uint8ClampedArray"
			if (val instanceof Int16Array) return "Int16Array"
			if (val instanceof Uint16Array) return "Uint16Array"
			if (val instanceof Int32Array) return "Int32Array"
			if (val instanceof Uint32Array) return "Uint32Array"
			if (val instanceof Float32Array) return "Float32Array"
			if (val instanceof Float64Array) return "Float64Array"
			// if (val instanceof BigInt64Array) return "BigInt64Array"
			// if (val instanceof BigUint64Array) return "BigUint64Array"
			else return type;
		}
		case "undefined":
		case "boolean":
		case "number":
		case "bigint":
		case "string":
		case "symbol":
		case "function":
			return type;
		default:
			return type;
	}
};

Autociv_CLI.prototype.accessFormat = function (value, access, isString)
{
	switch (access)
	{
		case "dot": return `.${value}`;
		case "bracket": return isString ? `["${value}"]` : `[${value}]`;
		case "parenthesis": return isString ? `("${value}")` : `(${value})`
		case "word": return `${value}`;
		default: return `${value}`;
	}
};

// escapeText from a24
Autociv_CLI.prototype.escape = function (obj)
{
	return obj.toString().replace(/\\/g, "\\\\").replace(/\[/g, "\\[");
};

Autociv_CLI.prototype.coloredAccessFormat = function (value, access, isString, type)
{
	// ****** REMBER TO ESCAPE STRINGS BY HAND ******
	const color = this.style.type[type] || this.style.type.default;
	value = `[color="${color}"]${this.escape(value)}[/color]`;
	switch (access)
	{
		case "dot": return `.${value}`;
		case "bracket": return isString ? `\\["${value}"]` : `\\[${value}]`;
		case "parenthesis": return isString ? `("${value}")` : `(${value})`
		case "word": return `${value}`;
		default: return `${value}`;
	}
};

Autociv_CLI.prototype.inspectSelectedSuggestion = function ()
{
	if (this.GUIList.selected == -1)
		return;

	let text = this.prefix + this.list_data[this.GUIList.selected];
	let entry = this.getEntry(text);
	if (!entry)
		return;

	if (typeof entry.parent == "object" && entry.token.value in entry.parent)
	{
		this.lastEntry = entry;
		this.updateObjectInspector(entry.parent[entry.token.value], text);
	}
};

Autociv_CLI.prototype.setSelectedSuggestion = function ()
{
	if (this.GUIList.selected == -1)
		return;

	this.GUIInput.caption = this.prefix + this.list_data[this.GUIList.selected];
	this.updateSuggestions()
	this.GUIInput.blur();
	this.GUIInput.focus();
	this.GUIInput.buffer_position = this.GUIInput.caption.length;
};

Autociv_CLI.prototype.toggle = function ()
{
	this.GUI.hidden = !this.GUI.hidden;
	if (this.GUI.hidden)
	{
		this.GUIInput.blur();
		return;
	}

	this.GUIInput.blur();
	this.GUIInput.focus();
	this.GUIInput.buffer_position = this.GUIInput.caption.length;
	if (!this.initiated)
	{
		this.updateSuggestions({});
		this.initiated = true;
	}
};

Autociv_CLI.prototype.evalInput = function (ev, text = this.GUIInput.caption)
{
	try { eval(text); }
	catch (er)
	{
		error(er.toString());
		return;
	}

	text = text.split("=")[0].trim();
	let entry = this.getEntry(text);
	if (!entry)
		return;

	if (typeof entry.parent == "object" && entry.token.value in entry.parent)
	{
		this.lastEntry = entry;
		this.updateObjectInspector(entry.parent[entry.token.value], text);
	}
};

Autociv_CLI.prototype.getTokens = function (text)
{
	let lex = text.split(/(\("?)|("?\))|(\["?)|("?\])|(\.)/g).filter(v => v)
	// lex ~~  ['word1', '.', 'word2', '["', 'word3', '"]', ...]

	if (!lex.length)
		lex = [""];

	let tokens = [];
	for (let i = 0; i < lex.length; ++i)
	{
		if (lex[i].startsWith("["))
		{
			let hasValue = false;
			let value = "";
			let hasClosure = false;
			let k = 1;
			while (i + k < lex.length)
			{
				if (lex[i + k].endsWith("]"))
				{
					hasClosure = true;
					break;
				}
				hasValue = true;
				value += lex[i + k];
				++k;
			}

			if (!hasClosure)
				value = value.replace(/"$/, "");

			tokens.push({
				"access": "bracket",
				"hasValue": hasValue,
				"hasClosure": hasClosure,
				"value": value,
				"valid": hasValue && hasClosure
			});
			i += k;
		}
		else if (lex[i].startsWith("("))
		{
			let hasValue = false;
			let value = "";
			let hasClosure = false;
			let k = 1;
			while (i + k < lex.length)
			{
				if (lex[i + k].endsWith(")"))
				{
					hasClosure = true;
					break;
				}
				hasValue = true;
				value += lex[i + k];
				++k;
			}

			if (!hasClosure)
				value = value.replace(/"$/, "");

			tokens.push({
				"access": "parenthesis",
				"hasValue": hasValue,
				"hasClosure": hasClosure,
				"value": value,
				"valid": hasValue && hasClosure
			});
			i += k;
		}
		else if (lex[i] == ".")
		{
			let hasValue = i + 1 in lex;
			tokens.push({
				"access": "dot",
				"hasValue": hasValue,
				"value": hasValue ? lex[i + 1] : "",
				"valid": hasValue
			});
			i += 1;
		}
		else
		{
			let hasValue = i in lex;
			tokens.push({
				"access": "word",
				"hasValue": hasValue,
				"value": lex[i],
				"valid": hasValue,
			});
		}
	}
	return tokens;
};

Autociv_CLI.prototype.getEntry = function (text)
{
	let tokens = this.getTokens(text);

	let object = global;
	let prefix = "";
	let prefixColored = "";

	let entry = {};

	// Dive into the nested object or array (but don't process last token)
	for (let i = 0; i < tokens.length - 1; ++i)
	{
		let token = tokens[i];
		entry = {
			"entry": entry,
			"parent": object,
			"prefix": prefix,
			"prefixColored": prefixColored,
			"token": token,
			"index": i
		};

		// "word" access must and can only be on the first token
		if (i == 0 && token.access != "word" || i != 0 && token.access == "word")
			return;

		let parentType = this.getType(object);
		let isMapGet = parentType == "Map" && token.value == "get";
		let validType = parentType == "array" ||
			parentType == "object" ||
			parentType == "function" ||
			isMapGet;
		if (!token.valid || !validType)
			return;

		if (isMapGet)
			object = object[token.value].bind(object);
		else
			object = object[token.value];

		prefix += this.accessFormat(token.value, token.access, parentType != "array");
		prefixColored += this.coloredAccessFormat(token.value, token.access, parentType != "array", parentType);
	}

	return {
		"entry": entry,
		"parent": object,
		"prefix": prefix,
		"prefixColored": prefixColored,
		"token": tokens[tokens.length - 1],
		"index": tokens.length - 1
	};
};

Autociv_CLI.prototype.getCandidates = function (object, access)
{
	let list = new Set();
	if (this.getType(object) == "function" && "prototype" in object)
		list.add("prototype");

	if ("__iterator__" in object)
		for (let k in object)
			list.add(k);


	if (this.seeOwnPropertyNames)
	{
		let proto = Object.getPrototypeOf(object);
		if (proto)
			for (let name of Object.getOwnPropertyNames(proto))
				if (name !== 'constructor' &&
					name !== "caller" &&
					name !== "callee" &&
					proto.hasOwnProperty(name) &&
					name != "arguments" &&
					!name.startsWith("__"))
					list.add(name);
	}

	if (this.getType(object) == "array")
	{
		if (access == "dot")
			return Array.from(list);
		else
			list = new Set();
	}

	for (let key of Object.keys(object))
		list.add(key)

	return Array.from(list);
};

Autociv_CLI.prototype.getSuggestions = function (entry)
{
	if (entry.token.access == "dot")
	{
		if (entry.index == 0)
			return;

		let parentType = this.getType(entry.parent);
		if (parentType != "object" && parentType != "function" && parentType != "array" &&
			parentType != "Map")
			return

		let candidates = this.getCandidates(entry.parent, entry.token.access);
		let results = entry.token.hasValue ?
			this.sort(entry.token.value, candidates) :
			this.sort("", candidates);
		results = this.sortSearchFilter(entry.parent, results);
		if (results.length == 1 && results[0] == entry.token.value)
			results = [];
		return results;
	}
	if (entry.token.access == "bracket")
	{
		if (entry.index == 0)
			return;

		let parentType = this.getType(entry.parent);
		if (parentType == "object" || parentType == "function")
		{
			let candidates = this.getCandidates(entry.parent);
			let results = entry.token.hasValue ?
				this.sort(entry.token.value.replace(/^"|"$/g, ""), candidates) :
				this.sort("", candidates);
			results = this.sortSearchFilter(entry.parent, results);
			if (entry.token.hasClosure && results.length && results[0] == entry.token.value)
				results = [];
			return results;
		}
		else if (parentType == "array")
		{
			let candidates = this.getCandidates(entry.parent, entry.token.access);
			let results = entry.token.hasValue ?
				this.sort(entry.token.value, candidates).sort((a, b) => (+a) - (+b)) :
				candidates;
			results = this.sortSearchFilter(entry.parent, results);
			if (entry.token.hasClosure && results.length && results[0] == entry.token.value)
				results = [];
			return results;
		}
	}
	if (entry.token.access == "word")
	{
		if (entry.index != 0)
			return;

		let candidates = this.getCandidates(entry.parent);
		let results = entry.token.hasValue ?
			this.sort(entry.token.value, candidates) :
			this.sort("", candidates);
		results = this.sortSearchFilter(entry.parent, results);
		if (results.length == 1 && results[0] == entry.token.value)
			results = [];
		return results;
	}
	if (entry.token.access == "parenthesis")
	{
		if (entry.index == 0)
			return;

		let candidates = [];
		if (entry.entry.token.value == "get" && entry.entry.parent instanceof Map)
			candidates = Array.from(entry.entry.parent.keys()).filter(v => this.getType(v) == "string")
		else
			candidates = this.getFunctionParameterCandidates(entry.parent);

		if (!candidates)
			return;

		let results = entry.token.hasValue ?
			this.sort(entry.token.value.replace(/^"|"$/g, ""), candidates) :
			this.sort("", candidates);
		if (entry.token.hasClosure && results.length && results[0] == entry.token.value)
			results = [];
		return results;
	}
};

Autociv_CLI.prototype.updateSuggestionList = function (entry, suggestions)
{
	let truncate = (text, start) =>
	{
		text = text.split("\n")[0];
		let alloted = this.previewLength - start - 3;
		return alloted < text.length ? text.slice(0, alloted) + "..." : text;
	}

	let isString = this.getType(entry.parent) != "array";
	this.GUIList.list = suggestions.map(value =>
	{
		if (entry.token.access == "parenthesis")
		{
			let text = entry.prefixColored;
			let type = this.getType(value);
			text += this.coloredAccessFormat(value, entry.token.access, type == "string", type);
			return text;
		}

		let type = this.getType(entry.parent[value]);
		let text = entry.prefixColored;
		text += this.coloredAccessFormat(value, entry.token.access, isString, type);

		// Show variable type
		text += ` [color="${this.style.typeTag}"]\\[${type}\\][/color]`;

		// Show preview
		let length = text.replace(/[^\\]\[.+[^\\]\]/g, "").replace(/\\\\\[|\\\\\]/g, " ").length;
		if (type == "boolean" || type == "number" || type == "bigint")
			text += " " + truncate(this.escape(`${entry.parent[value]}`), length);
		else if (type == "string")
			text += " " + truncate(this.escape(`"${entry.parent[value]}"`), length);

		return text;
	});
	this.list_data = [];
	this.prefix = entry.prefix;

	this.GUIList.size = Object.assign(this.GUIList.size, {
		"bottom": Math.min(suggestions.length * this.vlineSize, this.suggestionsMaxVisibleSize)
	});
	this.list_data = suggestions.map(value => this.accessFormat(value, entry.token.access, isString));
}

Autociv_CLI.prototype.processPrefixes = function (text)
{
	let original = text;

	if (text.startsWith("p?"))
	{
		this.seeOwnPropertyNames = !this.seeOwnPropertyNames;
		text = text.slice(2);
	}

	// searchFilter prefix
	if (/^\w{0,1}\?.*/.test(text))
	{
		if (text[0] == "?")
		{
			this.searchFilter = "";
			text = text.slice(1);
		}
		else if (text[0] in this.searchFilterKeys)
		{
			this.searchFilter = text[0];
			text = text.slice(2);
		}
	}

	// Caption setter doesn't trigger a textedit event (no infinite loop)
	this.GUIInput.caption = text;
	this.GUIInput.buffer_position = Math.max(0, this.GUIInput.buffer_position - (original.length - text.length));

	return text;
};

Autociv_CLI.prototype.updateSuggestions = function (event, text = this.GUIInput.caption, lookForPrefixes = true)
{
	let time = Engine.GetMicroseconds();
	if (lookForPrefixes)
		text = this.processPrefixes(text);

	let entry = this.getEntry(text);
	if (!entry)
		return;

	let suggestions = this.getSuggestions(entry)
	if (!suggestions)
		return;

	this.updateSuggestionList(entry, suggestions);

	if (typeof entry.parent == "object" && entry.token.value in entry.parent)
	{
		this.lastEntry = entry;
		this.updateObjectInspector(entry.parent[entry.token.value]);
	}

	this.suggestionsSettings.genTime = Engine.GetMicroseconds() - time;
};

Autociv_CLI.prototype.tab = function ()
{
	if (this.list_data.length)
	{
		this.GUIInput.caption = this.prefix + this.list_data[0];
		this.GUIInput.buffer_position = this.GUIInput.caption.length;
	}
	this.updateSuggestions();
};

Autociv_CLI.prototype.getObjectRepresentation = function (obj, depth = this.showDepth, prefix = "")
{
	let type = this.getType(obj);
	let typeTag = ` [color="${this.style.typeTag}"]\\[${type}\\][/color]`;

	if (depth < 1 && (type == "array" || type == "object" || type == "function"))
		return "..." + typeTag;

	if (obj == global)
		depth = Math.min(1, depth);

	let f = (t, v) => `[color="${this.style.type[t] || this.style.type["default"]}"]${this.escape(v)}[/color] `;

	switch (type)
	{
		case "undefined": return f(type, "undefined") + typeTag;
		case "boolean": return f(type, obj) + typeTag;
		case "number": return f(type, obj) + typeTag;
		case "bigint": return f(type, obj) + typeTag;
		case "symbol": return typeTag;
		case "null": return f(type, "null") + typeTag;
		case "string": {
			obj = obj.split("\n").map(t => prefix + t);
			obj[0] = obj[0].slice(prefix.length);
			obj = obj.join("\n");
			return '"' + f(type, obj) + '"' + typeTag;
		}
		case "function": {
			if (prefix)
				return typeTag;
			try
			{
				return this.escape(obj.toSource()).replace(/	|\r/g, this.spacing);
			}
			catch (error)
			{
				return typeTag + " Unable to print function \\[https://bugzilla.mozilla.org/show_bug.cgi?id=1440468\\]";
			}
		}
		case "array": {
			if (!obj.length)
				return `\\[ \\]`;

			let output = obj.map((val, index) =>
			{
				return prefix + this.spacing + (this.getType(val) == "object" ? index + " : " : "") +
					this.getObjectRepresentation(
						val,
						val == global ? 0 : depth - 1,
						prefix + this.spacing);
			}).join(",\n");

			return `\\[ \n${output} \n${prefix} \\]`;
		}
		case "object": {
			let list = this.getCandidates(obj);
			if (!list.length)
				return `{ }`;

			let output = list.map(key =>
			{
				return prefix + this.spacing + this.escape(key) + " : " +
					this.getObjectRepresentation(
						obj[key],
						obj[key] == global ? 0 : depth - 1,
						prefix + this.spacing);
			}).join(",\n");

			return `{ \n${output} \n${prefix} }`;
		}
		case "Set": {
			let list = Array.from(obj);
			if (!list.length)
				return `Set { }`;

			let output = list.map(value =>
			{
				return prefix + this.spacing +
					this.getObjectRepresentation(
						value,
						value == global ? 0 : depth - 1,
						prefix + this.spacing);
			}).join(",\n");

			return `Set { \n${output} \n${prefix} }`;
		}
		case "Map": {
			let list = Array.from(obj);
			if (!list.length)
				return `Map { }`;

			let output = list.map(([key, value]) =>
			{
				return prefix + this.spacing +
					this.getObjectRepresentation(
						key,
						key == global ? 0 : depth - 1,
						prefix + this.spacing) + " => " +
					this.getObjectRepresentation(
						value,
						value == global ? 0 : depth - 1,
						prefix + this.spacing);
			}).join(",\n");

			return `Map { \n${output} \n${prefix} }`;
		}
		case "Int8Array":
		case "Uint8Array":
		case "Uint8ClampedArray":
		case "Int16Array":
		case "Uint16Array":
		case "Int32Array":
		case "Uint32Array":
		case "Float32Array":
		case "Float64Array": {
			let list = Array.from(obj);
			if (!list.length)
				return `\\[ \\]`;

			let output = list.map((val, index) =>
			{
				return prefix + this.spacing + f("number", val);
			}).join(",\n");

			return `\\[ \n${output} \n${prefix} \\]` + typeTag;
		}
		default: return typeTag;
	}
}

Autociv_CLI.prototype.getObjectRepresentationUnformatted = function (obj, depth = this.showDepth, prefix = "")
{
	let type = this.getType(obj);

	if (depth < 1 && (type == "array" || type == "object" || type == "function"))
		return "...";

	if (obj == global)
		depth = Math.min(1, depth);

	switch (type)
	{
		case "undefined": return "undefined";
		case "boolean": return obj ? "true" : "false";
		case "number": return `${obj}`;
		case "bigint": return `${obj}`;
		case "symbol": return "Symbol";
		case "null": return "null";
		case "string":
			return `"${obj}"`;
		case "function": {
			if (prefix)
				return "function";
			try
			{
				return obj.toSource().replace(/	|\r/g, this.spacing);
			}
			catch (error)
			{
				return "Proxy";
			}
		}
		case "array": {
			if (!obj.length)
				return `[ ]`;

			let output = obj.map((val, index) =>
			{
				return prefix + this.spacing + (this.getType(val) == "object" ? index + " : " : "") +
					this.getObjectRepresentationUnformatted(
						val,
						val == global ? 0 : depth - 1,
						prefix + this.spacing);
			}).join(",\n");
			return `[ \n${output} \n${prefix} ]`;
		}
		case "object": {
			let list = this.getCandidates(obj);
			if (!list.length)
				return `{ }`;

			let output = list.map(key =>
			{
				return prefix + this.spacing + key + " : " +
					this.getObjectRepresentationUnformatted(
						obj[key],
						obj[key] == global ? 0 : depth - 1,
						prefix + this.spacing);
			}).join(",\n");


			return `{ \n${output} \n${prefix} }`;
		}
		case "Set": {
			let list = Array.from(obj);
			if (!list.length)
				return `Set { }`;

			let output = list.map(value =>
			{
				return prefix + this.spacing +
					this.getObjectRepresentationUnformatted(
						value,
						value == global ? 0 : depth - 1,
						prefix + this.spacing);
			}).join(",\n");

			return `Set { \n${output} \n${prefix} }`;
		}
		case "Map": {
			let list = Array.from(obj);
			if (!list.length)
				return `Map { }`;

			let output = list.map(([key, value]) =>
			{
				return prefix + this.spacing +
					this.getObjectRepresentationUnformatted(
						key,
						key == global ? 0 : depth - 1,
						prefix + this.spacing) + " => " +
					this.getObjectRepresentationUnformatted(
						value,
						value == global ? 0 : depth - 1,
						prefix + this.spacing);
			}).join(",\n");

			return `Map { \n${output} \n${prefix} }`;
		}
		case "Int8Array":
		case "Uint8Array":
		case "Uint8ClampedArray":
		case "Int16Array":
		case "Uint16Array":
		case "Int32Array":
		case "Uint32Array":
		case "Float32Array":
		case "Float64Array": {
			let list = Array.from(obj);
			if (!list.length)
				return `[ ]`;

			let output = list.map((val, index) =>
			{
				return prefix + this.spacing + `${val}`;
			}).join(",\n");

			return `[ \n${output} \n${prefix} ]`;
		}
		default: return "";
	}
}

Autociv_CLI.prototype.updateObjectInspector = function (object, text = this.GUIInput.caption)
{
	let time = Engine.GetMicroseconds();
	this.lastVariableNameExpressionInspector = text;
	let result = `${this.escape(text.split("=")[0].trim())} : ${this.getObjectRepresentation(object)} `;
	this.GUIText.caption = "";
	// Count number of lines
	let nLines1 = (result.match(/\n/g) || '').length + 1;
	let nLines2 = Math.ceil(result.length / 100);
	this.GUIText.size = Object.assign(this.GUIText.size, {
		"bottom": Math.min(Math.max(nLines1, nLines2) * this.vlineSize, this.inspectorMaxVisibleSize)
	});
	this.GUIText.caption = result;
	this.inspectorSettings.genTime = Engine.GetMicroseconds() - time;
};
