//////////////////////////////////////////////////
// Syuilo SS Analyzer
//////////////////////////////////////////////////

/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 syuilo
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import * as _debug from 'debug';

import { ISS, ICharacter, ISeries } from './interfaces';

import World from './world';
import modifyTrip from './modify-trip';
import paintId from './paint-id';
import modifyIsAA from './modify-is-aa';
import weakMarkMaster from './weak-mark-master';
import strongMarkMaster from './strong-mark-master';
import markAnchor from './mark-anchor';
import detectSeries from './detect-series';
import extractCharacters from './extract-characters';
import SSContext from './sscontext';

const debug = _debug('sssa');

/**
 * SSを解析しSSContextを取得します。
 * @param ss SS
 * @return SSContext
 */
export default (
	series: ISeries[],
	characters: ICharacter[],
	ss: ISS
): Promise<SSContext> => {

	debug('開始しています...');

	const world = new World(series, characters);
	debug('ワールドを初期化しました');

	return new Promise((resolve, reject) => {
		const context = new SSContext(ss.id);

		// アスキーアートかどうか
		const posts0 = ss.posts.map(modifyIsAA);
		debug('AA判定を設定しました');

		// トリップ解析
		const posts1 = posts0.map(modifyTrip);
		debug('トリップを設定しました');

		// IDの背景色と文字色を決定
		const posts2 = posts1.map(paintId);
		debug('IDカラーを設定しました');

		// 本文を判別
		/* Note:
		 * SSを(正確に)同定するには本文の投稿にマークする必要があり、
		 * 本文の投稿を(正確に)マークするにはSSが同定されている必要があるという矛盾に陥るので、
		 * まずSSが同定されているという前提が必要ない「弱い」マークを実行してSSを同定した後に「強い」(正確な)マークを行えばよい
		 */
		const posts3 = weakMarkMaster(posts2);
		debug('弱いマークをしました');

		detectSeries(world, {
			id: ss.id,
			title: ss.title,
			posts: posts3
		}).then(series => {
			debug('シリーズを同定しました');

			context.series = series;

			// シリーズが判らなかったら
			if (series === null) {
				const posts4 = markAnchor(ss, posts3);
				debug('被安価投稿をマークをしました');

				context.posts = posts4;

				debug('シリーズが判らなかったので終了しました');
				return resolve(context);
			}

			// シリーズが判ったので「強い」mark-masterを実行できる
			strongMarkMaster(world, posts3, series).then(posts4 => {
				debug('強いマークをしました');

				const posts5 = markAnchor(ss, posts4);
				debug('被安価投稿をマークをしました');

				context.posts = posts5;

				// 登場キャラクター抽出
				extractCharacters(world, {
					id: ss.id,
					title: ss.title,
					series: series,
					posts: posts4
				}).then(characters => {
					debug('キャラクターの統計を抽出しました');

					context.characters = characters;

					debug('完了');
					resolve(context);
				}, reject);
			});
		}, reject);
	});
}
