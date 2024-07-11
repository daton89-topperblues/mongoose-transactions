"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionModel = exports.TransactionSchema = void 0;
const mongoose = require("mongoose");
exports.TransactionSchema = new mongoose.Schema({
    operations: [],
    rollbackIndex: Number,
    status: {
        default: 'pending',
        type: String
    }
});
exports.TransactionModel = mongoose.model('MongooseTransactions', exports.TransactionSchema);
// # sourceMappingURL=mongooseTransactions.collection.js.map