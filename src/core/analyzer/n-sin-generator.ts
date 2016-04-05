export default (seed: number, chars: string): string => {

	let s = '';

	if (seed === 0) {
		return chars[0];
	}

	while (seed > 0) {
		const digit = chars[seed % chars.length];
		s = digit + s;
		seed = Math.floor(seed / chars.length);
	}

	return s;
}
