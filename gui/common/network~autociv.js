g_NetworkCommands['/help'] = () =>
{
    const g_ChatCommandColor = "200 200 255";
    let text = translate("Chat commands:");
    for (let command in g_NetworkCommands)
    {
        let noSlashCommand = command.slice(1);
        const nc = g_NetworkCommands[command];
        const asc = g_autociv_SharedCommands[noSlashCommand]
        text += "\n" + sprintf(translate("%(command)s - %(description)s"), {
            "command": "/" + coloredText(noSlashCommand, g_ChatCommandColor),
            "description": nc.description || asc && asc.description || ""
        });
    }
    selfMessage(text);
}
