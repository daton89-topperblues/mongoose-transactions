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
    constructor() {

    }

    /**
     * Clean the transactions object to begin a new transaction on the same instance.
     */
    clean(){
        this.transactions = [];
    }

    /**
     * Create the insert transaction and rollback states.
     * @param modelName - The string containing the mongoose model name.
     * @param data - The object or array containing data to insert into mongoose model.
     */
    insert(modelName, data) {
        const model = mongoose.model(modelName);
        if (data instanceof Array) {
            data.forEach(currentObj => {
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
            data = [data];
        }
        const transactionObj = {
            type: "insert",
            rollbackType: "remove",
            model: model,
            modelName: modelName,
            oldModels: null,
            findObj: {},
            data: data
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
   *                     runValidators: if true, runs update validators on this command. Update validators validate the update operation against the model's schema.
   *                     setDefaultsOnInsert: if this and upsert are true, mongoose will apply the defaults specified in the model's schema if a new document is created. This option only works on MongoDB >= 2.4 because it relies on MongoDB's $setOnInsert operator.
   *                     strict (boolean) overrides the strict option for this update
   *                     overwrite (boolean) disables update-only mode, allowing you to overwrite the doc (false)
   */
    async update(modelName, findObj, data, options = {}) {
        const model = mongoose.model(modelName);
        const oldModels = await model.find(findObj).exec();        
        const transactionObj = {
            type: "update",
            rollbackType: "update",
            model: model,
            modelName: modelName,
            oldModels: oldModels,
            findObj: findObj,
            data: data
        };

        this.transactions.push(transactionObj);

    }

    /**
   * Create the remove transaction and rollback states.
   * @param modelName - The string containing the mongoose model name.
   * @param findObj - The object containing data to find mongoose collection.
   */
    remove(modelName, findObj) {
        const model = mongoose.model(modelName);
        const oldModels = model.findOne(findObj).exec();
        const transactionObj = {
            type: "remove",
            rollbackType: "insert",
            model: model,
            modelName: modelName,
            oldModels: oldModels,
            findObj: findObj,
            data: null
        };

        this.transactions.push(transactionObj);

    }

    /**
   * Run the transaction and check errors.
   */
    run() {
        const deferredQueries = []
        try {
            this.transactions.forEach(transaction => {
                switch (transaction.type) {
                    case "insert":
                        deferredQueries.push(this.insertTransaction(transaction.model, transaction.data))
                        break;
                    case "update":
                        deferredQueries.push(this.updateTransaction(transaction.model, transaction.findObj, transaction.data))
                        break;
                    case "remove":
                        deferredQueries.push(this.removeTransaction(transaction.model, transaction.findObj))
                        break;
                }
            })
            Promise.all(deferredQueries)
                .catch(err => {
                    this.rollback(err)
                })
        } catch (err) {
            this.rollback(err)
        }
    }

    private insertTransaction(model, data) {
        return new Promise(function (resolve, reject) {
            model.create(data, function (err, data) {
                if (err) {
                    return reject({ error: err, model: model, object: data })
                } else {
                    return resolve(data)
                }
            });
        });
    }

    private updateTransaction(model, find, data) {
        return new Promise(function (resolve, reject) {
            model.update(find, data, function (err, data) {
                if (err) {
                    return reject({ error: err, model: model, find: find, object: data })
                } else {
                    return resolve(data)
                }
            });
        });
    }

    private removeTransaction(model, find) {
        return new Promise(function (resolve, reject) {
            model.remove(find, function (err, data) {
                if (err) {
                    return reject({ error: err, model: model, object: data })
                } else {
                    return resolve(data)
                }
            });
        });
    }

    /**
   * Rollback the executed transactions if any error occurred.
   */
    rollback(err) {
        const deferredQueries = []
        try {
            this.transactions.forEach(transaction => {
                switch (transaction.type) {
                    case "insert":
                        //Rollback remove with insert
                        transaction.oldModels.forEach(oldModel => {
                            deferredQueries.push(this.insertTransaction(transaction.model, oldModel))
                        })
                        break;
                    case "update":
                        //Rollback update with update
                        transaction.oldModels.forEach(oldModel => {
                            const find = {
                                _id: oldModel._id
                            }
                            deferredQueries.push(this.updateTransaction(transaction.model, find, oldModel))
                        })
                        break;
                    case "remove":
                        //Rollback insert with remove
                        transaction.oldModels.forEach(oldModel => {
                            const find = {
                                _id: oldModel._id
                            }
                            deferredQueries.push(this.removeTransaction(transaction.model, find))
                        })
                        break;
                }
            })
            Promise.all(deferredQueries)
                .then(data => {

                })
                .catch(err => {

                })
        } catch (err) {

        }
    }

}