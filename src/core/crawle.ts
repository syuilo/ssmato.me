//////////////////////////////////////////////////
// CRAWLER
//////////////////////////////////////////////////

const client = require('cheerio-httpcli');
client.headers['User-Agent'] = '';
client.referer = false;
client.timeout = 10000;
client.maxDataSize = 1024 * 1024; // 1MiB

export default function crawle(url: string): void {
	client.fetch(url, (err: any, $: any, res: any, body: any) => {

	});
}
