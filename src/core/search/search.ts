import { SS } from '../../db/models';
import client from '../../db/es';

export default (q: string) => {
	return new Promise((resolve, reject) => {
		client.search({
			index: 'ss',
			body: {
				fields: [],
				size: 10,
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
			.populate('series')
			.populate('characters.id', 'name kana screenName aliases color _id')
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
