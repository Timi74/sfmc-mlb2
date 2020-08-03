function toggleValue(prod, dev){
	return (process.env.NODE_ENV === 'production' ? prod : dev);
};

module.exports = {
	serverPort:          toggleValue(process.env.PORT, 8080),
	redisConnection:     toggleValue(process.env.REDIS_URL, null),
	sessionSecret:       toggleValue(process.env.SESSION_SECRET, 'qwerty'),
	sessionIsSecure:     false//toggleValue(true, false),
}