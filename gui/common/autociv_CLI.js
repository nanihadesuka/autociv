function Autociv_CLI(GUI)
{
	this.GUI = GUI;
	this.GUIInput = this.GUI.children[0];
	this.GUIList = this.GUIInput.children[0];
	this.GUIText = this.GUIList.children[0];

	this.GUI.onPress = this.toggle.bind(this);
	this.GUIInput.onTextedit = this.updateList.bind(this);
	this.GUIInput.onTab = this.tab.bind(this);
	this.GUIInput.onPress = this.eval.bind(this);
	this.GUIList.onSelectionChange = this.showFromList.bind(this);
	this.GUIList.onMouseLeftDoubleClick = this.setFromList.bind(this);

	this.suggestionsVisibleSize = 20
	this.inspectVisibleSize = 20;

	this.spacing = "  ";
	this.list_data = [];
	this.prefix = "";
	this.showDepth = 4;
	this.previewLength = 90;

	this.initiated = false;
}

Autociv_CLI.prototype.showFromList = function ()
{
	let caption = this.prefix + this.list_data[this.GUIList.selected];
	this.eval(null, caption)
}

Autociv_CLI.prototype.setFromList = function ()
{
	this.GUIInput.caption = this.prefix + this.list_data[this.GUIList.selected];
	this.updateList()
}

Autociv_CLI.prototype.toggle = function ()
{
	this.GUI.hidden = !this.GUI.hidden;
	if (!this.GUI.hidden)
	{
		this.GUIInput.blur();
		this.GUIInput.focus();
		this.GUIInput.buffer_position = this.GUIInput.caption.length;
		if (!this.initiated)
		{
			this.updateList();
			this.initiated = true;
		}
	}
	else
		this.GUIInput.blur();
};

Autociv_CLI.prototype.eval = function (ev, text = this.GUIInput.caption)
{
	eval(text);
	text = text.split("=")[0];
	let obj = this.getObject(text);
	if (obj.empty)
		return;

	if (obj.key.value in obj.parent)
		this.show(obj.parent[obj.key.value], text);
};

/**
 * Pitfall: can only work with keys that are valid with dot syntax
 */
Autociv_CLI.prototype.getObject = function (input = this.GUIInput.caption)
{
	let lex = input.trim().split(/(\["?)|("?\])|(\.)/g).filter(v => v);

	let chain = [];
	for (let i = 0; i < lex.length; ++i)
	{
		if (lex[i].startsWith("["))
		{
			let t = {};
			t["access"] = "bracket";
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
			t["hasValue"] = hasValue;
			t["value"] = value;
			t["hasEndBracket"] = hasEndBracket;
			t["valid"] = t.hasValue && t.hasEndBracket;
			chain.push(t);
			i += k;
		}
		else if (lex[i] == ".")
		{
			let t = {};
			t["access"] = "dot";
			t["hasValue"] = i + 1 in lex;
			t["value"] = t.hasValue ? lex[i + 1] : "";
			t["valid"] = t.hasValue;
			chain.push(t)
			i += 1;
		}
		else
		{
			let t = {};
			t["access"] = "word";
			t["hasValue"] = i in lex;
			t["value"] = lex[i];
			t["valid"] = t.hasValue;
			chain.push(t);
		}
	}

	let object = global;
	let prefix = "";

	if (!chain.length)
		return {
			"prefix": prefix,
			"key": {
				"access": "global",
				"hasValue": true,
				"value": "",
				"valid": true,
			},
			"parent": object
		};

	let valid = t => (this.getType(t) == "array" || this.getType(t) == "object");

	for (let entry of chain.slice(0, -1))
	{
		if (!entry.valid || !valid(object[entry.value]))
			return { "empty": true };
		let parentArray = this.getType(object) == "array";
		object = object[entry.value];
		entry.type = this.getType(object);
		prefix += this.accessFormat(entry.value, entry.access, parentArray);
	}

	return {
		"prefix": prefix,
		"key": chain[chain.length - 1],
		"parent": object
	};
};

Autociv_CLI.prototype.accessFormat = function (value, access, arrayNumber = false)
{
	switch (access)
	{
		case "dot": return `.${value}`;
		case "bracket": return arrayNumber ? `[${value}]` : `["${value}"]`;
		case "word": return value;
		default: return value;
	}
}

