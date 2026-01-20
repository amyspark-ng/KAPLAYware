import { k } from "../../../kaplay";

const BGs = ["#8465ec", "#873e84", "#c97373", "#5ba675"];
const tileSize = 90;
const tilesSpeed = 60; // px per second
let tilesOffset = 0; // current offset over time

export function addBackground() {
	const bg = k.add([k.opacity(), k.rect(k.width(), k.height()), k.color()]);

	// Loops BGs[] smoothly using lerp and modulo (%) to wrap from last to first
	// over time, used in onDraw()
	function lerpBackgroundColor(BGs, speed = 0.3) {
		const t = k.time() * speed;
		const i = Math.floor(t) % BGs.length;
		bg.color = k.lerp(k.rgb(BGs[i]), k.rgb(BGs[(i + 1) % BGs.length]), t % 1);
	}

	bg.onDraw(() => {
		lerpBackgroundColor(BGs);

		// Update tiles offset each frame before drawing the pattern
		// Modulo (%) wraps tileOffset to be between 0 and tileSize,
		// instead of increasing number yet keeping smooth loop
		tilesOffset = (tilesOffset + tilesSpeed * k.dt()) % tileSize;
		drawPattern();
	});

	// Draws background pattern, used in onDraw()
	function drawPattern() {
		// Create rows/cols slightly larger than screen for seamless pattern scrolling
		for (let y = -tileSize; y < Math.ceil(k.height() / tileSize) + 2; y++) {
			for (let x = -tileSize; x < Math.ceil(k.width() / tileSize) + 2; x++) {
				// Draw tile only in even cells
				if ((x + y) % 2 == 0) {
					k.drawSprite({
						sprite: "bean",
						anchor: "center",
						scale: k.vec2(1.25),
						// Set pos of tile in grid cell of tileSize
						// Apply offset, wrapped to [0, tileSize] using modulo (%)
						pos: k.vec2(
							x * tileSize - (tilesOffset % tileSize), // negative scrolls left
							y * tileSize + (tilesOffset % tileSize), // positive scrolls down
						),
						color: k.BLACK,
						opacity: 0.1 * bg.opacity,
					});
				}
			}
		}
	}

	return bg;
}
