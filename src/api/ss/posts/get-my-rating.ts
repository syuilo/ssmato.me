import * as express from 'express';
import { SSThread } from '../../../db/models';
import { ISSThread } from '../../../db/interfaces';

module.exports = (req: express.Request, res: express.Response): void => {
	if (!res.locals.login) {
		res.sendStatus(401);
		return;
	}

	const me = res.locals.me;
	const postId = req.body['post-id'];
	SSThread.findOne({
		'posts._id': postId
	}, 'posts', (err: any, ss: ISSThread) => {
		if (ss === null) {
			res.sendStatus(404);
			return;
		}

		const post = ss.posts.filter(x => x.id === postId)[0];

		if (post === undefined) {
			res.sendStatus(404);
			return;
		}

		const myRating = post.ratings.filter(x => x.user.toString() === me.id.toString())[0];

		if (myRating === undefined) {
			res.send('none');
		} else {
			res.send(myRating.rating);
		}
	});
};
