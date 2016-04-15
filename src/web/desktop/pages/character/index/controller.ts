import * as express from 'express';
import { ISSThread } from '../../../../../db/interfaces';
import findByCharacter from '../../../../../core/search/find-by-character';

module.exports = (req: express.Request, res: express.Response): void => {
	const character = res.locals.character;
	findByCharacter(character).then((sss: ISSThread[]) => {
		res.locals.display({
			sss: sss
		});
	});
};
