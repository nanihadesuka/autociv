var autociv_CLI =
{
    "toggle": function (CLI)
    {
        CLI.hidden = !CLI.hidden;
        if (!CLI.hidden)
        {
            let input = CLI.children[0];
            input.blur();
            input.focus();
            input.buffer_position = input.caption.length;
            this.input(input);
        }
        else
            input.blur();
    },
    "getObject": function (inputText)
    {
        let objectChain = inputText.split(".");
        let object = global;
        let prefix = "";
        for (let i = 0; i < objectChain.length - 1; ++i)
        {
            object = object[objectChain[i]];
            if (typeof object !== "object")
                break;
            prefix += objectChain[i] + ".";
        }

        let key = objectChain[objectChain.length - 1];

        return [prefix, key, object];
    },
    "input": function (input)
    {
        let [prefix, key, parent] = this.getObject(input.caption);

        let key_candidates = parent ? Object.keys(parent) : [];
        let results = key ? autociv_matchsort(key, key_candidates) : key_candidates;

        if (results.length == 1 && results[0] == key)
            results = [];

        let olist = input.children[0];
        olist.list = results.map(v => prefix + v);
        olist.list_data = results;

        let olistSize = olist.size;
        olistSize.bottom = Math.min(results.length, 10) * 18;
        olist.size = olistSize;

        if (parent && key in parent)
            this.show(input, parent[key]);

    },
    "tab": function (input)
    {
        let olist = input.children[0];

        if (!olist.list_data.length)
            return;

        input.caption = olist.list[0];
        input.buffer_position = input.caption.length;
        this.input(input);

    },
    "show": function (input, object)
    {
        let result = JSON.stringify(object, null, 2) || "";
        let textObject = input.children[0].children[0];
        textObject.caption = result;
        let nLines = (result.match(/\n/g) || '').length + 1;
        let textObjectSize = textObject.size;
        textObjectSize.bottom = Math.min(nLines, 30) * 16;
        textObject.size = textObjectSize;
    }
}
