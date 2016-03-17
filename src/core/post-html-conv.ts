const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

import { ICharacter, ISSThreadPost } from '../db/interfaces';
import highlight from './analyze/highlight-characters-in-serif';

/* tslint:disable:max-line-length */

export default function (seriesCharacters: ICharacter[], post: ISSThreadPost): string {
	let html: string = entities.encode(post.text);

	// 安価
	html = html.replace(/&gt;&gt;(\d+)/g, '<span class=anchor data-target=$1>$&</span>');

	return html.split('\n').map(x => {
		if (seriesCharacters !== null && seriesCharacters.length > 0 && post.isMaster) {
			x = highlight(seriesCharacters, x);
		}
		return x;
	}).join('<br>');
}
