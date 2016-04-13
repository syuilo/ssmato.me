import * as express from 'express';
import { SS, ReadLater, Favorite, History } from '../../../../../db/models';
import { IUser, IReadLater } from '../../../../../db/interfaces';

module.exports = (req: express.Request, res: express.Response): void => {
	const me: IUser = res.locals.me;
	Promise.all([
		(<any>ReadLater.find({
			user: me.id
		}))
		.sort({
			createdAt: -1
		})
		.limit(30)
		.lean()
		.exec(),

		(<any>Favorite.find({
			user: me.id
		}))
		.sort({
			createdAt: -1
		})
		.limit(30)
		.lean()
		.exec(),

		(<any>History.find({
			user: me.id
		}))
		.sort({
			createdAt: -1
		})
		.limit(30)
		.lean()
		.exec()
	]).then(results => {
		Promise.all([
			SS
			.find({ _id: { $in: results[0].map((x: any) => x.ss) }})
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
			.exec(),

			SS
			.find({ _id: { $in: results[1].map((x: any) => x.ss) }})
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
			.exec(),

			SS
			.find({ _id: { $in: results[2].map((x: any) => x.ss) }})
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
			.exec()
		]).then(results => {
			const readlaters = <IReadLater[]>results[0];
			const favorites = <IReadLater[]>results[1];
			const history = <IReadLater[]>results[2];

			res.locals.display({
				readlaters: readlaters,
				favorites: favorites,
				history: history
			});
		});
	});
};
