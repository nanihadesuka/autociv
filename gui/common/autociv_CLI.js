function Autociv_CLI(GUI)
{
	this.GUI = GUI;
	this.GUIInput = this.GUI.children[0];
	this.GUIList = this.GUIInput.children[0];
	this.GUIText = this.GUIList.children[0];

	this.GUI.onPress = this.toggle.bind(this);
	this.GUIInput.onTextedit = this.updateSuggestions.bind(this);
	this.GUIInput.onTab = this.tab.bind(this);
	this.GUIInput.onPress = this.evalInput.bind(this);
	this.GUIList.onSelectionChange = this.inspectSelectedSuggestion.bind(this);
	this.GUIList.onMouseLeftDoubleClick = this.setSelectedSuggestion.bind(this);

	this.suggestionsVisibleSize = 20
	this.inspectorVisibleSize = 18;

	this.spacing = "  ";
	this.list_data = [];
	this.prefix = "";
	this.showDepth = 2;
	this.previewLength = 50;

	this.initiated = false;

	setTimeout(() =>
	{
		// this.GUIInput.caption = `g_GameAttributes.settings.cr`;
		// this.GUIInput.caption = `loadCivData`;
		this.GUIInput.caption = `g_GameList[`;
		this.toggle();
	}, 10)
}

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
}

Autociv_CLI.prototype.accessFormat = function (value, access, isArray)
{
	switch (access)
	{
		case "dot": return `.${value}`;
		case "bracket": return isArray ? `[${value}]` : `["${value}"]`;
		case "word": return value;
		default: return value;
	}
}

Autociv_CLI.prototype.accessFormatColored = function (value, access, isArray, type)
{
	let text = ((v) =>
	{
		switch (type)
		{
			case "array": return `[color="167 91 46"]${escapeText(v)}[/color]`;
			case "object": return `[color="193 152 43"]${escapeText(v)}[/color]`;
			default: return escapeText(v);
		}
	})(value);

	switch (access)
	{
		case "dot": return `.${text}`;
		case "bracket": return isArray ? `\\[${text}\\]` : `\\["${text}"\\]`;
		case "word": return text;
		default: return text;
	}
}

Autociv_CLI.prototype.typeColored = function (t)
{
	return `[color="159 118 148"]\\[${t}\\][/color]`;
};

Autociv_CLI.prototype.inspectSelectedSuggestion = function ()
{
	if (this.GUIList.selected == -1)
		return;

	let caption = this.prefix + this.list_data[this.GUIList.selected];
	this.evalInput(null, caption)
}

Autociv_CLI.prototype.setSelectedSuggestion = function ()
{
	if (this.GUIList.selected == -1)
		return;

	this.GUIInput.caption = this.prefix + this.list_data[this.GUIList.selected];
	this.updateSuggestions()
	this.GUIInput.blur();
	this.GUIInput.focus();
	this.GUIInput.buffer_position = this.GUIInput.caption.length;
}

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
		this.updateSuggestions();
		this.initiated = true;
	}
};

Autociv_CLI.prototype.evalInput = function (ev, text = this.GUIInput.caption)
{
	eval(text);
	text = text.split("=")[0];
	let entry = this.getEntry(text);
	if (!entry)
		return;

	if (entry.key.value in entry.parent)
		this.updateObjectInspector(entry.parent[entry.key.value], text);
};

Autociv_CLI.prototype.getTokens = function (text)
{
	let lex = text.trim().split(/(\["?)|("?\])|(\.)/g).filter(v => v);
	// lex ~~  ['word1', '.', 'word2', '["', 'word3', '"]', ...]

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
}

Autociv_CLI.prototype.getEntry = function (text)
{
	let tokens = this.getTokens(text);
	if (!tokens.length)
		return {
			"prefix": "",
			"prefixColored": "",
			"key": {
				"access": "global",
				"hasValue": true,
				"value": "",
				"valid": true,
			},
			"parent": global
		};

	let object = global;
	let prefix = "";
	let prefixColored = "";

	// Dive into the nested object or array
	for (let token of tokens.slice(0, -1))
	{
		let type = this.getType(object);
		if (!token.valid || !(type == "array" || type == "object"))
			return;
		object = object[token.value];
		prefix += this.accessFormat(token.value, token.access, type == "array");
		prefixColored += this.accessFormatColored(token.value, token.access, type == "array", type);
	}

	return {
		"prefix": prefix,
		"prefixColored": prefixColored,
		"key": tokens[tokens.length - 1],
		"parent": object
	};
};



