AnimateGUIObject.prototype.identity.size = {
	"types": deepfreeze(["left", "top", "right", "bottom", "rleft", "rtop", "rright", "rbottom"]),
	"set": (guiObject, object) => guiObject.size = object,
	"get": guiObject => guiObject.size,
	"fromString": function (text)
	{
		let size = {};
		let blocks = text.match(/[\d%\.\+\-]+/g);
		for (let i = 0; i < 4; ++i)
		{
			let block = blocks[i].split("%");
			if (block.length == 2)
			{
				size[this.types[i + 4]] = +block[0];
				size[this.types[i]] = +block[1];
			}
			else
				size[this.types[i]] = +block[0];
		};
		return size;
	},
	"fromObject": object => Object.assign({}, object),
};
