
autociv_patchApplyN(AIProxy.prototype, "OnTrainingFinished", function (target, that, args)
{
    const [msg] = args

    const cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
    if (cmpGUIInterface.autociv.setHealersInitialStanceAggressive)
    {
        const healerEntities = msg.entities.filter(ent =>
        {
            const cmpIdentity = Engine.QueryInterface(ent, IID_Identity)
            return cmpIdentity?.HasClass("Healer")
        })

        if (healerEntities.length != 0)
            cmpGUIInterface.PushNotification({
                "type": "autociv_setHealersInitialStanceAggressive",
                "entities": msg.entities,
                "players": [msg.owner]
            });
    }

    return target.apply(that, args);
})

Engine.ReRegisterComponentType(IID_AIProxy, "AIProxy", AIProxy);
