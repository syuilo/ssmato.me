//////////////////////////////////////////////////
// SS GETTER
//////////////////////////////////////////////////

const client = require('cheerio-httpcli');
client.headers['User-Agent'] = '';
client.referer = false;
client.timeout = 60 * 1000; // 60 seconds
client.maxDataSize = (1024 * 1024) * 3; // 3MiB

const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

import { SSThread , VisitHistory} from '../db/models';
import { ISS, ISSThread, ISSThreadPost } from '../db/interfaces';
import analyzeSS from './analyze-ss';

interface IThread {
	title: string;
	posts: ISSThreadPost[];
}

export default function(url: string): Promise<ISS> {
	return new Promise<ISS>((resolve, reject) => {
		VisitHistory.findOne({
			url: url
		}, (err, exist) => {
			if (err !== null) {
				return reject(err);
			}

			if (exist !== null) {
				return reject('arleady-registered');
			}

			console.log(`fetching ${url}`);

			client.fetch(url, (err: any, $: any, res: any, body: any) => {
				// スレッドが無くても200を返すクソ仕様の場合があるので
				// あまり当てにならない
				if (err !== undefined || res.statusCode !== 200) {
					return reject('access-failed');
				}

				VisitHistory.create({
					url: url
				});

				const thread = analyze($, body);

				if (thread === null) {
					return reject('parse failed');
				}

				if (thread.posts.length === 0) {
					return reject('empty posts');
				}

				SSThread.create({
					title: thread.title,
					url: url,
					posts: thread.posts
				}, (err: any, ss: ISS) => {
					if (err !== null) {
						reject(err);
					} else {
						analyzeSS(<ISSThread>ss).then((ss: ISSThread) => {
							resolve(ss);
						}, reject);
					}
				});
			});
		});
	});
}

function analyze($: any, html: string): IThread {
	if (html.indexOf('<font size="1">Pastlog.cgi Ver2.0<br>') >= 0) {
		return analyzePastlogCgiVer2_0($, html);
	} else if (html.indexOf('read.cgi ver 05.02.02 2014/06/23') >= 0) {
		return analyzeReadCgiVer05_02_02_2014_06_23($, html);
	} else if (html.indexOf('read.cgi ver 2013/10/12 prev 2011/01/08') >= 0) {
		return analyzeReadCgiVer2013_10_12_prev_2011_01_08($, html);
	} else if (html.indexOf('read.cgi ver 2014.07.20.01.SC 2014/07/20')) {
		return analyzeReadCgiVer2014_07_20_01_SC_2014_07_20($, html);
	} else {
		return null;
	}
}

function analyzeReadCgiVer05_02_02_2014_06_23($: any, html: string): IThread {
	const title = $('h1').text();

	const dl = html.match(/<dl .+?>([\s\S]+)<\/dl>/)[1];

	const posts = dl.split('\n').map(x => x.trim()).filter(x => x !== '');

	return {
		title: title,
		posts: <ISSThreadPost[]>posts.map(post => {
			try {
				return {
					number: parseInt(post.match(/^<dt>(\d+)/)[1], 10),
					userName: entities.decode(post.match(/<b>(.+?)<\/b>/)[1]),
					userId: post.match(/ID:([0-9A-Za-z\+\/\.]+)/)[1],
					text: sanitize(post.match(/<dd>(.+?)<br><br>$/)[1].split('<br>').join('\n')),
					createdAt: new Date(post.match(/\d\d\d\d\/\d\d\/\d\d\(.+?\) \d\d\:\d\d\:\d\d\.\d\d/)[0] + ' +0900')
				};
			} catch (e) {
				return null;
			}
		}).filter(x => x !== null)
	};
}

function analyzeReadCgiVer2013_10_12_prev_2011_01_08($: any, html: string): IThread {
	const title = $('h1').text().replace(' - SS速報VIP 過去ログ倉庫', '');

	const lessHeaders = $('dl').children('dt');
	const lessBodies = $('dl').children('dd');

	let posts: any[] = [];

	for (let i = 0; i < lessHeaders.length; i++) {
		let post: any = {};

		try {
			post.text = sanitize($(lessBodies[i]).html()
				.split('<br>').join('\n'));

			post.number = parseInt(/^([0-9]+?) [:：]/
				.exec($(lessHeaders[i]).html())[1], 10);

			post.userName = $(lessHeaders[i]).find('b').parent().text();

			post.createdAt = new Date(/\d\d\d\d\/\d\d\/\d\d\(.+?\) \d\d\:\d\d\:\d\d/
				.exec($(lessHeaders[i]).text())[0] + ' +0900');

			post.userId = /ID:([0-9A-Za-z\+\/\.]*)$/
				.exec($(lessHeaders[i]).text())[1];

			posts.push(post);
		} catch (e) {
			console.error(`${i + 1} ${$(lessBodies[i]).html()} ${e}`);
		}
	}

	return {
		title: title,
		posts: posts
	};
}

function analyzeReadCgiVer2014_07_20_01_SC_2014_07_20($: any, html: string): IThread {
	const title = $('h1').text();

	const dl = html.match(/<dl .+?>([\s\S]+)<\/dl>/)[1];

	const posts = dl.split('\n').map(x => x.trim()).filter(x => x !== '');

	return {
		title: title,
		posts: <ISSThreadPost[]>posts.map(post => {
			return {
				number: parseInt(post.match(/^<dt>(\d+)/)[1], 10),
				userName: entities.decode(post.match(/<b>(.+?)<\/b>/)[1]),
				userId: post.match(/ID:([0-9A-Za-z\+\/\.]+)/)[1],
				text: sanitize(post.match(/<dd>(.+?)<br><br>$/)[1].split('<br>').join('\n')),
				createdAt: new Date(post.match(/\d\d\d\d\/\d\d\/\d\d\(.+?\) \d\d\:\d\d\:\d\d\.\d\d/)[0] + ' +0900')
			};
		})
	};
}

function analyzePastlogCgiVer2_0($: any, html: string): IThread {
	if (html.indexOf('<!-- Start_TITLE --><!-- End_TITLE -->') !== -1) {
		return null;
	}

	const title = entities.decode(
		/<!-- Start_TITLE -->(.+?)<!-- End_TITLE -->/.exec(html)[1]);

	const lessHeaders = $('dl').children('dt');
	const lessBodies = $('dl').children('dd');

	let posts: any[] = [];

	for (let i = 0; i < lessHeaders.length; i++) {
		let post: any = {};

		try {
			post.text = sanitize($(lessBodies[i]).html()
				.split('<br>').join('\n'));

			post.number = parseInt(/^([0-9]+?) [:：]/
				.exec($(lessHeaders[i]).html())[1], 10);

			post.userName = $(lessHeaders[i]).find('b').parent().text();

			post.createdAt = new Date(/\d\d\d\d\/\d\d\/\d\d\(.+?\) \d\d\:\d\d\:\d\d/
				.exec($(lessHeaders[i]).text())[0] + ' +0900');

			post.userId = /ID:([0-9A-Za-z\+\/\.]*)$/
				.exec($(lessHeaders[i]).text())[1];

			posts.push(post);
		} catch (e) {
			console.error(`${i + 1} ${$(lessBodies[i]).html()} ${e}`);
		}
	}

	return {
		title: title,
		posts: posts
	};
}

function sanitize(text: string): string {
	return entities.decode(text.replace(/<.+?>/g, ''));
}
