import * as express from 'express';
import { SSThread } from '../../db/models';
import { ISSThread } from '../../db/interfaces';
import analyzeSS from '../../core/analyze-ss';

module.exports = (req: express.Request, res: express.Response): void => {
	SSThread.findById(req.body['ss-id'], (err: any, ss: ISSThread) => {
		analyzeSS(ss).then(ss => {
			res.send(ss.toObject());
		}, err => {
			res.status(500).send(err);
		});
	});
};
