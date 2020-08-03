const {promisify}  = require('util');
const config       = requireRoot('config');
const utils        = requireRoot('modules/utils');
const redis        = require("redis");

const client       = redis.createClient(config.redisConnection);
client.getAsync    = promisify(client.get).bind(client);
client.setAsync    = promisify(client.set).bind(client);
client.existsAsync = promisify(client.exists).bind(client);

module.exports = {
	getPackageKey: function(packageId){
		return 'package_' + utils.hash(packageId);
	},

	getPackageData: async function(packageId){
		let key = this.getPackageKey(packageId);
		let ecryptedData = await client.getAsync(key);
		
		return JSON.parse(utils.decrypt(ecryptedData));
	},

	setPackageData: async function(packageId, packageData){
		if(
			!packageData.packageId 
			|| !packageData.jwtSecret 
			|| !packageData.apiClientId 
			|| !packageData.apiClientSecret 
			|| !packageData.appUrl
		){
			throw 'Package data is incomplete';
		}

		let key = this.getPackageKey(packageId);
		let exists = await client.existsAsync(key);
		
		if(exists){
			let existingData = await this.getPackageData(packageId);

			if(existingData.jwtSecret != packageData.jwtSecret
				|| existingData.apiClientId != packageData.apiClientId
				|| existingData.apiClientSecret != packageData.apiClientSecret){
					throw 'Package already exists and update validation failed';
			}
		}

		let result = await client.setAsync(key, utils.encrypt(packageData));

		return result;
	}
}