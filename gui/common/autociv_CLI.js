function Autociv_CLI(GUI)
{
	this.GUI = GUI;
	this.GUIInput = this.GUI.children[0];
	this.GUIInputFilter = this.GUI.children[1];
	this.GUIList = this.GUIInput.children[0];
	this.GUIText = this.GUIList.children[0];

	this.GUIInput.sprite = "color:" + this.style.input.background;
	this.GUIInput.font = this.style.font;
	this.GUIInput.textcolor = this.style.input.text;
	this.GUIInput.textcolor_selected = this.style.input.text_selected;
	this.GUIInput.sprite_selectarea = "color:" + this.style.input.area_selected;
	this.GUIInput.tooltip = "Press Enter to eval expression";

	this.GUIList.sprite = "color:" + this.style.suggestions.background;
	this.GUIList.font = this.style.font;
	this.GUIList.textcolor = this.style.suggestions.text;

	this.GUIText.sprite = "color: " + this.style.inspector.background;
	this.GUIText.font = this.style.font;
	this.GUIText.textcolor = this.style.inspector.text;

	this.GUI.onPress = this.toggle.bind(this);
	this.GUIInput.onTextedit = this.updateSuggestions.bind(this);
	this.GUIInput.onTab = this.tab.bind(this);
	this.GUIInput.onPress = this.evalInput.bind(this);
	this.GUIList.onSelectionChange = this.inspectSelectedSuggestion.bind(this);
	this.GUIList.onMouseLeftDoubleClick = this.setSelectedSuggestion.bind(this);

	// setTimeout(() =>
	// {
	// 	// this.GUIInput.caption = `g_TradeDialog.barterPanel.barterButtonManager.buttons[0].`;
	// 	this.GUIInput.caption = `a?g_ChatMessages[`;
	// 	// this.GUIInput.caption = `autociv_matchsort.`;
	// 	// this.GUIInput.caption = `a?g_CivData.athen.`;
	// 	this.toggle();
	// }, 20)
}

Autociv_CLI.prototype.initiated = false;
Autociv_CLI.prototype.suggestionsMaxVisibleSize = 350
Autociv_CLI.prototype.inspectorMaxVisibleSize = 350;
Autociv_CLI.prototype.vlineSize = 19.2;
Autociv_CLI.prototype.spacing = " ".repeat(8);
Autociv_CLI.prototype.list_data = [];
Autociv_CLI.prototype.prefix = "";
Autociv_CLI.prototype.showDepth = 2;
Autociv_CLI.prototype.previewLength = 100;
Autociv_CLI.prototype.searchFilter = "";

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
	},
	"font": "sans-bold-14",
};

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
		case "undefined": return type;
		case "boolean": return type;
		case "number": return type;
		case "bigint": return type;
		case "string": return type;
		case "symbol": return type;
		case "function": return type;
		case "object": {
			if (val === null) return "null";
			if (Array.isArray(val)) return "array";
			else return type;
		}
		default: return "unknown type";
	}
};

Autociv_CLI.prototype.accessFormat = function (value, access, isArray)
{
	switch (access)
	{
		case "dot": return `.${value}`;
		case "bracket": return isArray ? `[${value}]` : `["${value}"]`;
		case "word": return value;
		default: return value;
	}
};

