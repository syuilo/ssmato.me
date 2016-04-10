//////////////////////////////////////////////////
// SEARCH DB
//////////////////////////////////////////////////

const ElasticSearchClient = require('elasticsearch');
import config from '../config';

// init ElasticSearch connection
const client = new ElasticSearchClient(config.elasticsearch);

// Send a HEAD request
client.ping({
	// ping usually has a 3000ms timeout
	requestTimeout: Infinity,

	// undocumented params are appended to the query string
	hello: "elasticsearch!"
}, (error: any) => {
	if (error) {
		console.error('elasticsearch cluster is down!');
	} else {
		console.log('All is well');
	}
});

export default client;
