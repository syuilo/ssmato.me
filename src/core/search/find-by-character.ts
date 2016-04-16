import { SS } from '../../db/models';
import client from '../../db/es';

const size = 10;

export default (q: string, page?: number) => {
	if (page === undefined) {
		page = 1;
	}
	if (page === 0) {
		page = 1;
	}

	const from = (page - 1) * size;

	return new Promise((resolve, reject) => {
		client.search({
			index: 'ss',
			body: {
				fields: [],
				size: size,
				from: from,
				query: {
					simple_query_string: {
						fields: ['character_ids'],
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
