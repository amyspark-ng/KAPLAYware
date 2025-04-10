import k from "../../src/engine";
import { Minigame } from "../../src/game/types";

const strikeGame: Minigame = {
	prompt: "STRIKE!",
	author: "amyspark-ng",
	rgb: k.WHITE,
	input: "mouse (hidden)",
	duration: 5,
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSprite("gato", "sprites/strike/gato.png");
		ctx.loadSprite("markbola", "sprites/strike/markola.png");
		ctx.loadSprite("racket", "sprites/strike/cosa.png");
		ctx.loadSound("steelsting", "sounds/steelsting.mp3");
		ctx.loadSound("cheer", "sounds/applause.ogg");
		ctx.loadSound("ballhit", "sounds/ballhit.mp3");
	},
	// TODO: Make more juicy, make more clear when one should be careful of the ball, do the remake
	start(ctx) {
		let bolaZ = 0;
		let ballDirection = -1;
		let catLastHit = true;
		const SPEED = ctx.speed * 1.75;
		ctx.play("ballhit", { detune: ctx.rand(50, 100) });
		let timeout = false;

		const gato = ctx.add([
			ctx.sprite("gato"),
			ctx.anchor("bot"),
			ctx.pos(ctx.center().x, ctx.height()),
			ctx.scale(),
		]);

		const gatoracket = ctx.add([
			ctx.sprite("racket"),
			ctx.anchor("center"),
			ctx.scale(1 / 3),
			ctx.pos(gato.pos.x, gato.pos.y - 100),
		]);

		const markbola = ctx.add([
			ctx.sprite("markbola"),
			ctx.pos(),
			ctx.rotate(0),
			ctx.anchor("center"),
			ctx.scale(),
			ctx.area({ scale: ctx.vec2(0.8) }),
		]);

		const racket = ctx.add([
			ctx.sprite("racket"),
			ctx.anchor("center"),
			ctx.pos(ctx.mousePos()),
			ctx.scale(),
		]);

		let didntHitBall = false;
		let gatoRacketDirection = 0; // -1 left 0 gato 1 right;
		const mapBounce = (z: number, minHeight: number, maxHeight: number) => minHeight + (maxHeight - minHeight) * 4 * z * (1 - z); // la parabola
		ctx.onUpdate(() => {
			racket.pos = ctx.mousePos();
			racket.scale.x = ctx.lerp(racket.scale.x, ctx.mousePos().x <= ctx.center().x ? -1 : 1, 0.25);

			if (catLastHit) bolaZ += 0.01 * SPEED;
			else bolaZ -= 0.01 * SPEED;

			if (bolaZ >= 1 || bolaZ <= 0) {
				// you're supposed to hit now
				if (catLastHit && !didntHitBall) {
					if (markbola.isHovering()) {
						catLastHit = !catLastHit;
						ctx.play("ballhit", { detune: ctx.rand(-100, -50) });
					}
					else {
						didntHitBall = true;
						ctx.lose();
						ctx.play("steelsting", { detune: 10 * ctx.speed });
						ctx.wait(1 / ctx.speed, () => ctx.finish());
					}
				}
				else {
					// cat is supposed to hit now
					if (!didntHitBall) {
						if (timeout) {
							markbola.destroy();
							return;
						}
						catLastHit = !catLastHit;
						ctx.play("ballhit", { detune: ctx.rand(50, 100) });
						if (ctx.difficulty == 1) ballDirection *= -1;
						else ballDirection = ctx.choose([-1, 1]);
						gatoRacketDirection = 0;
						ctx.wait(0.1 / ctx.speed, () => gatoRacketDirection = ballDirection);
						gatoracket.flipX = ballDirection == 1;
					}
				}
			}

			gatoracket.pos.x = ctx.lerp(gatoracket.pos.x, gato.pos.x + gatoRacketDirection * 50, 0.5);
			const bolaScale = ctx.map(bolaZ, 0, 1, 0.5, 2);
			markbola.scale = ctx.lerp(markbola.scale, ctx.vec2(bolaScale), 0.5);
			markbola.angle += 2.5 * SPEED;
			if (ballDirection == -1) markbola.pos.x = ctx.map(bolaZ, 0, 1, ctx.center().x, ctx.center().x - markbola.width * markbola.scale.x);
			else if (ballDirection == 1) markbola.pos.x = ctx.map(bolaZ, 0, 1, ctx.center().x, ctx.center().x + markbola.width * markbola.scale.x);

			markbola.pos.y = mapBounce(bolaZ, ctx.height() - 100, ctx.center().y - 100);
		});

		ctx.onTimeout(() => {
			timeout = true;
			if (!didntHitBall) {
				ctx.win();
				ctx.play("cheer");
				ctx.wait(1 / ctx.speed, () => {
					ctx.finish();
				});
			}
		});
	},
};

export default strikeGame;
