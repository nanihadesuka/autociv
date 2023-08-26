
autociv_patchApplyN(AIProxy.prototype, "OnTrainingFinished", function (target, that, args)
{
    const [msg] = args

    const cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
    let results = []
    for (const [stance, evaluator] of cmpGUIInterface.autociv.initialStanceByClassExpression)
    {
        const matches = autociv_matchesEntities(msg.entities, evaluator)
        if (matches.length != 0)
            results.push([stance, matches])
    }

    if (results.length != 0) {
        cmpGUIInterface.PushNotification({
            "type": "autociv_setUnitsInitialStance",
            "entities": results,
            "players": [msg.owner]
        })
    }

    return target.apply(that, args);
})

Engine.ReRegisterComponentType(IID_AIProxy, "AIProxy", AIProxy);

function autociv_matchesEntities(entities, evalExpression) {
    return entities.filter(e => {
        let cmpIdentity = Engine.QueryInterface(e, IID_Identity);
        let cmpUnitAI = Engine.QueryInterface(e, IID_UnitAI);
        let cmpFoundation = Engine.QueryInterface(e, IID_Foundation);
        let cmpMirage = Engine.QueryInterface(e, IID_Mirage);
        return cmpIdentity &&
            !cmpFoundation &&
            !cmpMirage &&
            (cmpUnitAI ? !cmpUnitAI.isGarrisoned : true) &&
            evalExpression(cmpIdentity.GetClassesList());
    });
}
