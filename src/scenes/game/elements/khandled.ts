import { Color, GameObj, Vec2 } from "kaplay";
import { k } from "../../../kaplay";

function addDot(parent: GameObj, initialColor: Color = k.mulfok.YELLOW.lerp(k.mulfok.VOID_VIOLET, 0.25)) {
	return parent.add([
		k.sprite("consoledot"),
		k.pos(),
		k.scale(),
		k.color(initialColor),
		k.anchor("center"),
		k.timer(),
		k.z(2),
		"dot",
		{
			dark: initialColor,
			flash(speed: number = 1, flashColor = k.mulfok.YELLOW) {
				this.tween(flashColor, this.dark, 0.5 * speed, (p) => this.color = p, k.easings.easeOutQuint);
				this.tween(k.vec2(1.25), k.vec2(1), 0.5 * speed, (p) => this.scale = p, k.easings.easeOutQuint);
			},
		},
	]);
}

function addAntenna(parent: GameObj, startAngle = 25) {
	return parent.add([
		k.sprite("consoleantenna"),
		k.pos(),
		k.scale(),
		k.rotate(startAngle),
		k.anchor("bot"),
		k.timer(),
		k.z(0),
		{
			tweak(speed = 1) {
				k.tween(startAngle + k.rand(-15, 15), startAngle, 0.5 * speed, (p) => this.angle = p, k.easings.easeOutQuint);
			},

			bop(speed = 1) {
				k.tween(0.9, 1, 0.5 * speed, (p) => this.scale.y = p, k.easings.easeOutQuint);
			},
		},
	]);
}

export function buildKHandled() {
	const root = k.add([k.pos(k.center().x, k.height()), k.timer(1), k.scale(1), k.anchor("bot"), {
		bop(speed: number = 1) {
			this.tween(0.98, 1, 0.5 * speed, (p) => this.scale = k.vec2(1, p), k.easings.easeOutQuint);
		},
	}]);

	const body = root.add([
		k.sprite("consolebody"),
		k.pos(0, 45),
		k.scale(),
		k.opacity(1),
		k.anchor("bot"),
		k.z(1),
	]);

	const dot1 = addDot(root);
	dot1.pos = k.vec2(-325, -350);
	const dot2 = addDot(root);
	dot2.pos = k.vec2(-300, -350);
	const dot3 = addDot(root);
	dot3.pos = k.vec2(300, -350);
	const dot4 = addDot(root);
	dot4.pos = k.vec2(325, -350);

	const sideDot = addDot(root, k.mulfok.GRAY);
	sideDot.pos = k.vec2(-189, -300);

	// antenna
	const leftAntenna = addAntenna(root, -25);
	leftAntenna.pos = k.vec2(-4, -465);
	leftAntenna.angle = -25;

	const rightAntenna = addAntenna(root, 25);
	rightAntenna.pos = k.vec2(21, -480);

	return {
		root,
		sideDot,
		dots: [dot1, dot2, dot3, dot4],
		antennae: [leftAntenna, rightAntenna],
	};
}
