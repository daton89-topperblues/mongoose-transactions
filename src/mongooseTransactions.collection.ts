import * as mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    operations: [],
    status: {
        default: "pending",
        type: String
    }
});

export default mongoose.model('MongooseTransactions', transactionSchema);
