const express = require('express');
const utils    = requireRoot('modules/utils');
const sfmc     = require('sfmc-nodesdk');
const db       = requireRoot('modules/db');
const mcutils  = requireRoot('modules/mc-utils');

const router = express.Router();


router.get('/:package([-\\w]+)/:mid([-\\w]+)/', async function (req, res) {
	try {
		
		let packageId = req.params.package;
		let packageData = await db.getPackageData(packageId);

		let sfmc_conf = {clientId: packageData.apiClientId, clientSecret: packageData.apiClientSecret, authBaseUrl:packageData.appUrl, mid: packageData.req.params.mid, scope: "data_extensions_read data_extensions_write documents_and_images_read" };
		sfmc.core.init(sfmc_conf);

		let token = await sfmc.core.getToken();
		token.businessUnit = req.params.mid;
		token.entrepriseId = packageData.entrepriseId;
		
		console.log(JSON.stringify(token));

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

		console.log("login ok... redirect to the editor");
		res.redirect('/public/html/editor.html');

	} catch (err) {
		res.end(err.toString());
	}

	res.end();
});
module.exports = router;