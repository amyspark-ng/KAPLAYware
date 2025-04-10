import k from "../engine";

k.scene("title", () => {
	k.addPlainBackground(k.BLACK.lerp(k.WHITE, 0.45));
	let hasPressed = false;

	const logo = k.add([
		k.sprite("logo"),
		k.pos(k.center()),
		k.anchor("center"),
		k.rotate(),
		k.scale(2),
	]);

	const pressAny = k.add([
		k.text("Press ANY key to start!", { font: "happy-o" }),
		k.scale(0.5),
		k.pos(k.center().add(0, 70)),
		k.anchor("center"),
	]);

	k.onUpdate(() => {
		if (!hasPressed) {
			logo.angle = k.lerp(logo.angle, k.wave(-15, 15, k.time()), 0.5);
			pressAny.scale.x = k.lerp(pressAny.scale.x, k.wave(0.5, 0.75, k.time()), 0.5);
			pressAny.scale.y = k.lerp(pressAny.scale.y, k.wave(0.5, 0.75, k.time()), 0.5);
		}

		if (k.isKeyPressed()) {
			hasPressed = true;
			k.tween(logo.angle, 0, 0.25, (p) => logo.angle = p, k.easings.easeOutBack);
			k.tween(k.vec2(1), k.vec2(0.5), 0.25, (p) => pressAny.scale = p, k.easings.easeOutQuint);
			k.wait(0.25, () => {
				k.tween(logo.pos.y, k.height() + 100, 0.25, (p) => logo.pos.y = p);
				k.tween(pressAny.pos.y, k.height() + 100, 0.25, (p) => pressAny.pos.y = p);
				k.camFade(0.25).onEnd(() => {
					k.go("menu");
				});
			});
		}
	});
});
