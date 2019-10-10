Health.prototype.CreateCorpse = (function (originalFunction)
{
    return function (leaveResources)
    {
        let corpseEnt = originalFunction.apply(this, arguments);
        if (!leaveResources)
        {
            let cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
            cmpGUIInterface.autociv_CorpseAdd(corpseEnt);
        }
        return corpseEnt;
    }
})(Health.prototype.CreateCorpse);
