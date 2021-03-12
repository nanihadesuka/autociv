// Chop the quantity of messages to process in a tick
autociv_patchApplyN(XmppMessages.prototype, "handleMessages", function (target, that, args)
{
    const [getMessages] = args
    Array.prototype.push.apply(that.autociv_messageQueue, getMessages() ?? [])
    return target.apply(that, [() => that.autociv_messageQueue.splice(0, 80)])
})

XmppMessages.prototype.autociv_messageQueue = []

// React to chat and messages and filter unwanted ones
autociv_patchApplyN(XmppMessages.prototype, "handleMessages", function (target, that, args)
{
    const [getMessages] = args
    return target.apply(that, [() => getMessages()?.filter(msg => !botManager.react(msg))])
})
