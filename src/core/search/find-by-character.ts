import { SS } from '../../db/models';
import { ICharacter } from '../../db/interfaces';

export default (character: ICharacter) => {
	return SS
	.find({
		'characters.profile': character.id
	})
	.sort({
		// todo
	})
	.limit(16)
	.populate('series')
	.populate('characters.profile', 'name kana screenName aliases color _id')
	.exec();
}
