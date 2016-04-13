import { SS } from '../../db/models';
import client from '../../db/es';

export default (q: string, from?: number) => {
	if (from === undefined) {
		from = 0;
	}

	return new Promise((resolve, reject) => {
		client.search({
			index: 'ss',
			body: {
				fields: [],
				size: 10,
				from: from,
				query: {
					simple_query_string: {
						fields: ['title', 'body'],
						query: q,
						default_operator: 'and'
					}
				}
			}
		}, (error: any, response: any) => {
			if (error !== undefined) {
				return reject(error);
			}

			const ids: string[] = response.hits.hits.map((hit: any) => hit._id);

			SS
			.find({ _id: { $in: ids }})
			.populate({
				path: 'series',
				options: { lean: true }
			})
			.populate({
				path: 'characters.id',
				select: '_id name kana screenName aliases color',
				options: { lean: true }
			})
			.lean()
			.exec((err, sss) => {
				if (err !== null) {
					reject(err);
				} else {
					resolve(sss);
				}
			});
		});
	});
}
