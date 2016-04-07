//////////////////////////////////////////////////
// WEB SERVER
//////////////////////////////////////////////////

import * as cluster from 'cluster';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as express from 'express';
import * as expressSession from 'express-session';
import * as MongoStore from 'connect-mongo';
import * as compression from 'compression';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as csrf from 'csurf';
import * as cors from 'cors';
const vhost: any = require('vhost');

import db from './db/db';
import uatype from './detect-ua';
import config from './config';

import resources from './resources-server';
import routes from './routes';

const worker = cluster.worker;

console.log(`[${worker.id}] Initializing...`);

//////////////////////////////////////////////////
// SERVER OPTIONS

const store = MongoStore(expressSession);

const sessionExpires = 1000 * 60 * 60 * 24 * 365; // One Year
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

// Init static resources server
app.use(vhost(`${config.public.domains.resources}.${config.public.domain}`, resources));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(config.cookiePass));
app.use(compression());
app.use(expressSession(session));

// CORS
app.use(cors({
	origin: true,
	credentials: true
}));

// CSRF
app.use(csrf({
	cookie: false
}));

// Intercept all requests
app.use((req, res, next) => {
	// HSTS
	if (config.https.enable) {
		res.header(
			'Strict-Transport-Security',
			'max-age=10886400; includeSubDomains; preload');
	}

	// See: https://developer.mozilla.org/en-US/docs/Web/HTTP/X-Frame-Options
	res.header('X-Frame-Options', 'DENY');

	// See: http://web-tan.forum.impressrd.jp/e/2013/05/17/15269
	res.header('Vary', 'User-Agent');

	// Set locals
	res.locals = {
		csrftoken: req.csrfToken(),

		login:
			req.hasOwnProperty('session') &&
			req.session !== null &&
			req.session.hasOwnProperty('user') &&
			(<any>req.session).user !== null,

		config: config.public,

		pagePath: req.path,
		ua: uatype(req.headers['user-agent']),
		url: `${req.protocol}://${req.get('host')}${req.originalUrl}`
	};

	if (res.locals.login) {
		res.locals.me = (<any>req.session).user;
	}

	next();
});

app.use(require('subdomain')(subdomainOptions));

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

	// If request http, redirect to https
	http.createServer((req, res) => {
		res.writeHead(301, {
			Location: config.public.url + req.url
		});
		res.end();
	}).listen(config.port.http);
} else {
	port = config.port.http;
	server = http.createServer(app);
}

// LISTEN
server.listen(port, config.bindIp, () => {
	const host = server.address().address;
	const port = server.address().port;

	console.log(
		`\u001b[1;32m[${worker.id}] is now listening at ${host}:${port}\u001b[0m`);
});

// Dying away
