import * as express from 'express';
import { Character } from '../../../../../db/models';
import { ISSThread } from '../../../../../db/interfaces';
import findByCharacter from '../../../../../core/search/find-by-character';

module.exports = (req: express.Request, res: express.Response): void => {
	const character = res.locals.character;
	Character.populate(character, 'series', (err: any, character2: any) => {
		findByCharacter(character).then((sss: ISSThread[]) => {
			res.locals.display({
				character: character2,
				sss: sss
			});
		});
	});
};
