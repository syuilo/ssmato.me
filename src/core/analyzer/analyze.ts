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

import { ISS, ICharacter, ISeries } from './interfaces';

import World from './world';
import modifyTrip from './modify-trip';
import paintId from './paint-id';
import weakMarkMaster from './weak-mark-master';
import strongMarkMaster from './strong-mark-master';
import detectSeries from './detect-series';
import extractCharacters from './extract-characters';
import SSContext from './sscontext';

/**
 * SSを解析しSSContextを取得します。
 * @param ss SS
 * @return SSContext
 */
export default function analyze(series: ISeries[], characters: ICharacter[], ss: ISS): Promise<SSContext> {

	const world = new World(series, characters);

	return new Promise((resolve, reject) => {
		const context = new SSContext();

		// トリップ解析
		const posts1 = ss.posts.map(modifyTrip);

		// IDの背景色と文字色を決定
		const posts2 = posts1.map(paintId);

		// 本文を判別
		/* Note:
		 * SSを(正確に)同定するには本文の投稿にマークする必要があり、
		 * 本文の投稿を(正確に)マークするにはSSが同定されている必要があるという矛盾に陥るので、
		 * まずSSが同定されているという前提が必要ない「弱い」マークを実行してSSを同定した後に「強い」(正確な)マークを行えばよい
		 */
		const posts3 = weakMarkMaster(posts2);

		context.posts = posts3;

		detectSeries(world, {
			title: ss.title,
			posts: posts3
		}).then(series => {
			context.series = series;

			// シリーズが判らなかったら終了
			if (series === null) {
				return resolve(context);
			}

			// シリーズが判ったので「強い」mark-masterを実行できる
			strongMarkMaster(world, posts2, series).then(posts4 => {

				context.posts = posts4;

				// 登場キャラクター抽出
				extractCharacters(world, {
					title: ss.title,
					series: series,
					posts: posts4
				}).then(characters => {
					context.characters = characters;

					resolve(context);
				}, reject);
			});
		}, reject);
	});
}
