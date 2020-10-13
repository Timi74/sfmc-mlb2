function toggleValue(prod, dev){
	return (process.env.NODE_ENV === 'production' ? prod : dev);
};

module.exports = {
	isProduction:        toggleValue(true, false),
	serverPort:          toggleValue(process.env.PORT, 8080),
	encryptionKey:       toggleValue(process.env.ENCRYPTION_KEY, 'Y1xyS$R*b$qp7x3RY1xyS$R*b$qp7x3R'),
	encryptionIV:        toggleValue(process.env.ENCRYPTION_IV, '9wk&c&7HQPNn#68v'),
	hashSalt:            toggleValue(process.env.HASH_SALT, 'qwerty'),
	redisConnection:     toggleValue(process.env.REDIS_URL, null),
	sessionSecret:       toggleValue(process.env.SESSION_SECRET, 'qwerty'),
	sessionIsSecure:     true//toggleValue(true, false),
}