
ChatInputPanel.prototype.getAutocompleteList = function ()
{
    let list = []
    Array.prototype.push.apply(list, Engine.GetPlayerList().map(player => player.name))
    Array.prototype.push.apply(list, Engine.GetGameList().map(v => v.name))
    Array.prototype.push.apply(list, Object.keys(ChatCommandHandler.prototype.ChatCommands).map(v => `/${v}`))
    return list
}

ChatInputPanel.prototype.autocomplete = function ()
{
    autoCompleteText(this.chatInput, this.getAutocompleteList())
}
