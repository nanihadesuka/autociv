Health.prototype.CreateCorpse = (function (originalFunction)
{
    return function (leaveResources)
    {
        let cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
        if (cmpGUIInterface.autociv_hideCorpses && !leaveResources)
            return INVALID_ENTITY;
        return originalFunction.apply(this, arguments);
    }
})(Health.prototype.CreateCorpse);
