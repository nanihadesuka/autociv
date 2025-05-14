AutocivControls.PlayersOverlay = class
{
    autociv_playersOverlay = Engine.GetGUIObjectByName("autociv_playersOverlay")
    textFont = "mono-stroke-10"
    configKey_visible = "autociv.session.playersOverlay.visible"
    visible = Engine.ConfigDB_GetValue("user", this.configKey_visible) == "true"
    playerOfflineColor = "250 0 0 250"

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

        let onlinespecs = "";
        let offlineplayers = "";

        list.map(([name, isPlayer]) =>
        {
            //print(isPlayer)
            if (isPlayer){
                offlineplayers = offlineplayers + setStringTags(name, { "color": this.playerOfflineColor }) + "\n";
            }
            else {
                onlinespecs = onlinespecs + name + "\n";
            }
            return ""
        })

        let caption = "";

        if (offlineplayers != "") {
            caption = caption + "Offline players: \n" + offlineplayers
        }

        if (onlinespecs != ""){
            caption = caption + "Spectators: \n" + onlinespecs;
        }

        //find the maximum width required for the panel, which is equal to the longest name

        this.autociv_playersOverlay.hidden = !caption
        this.autociv_playersOverlay.caption = ""
        this.autociv_playersOverlay.size = `100%-190 100%-200 100% 100%` // this.computeSize(caption.length, list.length)
        this.autociv_playersOverlay.caption = setStringTags(caption, {
            "color": "250 250 250 250",
            "font": this.textFont
        })

        Engine.ProfileStop()
    }
}
