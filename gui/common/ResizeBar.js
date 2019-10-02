// See lobby_autociv.js init function for examples.
function ResizeBar(object, side, width, objectsHooked, isVisibleCondition, onDragDown)
{
	this.object = this.parseObject(object);
	this.side = side;

	this.halfWidth = width === undefined ?
		ResizeBar.defaults.width / 2 :
		width / 2;

	this.objectsHooked = objectsHooked ? objectsHooked : [];

	this.isVisibleCondition = isVisibleCondition ?
		isVisibleCondition :
		() => !this.object.hidden;

	this.onDragDown = onDragDown ? onDragDown : () => { };

	// True if the last time (tick) the mouse was inside.
	this.wasInside = false;

	// True if this bar is being dragged.
	this.dragging = false;

	for (let i = 0; i < this.objectsHooked.length; ++i)
		this.objectsHooked[i][0] = this.parseObject(this.objectsHooked[i][0]);
}

ResizeBar.mouse = {
	"x": 0,
	"y": 0,
	"set": function (mouse)
	{
		this.x = mouse.x;
		this.y = mouse.y;
	}
};

ResizeBar.mousePress = Object.assign({}, ResizeBar.mouse);

ResizeBar.mouseRelease = Object.assign({}, ResizeBar.mouse);

// True is one of the bars is being dragged.
ResizeBar.dragging = false;

ResizeBar.defaults = { "width": 14 };

// Used to disable bar selection while the resize animation is happening.
ResizeBar.ghostMode = false;

// Signed distance from bar center to mouse cursor when selected.
ResizeBar.dispErr = 0;

ResizeBar.prototype.parseObject = function (object)
{
	return typeof object == "string" ?
		Engine.GetGUIObjectByName(object) :
		object;
};

ResizeBar.prototype.mouseInside = function ()
{
	if (!this.isVisibleCondition())
		return false;

	let rect = this.object.getComputedSize();
	switch (this.side)
	{
		case "left":
		case "right":
			return Math.abs(rect[this.side] - ResizeBar.mouse.x) <= this.halfWidth &&
				rect.top + this.halfWidth < ResizeBar.mouse.y &&
				rect.bottom - this.halfWidth > ResizeBar.mouse.y;
		case "top":
		case "bottom":
			return Math.abs(rect[this.side] - ResizeBar.mouse.y) <= this.halfWidth &&
				rect.left + this.halfWidth < ResizeBar.mouse.x &&
				rect.right - this.halfWidth > ResizeBar.mouse.x;
		default:
			warn(`No side by name: "${this.side}"\n` + Error().stack);
	}
};

/**
 * Returns the complementary parameter.
 */
ResizeBar.prototype.sideComplementary = function (side)
{
	switch (side ? side : this.side)
	{
		case "left": return "right";
		case "right": return "left";
		case "top": return "bottom";
		case "bottom": return "top";
	}
};

/**
 * Returns the opposite parameter.
 */
ResizeBar.prototype.sideOpposite = function (side)
{
	switch (side ? side : this.side)
	{
		case "left": return "top";
		case "right": return "bottom";
		case "top": return "left";
		case "bottom": return "right";
	}
};

/**
 * Returns the opposite and complementary paramter.
 */
ResizeBar.prototype.sideCrossed = function (side)
{
	return this.sideComplementary(this.sideOpposite());
};

ResizeBar.prototype.sideSign = function (side)
{
	switch (side ? side : this.side)
	{
		case "right":
		case "bottom":
			return +1;
		default:
			return -1;
	}
};

ResizeBar.prototype.sideMouse = function (side)
{
	switch (side ? side : this.side)
	{
		case "left":
		case "right":
			return "x";
		default:
			return "y";
	}
};

ResizeBar.prototype.viewResizeBar = function ()
{
	let absPos = this.object.getComputedSize();

	let iSize = GUISize();
	iSize[this.side] = absPos[this.side];
	iSize[this.sideComplementary()] = absPos[this.side];
	iSize[this.sideOpposite()] = absPos[this.sideOpposite()];
	iSize[this.sideCrossed()] = absPos[this.sideCrossed()];

	let fSize = Object.assign({}, iSize); // Copy
	fSize[this.side] = iSize[this.side] + this.sideSign() * this.halfWidth;
	fSize[this.sideComplementary()] = iSize[this.side] - this.sideSign() * this.halfWidth;

	kinetic(ResizeBar.bar).add({
		"onStart": bar =>
		{
			bar.size = iSize;
			bar.hidden = false;
		},
		"size": fSize
	});
};

ResizeBar.prototype.hideResizeBar = function ()
{
	let iSize = ResizeBar.bar.size;
	let centerPos = (iSize[this.side] + iSize[this.sideComplementary()]) * 0.5;
	iSize[this.side] = centerPos;
	iSize[this.sideComplementary()] = centerPos;

	kinetic(ResizeBar.bar).add({
		"size": iSize,
		"onComplete": bar => bar.hidden = true
	});
};

