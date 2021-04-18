AutocivControls.PlayersOverlay = class
{
    autociv_playersOverlay = Engine.GetGUIObjectByName("autociv_playersOverlay")
    textFont = "mono-stroke-10"
    configKey_visible = "autociv.session.playersOverlay.visible"
    visible = Engine.ConfigDB_GetValue("user", this.configKey_visible) == "true"
    playerOfflineColor = "250 60 30 250"

    constructor()
    {
        if (this.visible)
            this.update()

        registerPlayerAssignmentsChangeHandler(this.onChange.bind(this))
        registerConfigChangeHandler(this.onConfigChanges.bind(this))
    }

    onConfigChanges(changes)
    {
        if (changes.has(this.configKey_visible))
        {
            this.visible = Engine.ConfigDB_GetValue("user", this.configKey_visible) == "true"
            this.autociv_playersOverlay.hidden = !this.visible
        }
        this.onChange()
    }

    onChange()
    {
        if (this.visible)
            this.update()
    }

    computeSize(textLength)
    {
        return `100%-200 100%-10-100 100% 100%-10`
    }

    update()
    {
        Engine.ProfileStart("AutocivControls.PlayersOverlay:update")

        const playersOffline = g_Players.
            filter(player => player.offline).
            map(player => [player.name, true])

        const observers = Object.keys(g_PlayerAssignments).
            filter(GUID => g_PlayerAssignments[GUID].player == -1).
            map(GUID => [g_PlayerAssignments[GUID].name, false])

        const list = [...playersOffline, ...observers]

        const caption = list.map(([name, isPlayer]) =>
        {
            return isPlayer ? setStringTags(name, { "color": this.playerOfflineColor, }) : name
        }).join(", ")

        this.autociv_playersOverlay.hidden = !caption
        this.autociv_playersOverlay.caption = ""
        this.autociv_playersOverlay.size = this.computeSize(caption.length)
        this.autociv_playersOverlay.caption = setStringTags(caption, {
            "color": "250 250 250 250",
            "font": this.textFont
        })

        Engine.ProfileStop()
    }
}
