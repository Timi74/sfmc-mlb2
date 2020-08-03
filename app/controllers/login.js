const express  = require('express');
const utils    = requireRoot('modules/utils');
const config   = requireRoot('config');
const mcutils  = requireRoot('modules/mc-utils');
const router   = express.Router();

router.get('/test/', function (req, res) {
	console.log(req.session.token);
	res.render('login/test.pug');
})

router.get('/:package([-\\w]+)/', async function (req, res, next) {
	try {
		console.log('Init login');
	} catch (err) {
		next({
			type: 'MLB_NOT_INITIALIZED',
			details: err
		});
	}
}

module.exports = router;