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

g_NotificationsTypes["autociv_minimap_flare"] = function (notification, player)
{
    if (g_IsObserver || !GetSimState().players[Engine.GetPlayerID()].isMutualAlly[player])
        return;

    let minimap = Engine.GetGUIObjectByName("minimapPanel").children[0];
    let minimapSize = minimap.getComputedSize();
    let nTiles = autociv_getMapSizeInTiles();

    // Normalize to [-1,1]
    let nx = 2 * (notification.mapPos.x / nTiles - 0.5) * (-1);
    let nz = 2 * (notification.mapPos.z / nTiles - 0.5);

    // Rotate acording to camera rotation
    let p = new Vector2D(nx, nz).rotate(autociv_getCameraAngle());

    // Scale (smaller) if map is squared
    if (!g_GameAttributes.settings.CircularMap)
        p.div(Math.sqrt(2));

    // Move coordinate system origin top left corner with range [0,1]
    p.x = (p.x + 1) / 2;
    p.y = (p.y + 1) / 2;

    // Transform to window abs coordinates
    let minimapWidth = minimapSize.right - minimapSize.left;
    let minimapHeight = minimapSize.bottom - minimapSize.top;

    let x = minimapSize.left + minimapWidth * p.x;
    let y = minimapSize.top + minimapHeight * p.y;

    // Set flare gui object abs cordinates
    let minimapFlare = Engine.GetGUIObjectByName("gl_autociv_MinimapFlare");

    animate(minimapFlare).complete().add({
        "start": {
            "size": { "left": x, "top": y }
        },
        "onStart": obj => obj.hidden = "false",
        "onComplete": obj => obj.hidden = "true",
        "onTick": (obj, that) => obj.hidden = ((Date.now() - that.data.start) % 1500) > 1200,
        "duration": 4000,
    });
};
