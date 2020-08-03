const express = require('express');
const path = require('path');
const sfmc     = require('sfmc-nodesdk');
var blocksdk = require('blocksdk');
const router = express.Router();


router.get('/:package([-\\w]+)/', async function (req, res, next) {
	try {
		
		var response = await sfmc.httpLayer.executeHttpCall({uri:"https://mct5rqj2m5hmqwlh05v-qstxmh9m.auth.marketingcloudapis.com/v2/authorize?response_type=code&client_id=pz1titr5p832x7uxqywrkr8v&redirect_uri=https%3A%2F%2Fsfmc-amer.herokuapp.com%2Feditor%2F36f68e83-28dd-4c8c-b58e-4b9bdd12dced%2F&scope=email_read%20email_write%20data_extensions_read%20data_extensions_write&state=mlb_editor", 
		method:"POST"});
		);
		
		console.log(response);
		return;
	} catch (err) {
		next({
			type: 'MLB_NOT_INITIALIZED',
			details: err
		});
	}
});


module.exports = router;