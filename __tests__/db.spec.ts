
import Transaction from "../src/main";

import * as mongoose from 'mongoose';

// mongoose.Promise = global.Promise

describe('Transaction using DB ', () => {

    const options: any = {
        useMongoClient: true
    }

    mongoose.connection
        // .once('open', () => { })
        .on('error', (err) => console.warn('Warning', err))

    let transaction: any

    const personSchema = new mongoose.Schema({
        age: Number,
        name: String
    })

    const carSchema = new mongoose.Schema({
        age: Number,
        name: String
    })

    const Person = mongoose.model('Person', personSchema)

    const Car = mongoose.model('Car', carSchema)

    async function dropCollections() {
        await Person.remove({});
        await Car.remove({});
    }

    /**
     * connect to database
     */
    beforeAll(async () => {
        await mongoose.connect(`mongodb://localhost/mongoose-transactions`, options)
    });

    /**
     * drop database collections
     * create new Transaction using database storage
     */
    beforeEach(async () => {
        await dropCollections()
        const useDB = true
        transaction = new Transaction(useDB)
    })

    /**
     * drop database collections
     * close database connection
     */
    afterAll(async () => {
        await dropCollections()
        await mongoose.connection.close()
    })

    /**
     * remove transactions collection from database
     */
    afterEach(async () => {
        await transaction.removeDbTransaction()
    })

    test('should create new transaction and remove it', async () => {

        const person: string = 'Person'

        const transId = await transaction.createTransaction()

        console.log('transId =>', transId)

        await transaction.loadDbTransaction(transId)

        const removed = await transaction.removeDbTransaction(transId)

        // TODO: find transaction and check it is null

    })

})
