
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

        const trans = await transaction.loadDbTransaction(transId)

        expect(trans.status).toBe('pending')

        await transaction.removeDbTransaction(transId)

        expect(await transaction.loadDbTransaction(transId)).toBeNull()

    })

    test('should create transaction, insert, update and run', async () => {

        const person: string = 'Person'

        const transId = await transaction.createTransaction()

        const tonyObject: any = {
            age: 28,
            name: 'Tony'
        }

        const nicolaObject: any = {
            age: 32,
            name: 'Nicola',
        }

        const id = transaction.insert(person, tonyObject)

        transaction.update(person, id, nicolaObject, { new: true })

        let final: any

        try {

            final = await transaction.run()

            expect(final).toBeInstanceOf(Array)
            expect(final.length).toBe(2)
            expect(final[0].name).toBe(tonyObject.name)
            expect(final[0].age).toBe(tonyObject.age)
            expect(final[1].name).toBe(tonyObject.name)
            expect(final[1].age).toBe(tonyObject.age)

            const trans = await transaction.loadDbTransaction(transId)

            console.log('trans =>', trans);

            expect(trans.status).toBe('Success')
            expect(trans.operations).toBeInstanceOf(Array)
            expect(trans.operations.length).toBe(2)
            expect(trans.operations[0].status).toBe('Success')
            expect(trans.operations[0].status).toBe('Success')

        } catch (error) {
            // console.error('run err =>', error)
        }

    })

})
