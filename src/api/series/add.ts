import * as express from 'express';
import {Series} from '../../db/models';
import recaptcha from '../../core/recaptcha';

module.exports = (req: express.Request, res: express.Response): void => {
	if (!res.locals.login) {
		res.sendStatus(401);
	} else if (!res.locals.me.isAdmin) {
		res.sendStatus(403);
	} else {
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
	}

	function create(): void {
		const title: string = req.body['title'];
		const kana: string = req.body['kana'];
		const aliases: string = req.body['aliases'];
		const description: string = req.body['description'];

		if (isEmpty(title)) {
			res.sendStatus(400);
			return;
		}

		if (isEmpty(kana)) {
			res.sendStatus(400);
			return;
		}

		Series.create({
			title: title.trim(),
			kana: kana.trim(),
			aliases: isEmpty(aliases) ? [] : aliases.split(',').map(x => x.trim()).filter(x => x !== ''),
			description: isEmpty(description) ? null : description
		}, (err, series) => {
			if (err !== null) {
				console.error(err);
				res.sendStatus(500);
				return;
			}

			res.sendStatus(200);
		});
	}
};

function isEmpty(x: any): boolean {
	return x === undefined || x === null || x.trim() === '';
}
