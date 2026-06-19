import { GameObj } from "kaplay";
import { createTransition } from "./create_transition";

export const prepTransition = createTransition("jingle-prep", 4, (act, ctx, controller, conductor, parent, jingle, scenery) => {
	act.root.use(ctx.opacity());
	// @ts-ignore
	act.root.opacity = 0;

	const magicNumber = 25 / 16;
	const gameActScenery = controller.currentAct.scenery;
	gameActScenery.scale = ctx.vec2(0.64, 0.64);

	parent.add([
		ctx.sprite("trans-background"),
	]);

	const plainBackground = parent.add([
		ctx.rect(512, 384),
		ctx.pos(ctx.center()),
		ctx.color(ctx.mulfok.LIGHT_VIOLET),
		ctx.anchor("center"),
		ctx.opacity(1),
	]);

	const clock = parent.add([
		ctx.sprite("trans-clock"),
		ctx.pos(ctx.center()),
		ctx.anchor("center"),
		ctx.opacity(1),
	]);

	const minuteHand = parent.add([
		ctx.rect(5, 75),
		ctx.pos(ctx.center()),
		ctx.anchor("bot"),
		ctx.rotate(30 * (controller.progress)), // 30 full hour // 15 half hour
		ctx.color(ctx.mulfok.VOID_VIOLET),
		ctx.opacity(1),
	]);

	const hourHand = parent.add([
		ctx.rect(7, 45),
		ctx.pos(ctx.center()),
		ctx.anchor("bot"),
		ctx.rotate(30 * (controller.progress)),
		ctx.color(ctx.mulfok.VOID_VIOLET),
		ctx.opacity(1),
	]);

	const hearts: GameObj[] = [];
	const getHeartPos = (angle: number) => {
		// X = magnitud * cos(angle)
		const rad = ctx.deg2rad(-90 + angle);
		const magnitude = 175;
		const X = magnitude * Math.cos(rad);
		const Y = magnitude * Math.sin(rad);
		return ctx.center().add(ctx.vec2(X, Y));
	};

	for (let i = 0; i < controller.lives; i++) {
		const heart = parent.add([
			ctx.sprite("heart"),
			ctx.pos(ctx.center()),
			ctx.anchor("center"),
			ctx.scale(),
			ctx.opacity(),
		]);

		heart.pos = getHeartPos((i + controller.heartTurns) * 90);
		hearts.push(heart);
	}

	const tvstatic = parent.add([
		ctx.sprite("trans-static", { anim: "a" }),
		ctx.pos(ctx.center()),
		ctx.anchor("center"),
		ctx.opacity(0),
		ctx.z(2),
	]);

	// TODO: can heart turns be replaced by score? since it also doesn't decrease when losing
	controller.heartTurns++;
	conductor.onBeat((beat, beatDuration) => {
		minuteHand.angle += 15;
		if (beat == 1) {
			hearts.forEach((heart, index) => {
				let angle = (index + controller.heartTurns - 1) * 90;
				let newAngle = (index + controller.heartTurns) * 90;
				heart.onUpdate(() => {
					angle = ctx.lerp(angle, newAngle, 0.3 * controller.speed);
					heart.pos = getHeartPos(angle);
				});
			});
		}
		if (beat == 2) {
			tvstatic.opacity = 1;
		}
		if (beat == 3) {
			parent.tween(scenery.scale, scenery.scale.scale(magicNumber), beatDuration, (p) => scenery.scale = p, ctx.easings.easeOutQuint);
			parent.tween(clock.opacity, 0, beatDuration, (p) => clock.opacity = p, ctx.easings.easeOutQuint);
			parent.tween(minuteHand.opacity, 0, beatDuration, (p) => minuteHand.opacity = p, ctx.easings.easeOutQuint);
			parent.tween(hourHand.opacity, 0, beatDuration, (p) => hourHand.opacity = p, ctx.easings.easeOutQuint);
			parent.tween(plainBackground.opacity, 0, beatDuration, (p) => plainBackground.opacity = p, ctx.easings.easeOutQuint);
			hearts.forEach((heart) => {
				parent.tween(heart.opacity, 0, beatDuration, (p) => heart.opacity = p, ctx.easings.easeOutQuint);
			});

			parent.tween(1, 0, beatDuration, (p) => tvstatic.opacity = p, ctx.easings.easeOutQuint);

			// make the game act normal again
			parent.tween(gameActScenery.scale, ctx.vec2(1), beatDuration, (p) => {
				gameActScenery.scale = p;
			}, ctx.easings.easeOutExpo);
		}
	});
});
