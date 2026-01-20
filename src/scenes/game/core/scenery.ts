import { GameObj, PosComp, Vec2 } from "kaplay";
import { k } from "../../../kaplay";

/** Manages the things like the root object and the objects where stuff gets added */
export class Scenery {
	/** The scene will always have a certain width, you can just change the scale */
	scale: Vec2 = k.vec2(1);
	pos: Vec2 = k.center();
	root: GameObj;

	/** The global scene */
	scene: GameObj<PosComp>;

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

		const cameraObject = shakeCameraObject.add([
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

		this.scene = cameraObject.add([
			k.pos(-cameraObject.width / 2, -cameraObject.height / 2),
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
			cameraObject.width = k.width();
			cameraObject.height = k.height();
			cameraObject.pos = k.vec2(k.width() / 2, k.height() / 2);
			cameraObject.shake = k.lerp(cameraObject.shake, 0, 5 * k.dt());
			let posShake = k.Vec2.fromAngle(k.rand(0, 360)).scale(cameraObject.shake);
			shakeCameraObject.pos = k.vec2().add(posShake);

			// scene stuff
			this.scene.pos = k.vec2(-cameraObject.width / 2, -cameraObject.height / 2);
		});
	}
}