Autociv_CLI.prototype.updateList = function ()
{
	let obj = this.getObject();
	if (obj.empty)
		return;

	let results = [];

	if (obj.key.access == "dot")
	{
		if (this.getType(obj.parent) != "object")
			return;

		let key_candidates = Object.keys(obj.parent);
		results = obj.key.hasValue ? autociv_matchsort(obj.key.value, key_candidates) : key_candidates;
	}
	else if (obj.key.access == "bracket")
	{
		let type = this.getType(obj.parent);
		if (type == "object")
		{
			let key_candidates = Object.keys(obj.parent);
			results = obj.key.hasValue ? autociv_matchsort(obj.key.value, key_candidates) : key_candidates;
		}
		else if (type == "array")
		{
			let key_candidates = Object.keys(obj.parent);
			results = obj.key.hasValue ? autociv_matchsort(obj.key.value, key_candidates) : key_candidates;
		}
		else
			return;
	}
	else if (obj.key.access == "word")
	{
		if (this.getType(obj.parent) != "object")
			return;

		let key_candidates = Object.keys(obj.parent);
		results = obj.key.hasValue ? autociv_matchsort(obj.key.value, key_candidates) : key_candidates;
	}
	else if (obj.key.access == "global")
	{
		results = Object.keys(obj.parent);
	}
	else
		return;

	if (results.length == 1 && results[0] == obj.key.value)
		results = [];

	let truncate = text => text.length > this.previewLength ? text.slice(0, this.previewLength - 3) + "..." : text;

	this.GUIList.list = results.map(v =>
	{
		let text = escapeText(obj.prefix);
		let type = this.getType(obj.parent[v]);
		text += escapeText(this.accessFormat(v, obj.key.access, this.getType(obj.parent) == "array"));
		text += " " + this.typeFormat(type)
		if (type == "boolean" || type == "number" || type == "bigint")
			text += " " + truncate(escapeText(`${obj.parent[v]}`));
		else if (type == "string")
			text += " " + truncate(escapeText(`"${obj.parent[v]}"`));

		return text;
	});
	this.list_data = results.map(v => this.accessFormat(v, obj.key.access, this.getType(obj.parent) == "array"));
	this.prefix = obj.prefix;

	this.GUIList.size = Object.assign(this.GUIList.size, {
		"bottom": Math.min(results.length, this.suggestionsVisibleSize) * 18
	});

	if (obj.key.value in obj.parent)
		this.show(obj.parent[obj.key.value]);
	else
		this.show("", "", true);
};

Autociv_CLI.prototype.tab = function ()
{
	if (this.list_data.length)
	{
		this.GUIInput.caption = this.prefix + this.list_data[0];
		this.GUIInput.buffer_position = this.GUIInput.caption.length;
	}
	this.updateList();
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
			if (val === null)
				return "null";

			if (Array.isArray(val))
				return "array";

			return type;
		}
		default: return "unknown type";
	}
}

// Autociv_CLI.prototype.escapeText = function (t) { return t.replace(/([\\\[|\]])/g, "\\$1"); };

Autociv_CLI.prototype.typeFormat = function (t) { return `[color="159 118 148"]\\[${t}\\][/color]`; };

Autociv_CLI.prototype.represent = function (obj, depth = this.showDepth, prefix = "")
{
	let type = this.getType(obj);

	const typeText = " " + this.typeFormat(type);

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
		case "function": return prefix ? typeText : escapeText(obj.toSource().replace(/	/g, this.spacing));
		case "null": return "null" + typeText;
		case "array": {
			let output = obj.map((val, index) =>
			{
				return prefix + this.spacing + (this.getType(val) == "object" ? index + " : " : "") +
					this.represent(
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
					this.represent(
						obj[key],
						obj[key] == global ? 0 : depth - 1,
						prefix + this.spacing);
			}).join(",\n");

			return `{\n${output}\n${prefix}}`;
		}
		default: return typeText;
	}
}

Autociv_CLI.prototype.show = function (object, text = this.GUIInput.caption, clear = false)
{
	if (clear)
	{
		this.GUIText.caption = "";
		this.GUIText.size = Object.assign(this.GUIText.size, { "bottom": 1 * 16 });
		return;
	}

	let result = `${escapeText(text.split("=")[0].trim())} : ${this.represent(object)}`;
	this.GUIText.caption = result;
	// Number of linebreaks
	let nLines1 = Math.min((result.match(/\n/g) || '').length + 1, this.inspectVisibleSize);
	// Font is mono
	let nLines2 = Math.min(Math.floor(result.length / 90) + 1, this.inspectVisibleSize);
	this.GUIText.size = Object.assign(this.GUIText.size, {
		"bottom": Math.max(nLines1, nLines2) * 16
	});
};


function autociv_CLI_load(that)
{
	global["g_autociv_CLI"] = new Autociv_CLI(that);
};
