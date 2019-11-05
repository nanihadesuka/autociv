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