Autociv_CLI.prototype.getSuggestions = function (entry)
{
	if (entry.key.access == "dot")
	{
		if (this.getType(entry.parent) != "object")
			return;

		let key_candidates = Object.keys(entry.parent);
		let results = entry.key.hasValue ? autociv_matchsort(entry.key.value, key_candidates) : key_candidates;

		if (results.length == 1 && results[0] == entry.key.value)
			results = [];
		return results;
	}
	if (entry.key.access == "bracket")
	{
		let type = this.getType(entry.parent);
		if (type == "object")
		{
			let key_candidates = Object.keys(entry.parent);
			let results = entry.key.hasValue ? autociv_matchsort(entry.key.value.replace(/^"|"$/g, ""), key_candidates) : key_candidates;
			if (entry.key.hasEndBracket && results[0] == entry.key.value)
				results = [];
			return results;
		}
		else if (type == "array")
		{
			let key_candidates = Object.keys(entry.parent);
			let results = entry.key.hasValue ? autociv_matchsort(entry.key.value, key_candidates) : key_candidates;
			if (entry.key.hasEndBracket && results[0] == entry.key.value)
				results = [];
			return results;
		}
	}
	if (entry.key.access == "word")
	{
		if (this.getType(entry.parent) != "object")
			return;

		let key_candidates = Object.keys(entry.parent);
		let results = entry.key.hasValue ? autociv_matchsort(entry.key.value, key_candidates) : key_candidates;

		if (results.length == 1 && results[0] == entry.key.value)
			results = [];
		return results;
	}
	if (entry.key.access == "global")
	{
		return Object.keys(entry.parent);
	}
};

Autociv_CLI.prototype.updateSuggestions = function ()
{
	let entry = this.getEntry(this.GUIInput.caption);
	if (!entry)
		return;

	let suggestions = this.getSuggestions(entry)
	if (!suggestions)
		return;

	let truncate = text => text.length > this.previewLength ? text.slice(0, this.previewLength - 3) + "..." : text;

	let isArray = this.getType(entry.parent) == "array";
	this.GUIList.list = suggestions.map(key =>
	{
		let type = this.getType(entry.parent[key]);
		let text = entry.prefixColored;
		text += escapeText(this.accessFormat(key, entry.key.access, isArray));
		text += " " + this.typeColored(type);
		if (type == "boolean" || type == "number" || type == "bigint")
			text += " " + truncate(escapeText(`${entry.parent[key]}`));
		else if (type == "string")
			text += " " + truncate(escapeText(`"${entry.parent[key]}"`));

		return text;
	});
	this.list_data = suggestions.map(key => this.accessFormat(key, entry.key.access, isArray));
	this.prefix = entry.prefix;

	this.GUIList.size = Object.assign(this.GUIList.size, {
		"bottom": Math.min(suggestions.length, this.suggestionsVisibleSize) * 18
	});

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

	const typeText = " " + this.typeColored(type);

	if (!depth && (type == "array" || type == "object"))
		return "..." + typeText;

	if (obj == global)
		depth = 1;

	switch (type)
	{
		case "undefined": return `undefined` + typeText;
		case "boolean": return escapeText(`${obj}`) + typeText;
		case "number": return escapeText(`${obj}`) + typeText;
		case "bigint": return escapeText(`${obj}`) + typeText;
		case "string": return "\"" + escapeText(`${obj}`) + "\"" + typeText;
		case "symbol": return typeText;
		case "null": return "null" + typeText;
		case "function": {
			if (prefix)
				return typeText;
			try
			{
				// replacetext function truncates result for some reason, use own made
				return obj.toString().replace(/(\[|\])/g, "\\$1").replace(/	/g, this.spacing);
			}
			catch (error)
			{
				return typeText + " Unable to print function \\[https://bugzilla.mozilla.org/show_bug.cgi?id=1440468\\]";
			}
		}
		case "array": {
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
			let output = Object.keys(obj).map(key =>
			{
				let keyText = `[color="202 177 55"]${escapeText(key)}[/color] : `

				return prefix + this.spacing + keyText +
					this.getObjectRepresentation(
						obj[key],
						obj[key] == global ? 0 : depth - 1,
						prefix + this.spacing);
			}).join(",\n");

			return `{\n${output}\n${prefix}}`;
		}
		default: return typeText;
	}
}

Autociv_CLI.prototype.updateObjectInspector = function (object, text = this.GUIInput.caption)
{
	let result = `${escapeText(text.split("=")[0].trim())} : ${this.getObjectRepresentation(object)}`;
	this.GUIText.caption = result;
	// Count number of lines, way 1
	let nLines1 = Math.min((result.match(/\n/g) || '').length + 1, this.inspectorVisibleSize);
	// Count number of lines, way 2 (font is monospaced)
	let nLines2 = Math.min(Math.floor(result.length / 90) + 1, this.inspectorVisibleSize);
	this.GUIText.size = Object.assign(this.GUIText.size, {
		"bottom": Math.max(nLines1, nLines2) * 18
	});
};

function autociv_CLI_load(that)
{
	global["g_autociv_CLI"] = new Autociv_CLI(that);
};
