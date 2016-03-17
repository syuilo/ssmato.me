import * as bcrypt from 'bcrypt';
import { User } from '../db/models';
import { IUser } from '../db/interfaces';

export default function login(screenName: string, password: string, session: any): Promise<void> {
	return new Promise<void>((resove, reject) => {
		User.findOne({
			screenNameLower: screenName.toLowerCase()
		}, (findErr: any, user: IUser) => {
			if (findErr !== null) {
				return reject(findErr);
			} else if (user === null) {
				return reject('user-not-found');
			}

			bcrypt.compare(password, user.encryptedPassword, (compareErr, same) => {
				if (compareErr !== undefined && compareErr !== null) {
					return reject(compareErr);
				} else if (!same) {
					return reject('failed');
				}

				session.userId = user.id;
				session.save(() => {
					resove();
				});
			});
		});
	});
}
