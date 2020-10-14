const sfmc         = require('sfmc-nodesdk');
const querystring  = require('querystring');
const url          = require('url');
const utils        = requireRoot('modules/utils');
const mcutils      = requireRoot('modules/mc-utils');
const config       = requireRoot('config');
const db           = requireRoot('modules/db');

module.exports = {
    getLocales: async function(req, res){

        let data = await sfmc.dataextension.getRows({
            dataextensionKey: 'MLB_SYS_CountryLanguage', 
            mid: res.locals.mid,
            columns: ['Country', 'Language']
        });
        data.rows.forEach((e) => { e["_CustomObjectKey"] = e.Country + '-' + e.Language; });
        res.json(data.rows);
    },
    
    getBlockList: async function(req, res){
        
        let data = await sfmc.dataextension.getRows({
            dataextensionKey: 'MLB_SYS_Blocks',
            mid: res.locals.mid,
            columns: ['ContentBlockKey', 'Name', 'Dataextension'],
        });
        res.json(data.rows);
    },
    
    getBlockFields: async function(req, res){
        
        let payload = JSON.parse(req.body.payload);
        let fieldsMeta = {};
        let result = [];
        let excludedFields = {
            "contentkey":         true, 
            "country":            true, 
            "language":           true,
            "contentdescription": true
        };
    
        let fieldsPromise = sfmc.dataextension.getRows({
            dataextensionKey: 'MLB_SYS_BlockFields',
            mid: res.locals.mid,
            columns: ['ContentBlockKey', 'ColumnName', 'Order', 'Label', 'Type'],
            filter: {
                Property:          'ContentBlockKey',
                SimpleOperator:    'equals',
                Value:             payload.ContentBlockKey
            }
        });
        
        let dataextensionName = await mcutils.getDataextensionByBlock(res.locals.mid, payload.ContentBlockKey);
    
        let columnsPromise = sfmc.dataextension.getColumns({
            dataextensionKey: dataextensionName,
            mid: res.locals.mid
        });
    
        let fields = await fieldsPromise;

        let columns = await columnsPromise;
    
        fields.rows.forEach((e) => {
            fieldsMeta[e.ColumnName.toLowerCase()] = e;
            result.push(e);
        });
    
        fields.rows.sort(function(a, b){ return parseInt(a.Order) - parseInt(b.Order); });
    
        columns.sort(function(a, b){ return parseInt(a.Ordinal) - parseInt(b.Ordinal); });
    
        columns.forEach((c) => {
            if(excludedFields[c.Name.toLowerCase()]) return true;
    
            if(fieldsMeta[c.Name.toLowerCase()]){
                fieldsMeta[c.Name.toLowerCase()].IsRequired = (c.IsRequired.toLowerCase() == 'true');
                return true;
            }
    
            result.push({
                ContentBlockKey:  payload.ContentBlockKey,
                ColumnName:       c.Name,
                Order:            100 + parseInt(c.Ordinal),
                Label:            c.Name,
                Type:             utils.getFieldType(c.Name, c.FieldType, c.MaxLength),
                IsRequired:       (c.IsRequired.toLowerCase() == 'true'),
                Description:      ''
            });
        });
    
        res.json(result);
    },
    
    getContent: async function(req, res){
        let payload = JSON.parse(req.body.payload);
    
        let dataextensionName = await mcutils.getDataextensionByBlock(res.locals.mid, payload.ContentBlockKey);
    
        let fieldsRows = await sfmc.dataextension.getRows({
            dataextensionKey: dataextensionName, 
            mid: res.locals.mid,
            filter: utils.getContentFilter(payload.ContentKey, payload.Country, payload.Language)
        });
        
        payload.Fields = {};
    
        if(fieldsRows.rows && fieldsRows.rows.length > 0){
            for(var p in fieldsRows.rows[0]){
                let val = fieldsRows.rows[0][p];
                
                /* processing link aliases */
                if(res.locals.token.linkAliasParameterName && val.indexOf('http') == 0){
					let substInit = new RegExp("\%\%", "g");
					let substRecover = new RegExp("__AMPSCRIPT-SUBSTITUTION__", "g");

					val = val.replace(substInit, "__AMPSCRIPT-SUBSTITUTION__");

                    let link = new url.URL(val);
                    let alias = link.searchParams.get(res.locals.token.linkAliasParameterName);
                    link.searchParams.delete(res.locals.token.linkAliasParameterName);
                    
                    val = link.href.replace(substRecover, "%%");
                    payload.Fields[p + '-trackingalias'] = alias;
                }
                payload.Fields[p] = val;
            }
        }
    
        res.json(payload);
    },
    
    setContent: async function(req, res){
        let payload = JSON.parse(req.body.payload);
    
        let dataextensionName = await mcutils.getDataextensionByBlock(res.locals.mid, payload.ContentBlockKey);
        
        payload.ContentKey = payload.ContentKey || utils.guid();
    
        let row = {
            ContentKey:  payload.ContentKey,
            Country:     payload.Country,
            Language:    payload.Language
        };
    
        let aliases = {};

        for(let p in payload.Fields){
            row[p] = utils.unescapeHtml(payload.Fields[p]);
            if(p.indexOf('-trackingalias') > 0 && payload.Fields[p]){
                aliases[p.replace('-trackingalias', '')] = payload.Fields[p];
            }
        }

        /* processing link aliases */
        if(res.locals.token.linkAliasParameterName){
            for(let f in aliases){
                if(!row[f] || row[f].indexOf('http') != 0) continue;
				
                //let separator = (row[f].indexOf('?') > 0 ? "&" : "?");
                //row[f] += separator + res.locals.token.linkAliasParameterName + "=" + querystring.escape(aliases[f]);
				let substInit = new RegExp("\%\%", "g");
				let substRecover = new RegExp("__AMPSCRIPT-SUBSTITUTION__", "g");

                let link = new url.URL(row[f].replace(substInit, "__AMPSCRIPT-SUBSTITUTION__"));
                link.searchParams.set(res.locals.token.linkAliasParameterName, aliases[f]);
                row[f] = link.href.replace(substRecover, "%%");
            }
        }
    
        let result = await sfmc.dataextension.updateRows({
            dataextensionKey: dataextensionName,
            mid: res.locals.mid,
            rows: [row]
        });
    
        res.json(payload);	
    },
    
    getHtml: async function(req, res){
		let data = null;
		
		try{
			if(!res.locals.token.ampscriptUrl){
				res.json({
					content: '<h1 style="color: #888888; text-align: center;">Html Preview Page is not configured for this BU</h1>'
				});
				return;
			}

			let payload = JSON.parse(req.body.payload);
		
			payload.AmpscriptToken = res.locals.token.ampscriptToken;
            
            data = utils.executeHttpCall(
                res.locals.token.ampscriptUrl,
				'POST',
				querystring.stringify({
					payload: JSON.stringify(payload)
				}),
				{
					'Accept-Encoding': 'identity',
					'Content-Type': 'application/x-www-form-urlencoded'
				}
            );

		}
		catch(err){
			data = {
				status: "ERROR",
				message: JSON.stringify(
					err,
					Object.getOwnPropertyNames(err),
					2
				)
			};
		}


        res.json(data);
    },
    
    getAssets: async function(req, res){
        let payload = JSON.parse(req.body.payload);
        let search = payload && payload.search ? payload.search : '%';
        let result = [];
        let foldersPromise = [];

        let leftOperand = {
            "property": "name",
            "simpleOperator": "like",
            "value": search
        };

        if(payload && payload.mode == 'folders'){
            payload.search = payload.search || 0;
            leftOperand = {
                "property": "category.id",
                "simpleOperator": "equals",
                "value": payload.search
            };

            let folderRequestParams = querystring.stringify({
                '$pagesize': 100,
                '$filter': 'parentId eq ' + payload.search
            });
            
            foldersPromise = sfmc.core.restExecute({
               endpoint: 'asset/v1/content/categories?' + folderRequestParams,
               method: 'GET' 
            });
        }

        let filesPromise = sfmc.core.restExecute({
            endpoint: 'asset/v1/content/assets/query',
            method: 'POST',
            body: {
                "page": {
                    "page": 1,
                    "pageSize": 30
                },
                "sort": [{
                    "property": "modifiedDate",
                    "direction": "desc"
                }],
                "fields": ["fileProperties"],
                "query": {
                    "leftOperand": leftOperand,
                    "logicalOperator": "AND",
                    "rightOperand": {
                        "property": "assetType.id",
                        "simpleOperator": "in",
                        "value": [20, 21, 22, 23, 28]
                    }
                }
            }
        });
        
        let files = await filesPromise;
        let folders = await foldersPromise;

        if(folders && folders.items){

            for(var i = 0; i < folders.items.length; i++){
                var item = folders.items[i];
                var folder = {
                    name: item.name,
                    id: item.id,
                    isFolder: true
                };

                result.push(folder);

            }
        }

        if(files && files.items){
            for(var i = 0; i < files.items.length; i++){
                var item = files.items[i];
                result.push({
                    name: item.name,
                    url: item.fileProperties.publishedURL,
                    width: item.fileProperties.width,
                    height: item.fileProperties.height
                });
            }
        }
    
        res.json(result);
    },

    getEmails: async function(req, res){
        let payload = JSON.parse(req.body.payload);
        let search = payload && payload.search ? payload.search : '%';
        let result = [];
    
        let data = await sfmc.core.restExecute({
            endpoint: 'asset/v1/content/assets/query',
            method: 'POST',
            body: {
                "page": {
                    "page": 1,
                    "pageSize": 30
                },
                "sort": [{
                    "property": "modifiedDate",
                    "direction": "desc"
                }],
                "fields": ["fileProperties"],
                "query": {
                    "leftOperand": {
                        "property": "name",
                        "simpleOperator": "like",
                        "value": search
                    },
                    "logicalOperator": "AND",
                    "rightOperand": {
                        "property": "assetType.id",
                        "simpleOperator": "in",
                        "value": [207]
                    }
                }
            }
        });
        
        res.json(data);  
    },

    getAssetByID: async function(id){
        let data = await sfmc.core.restExecute({
            uri: 'asset/v1/content/assets/' + id,
            method: 'GET'
        });

        return data;
    },

    getTranslationCSV: async function(req, res){
        let payload = JSON.parse(req.body.payload);
        let email = await this.getAssetByID(payload.emailID);
        let slots = email.views.html.slots;
        
        let result = {};
        let contentRows = [];
        let csvColumns = {Country: true, Language: true};


        let excludedFields = {
            "contentkey":         true, 
            "country":            true, 
            "language":           true,
            "contentdescription": true
        };

        for(let slotName in slots){
            let slot = slots[slotName];
            for(let blockName in slot.blocks){
                let block = slot.blocks[blockName];
                if(block.meta && block.meta.options && block.meta.options.customBlockData && block.meta.options.customBlockData.contentKey){
                    let meta = block.meta.options.customBlockData;

                    let dataextensionKey = await mcutils.getDataextensionByBlock(res.locals.mid, meta.contentBlockKey);
    
                    let rows = await sfmc.dataextension.getRows({
                        dataextensionKey: dataextensionKey, 
                        mid: res.locals.mid,
                        filter: {
                            Property:          'ContentKey',
                            SimpleOperator:    'equals',
                            Value:             meta.contentKey				
                        }
                    });

                    for(let i = 0; i < rows.rows.length; i++){
                        let row = rows.rows[i];
                        let contentRow = {
                            Country: '',
                            Language: ''
                        };

                        //fix for the wrong case of column names
                        for(let c in row){
                            if(c.toLowerCase() == 'country') contentRow['Country'] = row[c];
                            if(c.toLowerCase() == 'language') contentRow['Language'] = row[c];
                        }


                        result[contentRow['Country'] + '_' + contentRow['Language']] = {};

                        for(let col in row){
                            if(excludedFields[col.toLowerCase()]) continue;

                            let csvColumnName = meta.contentBlockKey + '::' + col + '::' + meta.contentKey;
                            
                            csvColumns[csvColumnName] = true;
                            contentRow[csvColumnName] = row[col];
                        }

                        contentRows.push(contentRow);
                    }
                }
            }
        }
        
        for(let i = 0; i < contentRows.length; i++){
            let contentRow = contentRows[i];
            let resultRow = result[contentRow['Country'] + '_' + contentRow['Language']];

            if(!resultRow._isInitialized){
                for(let csvColumn in csvColumns) resultRow[csvColumn] = '';
                resultRow._isInitialized = true;
            }
            
            for(let csvColumn in csvColumns) {
                if(contentRow[csvColumn]) resultRow[csvColumn] = contentRow[csvColumn];
            }
        }

        result.contentRows = contentRows;


        res.json(result);
    }
};