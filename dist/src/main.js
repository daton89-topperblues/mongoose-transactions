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
    function Transaction() {
        /** Index used for retrieve the executed transaction in the run */
        this.rollbackIndex = 0;
        /** The actions to execute on mongoose collections when transaction run is called */
        this.transactions = [];
    }
    /**
     * Create a transaction.
     * @param parameters - The parameters
     */
    // constructor() {}
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
     * @returns id - The id of the bject to insert.
     */
    Transaction.prototype.insert = function (modelName, data) {
        var model = mongoose.model(modelName);
        if (!data._id) {
            var id = new mongoose.Types.ObjectId();
            data._id = id;
        }
        var transactionObj = {
            data: data,
            findId: "",
            model: model,
            modelName: modelName,
            oldModel: null,
            rollbackType: "remove",
            type: "insert",
        };
        this.transactions.push(transactionObj);
        return data._id;
    };
    /**
     * Create the findOneAndUpdate transaction and rollback states.
     * @param modelName - The string containing the mongoose model name.
     * @param findId - The id of the object to update.
     * @param dataObj - The object containing data to update into mongoose model.
     * @param options - The object containing the options for update query:
     *                     safe (boolean) safe mode (defaults to value set in schema (true))
     *                     upsert (boolean) whether to create the doc if it doesn't match (false)
     *                     multi (boolean) whether multiple documents should be updated (false)
     *                     runValidators: if true, runs update validators on this command.
     *                          Update validators validate the update operation against the model's schema.
     *                     setDefaultsOnInsert: if this and upsert are true, mongoose will apply the defaults
     *                          specified in the model's schema if a new document is created. This option only works
     *                          on MongoDB >= 2.4 because it relies on MongoDB's $setOnInsert operator.
     *                     strict (boolean) overrides the strict option for this update
     *                     overwrite (boolean) disables update-only mode, allowing you to overwrite the doc (false)
     */
    Transaction.prototype.update = function (modelName, findId, data, options) {
        if (options === void 0) { options = {}; }
        var model = mongoose.model(modelName);
        var transactionObj = {
            data: data,
            findId: findId,
            model: model,
            modelName: modelName,
            oldModel: null,
            rollbackType: "update",
            type: "update",
        };
        this.transactions.push(transactionObj);
    };
    /**
     * Create the remove transaction and rollback states.
     * @param modelName - The string containing the mongoose model name.
     * @param findObj - The object containing data to find mongoose collection.
     */
    Transaction.prototype.remove = function (modelName, findId) {
        var model = mongoose.model(modelName);
        var transactionObj = {
            data: null,
            findId: findId,
            model: model,
            modelName: modelName,
            oldModel: null,
            rollbackType: "insert",
            type: "remove",
        };
        this.transactions.push(transactionObj);
    };
    /**
     * Run the transaction and check errors.
     */
    Transaction.prototype.run = function () {
        var _this = this;
        var final = [];
        return this.transactions.reduce(function (promise, transaction, index) {
            return promise.then(function (result) { return __awaiter(_this, void 0, void 0, function () {
                var _this = this;
                var operation;
                return __generator(this, function (_a) {
                    operation = {};
                    switch (transaction.type) {
                        case "insert":
                            operation = this.insertTransaction(transaction.model, transaction.data);
                            break;
                        case "update":
                            transaction.oldModel = this.findByIdTransaction(transaction.model, transaction.findId);
                            operation = this.updateTransaction(transaction.model, transaction.findId, transaction.data);
                            break;
                        case "remove":
                            transaction.oldModel = this.findByIdTransaction(transaction.model, transaction.findId);
                            operation = this.removeTransaction(transaction.model, transaction.findId);
                            break;
                    }
                    return [2 /*return*/, operation.then(function (query) {
                            _this.rollbackIndex = index;
                            final.push(query);
                            return final;
                        })];
                });
            }); });
        }, Promise.resolve());
    };
    /**
     * Rollback the executed transactions if any error occurred.
     */
    Transaction.prototype.rollback = function (err) {
        var _this = this;
        var transactionsToRollback = this.transactions.slice(0, this.rollbackIndex);
        transactionsToRollback.reverse();
        var final = [];
        return transactionsToRollback.reduce(function (promise, transaction, index) {
            return promise.then(function (result) {
                var operation = {};
                switch (transaction.rollbackType) {
                    case "insert":
                        operation = _this.insertTransaction(transaction.model, transaction.oldModel);
                        break;
                    case "update":
                        operation = _this.updateTransaction(transaction.model, transaction.findId, transaction.oldModel);
                        break;
                    case "remove":
                        operation = _this.removeTransaction(transaction.model, transaction.findId);
                        break;
                }
                return operation.then(function (query) {
                    _this.rollbackIndex = index;
                    final.push(query);
                    return final;
                });
            });
        }, Promise.resolve());
    };
    Transaction.prototype.findByIdTransaction = function (model, findId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, model.findById(findId).exec()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Transaction.prototype.insertTransaction = function (model, data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            model.create(data, function (err, result) {
                if (err) {
                    return reject(_this.transactionError(err, data));
                }
                else {
                    return resolve(result);
                }
            });
        });
    };
    Transaction.prototype.updateTransaction = function (model, find, data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            model.findByIdAndUpdate(find, data, { new: false }, function (err, result) {
                if (err) {
                    return reject(_this.transactionError(err, { find: find, data: data }));
                }
                else {
                    if (!result) {
                        return reject(_this.transactionError(new Error('Entity not found'), { find: find, data: data }));
                    }
                    return resolve(result);
                }
            });
        });
    };
    Transaction.prototype.removeTransaction = function (model, find) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            model.findByIdAndRemove(find, function (err, data) {
                if (err) {
                    return reject(_this.transactionError(err, find));
                }
                else {
                    if (data == null) {
                        return reject(_this.transactionError(new Error('Entity not found'), find));
                    }
                    else {
                        return resolve(data.result);
                    }
                }
            });
        });
    };
    Transaction.prototype.transactionError = function (error, data) {
        return {
            data: data,
            error: error,
            executedTransactions: this.rollbackIndex + 1,
            remainingTransactions: this.transactions.length - (this.rollbackIndex + 1),
        };
    };
    return Transaction;
}());
exports.default = Transaction;
//# sourceMappingURL=main.js.map