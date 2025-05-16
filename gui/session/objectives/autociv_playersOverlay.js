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
    truncateName(name)
    {
        if (name.length > 30){
            name = name.slice(0, 30)
            return name
        }
        else{
            let filler = "";
            for (let i = 0; i < 30-name.length; i++){
                filler = filler + " "
            }
            name = filler + name;
            return name
        }
    }
    update()
    {
        Engine.ProfileStart("AutocivControls.PlayersOverlay:update")

        //construct players list
        const playersOffline = g_Players.
            filter(player => player.offline).
            map(player => [player.name, true])

        const observers = Object.keys(g_PlayerAssignments).
            filter(GUID => g_PlayerAssignments[GUID].player == -1).
            map(GUID => [g_PlayerAssignments[GUID].name, false])

        const list = [...playersOffline, ...observers]

        //define these lists as long strings to be displayed
        let onlinespecs = "";
        let offlineplayers = "";

        //counter for the number of people in each category
        let Nonlinespecs = 0;
        let Nofflineplayers = 0;

        //format the player names to coloured string and append them to the strings defined above

        list.map(([name, isPlayer]) =>
        {
            //print(isPlayer)
            if (isPlayer){
                offlineplayers = offlineplayers + setStringTags(this.truncateName(name), { "color": this.playerOfflineColor }) + "\n";
                Nofflineplayers = Nofflineplayers + 1;
            }
            else {
                onlinespecs = onlinespecs + this.truncateName(name) + "\n";
                Nonlinespecs = Nonlinespecs + 1;
            }
            return ""
        })
        //this caption will be the final displayed content. Append names to this
        let caption = "";

        if (offlineplayers != "") {
            //add spacing to align to the right hand side
            caption = caption + " ".repeat(11-Nofflineplayers.toString().length)
            //count the number of players in this category
            caption = caption + "Offline players (" + Nofflineplayers.toString() + "):\n"
            //finally, add the list of formatted names
            caption = caption + offlineplayers
        }

        if (onlinespecs != ""){
            caption = caption + " ".repeat(16-Nonlinespecs.toString().length)
            caption = caption + "Spectators (" + Nonlinespecs.toString() +"):\n"
            caption = caption + onlinespecs;
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
