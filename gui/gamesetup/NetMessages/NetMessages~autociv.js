NetMessages.prototype.pollPendingMessages = function ()
{
    while (true)
    {
        let message = Engine.PollNetworkClient();
        if (!message)
            break;

        if(botManager.react(message))
            continue;

        log("Net message: " + uneval(message));

        if (this.netMessageHandlers[message.type])
            for (let handler of this.netMessageHandlers[message.type])
                handler(message);
        else
            error("Unrecognized net message type " + message.type);
    }
}
