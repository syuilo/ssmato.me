import * as moment from 'moment';
import { ISSThreadPost } from '../db/interfaces';

moment.locale('ja');

export default function (posts: ISSThreadPost[]): ISSThreadPost[] {
	const likeMax = Math.max.apply(null, posts.map(x => x.ratings.filter(y => y.rating === 'like').length));

	return posts.map(post => {
		const postObj: any = post.toObject();
		const likesCount = post.ratings.filter(y => y.rating === 'like').length;
		postObj.popularity = likesCount / likeMax * 100;
		postObj.displayCreatedAt = moment(post.createdAt).format('LL LT');
		return postObj;
	});
}
