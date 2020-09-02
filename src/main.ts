import * as mongoose from 'mongoose'
import {
    TransactionModel,
    Operation,
    Status
} from './mongooseTransactions.collection'

/** Class representing a transaction. */
export default class Transaction {
    /** Index used for retrieve the executed transaction in the run */
    private rollbackIndex = 0

    /** Boolean value for enable or disable saving transaction on db */
    private useDb: boolean = false

    /** The id of the current transaction document on database */
    private transactionId = ''

    /** The actions to execute on mongoose collections when transaction run is called */
    private operations: Operation[] = []

    /**
     * Create a transaction.
     * @param useDb - The boolean parameter allow to use transaction collection on db (default false)
     * @param transactionId - The id of the transaction to load, load the transaction
     *                        from db if you set useDb true (default "")
     */
    constructor(useDb = false) {
        this.useDb = useDb
        this.transactionId = ''
    }

    /**
     * Load transaction from transaction collection on db.
     * @param transactionId - The id of the transaction to load.
     * @trows Error - Throws error if the transaction is not found
     */
    public async loadDbTransaction(transactionId: string) {
        const loadedTransaction = await TransactionModel.findOne({
            _id: transactionId
        })
            .lean()
            .exec()

        if (!loadedTransaction) return null

        loadedTransaction.operations.forEach(operation => {
            operation.model = mongoose.model(operation.modelName)
        })
        this.operations = loadedTransaction.operations
        this.rollbackIndex = loadedTransaction.rollbackIndex
        this.transactionId = transactionId

        return loadedTransaction
    }

    /**
     * Remove transaction from transaction collection on db,
     * if the transactionId param is null, remove all documents in the collection.
     * @param transactionId - Optional. The id of the transaction to remove (default null).
     */
    public async removeDbTransaction(transactionId = null) {
        try {
            if (transactionId === null) {
                await TransactionModel.deleteMany({}).exec()
            } else {
                await TransactionModel.deleteOne({ _id: transactionId }).exec()
            }
        } catch (error) {
            throw new Error('Fail remove transaction[s] in removeDbTransaction')
        }
    }

    /**
     * If the instance is db true, return the actual or new transaction id.
     * @throws Error - Throws error if the instance is not a db instance.
     */
    public async getTransactionId() {
        if (this.transactionId === '') {
            await this.createTransaction()
        }
        return this.transactionId
    }

    /**
     * Get transaction operations array from transaction object or collection on db.
     * @param transactionId - Optional. If the transaction id is passed return the elements of the transaction id
     *                                  else return the elements of current transaction (default null).
     */
    public async getOperations(transactionId = null) {
        if (transactionId) {
            return await TransactionModel.findOne({ _id: transactionId })
                .lean()
                .exec()
        } else {
            return this.operations
        }
    }

    /**
     * Save transaction operations array on db.
     * @throws Error - Throws error if the instance is not a db instance.
     * @return transactionId - The transaction id on database
     */
    public async saveOperations() {
        if (this.transactionId === '') {
            await this.createTransaction()
        }

        await TransactionModel.updateOne(
            { _id: this.transactionId },
            {
                operations: this.operations,
                rollbackIndex: this.rollbackIndex
            }
        )

        return this.transactionId
    }

    /**
     * Clean the operations object to begin a new transaction on the same instance.
     */
    public async clean() {
        this.operations = []
        this.rollbackIndex = 0
        this.transactionId = ''
        if (this.useDb) {
            await this.createTransaction()
        }
    }

    /**
     * Create the insert transaction and rollback states.
     * @param modelName - The string containing the mongoose model name.
     * @param data - The object containing data to insert into mongoose model.
     * @returns id - The id of the object to insert.
     */
    public insert(
        modelName: string,
        data,
        options = {},
        additionalQuery = {}
    ): mongoose.Types.ObjectId {
        const model = mongoose.model(modelName)

        if (!data._id) {
            data._id = new mongoose.Types.ObjectId()
        }

        const operation: Operation = {
            data,
            findId: data._id,
            model,
            modelName,
            oldModel: null,
            options,
            additionalQuery,
            rollbackType: 'remove',
            status: Status.pending,
            type: 'insert'
        }

        this.operations.push(operation)

        return data._id
    }

    /**
     * Create the findOneAndUpdate transaction and rollback states.
     * @param modelName - The string containing the mongoose model name.
     * @param findId - The id of the object to update.
     * @param dataObj - The object containing data to update into mongoose model.
     */
    public update(modelName, findId, data, options = {}, additionalQuery = {}) {
        const model = mongoose.model(modelName)

        const operation: Operation = {
            data,
            findId,
            model,
            modelName,
            oldModel: null,
            options,
            additionalQuery,
            rollbackType: 'update',
            status: Status.pending,
            type: 'update'
        }

        this.operations.push(operation)

        return operation
    }

