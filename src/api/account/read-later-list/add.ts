import * as express from 'express';
import { SS, ReadLater } from '../../../db/models';
import { IUser, ISS, IReadLater } from '../../../db/interfaces';

module.exports = (req: express.Request, res: express.Response): void => {
	if (!res.locals.login) {
		res.sendStatus(401);
		return;
	}

	const me: IUser = res.locals.me;
	const ssId = req.body['ss-id'];

	SS.findById(ssId, (err: any, ss: ISS) => {
		if (err !== null) {
			console.error(err);
			res.sendStatus(500);
			return;
		}

		if (ss === null) {
			res.sendStatus(404);
			return;
		}

		ReadLater.findOne({
			user: me.id,
			ss: ss.id
		}, (err: any, readlater: IReadLater) => {
			if (err !== null) {
				console.error(err);
				res.sendStatus(500);
				return;
			}

			if (readlater !== null) {
				readlater.createdAt = new Date();
				readlater.save(err => {
					if (err !== null) {
						console.error(err);
						res.sendStatus(500);
					} else {
						res.sendStatus(200);
					}
				});
			} else {
				ReadLater.create({
					user: me.id,
					ss: ss.id
				}, (err, user) => {
					if (err !== null) {
						console.error(err);
						res.sendStatus(500);
					} else {
						res.sendStatus(200);
					}
				});
			}
		});
	});
};
