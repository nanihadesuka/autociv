autociv_patchApplyN("addChatMessage", function (target, that, args)
{
    let [msg] = args;
    return botManager.react(msg) || target.apply(that, args);
})
