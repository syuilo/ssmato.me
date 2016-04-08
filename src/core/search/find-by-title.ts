import { SS } from '../../db/models';
import escapeRegexp from '../escape-regexp';

export default (q: string) => {
	return SS
	.find({
		title: new RegExp(escapeRegexp(q), 'i')
	})
	.sort({
		// todo
	})
	.limit(16)
	.populate('series')
	.populate('characters.id', 'name kana screenName aliases color _id')
	.exec();
}
