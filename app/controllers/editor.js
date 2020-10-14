const express = require('express');
const sfmc = require('sfmc-nodesdk');
const path = require('path');
const utils = requireRoot('modules/utils');
const editorApi = requireRoot('modules/editor-api');
const router = express.Router();

/* Workaround for the block icon issue */
router.get(/.*(drag)?icon\.png$/i, async function (req, res) {
	let iconFile = path.parse(req.originalUrl).base;

	res.redirect('/public/img/' + iconFile);
});

router.get('/:package([-\\w]+)/:mid([-\\w]+)/', async function (req, res, next) {
	try {		
		if (req.session.token) {
			let token = JSON.parse(utils.decrypt(req.session.token));
			let now = new Date().getTime();
			let expiresOn = new Date(token.expiresOn).getTime();

			//If token is alive for at least next 20 minutes
			if (expiresOn > now + 20 * 60 * 1000) {
				res.redirect('/public/html/editor.html');
				return;
			}
		}
		
		res.redirect('/login/' + req.params.package + '/' + req.params.mid + '/' );
		return;
	} catch (err) {
		next({
			type: 'MLB_NOT_INITIALIZED',
			details: err
		});
	}
});

router.post('*', function (req, res, next) {
	/*try {*/
		let token = JSON.parse(utils.decrypt(req.session.token));

		sfmc.core.init({
			token: token,
			soapBaseUrl: token.soap_instance_url,
			restBaseUrl: token.rest_instance_url
		});

		res.locals.token = token;
		res.locals.mid = token.businessUnit;

		next();
	/*} catch (err) {
		next({
			type: 'MLB_SESSION_CORRUPTED'
		});
	}*/
});

router.post('/api/:action([\\w]+)', async function (req, res) {
	/*try {*/
		console.log(JSON.stringify(token));

		editorApi[req.params.action](req, res);
	/*} catch (err) {
		next({
			type: 'MLB_API_FAILED',
			details: err
		});
	}*/
});

/* Error handling */
router.use(function (err, req, res, next) {
	let error = {
		status: 'ERROR',
		message: 'UNKNOWN_ERROR'
	};

	if (err) {
		let details = (typeof err == 'object' ? JSON.stringify(err, Object.getOwnPropertyNames(err), 2) : err);

		error = {
			status: 'ERROR',
			details: details
		};
	}

	res.json(error);
});

module.exports = router;