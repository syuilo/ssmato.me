//////////////////////////////////////////////////
// DB
//////////////////////////////////////////////////

import * as mongoose from 'mongoose';
import config from '../config';

// init mongo connection
const db = mongoose.createConnection(
	config.mongo.dbUri, config.mongo.options);

db.once('open', () => {
	console.log('Connected to MongoDB');
});

db.on('error', (err: any) => {
	console.error(`MongoDB connection error: ${err}`);
});

/*
//////////////////////////////////////////////////
// River SETTINGS

Promise.all([
	// DB
	mongodb.MongoClient.connect(
		config.mongo.dbUri, config.mongo.options),
	// Local
	mongodb.MongoClient.connect(
		config.mongo.localUri, config.mongo.options)
]).then(connections => {
	const db = connections[0];
	const local = connections[1];

	const river = River(
		elasticsearch.Client(),
		local.collection('oplog.rs'),
		{
			'db.ss': { // namespace - 'db.collection'
				init: null, // for the first run
				collection: db.collection('ss')
			}
		}
	);

	river.on('error', (err: any) => {
		throw err;
	});

	river.run()
	.then(() => (console.log('River running'), river.init()))
	.then(() => console.log('River initialized'))
	.catch((err: any) => {
		throw err;
	});

}).catch((err) => {
	throw err;
});
*/

export default db;
