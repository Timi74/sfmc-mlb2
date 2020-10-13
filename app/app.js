const config	= requireRoot('config');
const express 	= require('express');
const app 		= express();
const bodyParser = require('body-parser');
const redis = require("redis");
const session = require('express-session');
const client = redis.createClient(config.redisConnection);
const RedisStore = require('connect-redis')(session);													 

app.set('view engine', 'pug');
app.set('views', rootPath + '/app/views');

app.use('/public', express.static('public'));
app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(function (err, req, res, next) {
	if (err) {
		res.send(JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
		res.end();
	} else {
		next();
	}
})

app.set('trust proxy', 1) // trust first proxy

app.use(session({
	store: new RedisStore({
		client: client,
		prefix: 'session_',
		ttl: 50000
	}),
	secret: config.sessionSecret,
	resave: false,
	saveUninitialized: false,
	ttl: 50000,
	cookie: {
		secure: config.sessionIsSecure,
		sameSite : 'none'
	}
}));

/* Declare controllers */
app.use('/editor', requireRoot('controllers/editor'));
app.use('/login', requireRoot('controllers/login'));
app.use('/init', requireRoot('controllers/init'));

app.listen(config.serverPort, function() {
	console.log('Application started: ' + (new Date()));
});