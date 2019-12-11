var autociv_stance = {
    "set": function (stance, entities = g_Selection.toList())
    {
        if (!this.stances.has(stance))
            return;

        Engine.PostNetworkCommand({
            "type": "stance",
            "entities": entities,
            "name": stance
        });

        return true;
    },
    "stances": new Set([
        "violent",
        "aggressive",
        "defensive",
        "passive",
        "standground",
    ])
};
