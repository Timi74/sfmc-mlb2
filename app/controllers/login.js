const express = require('express');
const path = require('path');
const sfmc     = require('sfmc-nodesdk');
var blocksdk = require('blocksdk');
const router = express.Router();


router.get('/:package([-\\w]+)/', async function (req, res, next) {
	try {
		var sdk = new SDK();
		sdk.triggerAuth2({authURL:"https://mct5rqj2m5hmqwlh05v-qstxmh9m.auth.marketingcloudapis.com/",
		                  clientID:"pz1titr5p832x7uxqywrkr8v",
						  redirectURL:"https://sfmc-amer.herokuapp.com/editor/36f68e83-28dd-4c8c-b58e-4b9bdd12dced/",
						  scope:["email_read","email_write","data_extensions_read","data_extensions_write"],
						  state: "mbl_editor"});
		
		/*res.redirect('/public/html/editor.html');*/
		return;
	} catch (err) {
		next({
			type: 'MLB_NOT_INITIALIZED',
			details: err
		});
	}
});


module.exports = router;