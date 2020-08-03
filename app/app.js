const config	= requireRoot('config');
const express 	= require('express');
const app 		= express();

app.set('view engine', 'pug');
app.set('views', rootPath + '/app/views');


/* Declare controllers */
app.use('/editor', requireRoot('controllers/editor'));
app.use('/login', requireRoot('controllers/login'));

app.listen(config.serverPort, function() {
	console.log('Application started: ' + (new Date()));
});