// escapeText from a24
Autociv_CLI.prototype.escape = function (obj)
{
	return obj.toString().replace(/\\/g, "\\\\").replace(/\[/g, "\\[");
};

Autociv_CLI.prototype.coloredAccessFormat = function (value, access, isArray, type)
{
	let text = `[color="${this.style.type[type] || this.style.type.default}"]${this.escape(value)}[/color]`;
	switch (access)
	{
		case "dot": return `.${text}`;
		case "bracket": return isArray ? `\\[${text}\\]` : `\\["${text}"\\]`;
		case "word": return text;
		default: return text;
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

	if (entry.key.value in entry.parent)
		this.updateObjectInspector(entry.parent[entry.key.value], text);
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
	let log = eval(text);
	try
	{
		warn(JSON.stringify(log === undefined ? "" : log, null, 2))
	}
	catch (error) { }

	text = text.split("=")[0];
	let entry = this.getEntry(text);
	if (!entry)
		return;

	if (entry.key.value in entry.parent)
		this.updateObjectInspector(entry.parent[entry.key.value], text);
};

Autociv_CLI.prototype.getTokens = function (text)
{
	let lex = text.trim().split(/(\["?)|("?\])|(\.)/g).filter(v => v)
	// lex ~~  ['word1', '.', 'word2', '["', 'word3', '"]', ...]

	if (!lex.length)
		lex = [""];

	let token = [];
	for (let i = 0; i < lex.length; ++i)
	{
		if (lex[i].startsWith("["))
		{
			let hasValue = false;
			let value = "";
			let hasEndBracket = false;
			let k = 1;
			while (i + k < lex.length)
			{
				if (lex[i + k].endsWith("]"))
				{
					hasEndBracket = true;
					break;
				}
				hasValue = true;
				value += lex[i + k];
				++k;
			}

			if (!hasEndBracket)
				value = value.replace(/"$/, "");

			token.push({
				"access": "bracket",
				"hasValue": hasValue,
				"hasEndBracket": hasEndBracket,
				"value": value,
				"valid": hasValue && hasEndBracket
			});
			i += k;
		}
		else if (lex[i] == ".")
		{
			let hasValue = i + 1 in lex;
			token.push({
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
			token.push({
				"access": "word",
				"hasValue": hasValue,
				"value": lex[i],
				"valid": hasValue,
			});
		}
	}

	return token;
};

Autociv_CLI.prototype.getEntry = function (text)
{
	let tokens = this.getTokens(text);

	let object = global;
	let prefix = "";
	let prefixColored = "";

	// Dive into the nested object or array (but don't process last token)
	for (let i = 0; i < tokens.length - 1; ++i)
	{
		let token = tokens[i];

		// A "word" access can only be valid if and only if is the first token
		if (i == 0 && token.access != "word" || i != 0 && token.access == "word")
			return;

		let parentType = this.getType(object);
		if (!token.valid || parentType != "array" && parentType != "object" && parentType != "function")
			return;

		object = object[token.value];
		prefix += this.accessFormat(token.value, token.access, parentType == "array");
		prefixColored += this.coloredAccessFormat(token.value, token.access, parentType == "array", parentType);
	}

	return {
		"parent": object,
		"prefix": prefix,
		"prefixColored": prefixColored,
		"key": tokens[tokens.length - 1],
		"index": tokens.length - 1
	};
};

Autociv_CLI.prototype.getCandidates = function (object)
{
	let list = [];
	if (this.getType(object) == "function" && "prototype" in object)
		list.push("prototype");

	if ("__iterator__" in object)
	{
		for (let k in object)
			list.push(k);
		return list;
	}

	Array.prototype.push.apply(list, Object.keys(object));

	return list;
};

Autociv_CLI.prototype.getSuggestions = function (entry)
{
	if (entry.key.access == "dot")
	{
		if (entry.index == 0)
			return;

		let parentType = this.getType(entry.parent);
		if (parentType != "object" && parentType != "function")
			return

		let candidates = this.getCandidates(entry.parent);
		let results = entry.key.hasValue ? this.sort(entry.key.value, candidates) : this.sort("", candidates);
		results = this.sortSearchFilter(entry.parent, results);
		if (results.length == 1 && results[0] == entry.key.value)
			results = [];
		return results;
	}
	if (entry.key.access == "bracket")
	{
		if (entry.index == 0)
			return;

		let parentType = this.getType(entry.parent);
		if (parentType == "object" || parentType == "function")
		{
			let candidates = this.getCandidates(entry.parent);
			let results = entry.key.hasValue ? this.sort(entry.key.value.replace(/^"|"$/g, ""), candidates) : this.sort("", candidates);
			results = this.sortSearchFilter(entry.parent, results);
			if (entry.key.hasEndBracket && results.length && results[0] == entry.key.value)
				results = [];
			return results;
		}
		else if (parentType == "array")
		{
			let candidates = this.getCandidates(entry.parent);
			let results = entry.key.hasValue ? this.sort(entry.key.value, candidates).sort((a, b) => (+a) - (+b)) :
				candidates;
			results = this.sortSearchFilter(entry.parent, results);
			if (entry.key.hasEndBracket && results.length && results[0] == entry.key.value)
				results = [];
			return results;
		}
	}
	if (entry.key.access == "word")
	{
		if (entry.index != 0)
			return;

		let candidates = this.getCandidates(entry.parent);
		let results = entry.key.hasValue ? this.sort(entry.key.value, candidates) : this.sort("", candidates);
		results = this.sortSearchFilter(entry.parent, results);
		if (results.length == 1 && results[0] == entry.key.value)
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

	let isArray = this.getType(entry.parent) == "array";
	this.GUIList.list = suggestions.map(key =>
	{
		let type = this.getType(entry.parent[key]);
		let text = entry.prefixColored;
		text += this.coloredAccessFormat(key, entry.key.access, isArray, type);

		// Show variable type
		text += ` [color="${this.style.typeTag}"]\\[${type}\\][/color]`;

		// Show preview
		let length = text.replace(/[^\\]\[.+[^\\]\]/g, "").replace(/\\\\\[|\\\\\]/g, " ").length;
		if (type == "boolean" || type == "number" || type == "bigint")
			text += " " + truncate(this.escape(`${entry.parent[key]}`), length);
		else if (type == "string")
			text += " " + truncate(this.escape(`"${entry.parent[key]}"`), length);

		return text;
	});
	this.list_data = suggestions.map(key => this.accessFormat(key, entry.key.access, isArray));
	this.prefix = entry.prefix;

	this.GUIList.size = Object.assign(this.GUIList.size, {
		"bottom": Math.min(suggestions.length * this.vlineSize, this.suggestionsMaxVisibleSize)
	});
}

Autociv_CLI.prototype.processPrefixes = function (text)
{
	let original = text;
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

Autociv_CLI.prototype.updateSuggestions = function (event, text = this.GUIInput.caption)
{
	if (event)
		text = this.processPrefixes(text);

	let entry = this.getEntry(text);
	if (!entry)
		return;

	let suggestions = this.getSuggestions(entry)
	if (!suggestions)
		return;

	this.updateSuggestionList(entry, suggestions);

	if (entry.key.value in entry.parent)
		this.updateObjectInspector(entry.parent[entry.key.value]);
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

	let f = (t, v) => `[color="${this.style.type[t] || this.style.type["default"]}"]${this.escape(v)}[/color] `

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
				// replacetext function truncates result for some reason, use own made
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

			return `\\[\n${output}\n${prefix}\\]`;
		}
		case "object": {
			let list = this.getCandidates(obj);
			if (!list.length)
				return `\\{ \\}`;

			let output = list.map(key =>
			{
				return prefix + this.spacing + this.escape(key) + " : " +
					this.getObjectRepresentation(
						obj[key],
						obj[key] == global ? 0 : depth - 1,
						prefix + this.spacing);
			}).join(",\n");

			return `{ \n${output} \n${prefix} } `;
		}
		default: return typeTag;
	}
}

Autociv_CLI.prototype.updateObjectInspector = function (object, text = this.GUIInput.caption)
{
	let result = `${this.escape(text.split("=")[0].trim())} : ${this.getObjectRepresentation(object)} `;
	this.GUIText.caption = result;
	// Count number of lines
	let nLines1 = (result.match(/\n/g) || '').length + 1;
	let nLines2 = Math.ceil(result.length / 100);
	this.GUIText.size = Object.assign(this.GUIText.size, {
		"bottom": Math.min(Math.max(nLines1, nLines2) * this.vlineSize, this.inspectorMaxVisibleSize)
	});
};
