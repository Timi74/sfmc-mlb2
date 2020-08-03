const express = require('express');
const path = require('path');
const router = express.Router();


router.get('/:package([-\\w]+)/', async function (req, res, next) {
	try {
		res.redirect('/public/html/editor.html');
		return;
	} catch (err) {
		next({
			type: 'MLB_NOT_INITIALIZED',
			details: err
		});
	}
});


module.exports = router;