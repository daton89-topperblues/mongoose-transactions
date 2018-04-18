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
var mongooseTransactions_collection_1 = require("./mongooseTransactions.collection");
/** Class representing a transaction. */
var Transaction = /** @class */ (function () {
    /**
     * Create a transaction.
     * @param useDb - The boolean parameter allow to use transaction collection on db (default false)
     * @param transactionId - The id of the transaction to load, load the transaction
     *                        from db if you set useDb true (default "")
     */
    function Transaction(useDb) {
        if (useDb === void 0) { useDb = false; }
        /** Index used for retrieve the executed transaction in the run */
        this.rollbackIndex = 0;
        /** Boolean value for enable or disable saving transaction on db */
        this.useDb = false;
        /** The id of the current transaction document on database */
        this.transactionId = "";
        /** The actions to execute on mongoose collections when transaction run is called */
        this.operations = [];
        this.useDb = useDb;
        this.transactionId = "";
    }
    /**
     * Load transaction from transaction collection on db.
     * @param transactionId - The id of the transaction to load.
     * @trows Error - Throws error if the transaction is not found
     */
    Transaction.prototype.loadDbTransaction = function (transactionId) {
        return __awaiter(this, void 0, void 0, function () {
            var loadedTransaction;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, mongooseTransactions_collection_1.default.findById(transactionId).lean().exec()];
                    case 1:
                        loadedTransaction = _a.sent();
                        if (loadedTransaction && loadedTransaction.operations) {
                            loadedTransaction.operations.forEach(function (operation) {
                                operation.model = mongoose.model(operation.modelName);
                            });
                            this.operations = loadedTransaction.operations;
                            this.rollbackIndex = loadedTransaction.rollbackIndex;
                            this.transactionId = transactionId;
                            return [2 /*return*/, loadedTransaction];
                        }
                        else {
                            throw new Error('Transaction not found');
                            // return null
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Remove transaction from transaction collection on db,
     * if the transactionId param is null, remove all documents in the collection.
     * @param transactionId - Optional. The id of the transaction to remove (default null).
     */
    Transaction.prototype.removeDbTransaction = function (transactionId) {
        if (transactionId === void 0) { transactionId = null; }
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        if (!(transactionId === null)) return [3 /*break*/, 2];
                        return [4 /*yield*/, mongooseTransactions_collection_1.default.remove({}).exec()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, mongooseTransactions_collection_1.default.findByIdAndRemove(transactionId).exec()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        throw new Error('Fail remove transaction[s] in removeDbTransaction');
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * If the instance is db true, return the actual or new transaction id.
     * @throws Error - Throws error if the instance is not a db instance.
     */
    Transaction.prototype.getTransactionId = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.transactionId === "")) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.createTransaction()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this.transactionId];
                }
            });
        });
    };
    /**
     * Get transaction operations array from transaction object or collection on db.
     * @param transactionId - Optional. If the transaction id is passed return the elements of the transaction id
     *                                  else return the elements of current transaction (default null).
     */
    Transaction.prototype.getOperations = function (transactionId) {
        if (transactionId === void 0) { transactionId = null; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!transactionId) return [3 /*break*/, 2];
                        return [4 /*yield*/, mongooseTransactions_collection_1.default.findById(transactionId).lean().exec()];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [2 /*return*/, this.operations];
                }
            });
        });
    };
    /**
     * Save transaction operations array on db.
     * @throws Error - Throws error if the instance is not a db instance.
     * @return transactionId - The transaction id on database
     */
    Transaction.prototype.saveOperations = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.transactionId === "")) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.createTransaction()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, mongooseTransactions_collection_1.default.findOneAndUpdate(this.transactionId, {
                            operations: this.operations,
                            rollbackIndex: this.rollbackIndex
                        })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, this.transactionId];
                }
            });
        });
    };
    /**
     * Clean the operations object to begin a new transaction on the same instance.
     */
    Transaction.prototype.clean = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.operations = [];
                        this.rollbackIndex = 0;
                        this.transactionId = "";
                        if (!this.useDb) return [3 /*break*/, 2];
                        _a = this;
                        return [4 /*yield*/, this.createTransaction()];
                    case 1:
                        _a.transactionId = _b.sent();
                        _b.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create the insert transaction and rollback states.
     * @param modelName - The string containing the mongoose model name.
     * @param data - The object containing data to insert into mongoose model.
     * @returns id - The id of the object to insert.
     */
    Transaction.prototype.insert = function (modelName, data, options) {
        if (options === void 0) { options = {}; }
        var model = mongoose.model(modelName);
        if (!data._id) {
            data._id = new mongoose.Types.ObjectId();
        }
        var transactionObj = {
            data: data,
            findId: data._id,
            model: model,
            modelName: modelName,
            oldModel: null,
            options: options,
            rollbackType: "remove",
            status: "Pending" /* pending */,
            type: "insert",
        };
        this.operations.push(transactionObj);
        return data._id;
    };
    /**
     * Create the findOneAndUpdate transaction and rollback states.
     * @param modelName - The string containing the mongoose model name.
     * @param findId - The id of the object to update.
     * @param dataObj - The object containing data to update into mongoose model.
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
            options: options,
            rollbackType: "update",
            status: "Pending" /* pending */,
            type: "update",
        };
        this.operations.push(transactionObj);
    };
    /**
     * Create the remove transaction and rollback states.
     * @param modelName - The string containing the mongoose model name.
     * @param findObj - The object containing data to find mongoose collection.
     */
    Transaction.prototype.remove = function (modelName, findId, options) {
        if (options === void 0) { options = {}; }
        var model = mongoose.model(modelName);
        var transactionObj = {
            data: null,
            findId: findId,
            model: model,
            modelName: modelName,
            oldModel: null,
            options: options,
            rollbackType: "insert",
            status: "Pending" /* pending */,
            type: "remove",
        };
        this.operations.push(transactionObj);
    };
    /**
     * Run the operations and check errors.
     * @returns Array of objects - The objects returned by operations
     *          Error - The error object containing:
     *                  data - the input data of operation
     *                  error - the error returned by the operation
     *                  executedTransactions - the number of executed operations
     *                  remainingTransactions - the number of the not executed operations
     */
    Transaction.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var final;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.useDb && this.transactionId === "")) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.createTransaction()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        final = [];
                        return [2 /*return*/, this.operations.reduce(function (promise, transaction, index) {
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
                                                operation = this.findByIdTransaction(transaction.model, transaction.findId)
                                                    .then(function (findRes) {
                                                    transaction.oldModel = findRes;
                                                    return _this.updateTransaction(transaction.model, transaction.findId, transaction.data, transaction.options);
                                                });
                                                break;
                                            case "remove":
                                                operation = this.findByIdTransaction(transaction.model, transaction.findId)
                                                    .then(function (findRes) {
                                                    transaction.oldModel = findRes;
                                                    return _this.removeTransaction(transaction.model, transaction.findId);
                                                });
                                                break;
                                        }
                                        return [2 /*return*/, operation.then(function (query) { return __awaiter(_this, void 0, void 0, function () {
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            this.rollbackIndex = index;
                                                            this.updateOperationStatus("Success" /* success */, index);
                                                            if (!(index === this.operations.length - 1)) return [3 /*break*/, 2];
                                                            return [4 /*yield*/, this.updateDbTransaction("Success" /* success */)];
                                                        case 1:
                                                            _a.sent();
                                                            _a.label = 2;
                                                        case 2:
                                                            final.push(query);
                                                            return [2 /*return*/, final];
                                                    }
                                                });
                                            }); }).catch(function (err) { return __awaiter(_this, void 0, void 0, function () {
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            this.updateOperationStatus("Error" /* error */, index);
                                                            return [4 /*yield*/, this.updateDbTransaction("Error" /* error */)];
                                                        case 1:
                                                            _a.sent();
                                                            throw err;
                                                    }
                                                });
                                            }); })];
                                    });
                                }); });
                            }, Promise.resolve([]))];
                }
            });
        });
    };
    /**
     * Rollback the executed operations if any error occurred.
     * @param   stepNumber - (optional) the number of the operation to rollback - default to length of
     *                            operation successfully runned
     * @returns Array of objects - The objects returned by rollback operations
     *          Error - The error object containing:
     *                  data - the input data of operation
     *                  error - the error returned by the operation
     *                  executedTransactions - the number of rollbacked operations
     *                  remainingTransactions - the number of the not rollbacked operations
     */
    Transaction.prototype.rollback = function (howmany) {
        if (howmany === void 0) { howmany = this.rollbackIndex + 1; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var transactionsToRollback, final;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.useDb && this.transactionId === "")) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.createTransaction()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        transactionsToRollback = this.operations.slice(0, this.rollbackIndex + 1);
                        transactionsToRollback.reverse();
                        if (howmany !== this.rollbackIndex + 1) {
                            transactionsToRollback = transactionsToRollback.slice(0, howmany);
                        }
                        final = [];
                        return [2 /*return*/, transactionsToRollback.reduce(function (promise, transaction, index) {
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
                                    return operation.then(function (query) { return __awaiter(_this, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    this.rollbackIndex--;
                                                    this.updateOperationStatus("Rollback" /* rollback */, index);
                                                    if (!(index === this.operations.length - 1)) return [3 /*break*/, 2];
                                                    return [4 /*yield*/, this.updateDbTransaction("Rollback" /* rollback */)];
                                                case 1:
                                                    _a.sent();
                                                    _a.label = 2;
                                                case 2:
                                                    final.push(query);
                                                    return [2 /*return*/, final];
                                            }
                                        });
                                    }); }).catch(function (err) { return __awaiter(_this, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    this.updateOperationStatus("ErrorRollback" /* errorRollback */, index);
                                                    return [4 /*yield*/, this.updateDbTransaction("ErrorRollback" /* errorRollback */)];
                                                case 1:
                                                    _a.sent();
                                                    throw err;
                                            }
                                        });
                                    }); });
                                });
                            }, Promise.resolve([]))];
                }
            });
        });
    };
    Transaction.prototype.findByIdTransaction = function (model, findId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, model.findById(findId).lean().exec()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Transaction.prototype.createTransaction = function () {
        return __awaiter(this, void 0, void 0, function () {
            var transaction;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.useDb) return [3 /*break*/, 2];
                        return [4 /*yield*/, mongooseTransactions_collection_1.default.create({
                                operations: this.operations,
                                rollbackIndex: this.rollbackIndex
                            })];
                    case 1:
                        transaction = _a.sent();
                        this.transactionId = transaction._id;
                        return [3 /*break*/, 3];
                    case 2: throw new Error("You must set useDB true in the constructor");
                    case 3: return [2 /*return*/];
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
    Transaction.prototype.updateTransaction = function (model, id, data, options) {
        var _this = this;
        if (options === void 0) { options = { new: false }; }
        return new Promise(function (resolve, reject) {
            model.findByIdAndUpdate(id, data, options, function (err, result) {
                if (err) {
                    return reject(_this.transactionError(err, { id: id, data: data }));
                }
                else {
                    if (!result) {
                        return reject(_this.transactionError(new Error('Entity not found'), { id: id, data: data }));
                    }
                    return resolve(result);
                }
            });
        });
    };
    Transaction.prototype.removeTransaction = function (model, id) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            model.findByIdAndRemove(id, function (err, data) {
                if (err) {
                    return reject(_this.transactionError(err, id));
                }
                else {
                    if (data == null) {
                        return reject(_this.transactionError(new Error('Entity not found'), id));
                    }
                    else {
                        return resolve(data);
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
            remainingTransactions: this.operations.length - (this.rollbackIndex + 1),
        };
    };
    Transaction.prototype.updateOperationStatus = function (status, index) {
        this.operations[index].status = status;
    };
    Transaction.prototype.updateDbTransaction = function (status) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.useDb && this.transactionId !== "")) return [3 /*break*/, 2];
                        return [4 /*yield*/, mongooseTransactions_collection_1.default.findByIdAndUpdate(this.transactionId, {
                                operations: this.operations,
                                rollbackIndex: this.rollbackIndex,
                                status: status
                            }, { new: true })];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    return Transaction;
}());
exports.default = Transaction;
//# sourceMappingURL=main.js.map