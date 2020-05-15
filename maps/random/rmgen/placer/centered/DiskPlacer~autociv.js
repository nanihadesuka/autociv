// // improve the initial points boundary guess.
// DiskPlacer.prototype.place = function (constraint)
// {
// 	let points = [];

// 	const radius = Math.sqrt(this.radiusSquared) + 1;

// 	const minx = Math.max(Math.floor(this.centerPosition.x - radius), 0);
// 	const maxx = Math.min(Math.ceil(this.centerPosition.x + radius), g_Map.getSize());

// 	const miny = Math.max(Math.floor(this.centerPosition.y - radius), 0);
// 	const maxy = Math.min(Math.ceil(this.centerPosition.y + radius), g_Map.getSize());

// 	for (let x = minx; x < maxx; ++x)
// 		for (let y = miny; y < maxy; ++y)
// 		{
// 			let point = new Vector2D(x, y);
// 			if (this.centerPosition.distanceToSquared(point) <= this.radiusSquared && constraint.allows(point))
// 				points.push(point);
// 		}

// 	return points;
// };
