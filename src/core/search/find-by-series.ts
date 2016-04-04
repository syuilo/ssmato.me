import { SS } from '../../db/models';
import { ISeries } from '../../db/interfaces';

export default (series: ISeries) => {
	return SS
	.find({
		'series': series.id
	})
	.sort({
		// todo
	})
	.limit(16)
	.populate('series')
	.populate('characters.profile', 'name kana screenName aliases color _id')
	.exec();
}
