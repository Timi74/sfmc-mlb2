const express = require('express');
const path = require('path');
const sfmc     = require('sfmc-nodesdk');
var blocksdk = require('blocksdk');
const router = express.Router();


router.get('/:package([-\\w]+)/', async function (req, res, next) {
	try {
		
		res.redirect('https://mct5rqj2m5hmqwlh05v-qstxmh9m.auth.marketingcloudapis.com/v2/authorize?response_type=code&client_id=ptfdr87gnrp5z662mpytawqc&redirect_uri=https%3A%2F%2Fsfmc-amer.herokuapp.com%2Feditor%2F5647b4f8-909d-4d8f-8a5d-19940149761d%2F&scope=email_read%20email_write%20data_extensions_read%20data_extensions_write&state=mlb_editor');
		return;
	} catch (err) {
		next({
			type: 'MLB_NOT_INITIALIZED',
			details: err
		});
	}
});


module.exports = router;