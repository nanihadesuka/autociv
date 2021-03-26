// Chop the quantity of messages to process in a tick
autociv_patchApplyN(XmppMessages.prototype, "handleMessages", function (target, that, args)
{
    const [getMessages] = args
    Array.prototype.push.apply(that.autociv_messageQueue, getMessages() ?? [])

    // Remove all lobby join & leave messages except the last 30 ones
    {
        let count = 0
        const max = 30
        that.autociv_messageQueue.reverse()
        that.autociv_messageQueue = that.autociv_messageQueue.filter(msg =>
        {
            if (msg.level == "join" || msg.level == "leave")
                return count++ < max
            return true
        })
        that.autociv_messageQueue.reverse()
    }

    return target.apply(that, [() => that.autociv_messageQueue.splice(0, 80)])
})

XmppMessages.prototype.autociv_messageQueue = []

// React to chat and messages and filter unwanted ones
autociv_patchApplyN(XmppMessages.prototype, "handleMessages", function (target, that, args)
{
    const [getMessages] = args
    return target.apply(that, [() => getMessages()?.filter(msg => !botManager.react(msg))])
})
