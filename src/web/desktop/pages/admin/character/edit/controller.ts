import * as express from 'express';
import {Series} from '../../../../../../db/models';

module.exports = (req: express.Request, res: express.Response): void => {
	Series.find({}, (err, serieses) => {
		res.locals.display({
			serieses
		});
	});
};
