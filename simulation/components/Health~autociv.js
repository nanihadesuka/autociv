autociv_patchApplyN(Health.prototype, "CreateCorpse", function (target, that, args)
{
    let [leaveResources] = args;
    let corpseEnt = target.apply(that, args);
    if (!leaveResources)
    {
        let cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
        cmpGUIInterface.autociv_CorpseAdd(corpseEnt);
    }
    return corpseEnt;
})
