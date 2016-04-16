import * as fs from 'fs';
import * as express from 'express';
import {Character} from '../../db/models';
import {ICharacter} from '../../db/interfaces';
import recaptcha from '../../core/recaptcha';

module.exports = (req: express.Request, res: express.Response): void => {
	const imageFile: any = ((<any>req).files['image'] || [])[0];
	const iconFile: any = ((<any>req).files['icon'] || [])[0];
	const image: Buffer = imageFile !== undefined ? fs.readFileSync(imageFile.path) : null;
	const icon: Buffer = iconFile !== undefined ? fs.readFileSync(iconFile.path) : null;
	const characterId: string = req.body['character-id'];
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
			update();
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

	function update(): void {
		// Check exists
		Character.findById(characterId).exec().then((char: ICharacter) => {
			if (char === null) {
				res.status(404).send('character-not-found');
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

			if (image !== null) {
				char.image = image;
			}

			if (icon !== null) {
				char.icon = icon;
			}

			char.series = seriesId.split(',');
			char.markModified('series');

			char.name = name.trim();

			char.kana = kana.trim();

			char.screenName = screenName.trim();

			char.aliases = aliases !== undefined ? aliases.split(',').map(x => x.trim()).filter(x => x !== '') : [];
			char.markModified('aliases');

			char.color = color !== undefined ? color.trim() : '#000000';

			char.ruby = ruby !== undefined ? ruby : null;

			char.bio = bio !== undefined ? bio : null;

			char.gender = gender !== undefined ? gender : null;

			char.save((err: any) => {
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
