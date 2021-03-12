g_NotificationsTypes["autociv_autotrain"] = function (notification, player)
{
    if (player != Engine.GetPlayerID())
        return;

    Engine.PostNetworkCommand({
        "type": "train",
        "template": notification.template,
        "count": notification.count,
        "entities": notification.entities
    });
};

autociv_patchApplyN("addChatMessage", function (target, that, args)
{
    let [msg] = args;
    return botManager.react(msg) || target.apply(that, args);
})
