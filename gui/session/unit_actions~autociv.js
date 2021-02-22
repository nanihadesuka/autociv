autociv_patchApplyN(g_EntityCommands.delete, "execute", function (target, that, args)
{
    if (Engine.ConfigDB_GetValue("user", "autociv.session.kill.nowarning") == "true")
    {
        let [entStates] = args;

        let entityIDs = entStates.reduce(
            (ids, entState) =>
            {
                if (!isUndeletable(entState))
                    ids.push(entState.id);
                return ids;
            },
            []);

        if (!entityIDs.length)
            return;

        Engine.PostNetworkCommand({
            "type": "delete-entities",
            "entities": entityIDs
        });
        return;
    }

    return target.apply(that, args);
})
