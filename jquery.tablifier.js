/* 
 * Permite la visualización de una tabla con categorías y subcategorías agregables
 * Clasificación de los datos
 *      Categoría
 *          Subcategoría
 *              Campo
 *              
 * Ejemplo: 
    {
        "headers":{
            "categories":[
                {
                    "id": "plate",
                    "label": "Placa",
                    "type": "string",
                    "state": "closed"
                },{
                    "id": 2,
                    "label": "Gastos",
                    "subcategories": [
                        {
                            "id": 1,
                            "label": "Mantenimiento",
                            "fields": [
                                {
                                    "id": 1,
                                    "name": "Preventivo Mayor"
                                },
                                {
                                    "id": 2,
                                    "name": "Preventivo Menor"
                                },
                                ...
                            ]
                        }
                    ]
                }

            ]
        }
        "data":[
            {
                "id": 12,                           # Id del objeto fila
                "categories":[
                    ...,
                    {
                        "id": "plate",              # Permite id's no numéricos
                        "value": "AAA000",          # Valor que se muestra cuando no hay subcategorías
                    },
                    {
                        "id": 2,
                        "value": 100,               # Valor que se muestra cuando se ocultan las subcategorías
                        "subcategories": [
                            {
                                "id": 1,
                                "sumarized": 100,   # Valor que se muestra cuando se ocultan los campos
                                "fields": [
                                    {
                                        "id": 1,
                                        "value": 12345
                                    },
                                    {
                                        "id": 2,
                                        "value": 12345
                                    },
                                    ...
                                ]
                            }
                        ]
                    },
                    ...
            },
            ...
        ]
    }
 */



/*Tablifier Plugin v.0.1 (https://github.com/maparrar/tablifier)
 *Apr 2017
 * - maparrar: maparrar (at) gmail (dot) com
 * 
 * options:
 **/
