import * as express from 'express';
import {ISS} from '../../db/interfaces';
import getSS from '../../core/get-ss';

module.exports = (req: express.Request, res: express.Response): void => {
	getSS(req.body.url).then((ss: ISS) => {
		res.send(ss.toObject());
	}, (err) => {
		console.error(err);
		res.sendStatus(500);
	});
};
