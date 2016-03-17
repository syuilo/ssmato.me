import * as express from 'express';
import { ReadLater } from '../../../db/models';
import { IUser } from '../../../db/interfaces';

module.exports = (req: express.Request, res: express.Response): void => {
	if (!res.locals.login) {
		res.sendStatus(401);
		return;
	}

	const me: IUser = res.locals.me;

	ReadLater.count({
		user: me.id
	}, (err: any, count: number) => {
		if (err !== null) {
			console.error(err);
			res.sendStatus(500);
			return;
		}

		res.send(count.toString());
	});
};
