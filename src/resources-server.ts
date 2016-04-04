//////////////////////////////////////////////////
// RESOURCES SERVER
//////////////////////////////////////////////////

import * as express from 'express';
import * as compression from 'compression';
const cors: any = require('cors');

export default function server(): express.Express {
	// Init server
	const app: express.Express = express();
	app.disable('x-powered-by');
	app.use(compression());

	// CORS
	app.use(cors({
		origin: true,
		credentials: false
	}));

	// SVGZ support
	// see: https://github.com/strongloop/express/issues/1911
	app.get(/.svgz/, (req, res, next) => {
		res.set('Content-Encoding', 'gzip');
		next();
	});

	app.use(express.static(`${__dirname}/resources/`));

	// Not found handling
	app.use((req, res) => {
		res.status(404).send('not-found');
	});

	return app;
}
