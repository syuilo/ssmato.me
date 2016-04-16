import * as fs from 'fs';
import * as express from 'express';
import {Character} from '../../db/models';
import recaptcha from '../../core/recaptcha';

module.exports = (req: express.Request, res: express.Response): void => {
	const imageFile: any = ((<any>req).files['image'] || [])[0];
	const iconFile: any = ((<any>req).files['icon'] || [])[0];
	const image: Buffer = imageFile !== undefined ? fs.readFileSync(imageFile.path) : null;
	const icon: Buffer = iconFile !== undefined ? fs.readFileSync(iconFile.path) : null;
	const seriesId: string = req.body['series-id'];
	const name: string = req.body['name'];
	const kana: string = req.body['kana'];
	const ruby: string = req.body['ruby'];
	const screenName: string = req.body['screen-name'];
	const aliases: string = req.body['aliases'];
	const color: string = req.body['color'];
	const bio: string = req.body['bio'];
	const gender: string = req.body['gender'];

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
		// Check exists
		Promise.all([
			Character.findOne({
				series: seriesId,
				name: name
			}),
			Character.findOne({
				series: seriesId,
				kana: kana
			})
		]).then(exists => {
			if (exists[0] !== null || exists[1] !== null) {
				res.status(400).send('arleady-exists');
				return;
			}

			if (imageFile !== undefined) {
				fs.unlink(imageFile.path);
			}

			if (iconFile !== undefined) {
				fs.unlink(iconFile.path);
			}

			if (isEmpty(seriesId)) {
				res.sendStatus(400);
				return;
			}

			if (isEmpty(name)) {
				res.sendStatus(400);
				return;
			}

			if (isEmpty(kana)) {
				res.sendStatus(400);
				return;
			}

			if (isEmpty(screenName)) {
				res.sendStatus(400);
				return;
			}

			if (!isEmpty(color) && !/^#[a-fA-F0-9]{6}$/.test(color)) {
				res.sendStatus(400);
				return;
			}

			Character.create({
				image: image,
				icon: icon,
				series: [seriesId],
				name: name.trim(),
				kana: kana.trim(),
				screenName: screenName.trim(),
				aliases: aliases !== undefined ? aliases.split(',').map(x => x.trim()).filter(x => x !== '') : [],
				color: color !== undefined ? color.trim() : '#000000',
				ruby: ruby !== undefined ? ruby : null,
				bio: bio !== undefined ? bio : null,
				gender: gender !== undefined ? gender : null
			}, (err, character) => {
				if (err !== null) {
					console.error(err);
					res.sendStatus(500);
					return;
				}

				res.sendStatus(200);
			});
		}, () => {
			res.sendStatus(500);
		});
	}
};

function isEmpty(x: any): boolean {
	return x === undefined || x === null || x.trim() === '';
}
