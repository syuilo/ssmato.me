//////////////////////////////////////////////////
// IMAGE SERVER
//////////////////////////////////////////////////

import * as express from 'express';
const cors: any = require('cors');

import { Series, Character } from './db/models';
import { ISeries, ICharacter } from './db/interfaces';
import config from './config';

//////////////////////////////////////////////////
// INIT SERVER PHASE

const app: express.Express = express();
app.disable('x-powered-by');

// CORS
app.use(cors({
	origin: true,
	credentials: false
}));

//////////////////////////////////////////////////
// ROUTING

app.get('/', (req, res) => res.redirect(config.public.url));

app.get('/character/:characterId', (req, res) => {
	Character.findById(req.params.characterId, 'image', (err: any, char: ICharacter) => {
		if (char === null) {
			res.sendStatus(404);
			return;
		}

		if (char.image === null) {
			res.sendFile(__dirname + '/resources/no-image.png');
		} else {
			res.send(char.image);
		}
	});
});

app.get('/character/:characterId/icon', (req, res) => {
	Character.findById(req.params.characterId, 'icon', (err: any, char: ICharacter) => {
		if (char === null) {
			res.sendStatus(404);
			return;
		}

		if (char.icon === null) {
			res.sendFile(__dirname + '/resources/no-image.png');
		} else {
			res.send(char.icon);
		}
	});
});

app.get('/series/:seriesId', (req, res) => {
	Series.findById(req.params.seriesId, 'image', (err: any, series: ISeries) => {
		if (series === null) {
			res.sendStatus(404);
			return;
		}

		if (series.image === null) {
			res.sendFile(__dirname + '/resources/no-image.png');
		} else {
			res.send(series.image);
		}
	});
});

// Not found handling
app.use((req, res) => {
	res.status(404).send('not-found');
});

export default app;
