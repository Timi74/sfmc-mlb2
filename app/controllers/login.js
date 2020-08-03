const express  = require('express');
const config   = requireRoot('config');
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
	res.end();
}

module.exports = router;