AnimateGUIObject.types.size = {
	"parameters": deepfreeze(["left", "top", "right", "bottom", "rleft", "rtop", "rright", "rbottom"]),
	"set": (GUIObject, object) => GUIObject.size = object,
	"get": GUIObject => GUIObject.size,
	"fromString": function (text)
	{
		let size = {};
		let blocks = text.match(/[\d%\.\+\-]+/g);
		for (let i = 0; i < 4; ++i)
		{
			let block = blocks[i].split("%");
			if (block.length == 2)
			{
				size[this.parameters[i + 4]] = +block[0];
				size[this.parameters[i]] = +block[1];
			}
			else
				size[this.parameters[i]] = +block[0];
		};
		return size;
	},
	"fromObject": object => Object.assign({}, object),
};
