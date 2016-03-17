//////////////////////////////////////////////////
// WEB SERVER
//////////////////////////////////////////////////

import * as cluster from 'cluster';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import * as express from 'express';
import * as expressSession from 'express-session';
import * as MongoStore from 'connect-mongo';
import * as compression from 'compression';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as csrf from 'csurf';
const cors: any = require('cors');
const vhost: any = require('vhost');

import db from './db/db';
import { User } from './db/models';
import { IUser } from './db/interfaces';
import uatype from './detect-ua';
import config from './config';

import resources from './resources-server';
import routes from './routes';

const worker = cluster.worker;

console.log(`[${worker.id}] Initializing...`);

//////////////////////////////////////////////////
// SERVER OPTIONS

const store = MongoStore(expressSession);

const sessionExpires: number = 1000 * 60 * 60 * 24 * 365;
const subdomainOptions = {
	base: config.public.domain
};

const session: any = {
	name: config.sessionKey,
	secret: config.sessionSecret,
	resave: false,
	saveUninitialized: true,
	cookie: {
		path: '/',
		domain: `.${config.public.domain}`,
		httpOnly: true,
		secure: config.https.enable,
		expires: new Date(Date.now() + sessionExpires),
		maxAge: sessionExpires
	},
	store: new store({
		mongooseConnection: db
	})
};

//////////////////////////////////////////////////
// INIT SERVER PHASE

const app: express.Express = express();
app.disable('x-powered-by');
app.locals.compileDebug = false;
app.locals.cache = true;
// app.locals.pretty = '    ';
app.set('view engine', 'jade');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(config.cookiePass));
app.use(compression());
app.use(expressSession(session));

// CORS
app.use(cors({
	origin: true,
	credentials: true
}));

app.use((req, res, next) => {
	// Security headers
	res.header('X-Frame-Options', 'SAMEORIGIN');
	res.header('X-XSS-Protection', '1; mode=block');
	res.header('X-Content-Type-Options', 'nosniff');

	// HSTS
	if (config.https.enable) {
		res.header(
			'Strict-Transport-Security',
			'max-age=10886400; includeSubDomains; preload');
	}

	// See: http://web-tan.forum.impressrd.jp/e/2013/05/17/15269
	res.header('Vary', 'User-Agent, Cookie');

	// Set locals

	res.locals.login =
		req.hasOwnProperty('session') &&
		req.session !== null &&
		req.session.hasOwnProperty('userId') &&
		(<any>req.session).userId !== null;

	res.locals.config = config.public;
	res.locals.pagePath = req.path;
	res.locals.ua = uatype(req.headers['user-agent']);
	res.locals.url = req.protocol + '://' + req.get('host') + req.originalUrl;

	if (res.locals.login) {
		User.findById((<any>req.session).userId, (err: any, user: IUser) => {
			res.locals.me = user;
			next();
		});
	} else {
		res.locals.me = null;
		next();
	}
});

// CSRF
app.use(csrf({
	cookie: false
}));
app.use((req, res, next) => {
	res.locals.csrftoken = req.csrfToken();
	next();
});

// Init static resources server
app.use(vhost(`${config.public.domains.resources}.${config.public.domain}`, resources()));

app.use(require('subdomain')(subdomainOptions));

app.get('/favicon.ico', (req, res) => {
	res.sendFile(path.resolve(`${__dirname}/resources/favicon.ico`));
});
app.get('/manifest.json', (req, res) => {
	res.sendFile(path.resolve(`${__dirname}/resources/manifest.json`));
});

// Main routing
routes(app);

//////////////////////////////////////////////////
// LISTEN PHASE

let server: http.Server | https.Server;
let port: number;

if (config.https.enable) {
	port = config.port.https;
	server = https.createServer({
		key: fs.readFileSync(config.https.keyPath),
		cert: fs.readFileSync(config.https.certPath)
	}, app);
} else {
	port = config.port.http;
	server = http.createServer(app);
}

server.listen(port, () => {
	const host = server.address().address;
	const port = server.address().port;

	console.log(
		`\u001b[1;32m[${worker.id}] is now listening at ${host}:${port}\u001b[0m`);
});
