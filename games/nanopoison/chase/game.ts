import { assets } from "@kaplayjs/crew";
import { Minigame } from "../../../src/kaplayware";

const newGame: Minigame = {
	prompt: "chase",
	author: "nanopoison",
	hue: 1,
	duration: 4,
	urlPrefix: "games/nanopoison/assets",
	load(ctx) {
		ctx.loadSprite("kat", assets.kat.sprite);
		ctx.loadSprite("karat", assets.karat.sprite);
		ctx.loadSprite("steel", assets.steel.sprite);
	},
	start(ctx) {
		const game = ctx.make([
			ctx.timer()
		]);

		const moveRate = 0.5 / ctx.speed;
		let level;

		switch (ctx.difficulty) {
			case 1:
				level = [
					"------------",
					"-          -",
					"- ---  --- -",
					"-          -",
					"- ---  --- -",
					"-          -",
					"- ---  --- -",
					"-          -",
					"------------",
				]
				break;
			case 2:
				level = [
					"------------",
					"- -        -",
					"-   ------ -",
					"- -        -",
					"- --- ---- -",
					"-       -  -",
					"- ---- --- -",
					"-          -",
					"------------",
				]
				break;
			case 3:
				level = [
					"------------",
					"-          -",
					"- -- -- -- -",
					"- -      - -",
					"- -- ----- -",
					"- -   -    -",
					"---------  -",
					"-          -",
					"------------",
				]
				break;
		}

		const directions = {
			UP: ctx.vec2(0, -1),
			DOWN: ctx.vec2(0, 1),
			LEFT: ctx.vec2(-1, 0),
			RIGHT: ctx.vec2(1, 0),
		}

		class Grid {
			grid = [];
			w = 12;
			h = 9;

			constructor() {
				for (let r = 0; r < this.h; r++) {
					this.grid[r] = [];
					for (let c = 0; c < this.w; c++) {
						if (level[r].charAt(c) == ' ') {
							this.grid[r][c] == null;
						} else {
							this.grid[r][c] = game.add([
								ctx.pos(this.getWorldPos(c, r)),
								ctx.sprite("steel"),
							])
						}
					}
				}
			}

			getWorldPos(c, r) {
				return ctx.vec2(16 + (c * 64), 12 + (r * 64));
			}

			getCellCoords(pos) {
				let c = Math.floor((pos.x - 16) / 64);
				let r = Math.floor((pos.y - 12) / 64);
				return { x: c, y: r};
			}

			isCellInBounds(c, r) {
				return c >= 0 && c < this.w && r >= 0 && r < this.h;
			}

			isCellBlocked(c, r) {
				if (!this.isCellInBounds(c,r))
					return true;
				console.log(`${r}, ${c}`);
				return this.grid[r][c] != null;
			}
		}

		function moveTo(obj, coordinates, sound = true) {
			if (grid.isCellBlocked(coordinates.x, coordinates.y)) {
				if (sound) {
					// play blocked sound

				}
			} else {
				// move the object
				obj.pos = grid.getWorldPos(coordinates.x, coordinates.y);
				// the way i made the characters move doesn't work with this lol
				//ctx.tween(obj.pos, grid.getWorldPos(coordinates.x, coordinates.y), 0.2, (p) => obj.pos = p, ctx.easings.easeInOutCubic);
				if (sound) {
					// play move sound

				}
			}
		}

		const grid = new Grid();

		const kat = game.add([
			ctx.sprite("kat"),
			ctx.pos(grid.getWorldPos(1, 7)),
			ctx.area(),
		]);

		const karat = game.add([
			ctx.sprite("karat"),
			ctx.pos(grid.getWorldPos(8, 3).add(16,16)),
			ctx.area(),
			ctx.scale(0.5),
			"karat"
		])

		ctx.onButtonPress("left", () => {
			var cellCoords = grid.getCellCoords(kat.pos);
			var moveCoords = ctx.vec2(cellCoords.x - 1, cellCoords.y)
			
			moveTo(kat, moveCoords)
		});

		ctx.onButtonPress("right", () => {
			var cellCoords = grid.getCellCoords(kat.pos);
			var moveCoords = ctx.vec2(cellCoords.x + 1, cellCoords.y)
			
			moveTo(kat, moveCoords)
		});

		ctx.onButtonPress("up", () => {
			var cellCoords = grid.getCellCoords(kat.pos);
			var moveCoords = ctx.vec2(cellCoords.x, cellCoords.y - 1)
			
			moveTo(kat, moveCoords)
		});

		ctx.onButtonPress("down", () => {
			var cellCoords = grid.getCellCoords(kat.pos);
			var moveCoords = ctx.vec2(cellCoords.x, cellCoords.y + 1)
			
			moveTo(kat, moveCoords)
		})

		let karatMoveLoop = game.loop(moveRate, () => {
			let availableDirections = [];
			var cellCoords = grid.getCellCoords(karat.pos);
			for (const [k, dir] of Object.entries(directions)) {
				var dc = dir.add(cellCoords.x, cellCoords.y);
				if (!grid.isCellBlocked(dc.x, dc.y))
					availableDirections.push(dir);
			}

			var randomDir = availableDirections[Math.floor(Math.random() * availableDirections.length)];
			if (randomDir != null) {
				moveTo(karat, randomDir.add(cellCoords.x, cellCoords.y), false);
				karat.pos = karat.pos.add(12,16);
			}
		})

		kat.onCollide("karat", () => {
			karatMoveLoop.cancel();
			karat.destroy();
			ctx.win();
			ctx.burp().onEnd(() => {
				ctx.wait(0.1, () => {
					ctx.finish();
				});
			});
		})

		ctx.onTimeout(() => {
			if (karat.exists()) {
				ctx.lose();
				ctx.wait(0.5, () => ctx.finish());
			}
		})

		return game;
	},
};

export default newGame;