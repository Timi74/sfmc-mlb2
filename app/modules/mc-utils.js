const sfmc  = require('sfmc-nodesdk');
const utils = requireRoot('modules/utils');

module.exports = {
    getDataextensionByBlock: async function(mid, contentBlockKey){
        let dataextensionRows = await sfmc.dataextension.getRows({
            dataextensionKey: 'MLB_SYS_Blocks',
            columns: ['Dataextension'],
            mid: mid,
            filter: {
                Property:          'ContentBlockKey',
                SimpleOperator:    'equals',
                Value:             contentBlockKey
            }
        });
    
        if(!dataextensionRows.rows || dataextensionRows.rows.length != 1){
            throw new Error('Unable to find a Dataextension name for this block');
        }
    
        return dataextensionRows.rows[0].Dataextension;
    },

    createAmpscriptToken: async function(mid){
        let token = utils.guid();
        let expiration = new Date();
        expiration.setTime(expiration.getTime() + (12*60*60*1000));

        await sfmc.dataextension.updateRows({
            dataextensionKey: 'MLB_SYS_AmpscriptTokens',
            mid: mid,
            rows: [
                { Token: token, ExpirationDate: expiration.toISOString() }
            ]
        });

        return token;
    }
}