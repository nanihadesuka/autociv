autociv_patchApplyN("addChatMessage", function (target, that, args)
{
    let [msg] = args;
    return botManager.react(msg) || target.apply(that, args);
})

class SetHealersInitialStanceAgressive
{
    configKey = "autociv.session.setHealersInitialStanceAgressive"
    callName = "autociv_setHealersInitialStanceAggressive"

    constructor()
    {
        g_NotificationsTypes[this.callName] = this.notificationHandle.bind(this)
        this.updateFromConfig()
        registerConfigChangeHandler(this.onConfigChanges.bind(this))
    }

    onConfigChanges(changes)
    {
        if (changes.has(this.configKey))
            this.updateFromConfig()
    }

    updateFromConfig()
    {
        const active = Engine.ConfigDB_GetValue("user", this.configKey) == "true"
        this.setActive(active)
    }

    setActive(active)
    {
        Engine.GuiInterfaceCall(this.callName, active)
    }

    notificationHandle(msg, player)
    {
        if (player != Engine.GetPlayerID())
            return;

            autociv_stance.set("aggressive", msg.entities)
    }
}

var g_SetHealersInitialStanceAgressive = new SetHealersInitialStanceAgressive()
