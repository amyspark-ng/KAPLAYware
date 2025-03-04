import { assets } from "@kaplayjs/crew";
import { Minigame } from "../../../src/types.ts";

const transformGame: Minigame = {
	prompt: "transform",
	author: "ricjones",
	rgb: [74, 48, 82],  // rgb for #4a3052 from mulfok32 palette
	urlPrefix: "games/ricjones/assets",
	load(ctx) {
		ctx.loadSprite("bean", assets.bean.sprite);
		ctx.loadSprite("left", "/left.png");
		ctx.loadSprite("right", "/right.png");
		ctx.loadSprite("up", "/up.png");
		ctx.loadSprite("down", "/down.png");
	},
	start(ctx) {
		const PIXEL_VEL = ctx.width()*0.4;
		enum DIRECTION {
			LEFT,
			RIGHT,
			UP,
			DOWN
		}
		const dir_sprites = ["left", "right", "up", "down"]
		const orders = [DIRECTION.UP, DIRECTION.DOWN, DIRECTION.LEFT]
		let currIdx = 0
		const game = ctx.make();

		function createCommand(onLeft: boolean, dir: DIRECTION) {
			const _obj = game.add([
				ctx.offscreen({hide: true}),
				ctx.sprite(dir_sprites[dir]),
				ctx.area(),
				ctx.pos(),
				ctx.opacity(),
				{canMove: true, command_dir: dir},
				"command"
			])

			if(onLeft) {
				_obj.use(ctx.anchor("left"))
				_obj.pos = spawnPointLeft
			} else {
				_obj.use(ctx.anchor("right"))
				_obj.pos = spawnPointRight
			}

			return _obj
		}

		// checking box for the transform
		const check = game.add([
			ctx.rect(200, 100, {fill: false}),
			ctx.pos(ctx.width()/2, ctx.height()*0.18),
			ctx.anchor("center"),
			ctx.area(),
			ctx.outline(2, ctx.RED)
		])

		const spawnPointLeft = ctx.vec2(0, ctx.height()*0.18)
		const spawnPointRight = ctx.vec2(ctx.width(), ctx.height()*0.18)

		// spawn button sprites
		const left_com = createCommand(true, orders[currIdx])

		const right_com = createCommand(false, orders[currIdx])

		function updateBothCommands() {
			currIdx = ctx.clamp(currIdx + 1, 0, orders.length)
			if (currIdx > orders.length-1) {
				left_com.destroy()
				right_com.destroy()
				ctx.win();
				ctx.burp().onEnd(() => {
					ctx.wait(0.1, () => {
						ctx.finish();
				});
			});
				return
			}
			const next_comm = orders[currIdx]
			left_com.command_dir = next_comm
			left_com.sprite = dir_sprites[next_comm]
			left_com.pos = spawnPointLeft
			
			right_com.command_dir = next_comm
			right_com.sprite = dir_sprites[next_comm]
			right_com.pos = spawnPointRight
		}

		const bean = game.add([
			ctx.sprite("bean"),
			ctx.anchor("center"),
			ctx.pos(ctx.width()/2, ctx.height()*0.8),
			ctx.scale(1),
			{
				beefiness: 1
			}
		]);

		const dir_map = {
			"up": DIRECTION.UP,
			"down": DIRECTION.DOWN,
			"left": DIRECTION.LEFT,
			"right": DIRECTION.RIGHT,
			
		}

		function isInputValid(_dir: DIRECTION) {
			return check.isOverlapping(left_com) && left_com.command_dir == _dir
		}

		ctx.onButtonPress("up", () => {
			if(isInputValid(DIRECTION.UP)) {
				bean.beefiness += 1;
				updateBothCommands();
			}
		})

		ctx.onButtonPress("down", () => {
			if(isInputValid(DIRECTION.DOWN)) {
				bean.beefiness += 1;
				updateBothCommands();
			}
		})

		ctx.onButtonPress("left", () => {
			if(isInputValid(DIRECTION.LEFT)) {
				bean.beefiness += 1;
				updateBothCommands();
			}
		})

		ctx.onButtonPress("right", () => {
			if(isInputValid(DIRECTION.RIGHT)) {
				bean.beefiness += 1;
				updateBothCommands();
			}
		})

		left_com.onUpdate(() => {
			if(!left_com.canMove) {
				left_com.move(0, 0)
			} else {
				left_com.move(PIXEL_VEL, 0)
			}
		})

		right_com.onUpdate(() => {
			if(!right_com.canMove) {
				right_com.move(0, 0)
			} else {
				right_com.move(-PIXEL_VEL, 0)
			}
		})

		// game is lost when the command icons clashes
		left_com.onCollide("command", () => {
			ctx.lose();
			ctx.wait(0.5, () => ctx.finish());
		})

		// left_com.onCollide("command", (obj, col) => {
		// 	if (currIdx > orders.length - 1) {
		// 		left_com.destroy()
		// 		right_com.destroy()
		// 		ctx.win()
		// 		return
		// 	}

		// 	// update curr index
		// 	currIdx += 1
		// 	// reset the left_command_icon pos
		// 	left_com.pos = spawnPointLeft
		// 	// update the dir data and sprite
		// 	left_com.command_dir = orders[currIdx]
		// 	left_com.sprite = dir_sprites[left_com.command_dir]

		// 	// do the same for right_com
		// 	right_com.pos = spawnPointRight
		// 	// update the dir data and sprite
		// 	right_com.command_dir = orders[currIdx]
		// 	right_com.sprite = dir_sprites[right_com.command_dir]
		// })

		ctx.onTimeout(() => {
			ctx.lose();
			ctx.wait(0.5, () => ctx.finish());
		});

		return game;
	},
};

export default transformGame;