    /**
     * Create the remove transaction and rollback states.
     * @param modelName - The string containing the mongoose model name.
     * @param findObj - The object containing data to find mongoose collection.
     */
    public remove(modelName, findId, options = {}, additionalQuery = {}) {
        const model = mongoose.model(modelName)

        const operation: Operation = {
            data: null,
            findId,
            model,
            modelName,
            oldModel: null,
            options,
            additionalQuery,
            rollbackType: 'insert',
            status: Status.pending,
            type: 'remove'
        }

        this.operations.push(operation)

        return operation
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
    public async run() {
        if (this.useDb && this.transactionId === '') {
            await this.createTransaction()
        }

        const final = []

        return this.operations.reduce((promise, transaction, index) => {
            return promise.then(async result => {
                let operation: any = {}

                switch (transaction.type) {
                    case 'insert':
                        operation = this.insertTransaction(
                            transaction.model,
                            transaction.data
                        )
                        break
                    case 'update':
                        operation = this.findByIdTransaction(
                            transaction.model,
                            transaction.findId
                        ).then(findRes => {
                            transaction.oldModel = findRes
                            return this.updateTransaction(
                                transaction.model,
                                transaction.findId,
                                transaction.data,
                                transaction.options,
                                transaction.additionalQuery,
                            )
                        })
                        break
                    case 'remove':
                        operation = this.findByIdTransaction(
                            transaction.model,
                            transaction.findId
                        ).then(findRes => {
                            transaction.oldModel = findRes
                            return this.removeTransaction(
                                transaction.model,
                                transaction.findId
                            )
                        })
                        break
                }

                return operation
                    .then(async query => {
                        this.rollbackIndex = index
                        this.updateOperationStatus(Status.success, index)

                        if (index === this.operations.length - 1) {
                            await this.updateDbTransaction(Status.success)
                        }

                        final.push(query)
                        return final
                    })
                    .catch(async err => {
                        this.updateOperationStatus(Status.error, index)

                        await this.updateDbTransaction(Status.error)

                        throw err
                    })
            })
        }, Promise.resolve([]))
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
    public async rollback(howmany = this.rollbackIndex + 1) {
        if (this.useDb && this.transactionId === '') {
            await this.createTransaction()
        }

        let transactionsToRollback: any = this.operations.slice(
            0,
            this.rollbackIndex + 1
        )

        transactionsToRollback.reverse()

        if (howmany !== this.rollbackIndex + 1) {
            transactionsToRollback = transactionsToRollback.slice(0, howmany)
        }

        const final = []

        return transactionsToRollback.reduce((promise, transaction, index) => {
            return promise.then(result => {
                let operation: any = {}

                switch (transaction.rollbackType) {
                    case 'insert':
                        operation = this.insertTransaction(
                            transaction.model,
                            transaction.oldModel
                        )
                        break
                    case 'update':
                        operation = this.updateTransaction(
                            transaction.model,
                            transaction.findId,
                            transaction.oldModel
                        )
                        break
                    case 'remove':
                        operation = this.removeTransaction(
                            transaction.model,
                            transaction.findId
                        )
                        break
                }

                return operation
                    .then(async query => {
                        this.rollbackIndex--

                        this.updateOperationStatus(Status.rollback, index)
                        if (index === this.operations.length - 1) {
                            await this.updateDbTransaction(Status.rollback)
                        }

                        final.push(query)
                        return final
                    })
                    .catch(async err => {
                        this.updateOperationStatus(Status.errorRollback, index)
                        await this.updateDbTransaction(Status.errorRollback)

                        throw err
                    })
            })
        }, Promise.resolve([]))
    }

    private async findByIdTransaction(model, findId) {
        return await model
            .findOne({ _id: findId })
            .lean()
            .exec()
    }

    private async createTransaction() {
        if (!this.useDb) {
            throw new Error('You must set useDB true in the constructor')
        }

        const transaction = await TransactionModel.create({
            operations: this.operations,
            rollbackIndex: this.rollbackIndex
        })

        this.transactionId = transaction._id

        return transaction
    }

    private insertTransaction(model, data) {
        return new Promise((resolve, reject) => {
            model.create(data, (err, result) => {
                if (err) {
                    return reject(this.transactionError(err, data))
                } else {
                    return resolve(result)
                }
            })
        })
    }

    private updateTransaction(model, id, data, options = { new: false }, additionalQuery = {}) {
        return new Promise((resolve, reject) => {
            model.findOneAndUpdate(
                { _id: id, ...additionalQuery },
                data,
                options,
                (err, result) => {
                    if (err) {
                        return reject(this.transactionError(err, { id, data }))
                    } else {
                        if (!result) {
                            return reject(
                                this.transactionError(
                                    new Error('Entity not found'),
                                    { id, data }
                                )
                            )
                        }
                        return resolve(result)
                    }
                }
            )
        })
    }

    private removeTransaction(model, id) {
        return new Promise((resolve, reject) => {
            model.findOneAndRemove({ _id: id }, (err, data) => {
                if (err) {
                    return reject(this.transactionError(err, id))
                } else {
                    if (data == null) {
                        return reject(
                            this.transactionError(
                                new Error('Entity not found'),
                                id
                            )
                        )
                    } else {
                        return resolve(data)
                    }
                }
            })
        })
    }

    private transactionError(error, data) {
        return {
            data,
            error,
            executedTransactions: this.rollbackIndex + 1,
            remainingTransactions:
                this.operations.length - (this.rollbackIndex + 1)
        }
    }

    private updateOperationStatus(status, index) {
        this.operations[index].status = status
    }

    private async updateDbTransaction(status) {
        if (this.useDb && this.transactionId !== '') {
            return await TransactionModel.findByIdAndUpdate(
                this.transactionId,
                {
                    operations: this.operations,
                    rollbackIndex: this.rollbackIndex,
                    status
                },
                { new: true }
            )
        }
    }
}
