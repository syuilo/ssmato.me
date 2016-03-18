//////////////////////////////////////////////////
// CONFIGURATION MANAGER
//////////////////////////////////////////////////

// Detect home path
const home = process.env[
	process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];

// Name of directory that includes config file
const dirName = 'ssmatome';

// Name of config file
const fileName = 'config.json';

// Resolve paths...
const dirPath = `${home}/${dirName}`;
const path = `${dirPath}/${fileName}`;

//////////////////////////////////////////////////
// CONFIGURATION LOADER

function loadConfig(): IConfig {
	// Read config file
	let conf = <IConfig>require(path);

	const domain = conf.public.domain;
	const domains = conf.public.domains;

	const scheme = conf.https.enable ? 'https://' : 'http://';
	conf.public.url = `${scheme}${conf.public.domain}`;

	// Define URLs
	(<any>conf).public.urls = {
		admin: `${scheme}${domains.admin}.${domain}`,
		i: `${scheme}${domains.i}.${domain}`,
		api: `${scheme}${domains.api}.${domain}`,
		resources: `${scheme}${domains.resources}.${domain}`,
		signup: `${scheme}${domains.signup}.${domain}`,
		signin: `${scheme}${domains.signin}.${domain}`,
		signout: `${scheme}${domains.signout}.${domain}`,
		search: `${scheme}${domains.search}.${domain}`,
		series: `${scheme}${domains.series}.${domain}`,
		characters: `${scheme}${domains.characters}.${domain}`
	};

	return conf;
}

export default loadConfig();

//////////////////////////////////////////////////
// CONFIGURATION INTERFACE DEFINITION

export interface IConfig {
	mongo: {
		uri: string;
		options: {
			user: string;
			pass: string;
		}
	};
	port: {
		http: number;
		https: number;
	};
	https: {
		enable: boolean;
		keyPath: string;
		certPath: string;
	};
	cookiePass: string;
	sessionKey: string;
	sessionSecret: string;
	recaptchaSecretKey: string;
	public: {
		domain: string;
		url: string;
		domains: {
			admin: string;
			i: string;
			api: string;
			resources: string;
			signup: string;
			signin: string;
			signout: string;
			characters: string;
			series: string;
			search: string;
		};
		urls: {
			admin: string;
			i: string;
			api: string;
			resources: string;
			signup: string;
			signin: string;
			signout: string;
			characters: string;
			series: string;
			search: string;
		};
		themeColor: string;
		recaptchaSiteKey: string;
	};
}
