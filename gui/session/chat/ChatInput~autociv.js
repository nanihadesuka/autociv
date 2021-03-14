ChatInput.prototype.getAutocompleteList = function ()
{
    let list = []
    let playernames = Object.keys(g_PlayerAssignments).map(player => g_PlayerAssignments[player].name);
    Array.prototype.push.apply(list, playernames)
    Array.prototype.push.apply(list, Object.keys(g_NetworkCommands).filter(v => !!v))
    return list
}

ChatInput.prototype.autoComplete = function ()
{
    autoCompleteText(this.chatInput, this.getAutocompleteList())
}