;(function($){
    
    
    /**
     * Create the plugin for each element provided by JQuery and allow use the
     * public functions over an specified element
     * @param {object} userOptions Options provided by the user
     * @param {function} callback function to execute after the data was loaded
     * */
    $.fn.tablifier=function(userOptions,callback){
        return this.each(function() {
            init($(this),userOptions,callback);
        });
    };
    
    /**
     * Initialize each element of the selector
     * @param {element} elem DOM Element that will be applied the plugin
     * @param {object} userOptions Options provided by the user
     * @param {function} callback function to execute after the data was loaded
     */
    function init(elem,userOptions,callback){
        var self={};
        let date = new Date();
        //Defines the size of a set of objects
        Object.size = function(obj) {
            var size = 0, key;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) size++;
            }
            return size;
        };
        
        //Options default variables
        var def = {
            fileName: `reporte_${date.getDate()}_${date.getMonth()}_${date.getFullYear()}.xls`,
            decimals: 2,
            number_decimals: 0,
            double_decimals: 2,
            styles:{
                table:  "table table-bordered table-hover table-responsive",
                head:   "thead-inverse",
                body:   ""
            }
        };
        //Prepare the data
        var opts=$.extend(def,userOptions);
        self.title=userOptions.title;
        self.categories=userOptions.categories;
        self.data=userOptions.data;
        self.div=elem;
        self.decimals=opts.decimals;
        self.number_decimals=opts.number_decimals;
        self.double_decimals=opts.double_decimals;
        self.buttons=opts.buttons;
        self.events=opts.events;
        self.fileName=opts.fileName;
        
        prepareData(self);
        
        //Draw an empty table
        drawTable(self,opts.styles);
        
        //Draw the headers and data
        redraw(self);
        
        //Attach table events
        attachTableEvents(self);

        startFilter(self.div[0].id);
        

    };
    
    /**************************************************************************/
    /****************************** M E T H O D S *****************************/
    /**************************************************************************/
    
    /**
     * Redraw the table
     * @param {object} self This object
     */
    function redraw(self){
        if(self.categories){
            //Draw headers with the categories
            drawHeaders(self,self.div.find('.tf_head'),self.categories);
            
            //Draw the data
            drawData(self);
            
            //Attach events to the table
            attachEvents(self);
        }
    };
    
    /**
     * Prepare data, stores paren id's in classifiers
     * @param {object} self This object
     * @returns {object}Categories with extra info
     */
    function prepareData(self){
        for(var i in self.categories){
            if(!self.categories[i].state){
                self.categories[i].state='closed';
            }
            if(!self.categories[i].type){
                self.categories[i].type='numeric';
            }
            if(self.categories[i].subcategories){
                for(var j in self.categories[i].subcategories){
                    self.categories[i].subcategories[j].parent_id=self.categories[i].id;
                    if(!self.categories[i].subcategories[j].state){
                        self.categories[i].subcategories[j].state='closed';
                    }
                    if(!self.categories[i].subcategories[j].type){
                        self.categories[i].subcategories[j].type='numeric';
                    }
                    if(self.categories[i].subcategories[j].fields){
                        for(var k in self.categories[i].subcategories[j].fields){
                            self.categories[i].subcategories[j].fields[k].parent_id=self.categories[i].subcategories[j].id;
                            if(!self.categories[i].subcategories[j].fields[k].type){
                                self.categories[i].subcategories[j].fields[k].type='numeric';
                            }
                        }
                    }
                }
            }
        }
    };
    
    /**
     * Attach events to the table
     * @param {object} self This object
     */
    function attachTableEvents(self){
        self.div.find('.export_to_excel').click(function(){
            toExcel($(this).attr('data-table-export'), self);
        });
        self.div.find('.tf_expand').click(function(){
            var expand=self.div.find('.tf_open');
            expand.each(function(){
                var id=$(this).attr('data-classifier-id');
                var type=$(this).attr('data-classifier-type');
                var parentId=$(this).attr('data-parent-id');
                toggleClassifier(self,type,id,'open',parentId);
            });
            expand=self.div.find('.tf_open');
            expand.each(function(){
                var id=$(this).attr('data-classifier-id');
                var type=$(this).attr('data-classifier-type');
                var parentId=$(this).attr('data-parent-id');
                toggleClassifier(self,type,id,'open',parentId);
            });
        });
        self.div.find('.tf_collapse').click(function(){
            var expand=self.div.find('.tf_close');
            expand.each(function(){
                var id=$(this).attr('data-classifier-id');
                var type=$(this).attr('data-classifier-type');
                var parentId=$(this).attr('data-parent-id');
                toggleClassifier(self,type,id,'close',parentId);
            });
        });
        
        //Add extra buttons events
        for(var i in self.buttons){
            var button=self.div.find('#'+self.buttons[i].id);
            if(self.buttons[i].action&&self.buttons[i].active){
                button.click(self.buttons[i].action);
            }
        }
    };
    
    /**
     * Attach events to the buttons
     * @param {object} self This object
     */
    function attachEvents(self){
        self.div.find('.tf_close').click(function(){
            var id=$(this).attr('data-classifier-id');
            var type=$(this).attr('data-classifier-type');
            var parentId=$(this).attr('data-parent-id');
            toggleClassifier(self,type,id,'close',parentId);
        });
        self.div.find('.tf_open').click(function(){
            var id=$(this).attr('data-classifier-id');
            var type=$(this).attr('data-classifier-type');
            var parentId=$(this).attr('data-parent-id');
            toggleClassifier(self,type,id,'open',parentId);
        });
        
        //Add extra events passed by parameter
        for(var i in self.events){
            var event=self.events[i];
            var elem=self.div.find("."+event.class);
            elem.click(event.action);
        }
    };
    
    /**
     * Open or close an classifier
     * @param {object} self This object
     * @param {string} type Type of classifier (category, subcategory)
     * @param {string} id Identifier of classifier (int or string)
     * @param {string} action open or close
     * @param {int} parentId Parent if apply
     */
    function toggleClassifier(self,type,id,action,parentId){
        var state='closed';
        if(action==='open'){
            state='opened';
        }
        for(var i in self.categories){
            if(type==='category'&&id==self.categories[i].id){
                self.categories[i].state=state;
                break;
            }
            if(self.categories[i].subcategories){
                for(var j in self.categories[i].subcategories){
                    if(type==='subcategory'&&id==self.categories[i].subcategories[j].id&&parentId==self.categories[i].id){
                        self.categories[i].subcategories[j].state=state;
                        break;
                    }
                }
            }
        }
        redraw(self);
    };
    
    /**************************************************************************/
    /************************ D R A W   M E T H O D S *************************/
    /**************************************************************************/
    
    /**
     * Draw the headers in the table
     * @param {object} self This object
     */
    function drawHeaders(self){
        self.div.find('.tf_categories').empty();
        self.div.find('.tf_subcategories').empty();
        self.div.find('.tf_fields').empty();
        for(var i in self.categories){
            drawCategory(self,self.categories[i]);
        }
    };
    
    /**
     * Draw a category in the table
     * @param {object} self This object
     * @param {object} category Category to classify
     */
    function drawCategory(self,category){
        var rowElem=self.div.find('.tf_categories');
        rowElem.append(htmlClassifier('category',category,Object.size(category.subcategories)));
        if(category.subcategories&&category.state==='opened'){
            for(var i in category.subcategories){
                var subcategory=category.subcategories[i];
                drawSubcategory(self,subcategory);
            }
        }
    };
    
    /**
     * Draw a subcategory in the table
     * @param {object} self This object
     * @param {object} subcategory Subcategory to classify
     */
    function drawSubcategory(self,subcategory){
        var rowElem=self.div.find('.tf_subcategories');
        rowElem.append(htmlClassifier('subcategory',subcategory,Object.size(subcategory.fields)));
        if(subcategory.fields&&subcategory.state==='opened'){
            //Update the parent colspan
            updateColspan(self.div.find('#category_'+subcategory.parent_id),Object.size(subcategory.fields)-1);
            for(var i in subcategory.fields){
                var field=subcategory.fields[i];
                drawField(self,field);
            }
        }
    };
    
    /**
     * Draw a subcategory in the table
     * @param {object} self This object
     * @param {object} field Field to classify
     */
    function drawField(self,field){
        var rowElem=self.div.find('.tf_fields');
        rowElem.append(htmlClassifier('field',field,0));
    };
    
    /**
     * Update a colspan for a classifier
     * @param {element} elem Header element
     * @param {int} addColumns Columns to add to colspan classifier
     */
    function updateColspan(elem,addColumns){
        var colspan=parseInt(elem.attr('colspan'))+addColumns;
        elem.attr('colspan',colspan);
    };
    
    /**
     * Draw the data in the table
     * @param {object} self This object
     */
    function drawData(self){
        self.div.find('.tf_body').empty();
        for(var i in self.data){
            var row=getVisibleData(self,self.data[i]);
            self.div.find('.tf_body').append(htmlRow(self,self.data[i].id,row));
        }
    };
    
    /**
     * Returns the visible data for a data row based in the visible classifiers
     * @param {object} self This object
     * @param {object} object Object with the data
     * @returns {array} Array with the visible data for the row
     */
    function getVisibleData(self,object){
        var row=[];
        for(var i in self.categories){
            var category=self.categories[i];
            row.push.apply(row,getVisibleCategory(category,object.categories));
        }
        return row;
    };
    
    /**
     * Returns the categories visible values in an array
     * @param {type} category Category header
     * @param {type} objCategories Row categories
     * @returns {Array} Array with the visible categories
     */
    function getVisibleCategory(category,objCategories){
        var row=[];
        for(var j in objCategories){
            var objCategory=objCategories[j];
            if(category.id===objCategory.id){
                if(category.state==='closed'||Object.size(category.subcategories)===0){
                    row.push({
                        type:category.type,
                        value:objCategory.value
                    });
                }else{
                    for(var k in category.subcategories){
                        var subcategory=category.subcategories[k];
                        var newRow=getVisibleSubcategory(subcategory,objCategory.subcategories);
                        row.push.apply(row,newRow);
                    }
                }
            }
        }
        if(row.length<=0){
            var value=0;
            if(category.type!=='numeric'){
                value="-";
            }
            if(category.state==='closed'||Object.size(category.subcategories)===0){
                row.push({type:category.type,value:value});
            }else{
                for(var k in category.subcategories){
                    if(category.subcategories[k].state==='closed'||Object.size(category.subcategories[k].fields)===0){
                        row.push({type:category.type,value:value});
                    }else{
                        for(var l=0;l<Object.size(category.subcategories[k].fields);l++){
                            row.push({type:category.type,value:value});
                        }
                    }
                }
            }
        }
        return row;
    };
    
    /**
     * Returns the subcategories visible values in an array
     * @param {type} subcategory Subcategory header
     * @param {type} objSubcategories Row subcategories
     * @returns {Array} Array with the visible subcategories
     */
    function getVisibleSubcategory(subcategory,objSubcategories){
        var row=[];
        for(var i in objSubcategories){
            var objSubcategory=objSubcategories[i];
            if(subcategory.id===objSubcategory.id){
                if(subcategory.state==='closed'||Object.size(subcategory.fields)===0){
                    row.push({
                        type:subcategory.type,
                        value:objSubcategory.value
                    });
                }else{
                    for(var j in subcategory.fields){
                        var field=subcategory.fields[j];
                        var newRow=getVisibleField(field,objSubcategory.fields);
                        row.push.apply(row,newRow);
                    }
                }
            }
        }
        if(row.length<=0){
            var value=0;
            if(subcategory.type!=='numeric'){
                value="-";
            }
            if(subcategory.state==='closed'||Object.size(subcategory.fields)===0){
                row.push({type:subcategory.type,value:value});
            }else{
                for(var i=0;i<Object.size(subcategory.fields);i++){
                    row.push({type:subcategory.type,value:value});
                }
            }
        }
        return row;
    };
    
    /**
     * Returns the fields visible values in an array
     * @param {type} field Field header
     * @param {type} objFields Row fields
     * @returns {Array} Array with the visible fields
     */
    function getVisibleField(field,objFields){
        var row=[];
        for(var i in objFields){
            var objField=objFields[i];
            if(field.id===objField.id){
                row.push({
                    type:field.type,
                    value:objField.value
                });
            }
        }
        if(row.length===0){
            var value=0;
            if(field.type!=='numeric'){
                value="-";
            }
            row.push({type:field.type,value:value});
        }
        return row;
    };
    
    /**************************************************************************/
    /************************ H T M L   M E T H O D S *************************/
    /**************************************************************************/
    
    /**
     * Draw an empty table in the object
     * @param {object} self This object
     * @param {object} styles Additional style classes to apply to table
     */
    function drawTable(self,styles){
        //Proccess additional buttons
        var stringButtons="";
        var title="";
        if(self.title){
            title=self.title;
        }
        for(var i in self.buttons){
            var disabled='';
            if(!self.buttons[i].active){
                disabled=' disabled ';
            }
            stringButtons+='<button id="'+self.buttons[i].id+'" class="btn btn-default '+self.buttons[i].class+' '+disabled+'" title="'+self.buttons[i].title+'">'+self.buttons[i].label+'</button>';
        }
        var html=
            '<h2>'+title+'</h2>'+
            '<div class="btn-group pull-right" role="group" aria-label="Botones de reporte">'+
                '<button class="btn btn-default export_to_excel" data-table-export="tf_table_'+self.div[0].id+'">Excel</button>'+
                '<button class="btn btn-default tf_expand">Expandir</button>'+
                '<button class="btn btn-default tf_collapse">Contraer</button>'+
            '</div>'+

            '<div class="row pull-left">'+
                '<div class="col-md-12">'+
                    '<input id="tf_search_'+self.div[0].id+'" type="text" class="form-control" placeholder="Buscar"/>'+
                '</div>'+
            '</div>'+

            '<div class="btn-group" role="group" aria-label="Botones de reporte">'+
                stringButtons+
            '</div>'+
            '<div class="tf_div_table">'+
                '<table id="tf_table_'+self.div[0].id+'" class="tf_table '+styles.table+'">'+
                    '<thead class="tf_head '+styles.head+'">'+
                        '<tr class="tf_categories"></tr>'+
                        '<tr class="tf_subcategories"></tr>'+
                        '<tr class="tf_fields"></tr>'+
                    '</thead>'+
                    '<tbody class="tf_body '+styles.body+'"></tbody>'+
                '</table>'+
            '</div>';
        self.div.append(html);
    };
    
    /**
     * Generate an HTML for a classifier (category, subcategory or field)
     * @param {string} type Type of classifier (category, subcategory, field)
     * @param {object} classifier Category to get
     * @param {int} children Number of subcolumns to show
     * @return {string} HTML of category
     */
    function htmlClassifier(type,classifier,children){
        var parentId=false;
        var rowspan=3;
        var colspan=1;
        var state='closed';
        var button='';
        if(classifier.state==='opened'){
            state='opened';
        }
        if(state==='opened'){
            rowspan=1;
            colspan=children;
        }else{
            if(type==='subcategory'){
                rowspan=2;
            }else if(type==='field'){
                rowspan=1;
            }
        }
        if(classifier.parent_id){
            parentId=classifier.parent_id;
        }
        if(children>0){
            if(state==='opened'){
                button='<button type="button" class="tf_change tf_close btn btn-default btn-xs" data-classifier-type="'+type+'" data-classifier-id="'+classifier.id+'" data-parent-id="'+parentId+'"><span class="glyphicon glyphicon-minus"></span></button>';
            }else{
                button='<button type="button" class="tf_change tf_open  btn btn-default btn-xs" data-classifier-type="'+type+'" data-classifier-id="'+classifier.id+'" data-parent-id="'+parentId+'"><span class="glyphicon glyphicon-plus"></span></button>';
            }
        }
        return '<th '+
                'id="'+type+'_'+classifier.id+'" '+
                'colspan="'+colspan+'" '+
                'rowspan="'+rowspan+'" '+
                'class="text-center" '+
                'data-state="'+state+'" '+
                'data-id="'+classifier.id+'"'+
                'data-parent-id="'+parentId+'"'+
            '>'+
                    button+classifier.label+
            '</th>';
    };
    
    /**
     * Return the HTML for a visible row in the table
     * @param {object} self This object
     * @param {string} id Id of the row
     * @param {array} row Row with the visible data
     * @return {string} HTML of the row
     */
    function htmlRow(self,id,row){
        var html='<tr data-id="'+id+'">';
        for(var i in row){
            var numberClass='positive';
            if(parseFloat(row[i].value)<0){
                numberClass='negative';
            }
            if(row[i].type==="numeric"){
                html+='<td data-value="'+row[i].data+'" class="text-right '+numberClass+'">'+row[i].value.toLocaleString('es-CO',{maximumFractionDigits:self.number_decimals})+'</td>';
            }else if(row[i].type==="double"){
                html+='<td data-value="'+row[i].data+'" class="text-right">'+row[i].value.toLocaleString('es-CO',{maximumFractionDigits:self.double_decimals})+'</td>';
            }else if(row[i].type==="double long"){
                html+='<td data-value="'+row[i].data+'" class="text-right">'+row[i].value.toLocaleString('es-CO',{maximumFractionDigits: 3})+'</td>';
            }else{
                html+='<td data-value="'+row[i].data+'">'+row[i].value+'</td>';
            }
        }
        return html;
    };
    
    /**
     * Exports a table to Excel
     * @param {string} tableElementId Id of the element to export
     * @param {object} self 
     */
    function toExcel(tableElementId, self){
        var topHtml = '<html><head><meta http-equiv="content-type" content="text/html; charset=utf-8"/></head><body>';
        var botHtml = '</body></html>';
        var tab_text=topHtml+"<table border='2px'>";
        var textRange; 
        var j=0;
        var htmlRow = '';
        tab = document.getElementById(tableElementId); // id of table

        for(j = 0 ; j < tab.rows.length ; j++){
            htmlRow = (j == 0)?"<tr bgcolor='#87AFC6'>":"<tr>";
            tab_text=tab_text+htmlRow+tab.rows[j].innerHTML+"</tr>";
            //tab_text=tab_text+"</tr>";
        }

        tab_text=tab_text+"</table>"+botHtml;
        tab_text= tab_text.replace(/<A[^>]*>|<\/A>/g, "");//remove if u want links in your table
        tab_text= tab_text.replace(/<img[^>]*>/gi,""); // remove if u want images in your table
        tab_text= tab_text.replace(/<input[^>]*>|<\/input>/gi, ""); // removes input params

        var ua = window.navigator.userAgent;
        var msie = ua.indexOf("MSIE "); 

        if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)){      // If Internet Explorer
            txtArea1.document.open("txt/html","replace");
            txtArea1.document.write(tab_text);
            txtArea1.document.close();
            txtArea1.focus(); 
            sa=txtArea1.document.execCommand("GuardarComo",true,"reporte.xls");
        }else if(navigator.userAgent.toLowerCase().indexOf('chrome') > -1){ // sí es Chrome
            var downloadLink = document.createElement('a');
            downloadLink.href = 'data:application/vnd.ms-excel,' + encodeURIComponent(tab_text);
            downloadLink.download = self.fileName;
            downloadLink.click();
            sa = null;
        }else{                 //other browser not tested on IE 11
            sa = window.open('data:application/vnd.ms-excel,' + encodeURIComponent(tab_text));  
        }
        return (sa);
    };
   /**
     * Start Filter from table
     */
    function startFilter(idTable){
        // Detectamos cada Tecla
        $('#tf_search_'+idTable).on('keyup', function(){
            // valor a buscar
            var query = $(this).val();
            // Empezamos a recorrer la tabla
            $('#tf_table_'+idTable).map(function(tableIndex){
                // Etiqueta Table
                var table = $(this)[tableIndex];
                // Etiqueta tbody
                var tbody = $(table).find('tbody');
                // Recorremos el cuerpo de la tabla
                tbody.map(function(tbodyIndex){
                    // Capturamos las filas 
                    var tr = $($(this)[tbodyIndex]).find('tr');
                    // Recorremos las filas
                    tr.map(function(){
                        // Capturamos la fila actual
                        var row = $(this)[0];
                        // Validamos que exista un valor a buscar en el campo search
                        // Si no existe un valor a buscar, muestra todas las filas
                        if(query.length > 0){
                            var findQuery = $(row).find('td').map(function(){
                                // return ($($(this)[0]).attr('data-value').toLowerCase().startsWith(query.toLowerCase())) 
                                return ($($(this)[0]).html().toLowerCase().startsWith(query.toLowerCase())) 
                            });
                            if(findQuery.filter(function(){ return this == true})[0]){
                                $(row).removeClass('hidden');
                            } else {
                                $(row).addClass('hidden');
                            }
                        } else {
                            $(row).removeClass('hidden');
                        }
                    })
                });
            })
        })
    }
})(jQuery);

