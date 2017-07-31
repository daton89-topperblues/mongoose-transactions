import * as mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    operations: [],
    rollbackIndex: Number,
    status: {
        default: "pending",
        type: String
    },
});

export default mongoose.model('MongooseTransactions', transactionSchema);
