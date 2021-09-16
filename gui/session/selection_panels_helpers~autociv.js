function setCameraFollow(entity)
{
	let entState = entity && GetEntityState(entity);
	if (entState && hasClass(entState, "Unit"))
		Engine.CameraFollow(entity);
	else if (!entState || !entState.position)
		Engine.CameraFollow(0);
	else
		Engine.CameraMoveTo(entState.position.x, entState.position.z);
}
