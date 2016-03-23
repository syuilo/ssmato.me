import * as express from 'express';
import { Series, SS, Character } from '../../../../../db/models';
import { ISeries, ISSThread, ICharacter } from '../../../../../db/interfaces';

module.exports = (req: express.Request, res: express.Response): void => {
	const series = res.locals.series;
	SS
	.find({
		series: series.id
	})
	.sort({
		registeredAt: -1
	})
	.limit(16)
	.populate('series')
	.populate('characters', 'name kana screenName aliases color _id')
	.exec((err: any, sss: ISSThread[]) => {
		Promise.all(sss.map(ss => {
			return new Promise<ISSThread>((resove, reject) => {
				const ssobj: any = ss.toObject();
				if (ss.series !== []) {
					Character.find({
						series: { $in: (<ISeries[]>ss.series).map(x => x.id) }
					}, 'name kana aliases color _id', (err: any, characters: ICharacter[]) => {
						resove(ssobj);
					});
				} else {
					resove(ssobj);
				}
			});
		})).then(sss => {
			res.locals.display({
				sss: sss
			});
		});
	});
};
