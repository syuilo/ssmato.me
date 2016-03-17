import * as express from 'express';
import { Favorite, SS } from '../../db/models';
import { IUser, IFavorite, ISS } from '../../db/interfaces';

module.exports = (req: express.Request, res: express.Response): void => {
	if (!res.locals.login) {
		res.sendStatus(401);
		return;
	}

	const me: IUser = res.locals.me;
	const ssId = req.body['ss-id'];

	Favorite.findOne({
		user: me.id,
		ss: ssId
	}, (err: any, favorite: IFavorite) => {
		if (err !== null) {
			console.error(err);
			res.sendStatus(500);
			return;
		}

		if (favorite === null) {
			res.sendStatus(404);
			return;
		}

		favorite.remove(err => {
			if (err !== null) {
				console.error(err);
				res.sendStatus(500);
			} else {
				res.sendStatus(200);

				SS.findById(ssId, '_id favoritesCount', (err: any, ss: ISS) => {
					ss.favoritesCount--;
					ss.save();
				});
			}
		});
	});
};
