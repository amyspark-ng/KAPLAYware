/**
 * Returns a copy of the object where it'll only have the keys you pass as param
 * @param obj The object
 * @param keys The keys you want to maintain in the object
 * @returns The new object with only those keys
 */
export function pickKeysInObj<T extends any, R extends keyof T>(obj: T, keys: R[]) {
	return keys.reduce((result: Pick<T, R>, prop) => {
		result[prop] = obj[prop];
		return result;
	}, {} as Pick<T, R>);
}

/** Merge 2 objects and returns a proper cool reference to both, also typed
 * @param obj1
 * @param obj2
 * @returns A merged object with proper typing
 */
export function mergeWithRef<T extends any, R extends any>(obj1: T, obj2: R) {
	// some crazy code to merge them together
	const result = {} as T & R;

	Object.defineProperties(result, {
		...Object.getOwnPropertyDescriptors(obj1),
		...Object.getOwnPropertyDescriptors(obj2),
	});

	return result;
}

export function scrollIndex(index: number, change: number, totalAmount: number) {
	if (totalAmount == 0) throw new Error("Something must be wrong with your code, scrollIndex amount is 0");
	// why was this so hard to figure out??
	if (change > 0) {
		if (index + change > totalAmount - 1) index = 0;
		else index += change;
	}
	else if (change < 0) {
		if (index - Math.abs(change) < 0) index = totalAmount - 1;
		else index -= Math.abs(change);
	}

	return index;
}
