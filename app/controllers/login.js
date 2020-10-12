const express = require('express');
const path = require('path');
const sfmc     = require('sfmc-nodesdk');
const db       = requireRoot('modules/db');
const router = express.Router();


router.get(/:package([-\\w]+)/, async function (req, res) {
	try {
		
		let packageId = jwtDataUnsafe.request.application.id;
		let packageData = await db.getPackageData(packageId);

		sfmc.core.init({clientID: packageData.apiClientId, clientSecret: packageData.apiClientSecret, authBaseUrl:packageData.authBaseUrl, mid: packageData.mid });

		let token = await sfmc.core.getToken();
		token.businessUnit = packageData.mid;
		token.entrepriseId = packageData.entrepriseId
		
		let promiseAmpscriptToken  = mcutils.createAmpscriptToken(token.businessUnit);
		let promiseConfigRows      = sfmc.dataextension.getRows({
            dataextensionKey: 'MLB_SYS_Config', 
			columns: ['HtmlPreviewEndpoint', 'LinkAliasParameterName'],
			mid: token.enterpriseId,
            filter: {
				Property:          'BusinessUnit',
				SimpleOperator:    'equals',
				Value:             token.businessUnit
		}	
        });

		let configRows                  = await promiseConfigRows;
		token.ampscriptToken            = await promiseAmpscriptToken;
		token.ampscriptUrl              = (configRows.length ? configRows[0]['HtmlPreviewEndpoint'] : null);
		token.linkAliasParameterName    = (configRows.length ? configRows[0]['LinkAliasParameterName'] : null);

		req.session.token = utils.encrypt(token);

		res.redirect('/public/html/editor.html');

	} catch (err) {
		res.end(err.toString());
	}

	res.end();
});
module.exports = router;