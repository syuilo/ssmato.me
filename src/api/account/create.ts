import * as express from 'express';
import * as bcrypt from 'bcrypt';
import {User} from '../../db/models';
import recaptcha from '../../core/recaptcha';

module.exports = (req: express.Request, res: express.Response): void => {
	recaptcha(req.body['g-recaptcha-response']).then(() => {
		create();
	}, (err) => {
		switch (err) {
			case 'request-failed':
				res.sendStatus(500);
				break;
			case 'recaptcha-failed':
				res.status(400).send('recaptcha-failed');
				break;
			default:
				break;
		}
	});

	function create(): void {
		const screenName: string = req.body['screen-name'];
		const password: string = req.body['password'];

		if (screenName === undefined || screenName === null || !/^[a-zA-Z0-9\-]{2,15}$/.test(screenName)) {
			res.sendStatus(400);
			return;
		}

		if (password === undefined || password === null || password.length < 8) {
			res.sendStatus(400);
			return;
		}

		// Generate hash of password
		const salt = bcrypt.genSaltSync(14);
		const encryptedPassword = bcrypt.hashSync(password, salt);

		User.create({
			screenName: screenName,
			screenNameLower: screenName.toLowerCase(),
			encryptedPassword: encryptedPassword
		}, (err, user) => {
			if (err !== null) {
				console.error(err);
				res.sendStatus(500);
				return;
			}

			res.sendStatus(200);
		});
	}
};
