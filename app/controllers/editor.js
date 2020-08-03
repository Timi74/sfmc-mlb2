const express = require('express');
const path = require('path');
const utils = requireRoot('modules/utils');
const router = express.Router();
const editorApi = requireRoot('modules/editor-api');

/* Workaround for the block icon issue */
router.get(/.*(drag)?icon\.png$/i, async function (req, res) {
	let iconFile = path.parse(req.originalUrl).base;

	res.redirect('/public/img/' + iconFile);
});

router.get('/:package([-\\w]+)/', async function (req, res, next) {
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
		
		res.redirect('/login/' || req.params.package);
		return;
	} catch (err) {
		next({
			type: 'MLB_NOT_INITIALIZED',
			details: err
		});
	}
});

router.post('/api/:action([\\w]+)', async function (req, res) {
	try {
		editorApi[req.params.action](req, res);
	} catch (err) {
		next({
			type: 'MLB_API_FAILED',
			details: err
		});
	}
});

module.exports = router;