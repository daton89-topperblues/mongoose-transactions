"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
     * Clean the transactions object to begin a new transaction on the same instance.
     */
    Transaction.prototype.clean = function () {
        this.transactions = [];
    };
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
                    var id = new mongoose.Types.ObjectId();
                    currentObj._id = id;
                }
            });
        }
        else {
            if (!data._id) {
                var id = new mongoose.Types.ObjectId();
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
        return __awaiter(this, void 0, void 0, function () {
            var model, oldModels, transactionObj;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        model = mongoose.model(modelName);
                        return [4 /*yield*/, model.find(findObj).exec()];
                    case 1:
                        oldModels = _a.sent();
                        transactionObj = {
                            type: "update",
                            rollbackType: "update",
                            model: model,
                            modelName: modelName,
                            oldModels: oldModels,
                            findObj: findObj,
                            data: data
                        };
                        this.transactions.push(transactionObj);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
   * Create the remove transaction and rollback states.
   * @param modelName - The string containing the mongoose model name.
   * @param findObj - The object containing data to find mongoose collection.
   */
    Transaction.prototype.remove = function (modelName, findObj) {
        var model = mongoose.model(modelName);
        var oldModels = model.findOne(findObj).exec();
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