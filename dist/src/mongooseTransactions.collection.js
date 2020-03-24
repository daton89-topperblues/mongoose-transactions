"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose = require("mongoose");
exports.TransactionSchema = new mongoose.Schema({
    operations: [],
    rollbackIndex: Number,
    status: {
        default: 'pending',
        type: String
    }
});
exports.TransactionModel = mongoose.model('MongooseTransactions', exports.TransactionSchema);
//# sourceMappingURL=mongooseTransactions.collection.js.map