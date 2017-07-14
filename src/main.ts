import * as mongoose from "mongoose";

/** Class representing a transaction. */
export default class Transaction {

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
        oldModels: any,
        /** The object ... */
        findObj: object,
        /** The array of data ... */
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
     */
    public insert(modelName, data) {
        const model = mongoose.model(modelName);
        if (data instanceof Array) {
            data.forEach((currentObj) => {
                if (!currentObj._id) {
                    const id = new mongoose.Types.ObjectId();
                    currentObj._id = id;
                }
            });
        } else {
            if (!data._id) {
                const id = new mongoose.Types.ObjectId();
                data._id = id;
            }
            // data = [data];
        }
        const transactionObj = {
            data,
            findObj: {},
            model,
            modelName,
            oldModels: null,
            rollbackType: "remove",
            type: "insert",
        };

        this.transactions.push(transactionObj);

    }

    /**
     * Create the findOneAndUpdate transaction and rollback states.
     * @param modelName - The string containing the mongoose model name.
     * @param findObj - The object containing data to find mongoose collection.
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
    public update(modelName, findObj, data, options = {}) {
        const model = mongoose.model(modelName);
        const oldModels = model.find(findObj);
        const transactionObj = {
            data,
            findObj,
            model,
            modelName,
            oldModels,
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
    public remove(modelName, findObj) {
        const model = mongoose.model(modelName);
        const oldModels = model.findOne(findObj);
        const transactionObj = {
            data: null,
            findObj,
            model,
            modelName,
            oldModels,
            rollbackType: "insert",
            type: "remove",
        };

        this.transactions.push(transactionObj);

    }

    /**
     * Run the transaction and check errors.
     */
    public run() {

        try {

            const final = []

            return this.transactions.reduce((promise, transaction) => {

                return promise.then((result) => {

                    let operation: any = {}

                    switch (transaction.type) {
                        case "insert":
                            operation = this.insertTransaction(transaction.model, transaction.data)
                            break;
                        case "update":
                            operation = this.updateTransaction(transaction.model, transaction.findObj, transaction.data)
                            break;
                        case "remove":
                            operation = this.removeTransaction(transaction.model, transaction.findObj)
                            break;
                    }

                    return operation.then((query) => {
                        final.push(query)
                        return final
                    })

                })

            }, Promise.resolve())

        } catch (err) {
            console.log("ERROR => ", err)
            //this.rollback(err)
        }
    }

    /**
     * Rollback the executed transactions if any error occurred.
     */
    private rollback(err) {
        const deferredQueries = []
        try {
            this.transactions.forEach((transaction) => {
                switch (transaction.type) {
                    case "insert":
                        // Rollback remove with insert
                        transaction.oldModels.forEach((oldModel) => {
                            deferredQueries.push(this.insertTransaction(transaction.model, oldModel))
                        })
                        break;
                    case "update":
                        // Rollback update with update
                        transaction.oldModels.forEach((oldModel) => {
                            const find = {
                                _id: oldModel._id
                            }
                            deferredQueries.push(this.updateTransaction(transaction.model, find, oldModel))
                        })
                        break;
                    case "remove":
                        // Rollback insert with remove
                        transaction.oldModels.forEach((oldModel) => {
                            const find = {
                                _id: oldModel._id
                            }
                            deferredQueries.push(this.removeTransaction(transaction.model, find))
                        })
                        break;
                }
            })
            return Promise.all(deferredQueries)
                .then((data) => {
                    console.log("Rollback return data => ", data);
                })
                .catch((error) => {
                    console.log("Rollback error data => ", error);
                    return error
                })
        } catch (err) {
            console.error(err);
        }
    }

    private insertTransaction(model, data) {
        return new Promise((resolve, reject) => {
            model.create(data, (err, data) => {
                if (err) {
                    return reject({ error: err, model, object: data })
                } else {
                    console.log("Insert success => ", data)

                    return resolve(data)
                }
            });
        });
    }

    private updateTransaction(model, find, data) {
        return new Promise((resolve, reject) => {
            model.findOneAndUpdate(find, data, { new: true }, (err, data) => {
                if (err) {
                    return reject({ error: err, model, find, object: data })
                } else {
                    if (!data) {
                        return reject({ find, data })
                    }
                    return resolve(data)
                }
            });
        });
    }

    private removeTransaction(model, find) {
        return new Promise((resolve, reject) => {
            model.remove(find, (err, data) => {
                if (err) {
                    return reject({ error: err, model, object: data })
                } else {
                    if (data.result.n === 0) {
                        return reject({ find, data })
                    }
                    return resolve(data.result)
                }
            });
        });
    }

}