ResizeBar.prototype.tick = function ()
{
	// If some bar is being dragged ignore all the others.
	if (!ResizeBar.dragging)
	{
		let isInside = this.mouseInside();
		// If same "state" and bar visible do nothing.
		if (this.wasInside == isInside && !ResizeBar.bar.hidden)
			return;
		// If the cursor goes inside bar then make the bar visible.
		if (isInside)
			this.viewResizeBar();
		// If the cursor goes outside bar then hide the bar.
		else
			this.hideResizeBar();
		// Update last "state"
		this.wasInside = isInside;
		return isInside;
	}
	// If this resize bar in specific is being dragged then update this bar position.
	else if (this.dragging)
	{
		let size = ResizeBar.bar.size;
		let position = ResizeBar.mouse[this.sideMouse()] - ResizeBar.dispErr;
		size[this.side] = position + this.sideSign() * this.halfWidth;
		size[this.sideComplementary()] = position - this.sideSign() * this.halfWidth;
		ResizeBar.bar.size = size;
	}
};

ResizeBar.prototype.drag = function ()
{
	if (!this.mouseInside())
		return false;

	ResizeBar.mousePress.set(ResizeBar.mouse);
	ResizeBar.dragging = true;
	ResizeBar.dispErr = ResizeBar.mousePress[this.sideMouse()] - this.object.getComputedSize()[this.side];
	this.dragging = true;
	return true;
};

ResizeBar.prototype.drop = function ()
{
	if (!this.dragging)
		return false;

	ResizeBar.mouseRelease.set(ResizeBar.mouse);

	let displacement = ResizeBar.mouseRelease[this.sideMouse()] - ResizeBar.mousePress[this.sideMouse()];
	if (displacement)
	{
		ResizeBar.ghostMode = true;
		kinetic(this.object).add({
			"size": { [this.side]: this.object.size[this.side] + displacement },
			"onComplete": () =>
			{
				this.onDragDown();
				ResizeBar.ghostMode = false;
			}
		});
		for (let [object, side] of this.objectsHooked)
			kinetic(object).add({
				"size": { [side]: object.size[side] + displacement }
			});
	}

	ResizeBar.dragging = false;
	this.dragging = false;
	return true;
};

/**
 * Creates a resize bar for an GUIObject.
 *
 * Example:
 *
 * resizeBar(
 *	Engine.GetGUIObjectByName("chatPanel"),
 *	"left",
 *	20,
 *	[
 *		[Engine.GetGUIObjectByName("profilePanel"), "right"],
 *		[Engine.GetGUIObjectByName("leftButtonPanel"), "right"],
 *	],
 *	() => !Engine.GetGUIObjectByName("profilePanel").hidden,
 *	() => warn("chatPanel resized")
 * );
 *
 * @param {GUIObject} object Main XML object to resize.
 * @param {String} side Object side to resize: "left", "right", "top", "bottom".
 * @param {Number} [width] Resize bar width, undefined value will assign the
 * default width.
 * @param {Array[]} [objectsHooked] Other XML objects that will also resize with
 * the main XML object.
 * In the form of [[GUIObject1,side1],[GUIObject2,side2],...]
 * @param {Function} [isVisibleCondition] Condition that makes the resize bar
 * visible/enabled if it returns true. By default the condition is the property
 * hidden of the main XML object, visible/enabled if not hidden.
 * @param {Function} [onDragDown] Call executed after dragging down the bar.
 */
var resizeBar = function (object, side, width, objectsHooked, isVisibleCondition, onDragDown)
{
	resizeBar.list.push(new ResizeBar(object, side, width, objectsHooked, isVisibleCondition, onDragDown));
};


resizeBar.list = [];

resizeBar.firstTick = true;

resizeBar.disabled = false;

resizeBar.onEvent = function (event)
{
	if (resizeBar.disabled)
		return;

	if (resizeBar.firstTick)
		return;

	switch (event.type)
	{
		case "mousebuttondown":
			for (let bar of resizeBar.list)
				if (bar.drag()) return true;
			break;
		case "mousebuttonup":
			for (let bar of resizeBar.list)
				if (bar.drop()) return true;
			break;
		case "mousemotion":
			ResizeBar.mouse.set(event)
			break;
	}
}

/**
 * Tick routine always called on all pages with
 * global.xml included (all?).
 */
resizeBar.onTick = function ()
{
	if (resizeBar.disabled)
		return;

	// Don't process anything at the first tick (error otherwise)
	switch (resizeBar.firstTick)
	{
		case true:
			resizeBar.firstTick = false;
			ResizeBar.bar = Engine.GetGUIObjectByName("glResizeBar");
			break;
		default:
			if (!ResizeBar.ghostMode)
				for (let bar of resizeBar.list)
					if (bar.tick()) break;
	}
}

/* THIS NEEDS TO BE ADDED ON FILES WHERE YOU WANT TO USE IT

	function handleInputBeforeGui(ev)
    {
        resizeBar.onEvent(ev);
        return false;
    }
*/
