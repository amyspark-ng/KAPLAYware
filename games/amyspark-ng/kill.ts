import { LoadSpriteOpt, Vec2 } from "kaplay";
import { Microgame } from "../../src/types/Microgame";

// TODO: Do the whole squid cool game
const killGame: Microgame = {
	name: "kill",
	author: "amyspark-ng",
	prompt: "KILL!",
	hideMouse: true,
	isBoss: true,
	rgb: (ctx) => ctx.mulfok.DARK_VIOLET,
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSprite("boss", "sprites/kill/boss.png");
		const defaultAnims: LoadSpriteOpt = { sliceX: 2, sliceY: 1, anims: { "idle": { from: 0, to: 1, loop: true } } };
		ctx.loadSprite("aim", "sprites/kill/aim.png");
		ctx.loadSprite("tentacle", "sprites/kill/tentacle.png", defaultAnims);
		ctx.loadSprite("spaceship", "sprites/kill/spaceship.png", defaultAnims);
		ctx.loadSprite("explosion", "sprites/kill/explosion.png", defaultAnims);
		ctx.loadSprite("bullet", "sprites/kill/bullet.png", defaultAnims);
		ctx.loadSprite("heart", "sprites/kill/heart.png");
		ctx.loadSprite("frame", "sprites/kill/frame.png");
		ctx.loadSprite("bar", "sprites/kill/bar.png");
		ctx.loadSound("drama", "sounds/drama.ogg");
		ctx.loadSound("shoot", "sounds/bullet.wav");
		ctx.loadSound("bosshurt", "sounds/bosshurt.wav");
	},
	start(ctx) {
		// setup
		const gameObjs = ctx.add([]);
		gameObjs.paused = true;

		const getAngleToMouse = (pos: Vec2) => {
			return pos.angle(ctx.mousePos()) - 90;
		};

		const aim = gameObjs.add([
			ctx.sprite("aim"),
			ctx.pos(),
			ctx.anchor("center"),
			ctx.rotate(),
			ctx.color(),
			ctx.z(1),
			ctx.scale(),
		]);

		const boss = gameObjs.add([
			ctx.sprite("boss"),
			ctx.anchor("top"),
			ctx.pos(ctx.center().x, 0),
			ctx.health(300, 300),
			ctx.color(),
			ctx.area({ scale: ctx.vec2(0.5) }),
			"boss",
			"ignorepoint",
			{
				dead: false,
			},
		]);

		const leftTentacle = gameObjs.add([
			ctx.sprite("tentacle", { anim: "idle" }),
			ctx.pos(),
			ctx.anchor("left"),
			ctx.health(100, 100),
		]);

		const rightTentacle = gameObjs.add([
			ctx.sprite("tentacle", { anim: "idle" }),
			ctx.pos(),
			ctx.anchor("right"),
			ctx.health(100, 100),
		]);

		const spaceship = gameObjs.add([
			ctx.sprite("spaceship", { anim: "idle" }),
			ctx.pos(ctx.center()),
			ctx.anchor("center"),
			ctx.health(5),
			ctx.scale(0.5),
			ctx.rotate(0),
			{
				shoot() {
					const dir = ctx.mousePos().sub(this.pos).unit();

					const bullet = ctx.add([
						ctx.pos(this.pos),
						ctx.sprite("bullet", { anim: "idle" }),
						ctx.anchor("center"),
						ctx.move(dir, 700),
						ctx.area(),
						ctx.rotate(this.angle),
						ctx.offscreen({ destroy: true }),
					]);

					bullet.onCollide("boss", () => {
						boss.hurt(25);
						bullet.destroy();
					});

					ctx.play("shoot", { detune: ctx.rand(-50, 50) });
				},
			},
		]);

		const barFrame = ctx.add([
			ctx.sprite("frame"),
			ctx.pos(15, 566),
			ctx.anchor("left"),
		]);

		const bar = barFrame.add([
			ctx.sprite("bar"),
			ctx.pos(10, 5),
			ctx.anchor("left"),
		]);
		let ogBarWidth = bar.width;

		const livesText = ctx.add([
			ctx.text(spaceship.hp().toString(), { align: "center" }),
			ctx.pos(717, 566),
			ctx.anchor("center"),
			ctx.scale(1.5),
		]);

		const livesHeart = ctx.add([
			ctx.sprite("heart"),
			ctx.pos(767, 566),
			ctx.anchor("center"),
			ctx.scale(),
			ctx.color(),
			ctx.opacity(),
		]);

		// intro
		const fadeIn = ctx.add([ctx.rect(ctx.width(), ctx.height()), ctx.color(ctx.BLACK), ctx.opacity(), ctx.z(2)]);
		const titles = ["kill", "the", "boss"];
		const title = ctx.add([
			ctx.text("", { size: 30 }),
			ctx.pos(ctx.center()),
			ctx.anchor("center"),
			ctx.opacity(),
			ctx.z(2),
		]);

		titles.forEach((text, index) => {
			ctx.wait(0.1 + 0.5 * index, () => {
				title.text = text.toUpperCase();
				ctx.play("drama");
				if (index == titles.length - 1) {
					fadeIn.fadeOut(0.1).onEnd(() => {
						fadeIn.destroy();
						gameObjs.paused = false;
						ctx.wait(0.1, () => {
							title.fadeOut(0.1).onEnd(() => {
								title.destroy();
							});
						});
					});
				}
			});
		});

		// # now define behaviour for stuff
		boss.onUpdate(() => {
			boss.pos.x = ctx.wave(ctx.center().x - 50, ctx.center().x + 50, ctx.time());
			const HP = boss.dead ? 0 : boss.hp();
			const maxHP = boss.maxHP() as number;
			bar.width = (HP / maxHP) * ogBarWidth;
		});

		boss.onHurt(() => {
			ctx.tween(ctx.RED, ctx.WHITE, 0.15, (p) => boss.color = p);
			ctx.play("bosshurt", { detune: ctx.rand(-50, 50) });
		});

		boss.onDeath(() => {
			boss.dead = true;
			boss.destroy();
			ctx.wait(1, () => {
				ctx.win();
				ctx.finish();
			});
		});

		// player movement
		const SPEED = 350;
		const mov = ctx.vec2(0);
		let lerpMovement = ctx.vec2();
		spaceship.onUpdate(() => {
			mov.x = ctx.isButtonDown("left") ? -1 : ctx.isButtonDown("right") ? 1 : 0;
			mov.y = ctx.isButtonDown("up") ? -1 : ctx.isButtonDown("down") ? 1 : 0;

			lerpMovement = ctx.lerp(lerpMovement, mov.unit().scale(SPEED), 0.75);
			spaceship.move(lerpMovement);

			spaceship.angle = getAngleToMouse(spaceship.pos);
			if (ctx.isButtonPressed("click")) {
				spaceship.shoot();
				aim.scale = ctx.vec2(1.2);
			}
		});

		ctx.onUpdate(() => {
			aim.pos = ctx.mousePos();
			aim.scale = ctx.lerp(aim.scale, ctx.vec2(1), 0.5);
		});
	},
};

export default killGame;
