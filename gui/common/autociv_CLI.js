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

	this.toggle()
}

Autociv_CLI.prototype.showFromList = function ()
{
	let caption = this.list_data[this.GUIList.selected];
	this.eval(caption)
}

Autociv_CLI.prototype.setFromList = function ()
{
	this.GUIInput.caption = this.list_data[this.GUIList.selected];
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
		this.updateList();
	}
	else
		this.GUIInput.blur();
};

Autociv_CLI.prototype.eval = function (ev, text = this.GUIInput.caption)
{
	eval(text);
	let [prefix, key, parent] = this.getObject(text);
	if (typeof parent == "object" && key in parent)
		this.show(parent[key], text);
};

/**
 * Pitfall: can only work with keys that are valid with dot syntax
 */
Autociv_CLI.prototype.getObject = function (objectChain = this.GUIInput.caption)
{
	objectChain = objectChain.trim().split(" ")[0].split(".");
	let object = global;
	let prefix = "";
	for (let i = 0; i < objectChain.length - 1; ++i)
	{
		object = object[objectChain[i]];
		let type = this.getType(object);
		if (type == "array" || type == "object")
			prefix += objectChain[i] + ".";
		else
			return [""];
	}

	let key = objectChain[objectChain.length - 1];

	return [prefix, key, object];
};
Autociv_CLI.prototype.updateList = function ()
{
	let [prefix, key, parent] = this.getObject();

	let key_candidates = parent ? Object.keys(parent) : [];
	let results = key ? autociv_matchsort(key, key_candidates) : key_candidates;

	if (results.length == 1 && results[0] == key)
		results = [];

	this.GUIList.list = results.map(v => prefix + v + " " + this.typeFormat(this.getType(parent[v])));
	this.list_data = results;
	this.prefix = prefix;

	this.GUIList.size = Object.assign(this.GUIList.size, {
		"bottom": Math.min(results.length, this.suggestionsVisibleSize) * 18
	});

	if (typeof parent == "object" && key in parent)
		this.show(parent[key]);
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


Autociv_CLI.prototype.escapeText = function (t) { return t.replace(/([\\\[|\]])/g, "\\$1"); };

Autociv_CLI.prototype.typeFormat = function (t) { return `[color="159 118 148"]\\[${t}\\][/color]`; };

Autociv_CLI.prototype.represent = function (obj, depth = this.showDepth, prefix = "")
{
	let type = this.getType(obj);

	const typeText = " " + this.typeFormat(type);

	if (!depth && (type == "array" || type == "object"))
		return "... " + typeText;

	if (obj == global)
		depth = 1;

	switch (type)
	{
		case "undefined": return `undefined` + typeText;
		case "boolean": return this.escapeText(`${obj}`) + typeText;
		case "number": return this.escapeText(`${obj}`) + typeText;
		case "bigint": return this.escapeText(`${obj}`) + typeText;
		case "string": return "\"" + this.escapeText(`${obj}`) + "\"" + typeText;
		case "symbol": return typeText;
		case "function": return prefix ? typeText : this.escapeText(obj.toSource().replace(/	/g, this.spacing));
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
				let keyText = `[color="202 177 55"]${this.escapeText(key)}[/color] : `

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

Autociv_CLI.prototype.show = function (object, text = this.GUIInput.caption)
{
	let result = `${this.escapeText(text.split(" ")[0])} : ${this.represent(object)}`;
	this.GUIText.caption = result;
	let nLines = (result.match(/\n/g) || '').length + 1;
	this.GUIText.size = Object.assign(this.GUIText.size, {
		"bottom": Math.min(nLines, this.inspectVisibleSize) * 16
	});
};
