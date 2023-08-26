class InitialStanceSettingHandler {
    configKeys = {
        violent: "autociv.session.units_initial_stance.violent.by_class",
        aggressive: "autociv.session.units_initial_stance.aggressive.by_class",
        defensive: "autociv.session.units_initial_stance.defensive.by_class",
        passive: "autociv.session.units_initial_stance.passive.by_class",
        standground: "autociv.session.units_initial_stance.standground.by_class",
    }
    callName = "autociv_setUnitsInitialStance"

    constructor() {
        g_NotificationsTypes[this.callName] = this.notificationHandle.bind(this)
        this.updateFromConfig()
        registerConfigChangeHandler(this.onConfigChanges.bind(this))
    }

    onConfigChanges(changes) {
        for (const configKey of Object.values(this.configKeys)) {
            if (changes.has(configKey)) {
                this.updateFromConfig()
                break
            }
        }
    }

    updateFromConfig() {
        const entries = {}
        for (const [stance, configKey] of Object.entries(this.configKeys)) {
            const value = Engine.ConfigDB_GetValue("user", configKey).trim()
            if (value !== "")
                entries[stance] = value
        }

        this.setInitialStances(entries)
    }

    setInitialStances(entries) {
        Engine.GuiInterfaceCall(this.callName, entries)
    }

    notificationHandle(msg, player) {
        if (player != Engine.GetPlayerID())
            return;

        for (const [stanceType, entities] of msg.entities) {
            autociv_stance.set(stanceType, entities)
        }
    }
}

var g_InitialStanceSettingHandler = new InitialStanceSettingHandler()
