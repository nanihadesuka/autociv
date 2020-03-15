function Autociv_CLI(gui)
{
	this.GUI = {};
	this.GUI.gui = gui;
	this.GUI.input = this.GUI.gui.children[0];
	this.GUI.stdout = this.GUI.gui.children[1];
	this.GUI.suggestions = this.GUI.input.children[0];
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
	this.GUI.suggestions.onSelectionChange = () => this.inspectSelectedSuggestion();
	this.GUI.suggestions.onMouseLeftDoubleClick = () => this.setSelectedSuggestion();

	this.inspectorSettings = {
		"update": true,
		"genTime": 0,
		"genTimeMax": 5000,
		"check": function ()
		{
			return this.update && this.genTime < this.genTimeMax;
		},
		"lastEntry": undefined
	};

	this.suggestionsSettings = {
		"update": true,
		"genTime": 0,
		"genTimeMax": 5000 * 2,
		"check": function ()
		{
			return this.update && this.genTime < this.genTimeMax;
		}
	};

	this.GUI.gui.onTick = this.onTick.bind(this);
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
		}
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

	if (this.GUI.gui.hidden || !this.inspectorSettings.lastEntry)
		return;

	if (this.inspectorSettings.check())
		this.updateObjectInspector(
			this.inspectorSettings.lastEntry.parent[this.inspectorSettings.lastEntry.token.value],
			this.lastVariableNameExpressionInspector);

	if (this.suggestionsSettings.check())
		this.updateSuggestions(this.GUI.input.caption, false);
}

Autociv_CLI.prototype.stdoutToggle = function ()
{
	if (this.GUI.gui.hidden)
		return;

	this.GUI.stdout.hidden = !this.GUI.stdout.hidden;
	if (this.GUI.stdout.hidden)
		return;

	if (!this.inspectorSettings.lastEntry)
		return;

	let object = this.inspectorSettings.lastEntry.parent[this.inspectorSettings.lastEntry.token.value];
	let result = this.getObjectRepresentation(object, undefined, undefined, false);
	// Count number of lines
	this.GUI.stdout.caption = "";
	let nLines1 = (result.match(/\n/g) || '').length + 1;
	let nLines2 = Math.ceil(result.length / 100);
	this.GUI.stdout.size = Object.assign(this.GUI.stdout.size, {
		"top": -Math.min(Math.max(nLines1, nLines2) * this.vlineSize, this.stdOutMaxVisibleSize) - 5
	});

	this.GUI.stdout.caption = result;
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
		if (isa == isb)
			return 0;
		if (isa)
			return -1;
		return +1;
	});
};

