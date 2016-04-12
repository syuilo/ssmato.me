import * as moment from 'moment';

import { Series, Character } from '../db/models';
import { ISSThread, ISeries, ICharacter } from '../db/interfaces';
import analyze from './analyzer/analyze';
import genhtml from './analyzer/generate-html';

moment.locale('ja');

/**
 * SSを解析し利用可能な状態にします
 * @param ss SS
 * @return ss
 */
export default (ss: ISSThread): Promise<ISSThread> => new Promise((resolve, reject) => {
	Promise.all([
		// Get all series
		Series.find({}, '_id title kana aliases'),
		// Get all characters
		Character.find({}, '_id name kana screenName aliases series color')
	]).then((results: any) => {
		const allseries = <ISeries[]>results[0];
		const allchars = <ICharacter[]>results[1];

		const _allseries = allseries.map(series => {
			return {
				id: series.id.toString(),
				title: series.title,
				kana: series.kana,
				aliases: series.aliases
			};
		});

		const _allchars = allchars.map(char => {
			return {
				id: char.id.toString(),
				name: char.name,
				kana: char.kana,
				screenName: char.screenName,
				aliases: char.aliases,
				color: char.color,
				series: (<any>char.series).map((series: any) => series.toString())
			};
		});

		const context = analyze(_allseries, _allchars, {
			id: ss.id.toString(),
			title: ss.title,
			posts: ss.posts.map(post => {
				return {
					text: post.text,
					number: post.number,
					user: {
						id: post.user.id,
						name: post.user.name
					}
				};
			})
		});

		if (context.series !== null) {
			ss.series = context.series.map(x => x.id);
		} else {
			ss.series = [];
		}

		if (context.characters !== null) {
			ss.characters = context.characters.map(x => {
				return {
					id: x.id,
					onStageRatio: x.onStageRatio
				};
			});
		} else {
			ss.characters = [];
		}

		// HTML生成
		const htmls = genhtml(context);

		ss.htmlInfo = htmls.info;
		ss.htmlStyle = htmls.style;

		ss.posts.forEach((post, i) => {
			post.isMaster = context.posts[i].isMaster;
			post.isAnchor = context.posts[i].isAnchor;
			post.user.bg = context.posts[i].user.backgroundColor;
			post.user.fg = context.posts[i].user.foregroundColor;
			post.html = htmls.postHtmls[i];
			post.createdAtStr = moment(post.createdAt).format('LL LT');
		});

		ss.pagesCount = context.posts.filter(post => post.isMaster).length;

		ss.readingTimeMinutes = Math.floor((context.posts
			.filter(post => post.isMaster)
			.map(post => post.text.length)
			.reduce((p, c) => p + c) / 18) / 60);

		ss.markModified('posts');
		ss.markModified('series');
		ss.markModified('characters');

		ss.save((err: any, ss: ISSThread) => {
			if (err !== null) {
				console.error(err);
				reject(err);
			} else {
				resolve(ss);
			}
		});
	});
});
