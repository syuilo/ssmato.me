import * as express from 'express';
import { ISSThread } from '../../../../../db/interfaces';
import ui from '../../../ui';
import findByCharacter from '../../../../../core/search/find-by-character';

module.exports = (req: express.Request, res: express.Response): void => {
	const character = res.locals.character;
	ui(req, res).then(() => {
		findByCharacter(character).then((sss: ISSThread[]) => {
			res.locals.display({
				sss: sss.map(ss => ss.toObject())
			});
		});
	});
};
