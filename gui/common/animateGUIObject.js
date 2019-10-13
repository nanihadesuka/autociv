function AnimateGUIObject(GUIObject, settings)
{
	this.GUIObject = GUIObject;
	this.settings = deepfreeze(settings);

	// Stores animation data. E.g. duration, queue, curve function, etc.
	this.data = this.getData(this.settings);

	// Stores the parsed values as defined by this.indentity.
	this.startValues = this.settings.start ? this.getValues(this.settings.start) : {};
	this.endValues = this.getValues(this.settings);

	// Stores parsed types actions. Filled in stageStart.
	this.actions = {};

	this.stagesChain = [
		this.stageInit,
		this.stageDelay,
		this.stageStart,
		this.stageTick,
		this.stageComplete
	];

	this.stage = this.stagesChain[0];
}

AnimateGUIObject.defaults = {
	"duration": 200,
	"curve": "easeOutQuint",
	"delay": 0,
	"queue": false
};

AnimateGUIObject.curves = {
	"linear": x => x,
	"easeInOut": x => x * x * x * (x * (x * 6 - 15) + 10),
	"easeInSine": x => 1 - Math.cos(x * Math.PI / 2),
	"easeOutSine": x => Math.sin(x * Math.PI / 2),
	"easeInQuint": x => Math.pow(x, 5),
	"easeOutQuint": x => 1 - Math.pow(1 - x, 5)
};

/**
 * Types specialized methods (size, color, textcolor, ...)
 * Each defined in its animateGUIObject_*.js
 */
AnimateGUIObject.prototype.identities = {};

AnimateGUIObject.prototype.getData = function (raw)
{
	let datas = {};
	for (let data in AnimateGUIObject.defaults)
		datas[data] = clone(data in raw ? raw[data] : AnimateGUIObject.defaults[data]);

	// Curve input can be string or function and is outputed as function
	datas.curve = AnimateGUIObject.curves[datas.curve] || datas.curve;
	return datas;
};

AnimateGUIObject.prototype.getValues = function (raw)
{
	let values = {};
	for (let value in this.identities) if (value in raw)
		values[value] = typeof raw[value] == "object" ?
			this.identities[value].fromObject(raw[value]) :
			this.identities[value].fromString(raw[value]);
	return values;
};

AnimateGUIObject.prototype.getAction = function (raw, type)
{
	let attribute = { "parameters": {} };
	let identity = this.identities[type];

	let original = identity.get(this.GUIObject);
	for (let parameter of identity.parameters) if (parameter in raw)
	{
		let start = original[parameter];
		let end = raw[parameter];
		attribute.parameters[parameter] = x => start + x * (end - start);
	}

	attribute.calc = x =>
	{
		let object = identity.get(this.GUIObject);
		for (let parameter in attribute.parameters)
			object[parameter] = attribute.parameters[parameter](x);
		identity.set(this.GUIObject, object);
	}
	return attribute;
};

AnimateGUIObject.prototype.getActions = function (raw)
{
	let actions = {};
	for (let type in this.identities) if (type in raw)
		actions[type] = this.getAction(raw[type], type)
	return actions;
};

AnimateGUIObject.prototype.setValues = function (values, GUIObject = this.GUIObject)
{
	for (let type in values)
	{
		let object = this.identities[type].get(GUIObject);
		for (let parameter in values[type])
			object[parameter] = values[type][parameter];
		this.identities[type].set(GUIObject, object);
	}
};

AnimateGUIObject.prototype.run = function (time)
{
	while (this.stage && this.stage(time))
		this.stage = this.stagesChain.shift();
	return this;
};

AnimateGUIObject.prototype.hasRemainingStages = function ()
{
	return !!this.stage;
};

AnimateGUIObject.prototype.stageInit = function (time)
{
	this.data.start = time + this.data.delay;
	this.data.end = this.data.start + this.data.duration;
	return true;
};

AnimateGUIObject.prototype.stageDelay = function (time)
{
	return time >= this.data.start;
};

AnimateGUIObject.prototype.stageStart = function (time)
{
	// Set starting values if any.
	this.setValues(this.startValues);

	if (this.settings.onStart)
		this.settings.onStart(this.GUIObject, this);

	// Called here given the user might modify the object before stageStart
	this.actions = this.getActions(this.endValues);

	return true;
};

AnimateGUIObject.prototype.stageTick = function (time)
{
	let running = time < this.data.end;
	let uniformTime = running ?
		(time - this.data.start) / this.data.duration :
		1;
	let x = this.data.curve(uniformTime);

	if (!this.noActionsUpdate)
		for (let attribute in this.actions)
			this.actions[attribute].calc(x);

	if (this.settings.onTick)
		this.settings.onTick(this.GUIObject, this);

	return !running;
};

AnimateGUIObject.prototype.stageComplete = function (time)
{
	if (this.settings.onComplete)
		this.settings.onComplete(this.GUIObject, this);

	return true;
};

/**
 * Checks if the animation has any type that still modifies the GUIObject.
 */
AnimateGUIObject.prototype.isAlive = function ()
{
	return !!Object.keys(this.endValues).length;
};

/**
 * Removes types/actions that the old animation has with the new animation.
 */
AnimateGUIObject.prototype.removeIntersections = function (newAnimation)
{
	for (let type of Object.keys(this.endValues))
		this.removeValueIntersections(newAnimation, type);

	return this;
};

AnimateGUIObject.prototype.removeValueIntersections = function (newAnimation, type)
{
	if (!newAnimation.endValues[type])
		return;

	for (let parameter of Object.keys(this.endValues[type]))
	{
		if (newAnimation.endValues[type][parameter] === undefined)
			continue;

		delete this.endValues[type][parameter];
		if (this.actions[type])
			delete this.actions[type].parameters[parameter];
	}

	if (Object.keys(this.endValues[type]).length)
		return;

	delete this.endValues[type];
	delete this.actions[type];
	return this;
};

/**
 * Jump to the end of the animation.
 * onStart/onTick/onComplete behaviour doesn't change.
 * @param {Boolean} noActionsUpdate Ends animations witout updating actions.
 */
AnimateGUIObject.prototype.complete = function (noActionsUpdate = false)
{
	this.noActionsUpdate = noActionsUpdate;
	this.data.end = Date.now();
	return this;
};

function GUIObjectSet(object, settings)
{
	const GUIObject = typeof object == "string" ? Engine.GetGUIObjectByName(object) : object;
	let values = AnimateGUIObject.prototype.getValues(settings);
	AnimateGUIObject.prototype.setValues(values, GUIObject);
	return GUIObject;
}
