import { k } from "../kaplay";

export default function posSetterPlug() {
	return {
		/** When setting this component, the left down up and right keys will now be used to position an object
		 * and debug.log its position
		 * ```ts
		 * update() {
		 * 		if (k.isKeyDown("left")) this.pos.x -= 1;
		 * 		if (k.isKeyDown("down")) this.pos.y += 1;
		 * 		if (k.isKeyDown("up")) this.pos.y -= 1;
		 * 		if (k.isKeyDown("right")) this.pos.x += 1;
		 * 		k.debug.log(this.pos);
		 * }
		 * ```
		 */
		posSetter() {
			return {
				id: "setter",
				require: ["pos"],
				update() {
					if (k.isKeyDown("left")) this.pos = this.pos.add(-1, 0);
					if (k.isKeyDown("down")) this.pos = this.pos.add(0, 1);
					if (k.isKeyDown("up")) this.pos = this.pos.add(0, -1);
					if (k.isKeyDown("right")) this.pos = this.pos.add(1, 0);
					k.debug.log(this.pos);
				},
			};
		},
	};
}
