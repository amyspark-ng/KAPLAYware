import { GameObj, PosComp, RectComp, RotateComp, ScaleComp, Vec2 } from "kaplay";
import { k } from "../../../kaplay";

/** Manages the things like the root object and the objects where stuff gets added */
export class Scenery {
	/** The scene will always have a certain width, you can just change the scale */
	scale: Vec2 = k.vec2(1);
	pos: Vec2 = k.center();
	root: GameObj;

	/** The global scene */
	scene: GameObj<PosComp>;

	camera: GameObj<PosComp | ScaleComp | RotateComp | RectComp | { shake: number; }>;

	constructor(private parent: GameObj = k.getTreeRoot()) {
		this.root = this.parent.add([]);

		const gameBox = this.root.add([
			k.rect(k.width(), k.height()),
			k.color(k.BLUE.lighten(100)),
			k.scale(1),
			k.pos(this.pos),
			k.anchor("center"),
		]);

		const maskObj = gameBox.add([
			k.rect(k.width(), k.height()),
			k.pos(-k.width() / 2, -k.height() / 2),
			k.mask("intersect"),
			k.color(k.RED),
		]);

		const shakeCameraObject = maskObj.add([
			k.pos(),
		]);

		this.camera = shakeCameraObject.add([
			k.rect(k.width(), k.height(), { fill: false }),
			k.pos(k.width() / 2, k.height() / 2),
			k.rotate(0),
			k.anchor("center"),
			k.scale(1),
			k.color(k.GREEN),
			{
				shake: 0,
			},
		]);

		this.scene = this.camera.add([
			k.pos(-this.camera.width / 2, -this.camera.height / 2),
		]);

		this.root.onUpdate(() => {
			// gamebox stuff
			gameBox.pos = this.pos;
			gameBox.scale = this.scale;

			// mask obj stuff
			maskObj.width = k.width();
			maskObj.height = k.height();
			maskObj.pos = k.vec2(-k.width() / 2, -k.height() / 2);

			// camera obj stuff
			this.camera.width = k.width();
			this.camera.height = k.height();
			this.camera.pos = k.vec2(k.width() / 2, k.height() / 2);
			this.camera.shake = k.lerp(this.camera.shake, 0, 5 * k.dt());
			let posShake = k.Vec2.fromAngle(k.rand(0, 360)).scale(this.camera.shake);
			shakeCameraObject.pos = k.vec2().add(posShake);

			// scene stuff
			this.scene.pos = k.vec2(-this.camera.width / 2, -this.camera.height / 2);
		});
	}
}
