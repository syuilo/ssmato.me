import * as request from 'request';
import config from '../config';

export default function recaptcha(response: string): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		request({
			url: 'https://www.google.com/recaptcha/api/siteverify',
			method: 'POST',
			form: {
				'secret': config.recaptchaSecretKey,
				'response': response
			}
		}, (err, response, body) => {
			if (err !== null) {
				reject('request-failed');
				return;
			}
			const parsed: any = JSON.parse(body);
			if (parsed.success) {
				resolve();
			} else {
				reject('recaptcha-failed');
			}
		});
	});
}