Autociv_CLI.prototype.getType = function (val)
{
	const type = typeof val;
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

Autociv_CLI.prototype.accessFormat = function (value, access, isString, colored = false, type)
{
	const esc = (text) => colored ? this.escape(text) : text;

	if (colored)
	{
		const color = this.style.type[type] || this.style.type.default;
		value = `[color="${color}"]${esc(value)}[/color]`;
	}

	switch (access)
	{
		case "dot": return `.${value}`;
		case "bracket": return isString ?
			esc(`["`) + value + esc(`"]`) :
			esc(`[`) + value + esc(`]`);
		case "parenthesis": return isString ?
			esc(`("`) + value + esc(`")`) :
			esc(`(`) + value + esc(`)`);
		case "word": return `${value}`;
		default: return `${value}`;
	}
};

// escapeText from a24
Autociv_CLI.prototype.escape = function (obj)
{
	return obj.toString().replace(/\\/g, "\\\\").replace(/\[/g, "\\[");
};

Autociv_CLI.prototype.inspectSelectedSuggestion = function ()
{
	if (this.GUI.suggestions.selected == -1)
		return;

	let text = this.prefix + this.list_data[this.GUI.suggestions.selected];
	let entry = this.getEntry(text);
	if (!entry)
		return;

	if (typeof entry.parent == "object" && entry.token.value in entry.parent)
	{
		this.inspectorSettings.lastEntry = entry;
		this.updateObjectInspector(entry.parent[entry.token.value], text);
	}
};

Autociv_CLI.prototype.setSelectedSuggestion = function ()
{
	if (this.GUI.suggestions.selected == -1)
		return;

	this.GUI.input.caption = this.prefix + this.list_data[this.GUI.suggestions.selected];
	this.updateSuggestions()
	this.GUI.input.blur();
	this.GUI.input.focus();
	this.GUI.input.buffer_position = this.GUI.input.caption.length;
};

Autociv_CLI.prototype.toggle = function ()
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
	if (!this.initiated)
	{
		this.updateSuggestions();
		this.initiated = true;
	}
};

Autociv_CLI.prototype.evalInput = function (text = this.GUI.input.caption)
{
	try
	{
		let result = eval(text);
		warn(text + " -> " + this.getObjectRepresentation(result, undefined, undefined, false).slice(0, 200))
	}
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
		this.inspectorSettings.lastEntry = entry;
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
		prefixColored += this.accessFormat(token.value, token.access, parentType != "array", true, parentType);
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
	this.GUI.suggestions.list = suggestions.map(value =>
	{
		if (entry.token.access == "parenthesis")
		{
			let text = entry.prefixColored;
			let type = this.getType(value);
			text += this.accessFormat(value, entry.token.access, type == "string", true, type);
			return text;
		}

		let type = this.getType(entry.parent[value]);
		let text = entry.prefixColored;
		text += this.accessFormat(value, entry.token.access, isString, true, type);

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

	this.GUI.suggestions.size = Object.assign(this.GUI.suggestions.size, {
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
	this.GUI.input.caption = text;
	this.GUI.input.buffer_position = Math.max(0, this.GUI.input.buffer_position - (original.length - text.length));

	return text;
};

Autociv_CLI.prototype.updateSuggestions = function (text = this.GUI.input.caption, lookForPrefixes = true)
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
		this.inspectorSettings.lastEntry = entry;
		this.updateObjectInspector(entry.parent[entry.token.value]);
	}

	this.suggestionsSettings.genTime = Engine.GetMicroseconds() - time;
};

Autociv_CLI.prototype.tab = function ()
{
	if (this.list_data.length)
	{
		this.GUI.input.caption = this.prefix + this.list_data[0];
		this.GUI.input.buffer_position = this.GUI.input.caption.length;
	}
	this.updateSuggestions();
};

Autociv_CLI.prototype.getObjectRepresentation = function (obj, depth = this.showDepth, prefix = "", format = true)
{
	const type = this.getType(obj);
	const typeTag = format ?
		` [color="${this.style.typeTag}"]` + this.escape("[") + type + this.escape("]") + `[/color]` :
		"";

	if (depth < 1 && (type == "array" || type == "object" || type == "function"))
		return "..." + typeTag;

	if (obj == global)
		depth = Math.min(1, depth);


	const colorize = (type, text) => format ?
		`[color="${this.style.type[type] || this.style.type["default"]}"]${this.escape(text)}[/color]` :
		`${text}`;

	const childPrefix = prefix + this.spacing;
	const representChild = child => this.getObjectRepresentation(child, depth - 1, childPrefix, format);
	const esc = text => format ? this.escape(text) : text;
	const interate = (list, func, intro, outro) =>
	{
		if (!list.length)
			return esc(intro) + " " + esc(outro);
		return esc(intro) + "\n" +
			list.map(func).join(",\n") + "\n" +
			prefix + esc(outro);
	};

	switch (type)
	{
		case "undefined": return colorize(type, type) + typeTag;
		case "boolean": return colorize(type, obj) + typeTag;
		case "number": return colorize(type, obj) + typeTag;
		case "bigint": return colorize(type, obj) + typeTag;
		case "symbol": return colorize(type, type) + typeTag;
		case "null": return colorize(type, type) + typeTag;
		case "string": {
			if (format)
			{
				obj = obj.split("\n").map(t => prefix + t);
				obj[0] = obj[0].slice(prefix.length);
				obj = obj.join("\n");
			}
			return '"' + colorize(type, obj) + '"' + typeTag;
		}
		case "function": {
			if (prefix)
				return format ? typeTag : "function";
			try
			{
				return esc(obj.toSource()).replace(/	|\r/g, this.spacing);
			}
			catch (error)
			{
				return format ?
					typeTag + this.escape("Unable to print function [https://bugzilla.mozilla.org/show_bug.cgi?id=1440468]") :
					"Proxy"
			}
		}
		case "array": {
			let child = (val, index) => childPrefix +
				(this.getType(val) == "object" ? index + " : " : "") +
				representChild(val);

			return interate(obj, child, "[", "]");
		}
		case "object": {
			let list = this.getCandidates(obj);
			let child = key => childPrefix + esc(key) + " : " +
				representChild(obj[key]);

			return interate(list, child, "{", "}");
		}
		case "Set": {
			let list = Array.from(obj);
			let child = value => childPrefix + representChild(value);

			return interate(list, child, "Set {", "}");
		}
		case "Map": {
			let list = Array.from(obj);
			let child = ([key, value]) => childPrefix + representChild(key) +
				" => " + representChild(value);

			return interate(list, child, "Map {", "}");
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
			let child = (val, index) => childPrefix + colorize("number", val);
			return interate(list, child, "[", "]");
		}
		default: return typeTag;
	}
}

Autociv_CLI.prototype.updateObjectInspector = function (object, text = this.GUI.input.caption)
{
	let time = Engine.GetMicroseconds();
	this.lastVariableNameExpressionInspector = text;
	let result = `${this.escape(text.split("=")[0].trim())} : ${this.getObjectRepresentation(object)} `;
	this.GUI.inspector.caption = "";
	// Count number of lines
	let nLines1 = (result.match(/\n/g) || '').length + 1;
	let nLines2 = Math.ceil(result.length / 100);
	this.GUI.inspector.size = Object.assign(this.GUI.inspector.size, {
		"bottom": Math.min(Math.max(nLines1, nLines2) * this.vlineSize, this.inspectorMaxVisibleSize)
	});
	this.GUI.inspector.caption = result;
	this.inspectorSettings.genTime = Engine.GetMicroseconds() - time;
};
