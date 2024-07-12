import * as mongoose from 'mongoose'

/** The operations and transaction possible states */
export const enum Status {
    pending = 'Pending',
    success = 'Success',
    error = 'Error',
    rollback = 'Rollback',
    errorRollback = 'ErrorRollback'
}

export interface Operation {
    /** The transaction type to run */
    type: string
    /** The transaction type to execute for rollback */
    rollbackType: string
    /** The mongoose model instance */
    model: mongoose.Model<unknown>
    /** The mongoose model name */
    modelName: string
    /** The mongoose model instance before transaction if exists */
    oldModel: mongoose.Model<unknown>
    /** The id of the object */
    findId: mongoose.Types.ObjectId
    /** The data */
    data: mongoose.Document
    /** options configuration query */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any
    /** The current status of the operation */
    status: Status
}

export interface ITransactionSchema extends mongoose.Document {
    operations: Operation[]
    rollbackIndex: number
    status: string
}

export const TransactionSchema = new mongoose.Schema({
    operations: [],
    rollbackIndex: Number,
    status: {
        default: 'pending',
        type: String
    }
})

export const TransactionModel = mongoose.model<ITransactionSchema>(
    'MongooseTransactions',
    TransactionSchema
)
