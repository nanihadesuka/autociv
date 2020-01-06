function autociv_CLI(GUI)
{
    this.GUI = GUI;
    this.GUIInput = this.GUI.children[0];
    this.GUIList = this.GUIInput.children[0];
    this.GUIText = this.GUIList.children[0];

    this.GUI.onPress = this.toggle.bind(this);
    this.GUIInput.onTextedit = this.input.bind(this);
    this.GUIInput.onTab = this.tab.bind(this);
    this.GUIInput.onPress = this.eval.bind(this);

    this.suggestionsVisibleSize = 20;
    this.inspectVisibleSize = 20;


    setTimeout(() =>
    {
        this.GUIInput.caption = "g_GameList"
        this.toggle();
    }, 10);
}

autociv_CLI.prototype.toggle = function (CLI)
{
    this.GUI.hidden = !this.GUI.hidden;
    if (!this.GUI.hidden)
    {
        this.GUIInput.blur();
        this.GUIInput.focus();
        this.GUIInput.buffer_position = this.GUIInput.caption.length;
        this.input();
    }
    else
        this.GUIInput.blur();
};

autociv_CLI.prototype.eval = function ()
{
    eval(this.GUIInput.caption);
};

autociv_CLI.prototype.getObject = function ()
{
    let objectChain = this.GUIInput.caption.split(".");
    let object = global;
    let prefix = "";
    for (let i = 0; i < objectChain.length - 1; ++i)
    {
        object = object[objectChain[i]];
        let type = this.getType(object);
        if (type == "array" || type == "object")
            prefix += objectChain[i] + ".";
        else
            return [];
    }

    let key = objectChain[objectChain.length - 1];

    return [prefix, key, object];
};
autociv_CLI.prototype.input = function ()
{
    let [prefix, key, parent] = this.getObject();

    let key_candidates = parent ? Object.keys(parent) : [];
    let results = key ? autociv_matchsort(key, key_candidates) : key_candidates;

    if (results.length == 1 && results[0] == key)
        results = [];

    this.GUIList.list = results.map(v => prefix + v);
    this.GUIList.list_data = results;

    this.GUIList.size = Object.assign(this.GUIList.size, {
        "bottom": Math.min(results.length, this.suggestionsVisibleSize) * 18
    });

    if (typeof parent == "object" && key in parent)
        this.show(parent[key]);
};

autociv_CLI.prototype.tab = function ()
{
    if (!this.GUIList.list_data.length)
        return;

    this.GUIInput.caption = this.GUIList.list[0];
    this.GUIInput.buffer_position = this.GUIInput.caption.length;
    this.input();
};
autociv_CLI.prototype.getType = function (val)
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


autociv_CLI.prototype.escapeText = function (t) { return t.replace(/([\\\[|\]])/g, "\\$1"); };

autociv_CLI.prototype.represent = function (obj, depth = 5, prefix = "")
{
    let type = this.getType(obj);

    if (!depth)
        return "... " + this.escapeText(`[${type}]`);

    if (obj == global)
        depth = 1;

    const typeText = ` [color="159 118 148"]\\[${type}\\][/color]`;

    switch (type)
    {
        case "undefined": return `undefined` + typeText;
        case "boolean": return this.escapeText(`${obj}`) + typeText;
        case "number": return this.escapeText(`${obj}`) + typeText;
        case "bigint": return this.escapeText(`${obj}`) + typeText;
        case "string": return "\"" + this.escapeText(`${obj}`) + "\"" + typeText;
        case "symbol": return typeText;
        case "function": return prefix ? typeText : this.escapeText(obj.toSource());
        case "null": return "null" + typeText;
        case "array": {
            let output = obj.map((val, index) =>
            {
                return prefix + "  " + (this.getType(val) == "object" ? index + " : " : "") +
                    this.represent(
                        val,
                        val == global ? 0 : depth - 1,
                        prefix + "  ");
            }).join(",\n");

            return "\\[\n" +
                output + "\n" + prefix + "\\]";
        }
        case "object": {
            let output = Object.keys(obj).map(key =>
            {
                let keyText = `[color="202 177 55"]${this.escapeText(key)}[/color] : `

                return prefix + "  " + keyText +
                    this.represent(
                        obj[key],
                        obj[key] == global ? 0 : depth - 1,
                        prefix + "  ");
            }).join(",\n");

            return "{\n" + output + "\n" + prefix + "}";
        }
        default: return typeText;
    }
}

autociv_CLI.prototype.show = function (object)
{
    let result = this.escapeText(this.GUIInput.caption) + " : " + this.represent(object);
    this.GUIText.caption = result;
    let nLines = (result.match(/\n/g) || '').length + 1;
    this.GUIText.size = Object.assign(this.GUIText.size, {
        "bottom": Math.min(nLines, this.inspectVisibleSize) * 16
    });
};
