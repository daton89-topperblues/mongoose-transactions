import * as mongoose from "mongoose";

/** Class representing a transaction. */
class Transaction {
    /** The states of mongoose collections before run transaction, used for rollback */
    states: Array<{
        /** The executed transaction type */
        originalType: string,
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

    /** The actions to execute on mongoose collections when transaction run is called */
    transactions: Array<{
        /** The transaction type to run */   
        type: string,
        /** The mongoose model instance */                
        model: any,
        /** The mongoose model name */                        
        modelName: string,
        /** The object ... */                                
        findObj: object,
        /** The array of data ... */                                        
        data: any
    }> = [];


    /**
   * Create a transaction.
   * @param parameters - The parameters
   */
    constructor(parameters) {

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
                    const id = mongoose.Types.ObjectId().toString();
                    currentObj._id = id;
                }
            });
        } else {
            if (!data._id) {
                const id = mongoose.Types.ObjectId().toString();
                data._id = id;
            }
            data = [data];
        }
        const transactionObj = {
            type: "insert",
            model: model,
            modelName: modelName,
            findObj: {},
            data: data
        };
        const stateObj = {
            originalType: "insert",
            rollbackType: "remove",
            model: model,
            modelName: modelName,
            oldModels:null,
            findObj: {},
            data: {}
        };
        this.transactions.push(transactionObj);
        this.states.push(stateObj);
    }

    /**
   * Create the findOneAndUpdate transaction and rollback states.
   * @param modelName - The string containing the mongoose model name.
   * @param findObj - The object containing data to find mongoose collection.
   * @param dataObj - The object containing data to update into mongoose model.
   */
    update(modelName, findObj, data) {
        const model = mongoose.model(modelName);
        const oldModels = model.find(findObj);
        const transactionObj = {
            type: "findOneAndUpdate",
            model: model,
            modelName: modelName,
            findObj: findObj,
            data: data
        };
        const stateObj = {
            originalType: "findOneAndUpdate",
            rollbackType: "findOneAndUpdate",
            model: model,
            modelName: modelName,
            oldModels:oldModels,
            findObj: findObj,
            data: data
        };
        this.transactions.push(transactionObj);
        this.states.push(stateObj);
    }

    /**
   * Create the remove transaction and rollback states.
   * @param modelName - The string containing the mongoose model name.
   * @param findObj - The object containing data to find mongoose collection.
   */
    remove(modelName, findObj) {
        const model = mongoose.model(modelName);
        const oldModels = model.findOne(findObj);
        const transactionObj = {
            type: "remove",
            model: model,
            modelName: modelName,
            findObj: findObj,
            data: null
        };
        const stateObj = {
            originalType: "remove",
            rollbackType: "insert",
            model: model,
            modelName: modelName,
            oldModels:oldModels,
            findObj: findObj,
            data: null
        };
        this.transactions.push(transactionObj);
        this.states.push(stateObj);
    }

    /**
   * Run the transaction and check errors.
   */
    run() {

    }

    /**
   * Rollback the executed transactions if any error occurred.
   */
    rollback() {

    }

}