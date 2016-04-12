import * as _debug from 'debug';
import * as escape from 'escape-html';

import SSContext from './sscontext';
import nSin from './n-sin-generator';

const debug = _debug('sssa.html');

/**
 * SSのHTMLを生成します
 * @param SSContext#genHtml
 * @return string
 */
export default (ss: SSContext): {
	postHtmls: string[];
	info: string;
	style: string;
} => {
	let chars: any = null;

	if (ss.characters !== null && ss.characters.length > 0) {
		chars = ss.characters.map((c, i) => {
			return [
				{
					id: c.id,
					name: c.name,
					kana: c.kana,
					color: c.color
				},
				nSin(i, 'abcdefghijklmnopqrstuvwxyz')
			];
		});
	}

	const htmls = ss.posts.map((post, i) => {
		if (post.text === '') {
			debug(`${post.number} -> EMPTY`);
			return '';
		}

		let html = post.tokens.map((token: any) => {
			switch (token.type) {
				case 'text':
					return escape(token.text).replace(/\n/g, '<br>');
				case 'anchor':
					return `<span class=anchor data-target="${token.target}">${escape(token.text)}</span>`;
				case 'character-name':
					const sid = chars.filter((c: any) => c[0].id === token.character.id)[0][1];
					return `<b class=${sid}>${escape(token.text)}</b>`;
				default:
					return '';
			}
		}).join('');

		if (post.isAA) {
			html = `<pre>${html}</pre>`;
		}

		debug(`${post.number} -> DONE`);
		return html;
	});

	return {
		postHtmls: htmls,
		info: chars !== null ? JSON.stringify(chars) : null,
		style: chars !== null ? chars.map((c: any) => {
			return `[data-id='${ss.id}'] .${c[1]}{color:${c[0].color}}`;
		}).join('') : ''
	};
}
