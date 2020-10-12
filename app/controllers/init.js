const express = require('express');
const db      = requireRoot('modules/db');

const router  = express.Router();

router.post('/package/', async function(req, res){
	let result = '';

	
	let packageData = {
		packageId:        req.body.package,
		jwtSecret:        req.body.jwt_secret,
		apiClientId:      req.body.client_id,
		apiClientSecret:  req.body.client_secret,
		appUrl:           req.body.mcapp_url,
		entrepriseId:     req.body.entrepriseId,
		ampscriptUrls:    {}
	};

	if(req.body.ampscript_endpoints){
		let lines = req.body.ampscript_endpoints.trim().split(/\r?\n/);
		lines.forEach(l => {
			let params = l.split('-');
			if(params && params.length == 2 && params[0].trim() && params[1].trim()){
				packageData.ampscriptUrls['C' + params[0].trim()] = params[1].trim();
			}
		});
	}

	try{
		result = await db.setPackageData(packageData.packageId, packageData);
	}
	catch(err){
		result = err;
	}

	res.end(result);
});


module.exports = router;