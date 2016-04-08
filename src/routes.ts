//////////////////////////////////////////////////
// WEB ROUTER
//////////////////////////////////////////////////

import * as express from 'express';
import * as multer from 'multer';
import * as path from 'path';
import { Series, Character, SSThread } from './db/models';
import { ISeries, ICharacter, ISS } from './db/interfaces';
import config from './config';
import login from './core/login';

const upload = multer({
	dest: 'uploads/'
});

export default (app: express.Express) => {

	//////////////////////////////////////////////////
	// GENERAL

	app.get('/', (req, res) =>
		call(req, res, 'index'));

	app.get('/manifest.json', (req, res) =>
		res.sendFile(path.resolve(`${__dirname}/resources/manifest.json`)));

	app.get('/:ssId', (req, res) =>
		call(req, res, 'ss'));

	//////////////////////////////////////////////////
	// I

	const iDomain = `/subdomain/${config.public.domains.i}`;

	app.get(`${iDomain}/*`, (req, res, next) => {
		// ログイン必須
		if (res.locals.login) {
			if (res.locals.me.isAdmin) {
				next();
			} else {
				res.sendStatus(403);
			}
		} else {
			call(req, res, 'signin');
		}
	});

	app.get(`${iDomain}/`, (req, res) => {
		call(req, res, 'i/index');
	});

	//////////////////////////////////////////////////
	// SEARCH

	const searchDomain = `/subdomain/${config.public.domains.search}`;

	app.get(`${searchDomain}/`, (req, res) => {
		call(req, res, 'search/index');
	});

	//////////////////////////////////////////////////
	// SERIES

	const seriesDomain = `/subdomain/${config.public.domains.series}`;

	app.get(`${seriesDomain}/:seriesId`, (req, res) => {
		call(req, res, 'series/index');
	});

	//////////////////////////////////////////////////
	// CHARACTERS

	const charactersDomain = `/subdomain/${config.public.domains.characters}`;

	app.get(`${charactersDomain}/:characterId`, (req, res) => {
		call(req, res, 'character/index');
	});

	//////////////////////////////////////////////////
	// SIGN UP

	const signupDomain = `/subdomain/${config.public.domains.signup}`;

	app.get(`${signupDomain}/`, (req, res) => {
		if (res.locals.login) {
			res.redirect(config.public.url);
		} else {
			call(req, res, 'signup');
		}
	});

	//////////////////////////////////////////////////
	// SIGN IN

	const signinDomain = `/subdomain/${config.public.domains.signin}`;

	app.post(`${signinDomain}/`, (req, res) => {
		login(req.body['screen-name'], req.body['password'], req.session).then(() => {
			res.sendStatus(200);
		}, err => {
			res.status(400).send(err);
		});
	});

	app.get(`${signinDomain}/`, (req, res) => {
		if (res.locals.login) {
			res.redirect(config.public.url);
		} else if (req.query.hasOwnProperty('screen-name') && req.query.hasOwnProperty('password')) {
			login(req.query['screen-name'], req.query['password'], req.session).then(() => {
				res.redirect(config.public.url);
			}, err => {
				res.status(400).send(err);
			});
		} else {
			call(req, res, 'signin');
		}
	});

	//////////////////////////////////////////////////
	// ADMIN

	const adminDomain = `/subdomain/${config.public.domains.admin}`;

	app.get(`${adminDomain}/*`, (req, res, next) => {
		// ログイン必須
		if (res.locals.login) {
			// 管理者のみ
			if (res.locals.me.isAdmin) {
				next();
			} else {
				res.sendStatus(403);
			}
		} else {
			call(req, res, 'signin');
		}
	});

	app.get(`${adminDomain}/`, (req, res) => {
		call(req, res, 'admin/index');
	});

	app.get(`${adminDomain}/character/add`, (req, res) => {
		call(req, res, 'admin/character/add');
	});

	app.get(`${adminDomain}/series/add`, (req, res) => {
		call(req, res, 'admin/series/add');
	});

	app.get(`${adminDomain}/sss/get`, (req, res) => {
		call(req, res, 'admin/sss/get');
	});

	app.get(`${adminDomain}/sss/ss/:ssId`, (req, res) => {
		call(req, res, 'admin/sss/ss/index');
	});

	//////////////////////////////////////////////////
	// API

	const apiDomain = `/subdomain/${config.public.domains.api}`;

	app.post(`${apiDomain}/account/create`, require('./api/account/create'));
	app.post(`${apiDomain}/account/read-later-list/add`, require('./api/account/read-later-list/add'));
	app.post(`${apiDomain}/account/read-later-list/count`, require('./api/account/read-later-list/count'));
	app.post(`${apiDomain}/account/read-later-list/remove`, require('./api/account/read-later-list/remove'));
	app.post(`${apiDomain}/favorites/create`, require('./api/favorites/create'));
	app.post(`${apiDomain}/favorites/destroy`, require('./api/favorites/destroy'));
	app.post(`${apiDomain}/favorites/check`, require('./api/favorites/check'));
	app.post(`${apiDomain}/screen-name/available`, require('./api/screen-name/available'));
	app.post(`${apiDomain}/series/add`, require('./api/series/add'));
	app.post(`${apiDomain}/character/add`, upload.single('image'), require('./api/character/add'));
	app.post(`${apiDomain}/ss/get`, require('./api/ss/get'));
	app.post(`${apiDomain}/ss/analyze`, require('./api/ss/analyze'));
	app.get(`${apiDomain}/set-filter`, require('./api/set-filter'));

	//////////////////////////////////////////////////
	// PARAMATER DEFINITIONS

	// SS
	app.param('ssId', (req, res, next, ssId) => {
		// console.time('ss');
		SSThread
		.findById(req.params.ssId, '-registeredAt -ratings -posts.text -posts.createdAt')
		.populate({
			path: 'series',
			options: { lean: true }
		})
		.populate({
			path: 'characters.id',
			select: '_id name kana screenName aliases color',
			options: { lean: true }
		})
		.lean()
		.exec((err: any, ss: ISS) => {
			// console.timeEnd('ss');
			if (err !== null) {
				console.error(err);
				res.sendStatus(500);
				return;
			}
			if (ss === null) {
				res.status(404);
				call(req, res, 'ss/not-found');
			} else {
				res.locals.ss = ss;
				next();
			}
		});
	});

	// Series
	app.param('seriesId', (req, res, next, ssId) => {
		Series
		.findById(req.params.seriesId)
		.exec((err: any, series: ISeries) => {
			if (err !== null) {
				console.error(err);
				res.sendStatus(500);
				return;
			}
			if (series === null) {
				res.status(404);
				call(req, res, 'series/not-found');
			} else {
				res.locals.series = series;
				next();
			}
		});
	});

	// Character
	app.param('characterId', (req, res, next, ssId) => {
		Character
		.findById(req.params.characterId)
		.populate('series')
		.exec((err: any, character: ICharacter) => {
			if (err !== null) {
				console.error(err);
				res.sendStatus(500);
				return;
			}
			if (character === null) {
				res.status(404);
				call(req, res, 'character/not-found');
			} else {
				res.locals.character = character;
				next();
			}
		});
	});
}

/**
 * コントローラーを呼び出します。
 */
function call(
	req: express.Request,
	res: express.Response,
	path: string,
	options?: any
): void {
	res.locals.display = (data?: any) => {
		const view = `${__dirname}/web/${res.locals.ua}/pages/${path}/view.jade`;
		data.stylePath = `${config.public.urls.resources}/${res.locals.ua}/pages/${path}/style.css`;
		data.scriptPath = `${config.public.urls.resources}/${res.locals.ua}/pages/${path}/script.js`;
		delete res.locals.display;

		res.render(view, data);
	};

	let controller: any;
	switch (res.locals.ua) {
		case 'desktop':
			controller = require(`./web/desktop/pages/${path}/controller`);
			break;
		case 'mobile':
			controller = require(`./web/mobile/pages/${path}/controller`);
			break;
		default:
			controller = require(`./web/desktop/pages/${path}/controller`);
			break;
	}

	try {
		controller(req, res, options);
	} catch (e) {
		call(req, res, 'error', e);
	}
}
