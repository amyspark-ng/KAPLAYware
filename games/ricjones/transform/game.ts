import { assets } from "@kaplayjs/crew";
import { Minigame } from "../../../src/types.ts";
import { TweenController } from "kaplay";

const transformGame: Minigame = {
	prompt: "transform",
	author: "ricjones",
	rgb: [74, 48, 82],  // rgb for #4a3052 from mulfok32 palette
	urlPrefix: "games/ricjones/assets",
	load(ctx) {
		ctx.loadSprite("bean", assets.bean.sprite);
		ctx.loadSprite("fish", assets.bobo.sprite);
		ctx.loadSprite("chad", "/chadBean.png");
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

		let currTween: TweenController|null = null

		const transitionScreen = game.add([
			ctx.rect(ctx.width(), ctx.height()),
			ctx.pos(0, 0),
			ctx.color(ctx.WHITE),
			ctx.opacity(0),
			ctx.z(100),
			ctx.timer()
		])

		function clearPrevCanvas() {
			check.destroy()
			left_com.destroy()
			right_com.destroy()
			bean.destroy()
		}

		// put all the obj you need on the screen, depends on the winning cond
		function createGameOverScreen(isWin: boolean = true) {
			if (!isWin) {
				game.add([
					ctx.sprite("fish"),
					ctx.anchor("center"),
					ctx.pos(ctx.width()*0.4, ctx.height()/2),
					ctx.rotate(-95),
					ctx.scale(2.5)
				])
				ctx.lose()
				ctx.wait(1.5, () => {
					ctx.finish()
				})
				return
			}

			const chad1 = game.add([
				ctx.sprite("chad"),
				ctx.pos(0, 0)
			])
			chad1.use(ctx.scale(ctx.height()/chad1.height))

			game.add([
				ctx.text("oh hi !"),
				ctx.pos(ctx.width()/2, ctx.height()/2)
			])

			ctx.win()
			ctx.wait(1.5, () => ctx.finish())
		}

		function goToGameOver(isWin: boolean = true) {
			// clear all previous objects
			clearPrevCanvas()
			// fade in 
			transitionScreen.tween(
				0,
				1,
				0.3,
				(v) => {
					transitionScreen.opacity = v
				}
			).onEnd(() => {
				// fade out
				transitionScreen.tween(
					1,
					0,
					0.3,
					(v) => {
						transitionScreen.opacity = v
					}
				).onEnd(() => {
					createGameOverScreen(isWin)
				})
			})
		}

		function updateBothCommands() {
			currIdx = ctx.clamp(currIdx + 1, 0, orders.length)
			if (currIdx > orders.length-1) {
				goToGameOver(true)
				return
			}
			
			const next_comm = orders[currIdx]
			left_com.command_dir = next_comm
			left_com.sprite = dir_sprites[next_comm]
			left_com.pos = spawnPointLeft
			
			right_com.command_dir = next_comm
			right_com.sprite = dir_sprites[next_comm]
			right_com.pos = spawnPointRight

			if (currTween) currTween.cancel()
			currTween = ctx.tween(
				bean.scale,
				bean.scale.add(2),
				0.2,
				(value) => {
					bean.scale = value
				},
				ctx.easings.easeInBounce
			)
		}

		const bean = game.add([
			ctx.sprite("bean"),
			ctx.anchor("bot"),
			ctx.pos(ctx.width()/2, ctx.height()*0.8),
			ctx.scale(1)
		]);

		function isInputValid(_dir: DIRECTION) {
			return check.isOverlapping(left_com) && left_com.command_dir == _dir
		}

		// checking input if it is within the box
		ctx.onButtonPress("up", () => {
			if(isInputValid(DIRECTION.UP)) {
				updateBothCommands();
			}
		})

		ctx.onButtonPress("down", () => {
			if(isInputValid(DIRECTION.DOWN)) {
				updateBothCommands();
			}
		})

		ctx.onButtonPress("left", () => {
			if(isInputValid(DIRECTION.LEFT)) {
				updateBothCommands();
			}
		})

		ctx.onButtonPress("right", () => {
			if(isInputValid(DIRECTION.RIGHT)) {
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
			ctx.wait(0.5, () => {
				// lose screen
				goToGameOver(false)
			})
			// ctx.lose();
			// ctx.wait(0.5, () => ctx.finish());
		})

		ctx.onTimeout(() => {
			ctx.wait(0.1, () => {
				ctx.finish()
			})
		})

		return game;
	},
};

export default transformGame;