import * as express from 'express';
import { SS, Favorite } from '../../db/models';
import { IUser, ISS, IFavorite } from '../../db/interfaces';

module.exports = (req: express.Request, res: express.Response): void => {
	if (!res.locals.login) {
		res.sendStatus(401);
		return;
	}

	const me: IUser = res.locals.me;
	const ssId = req.body['ss-id'];

	SS.findById(ssId, '_id favoritesCount', (err: any, ss: ISS) => {
		if (err !== null) {
			console.error(err);
			res.sendStatus(500);
			return;
		}

		if (ss === null) {
			res.sendStatus(404);
			return;
		}

		Favorite.findOne({
			user: me.id,
			ss: ss.id
		}, (err: any, existFavorite: IFavorite) => {
			if (err !== null) {
				console.error(err);
				res.sendStatus(500);
				return;
			}

			if (existFavorite !== null) {
				res.sendStatus(400);
				return;
			}

			Favorite.create({
				user: me.id,
				ss: ss.id
			}, (err, user) => {
				if (err !== null) {
					console.error(err);
					res.sendStatus(500);
				} else {
					res.sendStatus(200);

					ss.favoritesCount++;
					ss.save();
				}
			});
		});
	});
};
