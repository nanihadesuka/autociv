function displayPanelEntities()
{
	let buttons = Engine.GetGUIObjectByName("panelEntityPanel").children;

	buttons.forEach((button, slot) =>
	{

		if (button.hidden || g_PanelEntities.some(ent => ent.slot !== undefined && ent.slot == slot))
			return;

		button.hidden = true;
		stopColorFade("panelEntityHitOverlay[" + slot + "]");
	});

	// The slot identifies the button, displayIndex determines its position.
	for (let displayIndex = 0; displayIndex < Math.min(g_PanelEntities.length, buttons.length); ++displayIndex)
	{
		let panelEnt = g_PanelEntities[displayIndex];

		// Find the first unused slot if new, otherwise reuse previous.
		let slot = panelEnt.slot === undefined ?
			buttons.findIndex(button => button.hidden) :
			panelEnt.slot;

		let panelEntButton = Engine.GetGUIObjectByName("panelEntityButton[" + slot + "]");

		//=================| BUG idk why |=================
		if (panelEntButton === undefined)
			continue;
		//=================================================

		panelEntButton.tooltip = panelEnt.tooltip;

		updateGUIStatusBar("panelEntityHealthBar[" + slot + "]", panelEnt.currentHitpoints, panelEnt.maxHitpoints);

		if (panelEnt.slot === undefined)
		{
			let panelEntImage = Engine.GetGUIObjectByName("panelEntityImage[" + slot + "]");
			panelEntImage.sprite = panelEnt.sprite;

			panelEntButton.hidden = false;
			panelEnt.slot = slot;
		}

		// If the health of the panelEnt changed since the last update, trigger the animation.
		if (panelEnt.previousHitpoints > panelEnt.currentHitpoints)
			startColorFade("panelEntityHitOverlay[" + slot + "]", 100, 0,
				colorFade_attackUnit, true, smoothColorFadeRestart_attackUnit);

		// TODO: Instead of instant position changes, animate button movement.
		setPanelObjectPosition(panelEntButton, displayIndex, buttons.length);
	}
}


// Hack fix to the "t"
openChat = (function (originalFunction)
{
	return function ()
	{
		let result = originalFunction.apply(this, arguments);
		setTimeout(() =>
		{
			let chatInput = Engine.GetGUIObjectByName("chatInput");
			if (chatInput.caption === "t")
				chatInput.caption = "";
		}, 1);
		return result;
	}
})(openChat)
