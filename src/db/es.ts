//////////////////////////////////////////////////
// SEARCH DB
//////////////////////////////////////////////////

const ElasticSearchClient = require('elasticsearchclient');
import config from '../config';

// init ElasticSearch connection
const elasticSearchClient = new ElasticSearchClient(config.elasticsearch);

// Send a HEAD request
elasticSearchClient.ping({
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

export default elasticSearchClient;
