import * as express from 'express';
import { SSThread, History } from '../db/models';
import { ISSThread, IHistory } from '../db/interfaces';

export default function(req: express.Request, res: express.Response, ssId: string): void {
	const ip = req.ip;
	SSThread.findById(ssId, '-posts', (err: any, ss: ISSThread) => {
		if (ss.views.indexOf(ip) === -1) {
			ss.views.push(ip);
			ss.markModified('views');
			ss.save();
		}

		if (res.locals.login) {
			History.findOne({
				user: res.locals.me.id
			})
			.sort({
				createdAt: -1
			})
			.exec((err: any, existHistory: IHistory) => {
				if (existHistory === null || existHistory.ss.toString() !== ss.id.toString()) {
					History.create({
						user: res.locals.me.id,
						ss: ss.id
					});
				}
			});
		}
	});
}
