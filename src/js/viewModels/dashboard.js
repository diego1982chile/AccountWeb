/**
 * @license
 * Copyright (c) 2014, 2020, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
/*
 * Your dashboard ViewModel code goes here
 */
define(['knockout', 
        'exports',        
        'ojs/ojconverter-number', 
        'ojs/ojconverter-datetime',
        'ojs/ojvalidator-numberrange',
        'ojs/ojinputtext',
        'ojs/ojcollectiondataprovider',                
        'ojs/ojarraydataprovider',
        'ojs/ojbufferingdataprovider',        
        'ojs/ojarraytabledatasource',        
        'ojs/ojtable'
        ],
 function(ko, exports, ojconverter_number_1, ojconverter_datetime_1, NumberRangeValidator, CollectionDataProvider, ArrayDataProvider, BufferingDataProvider) {
     
    function DashboardViewModel() {
        // Below are a set of the ViewModel methods invoked by the oj-module component.
        // Please reference the oj-module jsDoc for additional information.

        var self = this;
        
         // // NUMBER AND DATE CONVERTER ////
        self.numberConverter = new ojconverter_number_1.IntlNumberConverter();
        self.dateConverter = new ojconverter_datetime_1.IntlDateTimeConverter({
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
        });
        
        self.rangeValidator = new NumberRangeValidator({ min: 100, max: 500 });
        self.validators = [self.rangeValidator];
        self.editRow = ko.observable();
        
        self.data = ko.observableArray();

        self.accountArrayDataSource = ko.computed(function () {
          
            $.getJSON("http://dnssemantikos:8080/AccountService/api/accounts/").
                then(function (accounts) {                    
                    var tempArray = [];
                    $.each(accounts, function () {
                        tempArray.push({
                            id: this.id,
                            client: this.client.name,
                            holding: this.holding.name,
                            user: this.user,
                            password: this.password,
                            company: this.company                            
                        });
                    });
                    //self.data(tempArray);
                    
                    self.data(accounts);
                    
                    //console.log(accounts);
                    //self.accountArray = JSON.parse(accounts);
                    //self.accountObservableArray = ko.observableArray(accounts);                    
                    //console.log(self.accountObservableArray);                    
                    //return new BufferingDataProvider(new BufferingDataProvider(self.accountObservableArray, {keyAttributes: "id"}));
                    //return new ArrayDataProvider(self.accountObservableArray, {keyAttributes: "id"});                               
            });     
            
            /*
            self.datasource = new BufferingDataProvider(new oj.ArrayDataProvider(
                self.data,
                {idAttribute: 'id'}
            )); 
            */
                        
            self.datasource = new oj.ArrayTableDataSource(
                self.data,
                {idAttribute: 'id'}
            );            
            
        });                    
        
        self.editedData = ko.observable("");
        
        self.beforeRowEditListener = (event) => {
              self.cancelEdit = false;
              const rowContext = event.detail.rowContext;
              //console.log(rowContext.status);
              //console.log(self.data()[rowContext.status.rowIndex]);
              
              self.originalData = Object.assign({}, self.data()[rowContext.status.rowIndex]);
              self.rowData = Object.assign({}, self.data()[rowContext.status.rowIndex]);
              
              //self.originalData = Object.assign({}, rowContext.item.data);
              //self.rowData = Object.assign({}, rowContext.item.data);
              
              console.log(self.rowData);
        };
        
        // handle validation of editable components and when edit has been cancelled
        self.beforeRowEditEndListener = (event) => {
            console.log(event);
            self.editedData("");            
            const detail = event.detail; 
            if (!detail.cancelEdit && !self.cancelEdit) {
                if (self.hasValidationErrorInRow(document.getElementById("table"))) {
                    event.preventDefault();
                }
                else {
                    if (self.isRowDataUpdated()) {
                        const key = detail.rowContext.status.rowIndex;
                        self.submitRow(key);
                    }
                }
            }
        };
        
        self.submitRow = (key) => {
                  alert("hola");
                  /*
                  self.datasource.updateItem({
                      metadata: { key: key },
                      data: self.rowData,
                  });
                  
                  const editItem = self.datasource.getSubmittableItems()[0];
                  self.datasource.setItemStatus(editItem, "submitting");
                  for (let idx = 0; idx < self.data().length; idx++) {
                      if (self.data()[idx].id ===
                          editItem.item.metadata.key) {
                          self.data.splice(idx, 1, editItem.item.data);
                          break;
                      }
                  }
                  // Set the edit item to "submitted" if successful
                  self.datasource.setItemStatus(editItem, "submitted");
                  self.editedData(JSON.stringify(editItem.item.data));
                  */      
                 
                  console.log(self.rowData);
                 
                  $.ajax({                    
                    type: "POST",
                    url: "http://dnssemantikos:8080/AccountService/api/accounts/update",                                        
                    dataType: "json",      
                    data: JSON.stringify(self.rowData),			  		 
                    //crossDomain: true,
                    contentType : "application/json",                    
                    success: function() {
                          alert("Registro grabado correctamente");                          
                          self.datasource.change(self.rowData);
                    },
                    error: function (request, status, error) {
                          alert(request.responseText);                          
                    },                                  
                  });
                  
                  
                
                /*
                 $.ajaxSetup({
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        "Access-Control-Allow-Origin":"http://dnssemantikos:8000"
                    }
                });
                 
                 
                 $.post( "http://dnssemantikos:8080/AccountService/api/accounts/update", JSON.stringify(self.rowData))
                    .done(function( data ) {                        
                        alert("Registro grabado correctamente");                          
                        self.datasource.change(self.rowData);
                  },"jsonp");     
                  */
                                    
        };
        
        self.isRowDataUpdated = () => {
            const propNames = Object.getOwnPropertyNames(self.rowData);
            for (let i = 0; i < propNames.length; i++) {
                if (self.rowData[propNames[i]] !== self.originalData[propNames[i]]) {
                    return true;
                }
            }
            return false;
        };
        
        // checking for validity of editables inside a row
        // return false if one of them is considered as invalid
        self.hasValidationErrorInRow = (table) => {
            const editables = table.querySelectorAll(".editable");
            for (let i = 0; i < editables.length; i++) {
                const editable = editables.item(i);
                /*
                editable.validate();
                // Table does not currently support editables with async validators
                // so treating editable with 'pending' state as invalid
                if (editable.valid !== "valid") {
                    return true;
                }
                */
            }
            return false;
        };
        
        self.handleUpdate = (event, context) => {
            //console.log(context);
            self.editRow({ rowKey: context.row.id });
        };
        
        self.handleDone = () => {
            self.editRow({ rowKey: null });
        };
        
        self.handleCancel = () => {
            self.cancelEdit = true;
            self.editRow({ rowKey: null });
        };

    }
    

    /*
     * Returns an instance of the ViewModel providing one instance of the ViewModel. If needed,
     * return a constructor for the ViewModel so that the ViewModel is constructed
     * each time the view is displayed.
     */
    return DashboardViewModel;
  }
);
