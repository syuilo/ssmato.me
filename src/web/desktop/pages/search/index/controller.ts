import * as express from 'express';
import { SS, SSThread } from '../../../../../db/models';
import { IUser, ICharacter, ISSThread } from '../../../../../db/interfaces';
import postHtmlConv from '../../../../../core/post-html-conv';

module.exports = (req: express.Request, res: express.Response): void => {
	const q: string = req.query.q;

	console.log(q);

	SS.find(
		{ $text: { $search: q, $language: 'none' } },
		{ score: { $meta: 'textScore' } }
	)
	.sort({ score : { $meta : 'textScore' } })
	.exec((err: any, results: ISSThread[]) => {
		if (err !== null) {
			console.error(err);
			return;
		}
		console.log(results.map(x => x.title));
	});
};
