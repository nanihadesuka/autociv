Health.prototype.CreateCorpse = function()
{
	// If the unit died while not in the world, don't create any corpse for it
	// since there's nowhere for the corpse to be placed.
	let cmpPosition = Engine.QueryInterface(this.entity, IID_Position);
	if (!cmpPosition || !cmpPosition.IsInWorld())
		return;

	// Either creates a static local version of the current entity, or a
	// persistent corpse retaining the ResourceSupply element of the parent.
	let templateName = Engine.QueryInterface(SYSTEM_ENTITY, IID_TemplateManager).GetCurrentTemplateName(this.entity);

	let entCorpse;
	let cmpResourceSupply = Engine.QueryInterface(this.entity, IID_ResourceSupply);
	let resource = cmpResourceSupply && cmpResourceSupply.GetKillBeforeGather();
	if (resource)
		entCorpse = Engine.AddEntity("resource|" + templateName);
    else
    {
        entCorpse = Engine.AddLocalEntity("corpse|" + templateName);
        // START: ADDED THIS **************************************************
        // ****************** **************************************************
        const cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
        cmpGUIInterface.autociv_CorpseAdd(entCorpse);
        // END: ADDED THIS ****************************************************
        // *********************************************************************
    }

	// Copy various parameters so it looks just like us.
	let cmpPositionCorpse = Engine.QueryInterface(entCorpse, IID_Position);
	let pos = cmpPosition.GetPosition();
	cmpPositionCorpse.JumpTo(pos.x, pos.z);
	let rot = cmpPosition.GetRotation();
	cmpPositionCorpse.SetYRotation(rot.y);
	cmpPositionCorpse.SetXZRotation(rot.x, rot.z);

	let cmpOwnership = Engine.QueryInterface(this.entity, IID_Ownership);
	let cmpOwnershipCorpse = Engine.QueryInterface(entCorpse, IID_Ownership);
	if (cmpOwnership && cmpOwnershipCorpse)
		cmpOwnershipCorpse.SetOwner(cmpOwnership.GetOwner());

	let cmpVisualCorpse = Engine.QueryInterface(entCorpse, IID_Visual);
	if (cmpVisualCorpse)
	{
		let cmpVisual = Engine.QueryInterface(this.entity, IID_Visual);
		if (cmpVisual)
			cmpVisualCorpse.SetActorSeed(cmpVisual.GetActorSeed());

		cmpVisualCorpse.SelectAnimation("death", true, 1);
	}

	if (resource)
		Engine.PostMessage(this.entity, MT_EntityRenamed, {
			"entity": this.entity,
			"newentity": entCorpse
		});
};
