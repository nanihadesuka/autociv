// React to chat and messages and filter unwanted ones
autociv_patchApplyN(XmppMessages.prototype, "handleMessages", function (target, that, args)
{
    const [getMessages] = args
    return target.apply(that, [() => getMessages()?.filter(msg => !botManager.react(msg))])
})
