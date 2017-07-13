"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose = require("mongoose");
/** Class representing a transaction. */
var Transaction = (function () {
    /**
   * Create a transaction.
   * @param parameters - The parameters
   */
    function Transaction() {
        /** The actions to execute on mongoose collections when transaction run is called */
        this.transactions = [];
    }
    /**
     * Create the insert transaction and rollback states.
     * @param modelName - The string containing the mongoose model name.
     * @param data - The object or array containing data to insert into mongoose model.
     */
    Transaction.prototype.insert = function (modelName, data) {
        var model = mongoose.model(modelName);
        if (data instanceof Array) {
            data.forEach(function (currentObj) {
                if (!currentObj._id) {
                    var id = mongoose.Types.ObjectId().toString();
                    currentObj._id = id;
                }
            });
        }
        else {
            if (!data._id) {
                var id = mongoose.Types.ObjectId().toString();
                data._id = id;
            }
            data = [data];
        }
        var transactionObj = {
            type: "insert",
            rollbackType: "remove",
            model: model,
            modelName: modelName,
            oldModels: null,
            findObj: {},
            data: data
        };
        this.transactions.push(transactionObj);
    };
    /**
   * Create the findOneAndUpdate transaction and rollback states.
   * @param modelName - The string containing the mongoose model name.
   * @param findObj - The object containing data to find mongoose collection.
   * @param dataObj - The object containing data to update into mongoose model.
   * @param options - The object containing the options for update query:
   *                     safe (boolean) safe mode (defaults to value set in schema (true))
   *                     upsert (boolean) whether to create the doc if it doesn't match (false)
   *                     multi (boolean) whether multiple documents should be updated (false)
   *                     runValidators: if true, runs update validators on this command. Update validators validate the update operation against the model's schema.
   *                     setDefaultsOnInsert: if this and upsert are true, mongoose will apply the defaults specified in the model's schema if a new document is created. This option only works on MongoDB >= 2.4 because it relies on MongoDB's $setOnInsert operator.
   *                     strict (boolean) overrides the strict option for this update
   *                     overwrite (boolean) disables update-only mode, allowing you to overwrite the doc (false)
   */
    Transaction.prototype.update = function (modelName, findObj, data, options) {
        if (options === void 0) { options = {}; }
        var model = mongoose.model(modelName);
        var oldModels = model.find(findObj);
        var transactionObj = {
            type: "update",
            rollbackType: "update",
            model: model,
            modelName: modelName,
            oldModels: oldModels,
            findObj: findObj,
            data: data
        };
        this.transactions.push(transactionObj);
    };
    /**
   * Create the remove transaction and rollback states.
   * @param modelName - The string containing the mongoose model name.
   * @param findObj - The object containing data to find mongoose collection.
   */
    Transaction.prototype.remove = function (modelName, findObj) {
        var model = mongoose.model(modelName);
        var oldModels = model.findOne(findObj);
        var transactionObj = {
            type: "remove",
            rollbackType: "insert",
            model: model,
            modelName: modelName,
            oldModels: oldModels,
            findObj: findObj,
            data: null
        };
        this.transactions.push(transactionObj);
    };
    /**
   * Run the transaction and check errors.
   */
    Transaction.prototype.run = function () {
        var _this = this;
        var deferredQueries = [];
        try {
            this.transactions.forEach(function (transaction) {
                switch (transaction.type) {
                    case "insert":
                        deferredQueries.push(_this.insertTransaction(transaction.model, transaction.data));
                        break;
                    case "update":
                        deferredQueries.push(_this.updateTransaction(transaction.model, transaction.findObj, transaction.data));
                        break;
                    case "remove":
                        deferredQueries.push(_this.removeTransaction(transaction.model, transaction.findObj));
                        break;
                }
            });
            Promise.all(deferredQueries)
                .catch(function (err) {
                _this.rollback(err);
            });
        }
        catch (err) {
            this.rollback(err);
        }
    };
    Transaction.prototype.insertTransaction = function (model, data) {
        return new Promise(function (resolve, reject) {
            model.create(data, function (err, data) {
                if (err) {
                    return reject({ error: err, model: model, object: data });
                }
                else {
                    return resolve(data);
                }
            });
        });
    };
    Transaction.prototype.updateTransaction = function (model, find, data) {
        return new Promise(function (resolve, reject) {
            model.update(find, data, function (err, data) {
                if (err) {
                    return reject({ error: err, model: model, find: find, object: data });
                }
                else {
                    return resolve(data);
                }
            });
        });
    };
    Transaction.prototype.removeTransaction = function (model, find) {
        return new Promise(function (resolve, reject) {
            model.remove(find, function (err, data) {
                if (err) {
                    return reject({ error: err, model: model, object: data });
                }
                else {
                    return resolve(data);
                }
            });
        });
    };
    /**
   * Rollback the executed transactions if any error occurred.
   */
    Transaction.prototype.rollback = function (err) {
        var _this = this;
        var deferredQueries = [];
        try {
            this.transactions.forEach(function (transaction) {
                switch (transaction.type) {
                    case "insert":
                        //Rollback remove with insert
                        transaction.oldModels.forEach(function (oldModel) {
                            deferredQueries.push(_this.insertTransaction(transaction.model, oldModel));
                        });
                        break;
                    case "update":
                        //Rollback update with update
                        transaction.oldModels.forEach(function (oldModel) {
                            var find = {
                                _id: oldModel._id
                            };
                            deferredQueries.push(_this.updateTransaction(transaction.model, find, oldModel));
                        });
                        break;
                    case "remove":
                        //Rollback insert with remove
                        transaction.oldModels.forEach(function (oldModel) {
                            var find = {
                                _id: oldModel._id
                            };
                            deferredQueries.push(_this.removeTransaction(transaction.model, find));
                        });
                        break;
                }
            });
            Promise.all(deferredQueries)
                .then(function (data) {
            })
                .catch(function (err) {
            });
        }
        catch (err) {
        }
    };
    return Transaction;
}());
exports.default = Transaction;
//# sourceMappingURL=main.js.map