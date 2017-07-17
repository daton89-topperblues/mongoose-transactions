
import Transaction from "../src/main";

import * as mongoose from 'mongoose';

const options: any = {
    useMongoClient: true
}

// mongoose.Promise = global.Promise

mongoose.connection
    // .once('open', () => { })
    .on('error', (err) => console.warn('Warning', err));

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

const transaction = new Transaction();

async function dropCollections() {
    await Person.remove({});
    await Car.remove({});
}

describe('Transaction run ', () => {

    // Read more about fake timers: http://facebook.github.io/jest/docs/en/timer-mocks.html#content
    // jest.useFakeTimers();

    beforeAll(async () => {
        await mongoose.connect(`mongodb://localhost/mongoose-transactions`, options);
    });

    afterAll(async () => {
        await dropCollections()
    })

    beforeEach(async () => {
        await dropCollections()
        transaction.clean()
    });

    test('insert', async () => {

        const person: string = "Person"

        const jonathanObject: any = {
            age: 18,
            name: 'Jonathan'
        }

        transaction.insert(person, jonathanObject)

        const final = await transaction.run().catch(console.error)

        const jonathan: any = await Person.findOne(jonathanObject).exec()

        expect(jonathan.name).toBe(jonathanObject.name)

        expect(jonathan.age).toBe(jonathanObject.age)

        expect(final).toBeInstanceOf(Array)

        expect(final.length).toBe(1)

    });

    test('update', async () => {

        const person: string = "Person"

        const tonyObject: any = {
            age: 28,
            name: 'Tony'
        }

        const nicolaObject: any = {
            age: 32,
            name: 'Nicola',
        }

        transaction.insert(person, tonyObject)

        transaction.update(person, tonyObject, nicolaObject)

        const final = await transaction.run()

        const nicola: any = await Person.findOne(nicolaObject).exec()

        expect(nicola.name).toBe(nicolaObject.name)

        expect(nicola.age).toBe(nicolaObject.age)

        expect(final).toBeInstanceOf(Array)

        expect(final.length).toBe(2)

    });

    test('remove', async () => {

        const person: string = "Person"

        const bobObject: any = {
            age: 45,
            name: 'Bob',
        }

        const aliceObject: any = {
            age: 23,
            name: 'Alice',
        }

        transaction.insert(person, bobObject)

        transaction.update(person, bobObject, aliceObject)

        transaction.remove(person, aliceObject)

        const final = await transaction.run()

        const bob: any = await Person.findOne(bobObject).exec()

        const alice: any = await Person.findOne(aliceObject).exec()

        expect(final).toBeInstanceOf(Array)

        expect(final.length).toBe(3)

        expect(alice).toBeNull()

        expect(bob).toBeNull()

    })

    test('Fail remove', async () => {

        const person: string = "Person"

        const bobObject: any = {
            age: 45,
            name: 'Bob',
        }

        const aliceObject: any = {
            age: 23,
            name: 'Alice',
        }

        transaction.insert(person, bobObject)

        transaction.update(person, bobObject, aliceObject)

        transaction.remove(person, { name: 'pippo' })

        try {

            const final = await transaction.run()

        } catch (error) {

            expect(error.executedTransactions).toEqual(2)

            expect(error.remainingTransactions).toEqual(1)

            expect(error.error.message).toBe('Entity not found')

            expect(error.data).toEqual({ name: 'pippo' })
        }

    })
})
