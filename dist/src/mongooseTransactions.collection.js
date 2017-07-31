"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose = require("mongoose");
var transactionSchema = new mongoose.Schema({
    operations: [],
    rollbackIndex: Number,
    status: {
        default: "pending",
        type: String
    },
});
exports.default = mongoose.model('MongooseTransactions', transactionSchema);
//# sourceMappingURL=mongooseTransactions.collection.js.map