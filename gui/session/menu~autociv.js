autociv_patchApplyN("openDeleteDialog", function (target, that, args)
{
    let [selection] = args;

    if (Engine.ConfigDB_GetValue("user", "autociv.session.kill.nowarning") == "true")
    {
        Engine.PostNetworkCommand({
            "type": "delete-entities",
            "entities": selection
        });
        return;
    }

    return target.apply(that, args);
})
