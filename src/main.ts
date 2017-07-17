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
    }

    /**
     * Create the insert transaction and rollback states.
     * @param modelName - The string containing the mongoose model name.
     * @param data - The object or array containing data to insert into mongoose model.
     * @returns id - The id of the bject to insert.
     */
    public insert(modelName, data) {
        const model = mongoose.model(modelName);

        if (!data._id) {
            const id = new mongoose.Types.ObjectId();
            data._id = id;
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
     * Run the transaction and check errors.
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
                        transaction.oldModel = this.findByIdTransaction(transaction.model, transaction.findId);
                        operation = this.updateTransaction(transaction.model, transaction.findId, transaction.data)
                        break;
                    case "remove":
                        transaction.oldModel = this.findByIdTransaction(transaction.model, transaction.findId);
                        operation = this.removeTransaction(transaction.model, transaction.findId)
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
     * Rollback the executed transactions if any error occurred.
     */
    public rollback() {

        const transactionsToRollback: any = this.transactions.slice(0, this.rollbackIndex + 1)

        transactionsToRollback.reverse()

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
        return await model.findById(findId).exec();
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

    private updateTransaction(model, find, data) {
        return new Promise((resolve, reject) => {
            model.findByIdAndUpdate(find, data, { new: false }, (err, result) => {

                if (err) {
                    return reject(this.transactionError(err, { find, data }))
                } else {
                    if (!result) {
                        return reject(this.transactionError(new Error('Entity not found'), { find, data }))
                    }
                    return resolve(result)
                }

            });
        });
    }

    private removeTransaction(model, find) {
        return new Promise((resolve, reject) => {

            model.findByIdAndRemove(find, (err, data) => {

                if (err) {
                    return reject(this.transactionError(err, find))
                } else {

                    if (data == null) {
                        return reject(this.transactionError(new Error('Entity not found'), find))
                    } else {
                        return resolve(data.result)
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
