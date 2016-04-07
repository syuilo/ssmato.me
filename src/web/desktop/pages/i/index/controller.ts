import * as express from 'express';
import { ReadLater, Favorite, History } from '../../../../../db/models';
import { IUser, IReadLater } from '../../../../../db/interfaces';

module.exports = (req: express.Request, res: express.Response): void => {
	const me: IUser = res.locals.me;
	Promise.all([
		(<any>ReadLater.find({
			user: me.id
		}))
		.deepPopulate('ss.series ss.characters.id')
		.sort({
			createdAt: -1
		})
		.limit(30)
		.exec(),

		(<any>Favorite.find({
			user: me.id
		}))
		.deepPopulate('ss.series ss.characters.id')
		.sort({
			createdAt: -1
		})
		.limit(30)
		.exec(),

		(<any>History.find({
			user: me.id
		}))
		.deepPopulate('ss.series ss.characters.id')
		.sort({
			createdAt: -1
		})
		.limit(30)
		.exec()
	]).then(results => {
		const readlaters = <IReadLater[]>results[0];
		const favorites = <IReadLater[]>results[1];
		const history = <IReadLater[]>results[2];

		res.locals.display({
			readlaters: readlaters.map(x => x.ss),
			favorites: favorites.map(x => x.ss),
			history: history.map(x => x.ss)
		});
	});
};
