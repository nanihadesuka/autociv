NetMessages.prototype.pollNextMessage = function ()
{
    let message = Engine.PollNetworkClient();
    if (this.netMessageHandlers[message?.type])
        if (botManager.react(message))
        {
            log("Net message: " + uneval(message));
            return;
        }

    return message;
}

NetMessages.prototype.onTick = function ()
{
    while (true)
    {
        let message = this.pollNextMessage()
        if (!message)
            break;

        log("Net message: " + uneval(message));

        if (this.netMessageHandlers[message.type])
            for (let handler of this.netMessageHandlers[message.type])
                handler(message);
        else
            error("Unrecognized net message type " + message.type);
    }
}
