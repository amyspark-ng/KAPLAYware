import { KAPLAYCtx } from "kaplay";

export function mulfokPalettePlug(k: KAPLAYCtx) {
	return {
		/** The mulfok32 palette */
		mulfok: {
			BEAN_GREEN: k.Color.fromHex("#5ba675"),
			GREEN: k.Color.fromHex("#6bc96c"),
			LIGHT_GREEN: k.Color.fromHex("#abdd64"),
			YELLOW: k.Color.fromHex("#fcef8d"),
			ORANGE: k.Color.fromHex("#ffb879"),
			DARK_ORANGE: k.Color.fromHex("#ea6262"),
			RED: k.Color.fromHex("#cc425e"),
			DARK_RED: k.Color.fromHex("#a32858"),
			PURPLE: k.Color.fromHex("#751756"),
			VOID_PURPLE: k.Color.fromHex("#390947"),
			DARK_PURPLE: k.Color.fromHex("#611851"),
			DARK_BROWN: k.Color.fromHex("#873555"),
			BROWN: k.Color.fromHex("#a6555f"),
			MARROC_BROWN: k.Color.fromHex("#c97373"),
			LIGHT_BROWN: k.Color.fromHex("#f2ae99"),
			LIGHT_PINK: k.Color.fromHex("#ffc3f2"),
			PINK: k.Color.fromHex("#ee8fcb"),
			DARK_PINK: k.Color.fromHex("#d46eb3"),
			VIOLET: k.Color.fromHex("#873e84"),
			/** The color used in most of kaplay's outlines */
			VOID_VIOLET: k.Color.fromHex("#1f102a"),
			DARK_VIOLET: k.Color.fromHex("#4a3052"),
			LIGHT_VIOLET: k.Color.fromHex("#7b5480"),
			DARK_GRAY: k.Color.fromHex("#a6859f"),
			GRAY: k.Color.fromHex("#d9bdc8"),
			WHITE: k.Color.fromHex("#ffffff"),
			LIGHT_BLUE: k.Color.fromHex("#aee2ff"),
			BLUE: k.Color.fromHex("#8db7ff"),
			DARK_BLUE: k.Color.fromHex("#6d80fa"),
			BEANT_BLUE: k.Color.fromHex("#8465ec"),
			DARK_BEANT_BLUE: k.Color.fromHex("#834dc4"),
			BURPMAN_BLUE: k.Color.fromHex("#7d2da0"),
			DARK_BURPMAN_BLUE: k.Color.fromHex("#4e187c"),
			BLACK: k.Color.fromHex("#000000"),
		},
	};
}

export default mulfokPalettePlug;
