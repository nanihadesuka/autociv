// See lobby_autociv.js init function for examples.
function ResizeBar(object, side, width, objectsHooked, isVisibleCondition, onDragDown)
{
	this.object = this.parseObject(object);
	this.side = side;
	this.halfWidth = (width || ResizeBar.defaults.width) / 2;
	this.objectsHooked = objectsHooked || [];
	this.isVisibleCondition = isVisibleCondition || (() => !this.object.hidden);
	this.onDragDown = onDragDown || (() => { });
	this.wasMouseInside = false;
	this.selectionOffset = 0;
	for (let i = 0; i < this.objectsHooked.length; ++i)
		this.objectsHooked[i][0] = this.parseObject(this.objectsHooked[i][0]);
}

ResizeBar.defaults = { "width": 14 };

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

// Holds ResizeBar instance of the that is being dragged
ResizeBar.dragging = undefined;

// Used to disable bar selection while the resize animation is happening.
ResizeBar.ghostMode = false;

ResizeBar.prototype.parseObject = function (object)
{
	return typeof object == "string" ? Engine.GetGUIObjectByName(object) : object;
};

ResizeBar.prototype.isMouseInside = function ()
{
	if (!this.isVisibleCondition())
		return false;

	let rect = this.object.getComputedSize();
	let pos = ResizeBar.mouse;
	switch (this.side)
	{
		case "left":
		case "right":
			return Math.abs(rect[this.side] - pos.x) <= this.halfWidth &&
				rect.top + this.halfWidth < pos.y &&
				rect.bottom - this.halfWidth > pos.y;
		case "top":
		case "bottom":
			return Math.abs(rect[this.side] - pos.y) <= this.halfWidth &&
				rect.left + this.halfWidth < pos.x &&
				rect.right - this.halfWidth > pos.x;
		default:
			return false;
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
	animate(ResizeBar.bar).finish().add({
		"start": {
			"size": {
				[this.side]: absPos[this.side],
				[this.sideComplementary()]: absPos[this.side],
				[this.sideOpposite()]: absPos[this.sideOpposite()],
				[this.sideCrossed()]: absPos[this.sideCrossed()]
			}
		},
		"onStart": bar => bar.hidden = false,
		"size": {
			[this.side]: absPos[this.side] + this.sideSign() * this.halfWidth,
			[this.sideComplementary()]: absPos[this.side] - this.sideSign() * this.halfWidth
		}
	});
};

ResizeBar.prototype.hideResizeBar = function ()
{
	let iSize = ResizeBar.bar.size;
	let centerPos = (iSize[this.side] + iSize[this.sideComplementary()]) / 2;
	animate(ResizeBar.bar).finish().add({
		"size": {
			[this.side]: centerPos,
			[this.sideComplementary()]: centerPos
		},
		"onComplete": bar => bar.hidden = true
	});
};

ResizeBar.prototype.tick = function ()
{
	if (ResizeBar.dragging === this)
	{
		let position = ResizeBar.mouse[this.sideMouse()] - this.selectionOffset;
		GUIObjectSet(ResizeBar.bar, {
			"size": {
				[this.side]: position + this.sideSign() * this.halfWidth,
				[this.sideComplementary()]: position - this.sideSign() * this.halfWidth
			}
		});
	}
	else if (!ResizeBar.dragging)
	{
		let isInside = this.isMouseInside();

		if (isInside && this.wasMouseInside && ResizeBar.bar.hidden)
			return this.viewResizeBar();

		if (this.wasMouseInside == isInside)
			return;

		if (this.wasMouseInside)
			this.hideResizeBar();
		else
			this.viewResizeBar();

		return this.wasMouseInside = !this.wasMouseInside;
	}
};

ResizeBar.prototype.drag = function ()
{
	if (!this.isMouseInside())
		return false;

	ResizeBar.mousePress.set(ResizeBar.mouse);
	ResizeBar.dragging = this;
	this.selectionOffset = ResizeBar.mousePress[this.sideMouse()] - this.object.getComputedSize()[this.side];
	return true;
};

ResizeBar.prototype.drop = function ()
{
	if (ResizeBar.dragging !== this)
		return false;

	ResizeBar.mouseRelease.set(ResizeBar.mouse);

	let displacement = ResizeBar.mouseRelease[this.sideMouse()] - ResizeBar.mousePress[this.sideMouse()];
	if (displacement)
	{
		ResizeBar.ghostMode = true;
		animate(this.object).add({
			"size": { [this.side]: this.object.size[this.side] + displacement },
			"onComplete": () =>
			{
				this.onDragDown();
				ResizeBar.ghostMode = false;
			}
		});
		for (let [object, side] of this.objectsHooked)
			animate(object).add({
				"size": { [side]: object.size[side] + displacement }
			});
	}

	ResizeBar.dragging = undefined;
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
