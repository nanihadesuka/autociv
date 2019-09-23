AnimateGUIObject.prototype.identity.size = {
	"types": deepfreeze(["left", "top", "right", "bottom", "rleft", "rtop", "rright", "rbottom"]),
	"set": (guiObject, object) => guiObject.size = object,
	"get": guiObject => guiObject.size,
	"fromString": function (text)
	{
		let size = {};
		let block = text.split(" ").filter(t => t != "").map(t => t.split("%"));
		for (let i = 0; i < 4; ++i)
		{
			if (block[i].length == 2)
			{
				size[this.types[i + 4]] = +block[i][0];
				if (block[i][1] != "")
					size[this.types[i]] = +block[i][1];
			}
			else
				size[this.types[i]] = +block[i][0];
		};
		return size;
	},
	"fromObject": object => Object.assign({}, object),
};
