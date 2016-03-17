import * as express from 'express';
import { Favorite } from '../../db/models';
import { IUser, IFavorite } from '../../db/interfaces';

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
	}, '_id', (err: any, favorite: IFavorite) => {
		if (err !== null) {
			console.error(err);
			res.sendStatus(500);
			return;
		}

		if (favorite === null) {
			res.send('false');
		} else {
			res.send('true');
		}
	});
};
