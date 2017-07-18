import * as mongoose from "mongoose";

/** Class representing a transaction. */
export default class Transaction {

    /** Index used for retrieve the executed transaction in the run */
    private rollbackIndex = 0

    /** The actions to execute on mongoose collections when transaction run is called */
    private transactions: Array<{
        /** The transaction type to run */
        type: string,
        /** The transaction type to execute for rollback */
        rollbackType: string,
        /** The mongoose model instance */
        model: any,
        /** The mongoose model name */
        modelName: string,
        /** The mongoose model instance before transaction if exists */
        oldModel: any,
        /** The id of the object */
        findId: any,
        /** The data */
        data: any
    }> = [];

    /**
     * Create a transaction.
     * @param parameters - The parameters
     */
    // constructor() {}

    /**
     * Clean the transactions object to begin a new transaction on the same instance.
     */
    public clean() {
        this.transactions = [];
        this.rollbackIndex = 0
    }

    /**
     * Create the insert transaction and rollback states.
     * @param modelName - The string containing the mongoose model name.
     * @param data - The object containing data to insert into mongoose model.
     * @returns id - The id of the object to insert.
     */
    public insert(modelName, data) {
        const model = mongoose.model(modelName);

        if (!data._id) {
            data._id = new mongoose.Types.ObjectId();
        }

        const transactionObj = {
            data,
            findId: data._id,
            model,
            modelName,
            oldModel: null,
            rollbackType: "remove",
            type: "insert",
        };

        this.transactions.push(transactionObj);

        return data._id;

    }

    /**
     * Create the findOneAndUpdate transaction and rollback states.
     * @param modelName - The string containing the mongoose model name.
     * @param findId - The id of the object to update.
     * @param dataObj - The object containing data to update into mongoose model.
     */
    public update(modelName, findId, data, options = {}) {
        const model = mongoose.model(modelName);
        const transactionObj = {
            data,
            findId,
            model,
            modelName,
            oldModel: null,
            rollbackType: "update",
            type: "update",
        };

        this.transactions.push(transactionObj);

    }

    /**
     * Create the remove transaction and rollback states.
     * @param modelName - The string containing the mongoose model name.
     * @param findObj - The object containing data to find mongoose collection.
     */
    public remove(modelName, findId) {
        const model = mongoose.model(modelName);
        const transactionObj = {
            data: null,
            findId,
            model,
            modelName,
            oldModel: null,
            rollbackType: "insert",
            type: "remove",
        };

        this.transactions.push(transactionObj);

    }

    /**
     * Run the operations and check errors.
     * @returns Array of objects - The objects returned by operations
     *          Error - The error object containing:
     *                  data - the input data of operation
     *                  error - the error returned by the operation
     *                  executedTransactions - the number of executed operations
     *                  remainingTransactions - the number of the not executed operations
     */
    public run() {

        const final = []

        return this.transactions.reduce((promise, transaction, index) => {

            return promise.then(async (result) => {

                let operation: any = {}

                switch (transaction.type) {
                    case "insert":
                        operation = this.insertTransaction(transaction.model, transaction.data)
                        break;
                    case "update":
                        operation = this.findByIdTransaction(transaction.model, transaction.findId)
                            .then((findRes) => {
                                transaction.oldModel = findRes;
                                return this.updateTransaction(transaction.model, transaction.findId, transaction.data)
                            })
                        break;
                    case "remove":
                        operation = this.findByIdTransaction(transaction.model, transaction.findId)
                            .then((findRes) => {
                                transaction.oldModel = findRes;
                                return this.removeTransaction(transaction.model, transaction.findId)
                            })
                        break;
                }

                return operation.then((query) => {
                    this.rollbackIndex = index
                    final.push(query)
                    return final
                })

            })

        }, Promise.resolve())

    }

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
    public rollback(howmany = this.rollbackIndex + 1) {

        let transactionsToRollback: any = this.transactions.slice(0, this.rollbackIndex + 1)

        transactionsToRollback.reverse()

        if (howmany !== this.rollbackIndex + 1) {
            transactionsToRollback = transactionsToRollback.slice(0, howmany)
        }

        const final = []

        return transactionsToRollback.reduce((promise, transaction, index) => {

            return promise.then((result) => {

                let operation: any = {}

                switch (transaction.rollbackType) {
                    case "insert":
                        operation = this.insertTransaction(transaction.model, transaction.oldModel)
                        break;
                    case "update":
                        operation = this.updateTransaction(transaction.model, transaction.findId, transaction.oldModel)
                        break;
                    case "remove":
                        operation = this.removeTransaction(transaction.model, transaction.findId)
                        break;
                }

                return operation.then((query) => {
                    final.push(query)
                    return final
                })

            })

        }, Promise.resolve())

    }

    private async findByIdTransaction(model, findId) {
        return await model.findById(findId).lean().exec();
    }

    private insertTransaction(model, data) {
        return new Promise((resolve, reject) => {
            model.create(data, (err, result) => {
                if (err) {
                    return reject(this.transactionError(err, data))
                } else {
                    return resolve(result)
                }
            });
        });
    }

    private updateTransaction(model, id, data) {
        return new Promise((resolve, reject) => {
            model.findByIdAndUpdate(id, data, { new: false }, (err, result) => {

                if (err) {
                    return reject(this.transactionError(err, { id, data }))
                } else {
                    if (!result) {
                        return reject(this.transactionError(new Error('Entity not found'), { id, data }))
                    }
                    return resolve(result)
                }

            });
        });
    }

    private removeTransaction(model, id) {
        return new Promise((resolve, reject) => {

            model.findByIdAndRemove(id, (err, data) => {

                if (err) {
                    return reject(this.transactionError(err, id))
                } else {

                    if (data == null) {
                        return reject(this.transactionError(new Error('Entity not found'), id))
                    } else {
                        return resolve(data)
                    }

                }
            });

        });
    }

    private transactionError(error, data) {
        return {
            data,
            error,
            executedTransactions: this.rollbackIndex + 1,
            remainingTransactions: this.transactions.length - (this.rollbackIndex + 1),
        }
    }

}
