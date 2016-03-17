import * as express from 'express';
import {User} from '../../db/models';

module.exports = (req: express.Request, res: express.Response): void => {
	const screenName: string = req.body['screen-name'];
	User.findOne({
		screenNameLower: screenName.toLowerCase()
	}, (err, user) => {
		if (user === null) {
			res.send({
				available: true
			});
		} else {
			res.send({
				available: false
			});
		}
	});
};
