const config = requireRoot('config');
const crypto = require('crypto');
const http   = require('http');
const https  = require('https');
const url    = require('url');
const zlib   = require('zlib');

const encryptionAlgorithm = 'aes-256-cbc';

module.exports = {
    hash: function (input, salt) {
        if (!salt) {
            salt = config.hashSalt;
        }

        var inputString = typeof input == 'object' ? JSON.stringify(input) : input;

        return crypto.createHash('sha256').update(inputString + salt).digest('hex')
    },

    encrypt: function (input) {
        var inputString = (typeof input == 'object' ? JSON.stringify(input) : input);

        var cipher = crypto.createCipheriv(encryptionAlgorithm, config.encryptionKey, config.encryptionIV);
        var crypted = cipher.update(inputString, 'utf8', 'hex');

        crypted += cipher.final('hex');
        return crypted;
    },

    guid: function(){
        return crypto.randomBytes(16).toString("hex");
    },

    unescapeHtml: function(html){
        if(!html) return "";
        return html.replace(/{{sfdc-amp}}/g, '&').replace(/{{sfdc-lt}}/g, '<').replace(/{{sfdc-gt}}/g, '>');
    },

    decrypt: function (text) {
        var decipher = crypto.createDecipheriv(encryptionAlgorithm, config.encryptionKey, config.encryptionIV);
        var dec = decipher.update(text, 'hex', 'utf8');
        dec += decipher.final('utf8');
        return dec;
    },

    getFieldType: function(name, fieldType, maxLength){
        if(name.toLowerCase().indexOf('_image') >= 0)
            return 'IMG';
        
        if(fieldType == 'Text' && (maxLength > 1000 || !maxLength)){
            return 'TEXT_LONG';
        }

        return 'TEXT_SHORT';
    },

    getContentFilter: function(contentKey, country, language){
        return {
			logicalOperator: 'AND',
			leftOperand: {
				Property:          'ContentKey',
				SimpleOperator:    'equals',
				Value:             contentKey				
			},
			rightOperand: {
				logicalOperator: 'AND',
				leftOperand: {
					Property:          'Country',
					SimpleOperator:    'equals',
					Value:             country				
				},
				rightOperand: {
					Property:          'Language',
					SimpleOperator:    'equals',
					Value:             language
				}
			}
		};
    },

    executeHttpCall: function(uri, method, body, headers){
		var options      = url.parse(uri);
		options.method   = method;
		options.headers  = headers;

		var client = (options.protocol === 'https:' ? https : http);
		var bodyText = (typeof body == 'object' ? JSON.stringify(body) : body);

		return new Promise((resolve, reject) => {
			var req = client.request(options, (res) => {
				var chunks = [];
				
				res.on('data', (data) => { chunks.push(data); });
				res.on('end', () => {
					var buffer = Buffer.concat(chunks);

					if(res.headers['content-encoding'] == 'gzip'){
						zlib.gunzip(buffer, function(err, output){
							if(!err && res.statusCode >= 200 && res.statusCode < 300){
								resolve(output.toString());
							}
							else{
								reject(err);
							}
						});
					}
					else{
						var output = buffer.toString();;
						if(res.statusCode >= 200 && res.statusCode < 300){
							resolve(output);
						}
						else{
							reject(output);
						}
					}
				});
			});

			req.on('error', (err) => { 
				reject(err); 
			});
			
			if(bodyText){
				req.write(bodyText);
			}
			
			req.end();
		});
	}
}