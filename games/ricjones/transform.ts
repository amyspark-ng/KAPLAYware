import { Minigame } from "../../src/game/types.ts";

const transformGame: Minigame = {
	prompt: "transform",
	author: "ricjones",
	rgb: [74, 48, 82], // rgb for #4a3052 from mulfok32 palette
	urlPrefix: "games/ricjones/assets/",
	duration: () => undefined,
	load(ctx) {
		ctx.loadSound("jump", "jump_37.wav");
		ctx.loadSprite("chad", "chadbean-amy.png");
		ctx.loadSprite("strong", "strong.png");
		ctx.loadSprite("bg", "gym_room_bg.png");
		ctx.loadSprite("punchbag", "punch.png");
		ctx.loadSound("grunt1", "grunt1.wav");
		ctx.loadSound("grunt2", "grunt2.wav");
		ctx.loadSound("grunt3", "grunt3.wav");
		ctx.loadSound("grunt4", "grunt4.wav");
		ctx.loadSound("punch", "punch.ogg");
		ctx.loadSound("bwomp", "bwomp.ogg");
		ctx.loadSound("hellothere", "hellothere.mp3");
	},
	start(ctx) {
		// game options start
		const PIXEL_VEL = ctx.width() * 0.8 * ctx.speed;
		const BEAN_TARGET_SCALE = 3;
		const COMMAND_LENGTH = 4;
		const spawnPointLeft = ctx.vec2(0, ctx.height() * 0.22);
		const grunts = ["grunt1", "grunt2", "grunt3", "grunt4"];
		// game options end
		enum DIRECTION {
			LEFT,
			RIGHT,
			UP,
			DOWN,
		}

		const orders: number[] = [];
		for (let i = 0; i < COMMAND_LENGTH; i++) {
			orders.push(ctx.randi(3));
		}

		let currIdx = 0;
		const game = ctx.make();
		game.add([
			ctx.anchor("center"),
			ctx.pos(ctx.center()),
			ctx.sprite("bg"),
			ctx.scale(1.1),
		]);

		// checking box for the transform
		const check = game.add([
			ctx.rect(180, 100, { fill: false }),
			ctx.pos(ctx.width() * 0.75, ctx.height() * 0.22),
			ctx.anchor("center"),
			ctx.area(),
			// ctx.outline(2, ctx.RED),
		]);

		const punch = game.add([
			ctx.sprite("punchbag"),
			ctx.anchor("top"),
			ctx.scale(),
			ctx.rotate(),
			ctx.pos(check.pos.sub(0, 135)),
		]);

		function updateCommandSprite(_obj: any, _dir: DIRECTION) {
			switch (_dir) {
				case DIRECTION.RIGHT: {
					_obj.angle = 0;
					_obj.scale.x = 1 / 2;
					_obj.scale.y = 1 / 2;
					break;
				}
				case DIRECTION.LEFT: {
					_obj.angle = 0;
					_obj.scale.x = -1 / 2;
					_obj.scale.y = 1 / 2;
					break;
				}
				case DIRECTION.UP: {
					_obj.angle = -100;
					_obj.scale.x = 1 / 2;
					_obj.scale.y = 1 / 2;
					break;
				}
				case DIRECTION.DOWN: {
					_obj.angle = 90;
					_obj.scale.x = 1 / 2;
					_obj.scale.y = 1 / 2;
					break;
				}
			}
		}

		function createCommand(dir: DIRECTION) {
			const _obj = game.add([
				ctx.offscreen({ hide: true }),
				ctx.sprite("strong"),
				ctx.area(),
				ctx.rotate(),
				ctx.scale(),
				ctx.pos(),
				ctx.opacity(),
				ctx.anchor("center"),
				{ canMove: true, command_dir: dir },
				"command",
			]);

			_obj.pos = spawnPointLeft;

			updateCommandSprite(_obj, dir);

			return _obj;
		}

		// spawn button sprites
		const left_com = createCommand(orders[currIdx]);

		let canPress = true;

		function clearPrevCanvas() {
			check.destroy();
			left_com.destroy();
			bean.destroy();
		}

		// put all the obj you need on the screen, depends on the winning cond
		function createGameOverScreen(isWin: boolean = true) {
			if (!isWin) {
				ctx.play("bwomp");
				game.add([
					ctx.sprite("@bobo"),
					ctx.anchor("center"),
					ctx.pos(ctx.width() * 0.3, ctx.height() * 0.65),
					ctx.rotate(-95),
					ctx.scale(2.5),
				]);
				ctx.wait(1.0 / ctx.speed, () => {
					ctx.lose();
					ctx.wait(0.5 / ctx.speed, () => ctx.finish());
				});
				return;
			}

			ctx.wait(0.5 / ctx.speed, () => {
				const chad1 = game.add([
					ctx.sprite("chad"),
					ctx.anchor("botleft"),
					ctx.pos(-800, ctx.height()),
					ctx.scale(1),
					ctx.animate(),
				]);

				const dialog1 = game.add([
					ctx.text(
						ctx.choose(["oh hi !", "new babe..", "miss u luv~"]),
					),
					ctx.pos(ctx.width() / 2, ctx.height() * 0.4),
					ctx.opacity(0),
					ctx.animate(),
				]);

				ctx.tween(ctx.vec2(-chad1.width, ctx.height()), ctx.vec2(0, ctx.height()), 0.5 / ctx.speed, (p) => chad1.pos = p, ctx.easings.easeOutCubic).onEnd(() => {
					ctx.tween(0, 1, 0.5 / ctx.speed, (p) => dialog1.opacity = p, ctx.easings.easeOutCubic);
					ctx.play("hellothere");
				});

				ctx.win();
				ctx.wait(1 / ctx.speed, () => ctx.finish());
			});
		}

		function goToGameOver(isWin: boolean = true) {
			// clear all previous objects
			clearPrevCanvas();
			createGameOverScreen(isWin);
			// fade in
			ctx.flashCam(ctx.WHITE, 0.5 / ctx.speed, 1);
		}

		function updateBothCommands() {
			currIdx = ctx.clamp(currIdx + 1, 0, orders.length);

			const tScale = ctx.lerp(
				1,
				BEAN_TARGET_SCALE,
				currIdx / orders.length + 1,
			);
			// use animate instead
			bean.animation.seek(0);
			bean.animate("scale", [bean.scale, ctx.vec2(tScale)], {
				duration: 0.2 / ctx.speed,
				direction: "forward",
				loops: 1,
			});
			// go to the win condition screen.
			if (currIdx > orders.length - 1) {
				ctx.play("jump", {
					volume: 1,
				});

				goToGameOver(true);
				return;
			}
			else {
				const next_comm = orders[currIdx];
				updateCommandSprite(left_com, next_comm);
				left_com.command_dir = next_comm;
				left_com.pos = spawnPointLeft;
				return;
			}
		}

		const bean = game.add([
			ctx.sprite("@bean"),
			ctx.anchor("bot"),
			ctx.pos(ctx.width() * 0.3, ctx.height() * 0.65),
			ctx.scale(1),
			ctx.animate(),
		]);
		bean.animation.seek(0);

		function isInputValid(_dir: DIRECTION) {
			return (
				check.isOverlapping(left_com)
				&& left_com.command_dir == _dir
				&& canPress
			);
		}

		function onInputValid() {
			updateBothCommands();
			ctx.addKaboom(check.pos);
			ctx.shakeCam();
			ctx.play(ctx.choose(grunts), { volume: 1, speed: 1 });
			ctx.tween(ctx.rand(-30, -60), 0, 0.5 / ctx.speed, (p) => punch.angle = p, ctx.easings.easeOutQuint);
			ctx.tween(ctx.vec2(ctx.rand(1.25, 1.5)), ctx.vec2(1), 0.5 / ctx.speed, (p) => punch.scale = p, ctx.easings.easeOutQuint);
			ctx.play("punch", { detune: ctx.rand(-20, 20) });
		}

		function onInputInvalid() {
			bean.sprite = "@beant";
			// resets
			currIdx = 0;
			canPress = false;
			ctx.wait(0.2 / ctx.speed, () => {
				// lose screen
				goToGameOver(false);
			});
		}

		left_com.onUpdate(() => {
			if (!left_com.canMove) {
				left_com.move(0, 0);
			}
			else {
				left_com.move(PIXEL_VEL, 0);
			}
		});

		game.onUpdate(() => {
			// checking input if it is within the box
			if (ctx.isButtonPressed("up") && isInputValid(DIRECTION.UP)) onInputValid();
			else if (ctx.isButtonPressed("down") && isInputValid(DIRECTION.DOWN)) onInputValid();
			else if (ctx.isButtonPressed("left") && isInputValid(DIRECTION.LEFT)) onInputValid();
			else if (ctx.isButtonPressed("right") && isInputValid(DIRECTION.RIGHT)) onInputValid();
			else if (left_com.pos.x >= check.pos.x + check.width * 0.5 && canPress) onInputInvalid();
		});

		return game;
	},
};

export default transformGame;
