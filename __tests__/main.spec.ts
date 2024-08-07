import Transaction from '../src/main'

import * as mongoose from 'mongoose'

// @ts-expect-error private variable
mongoose.Promise = global.Promise

mongoose.connection
    // .once('open', () => { })
    .on('error', (err) => console.warn('Warning', err))

const personSchema = new mongoose.Schema({
    age: Number,
    contact: {
        email: {
            alias: 'email',
            index: true,
            sparse: true,
            type: String,
            unique: true,
        },
    },
    name: String,
})

const carSchema = new mongoose.Schema({
    age: Number,
    name: String,
})

const Person = mongoose.model('Person', personSchema)

const Car = mongoose.model('Car', carSchema)

const transaction = new Transaction()

async function dropCollections() {
    await Person.deleteMany({})
    await Car.deleteMany({})
}

describe('Transaction run ', () => {
    // Read more about fake timers: http://facebook.github.io/jest/docs/en/timer-mocks.html#content
    // jest.useFakeTimers();

    beforeAll(async () => {
        await mongoose.connect('mongodb://localhost/mongoose-transactions')
    })

    //   afterAll(async () => {
    //     await dropCollections();
    //   });

    beforeEach(async () => {
        await dropCollections()
        transaction.clean()
    })

    test('insert', async () => {
        const person = 'Person'

        const jonathanObject = {
            age: 18,
            name: 'Jonathan',
        }

        transaction.insert(person, personSchema, jonathanObject)

        const final = await transaction.run().catch(console.error)

        const jonathan = await Person.findOne(jonathanObject).exec()

        expect(jonathan.name).toBe(jonathanObject.name)

        expect(jonathan.age).toBe(jonathanObject.age)

        expect(final).toBeInstanceOf(Array)

        expect(final.length).toBe(1)
    })

    test('it should raise a duplicate key error', async () => {
        const person = 'Person'

        const jonathanObject = {
            age: 18,
            email: 'myemail@blabla.com',
            name: 'Jonathan',
        }

        const tonyObject = {
            age: 29,
            email: 'myemail@blabla.com',
            name: 'tony',
        }

        transaction.insert(person, personSchema, jonathanObject)

        transaction.insert(person, personSchema, tonyObject)

        try {
            const final = await transaction.run()

            expect(final).toBeFalsy()
        } catch (error) {
            expect(error).toBeTruthy()

            expect(error.error.code).toBe(11000)
        }
    })

    test('update', async () => {
        const person = 'Person'

        const tonyObject = {
            age: 28,
            name: 'Tony',
        }

        const nicolaObject = {
            age: 32,
            name: 'Nicola',
        }

        const personId = transaction.insert(person, personSchema, tonyObject)

        transaction.update(person, personSchema, personId, nicolaObject)

        const final = await transaction.run()

        const nicola = await Person.findOne(nicolaObject).exec()

        expect(nicola.name).toBe(nicolaObject.name)

        expect(nicola.age).toBe(nicolaObject.age)

        expect(final).toBeInstanceOf(Array)

        expect(final.length).toBe(2)
    })

    test('remove', async () => {
        const person = 'Person'

        const bobObject = {
            age: 45,
            name: 'Bob',
        }

        const aliceObject = {
            age: 23,
            name: 'Alice',
        }

        const personId = transaction.insert(person, personSchema, bobObject)

        transaction.update(person, personSchema, personId, aliceObject)

        transaction.remove(person, personSchema, personId)

        const final = await transaction.run()

        const bob = await Person.findOne(bobObject).exec()

        const alice = await Person.findOne(aliceObject).exec()

        expect(final).toBeInstanceOf(Array)

        expect(final.length).toBe(3)

        expect(alice).toBeNull()

        expect(bob).toBeNull()
    })

    test('Fail remove', async () => {
        const person = 'Person'

        const bobObject = {
            age: 45,
            name: 'Bob',
        }

        const aliceObject = {
            age: 23,
            name: 'Alice',
        }

        const personId = transaction.insert(person, personSchema, bobObject)

        transaction.update(person, personSchema, personId, aliceObject)

        const failObjectId = new mongoose.Types.ObjectId()

        transaction.remove(person, personSchema, failObjectId)

        expect(personId).not.toEqual(failObjectId)

        try {
            await transaction.run()
        } catch (error) {
            expect(error.executedTransactions).toEqual(2)

            expect(error.remainingTransactions).toEqual(1)

            expect(error.error.error.message).toBe('Entity not found')

            expect(error.data).toEqual(failObjectId)
        }
    })

    test('Fail remove with rollback', async () => {
        const person = 'Person'

        const bobObject = {
            age: 45,
            name: 'Bob',
        }

        const aliceObject = {
            age: 23,
            name: 'Alice',
        }

        const personId = transaction.insert(person, personSchema, bobObject)

        transaction.update(person, personSchema, personId, aliceObject)

        const failObjectId = new mongoose.Types.ObjectId()

        transaction.remove(person, personSchema, failObjectId)

        expect(personId).not.toEqual(failObjectId)

        try {
            await transaction.run()
        } catch (error) {
            expect(error.executedTransactions).toEqual(2)

            expect(error.remainingTransactions).toEqual(1)

            expect(error.error.error.message).toBe('Entity not found')

            expect(error.data).toEqual(failObjectId)

            const rollbackObj = await transaction
                .rollback()
                .catch(console.error)

            // First revert update of bob object to alice
            expect(rollbackObj[0].name).toBe(aliceObject.name)
            expect(rollbackObj[0].age).toBe(aliceObject.age)
            // Then revert the insert of bob object
            expect(rollbackObj[1].name).toBe(bobObject.name)
            expect(rollbackObj[1].age).toBe(bobObject.age)
        }
    })

    test('Fail remove with rollback and clean, multiple update, run and insert', async () => {
        const person = 'Person'

        const bobObject = {
            age: 45,
            name: 'Bob',
        }

        const aliceObject = {
            age: 23,
            name: 'Alice',
        }

        const bobId = transaction.insert(person, personSchema, bobObject)

        const insertRun = await transaction.run()

        const bobFind = await Person.findOne({ _id: bobId }).exec()
        expect(bobFind.name).toBe(bobObject.name)
        expect(bobFind.age).toBe(bobObject.age)
        expect(insertRun).toBeInstanceOf(Array)
        expect(insertRun.length).toBe(1)

        transaction.clean()

        const aliceId = transaction.insert(person, personSchema, aliceObject)

        expect(bobId).not.toEqual(aliceId)

        // Invert bob and alice
        transaction.update(person, personSchema, bobId, { name: 'Maria' })

        transaction.update(person, personSchema, aliceId, { name: 'Giuseppe' })

        const failObjectId = new mongoose.Types.ObjectId()
        // ERROR REMOVE
        transaction.remove(person, personSchema, failObjectId)

        expect(bobId).not.toEqual(failObjectId)
        expect(aliceId).not.toEqual(failObjectId)

        try {
            await transaction.run()
        } catch (error) {
            // expect(error).toBeNaN()

            expect(error.executedTransactions).toEqual(3)

            expect(error.remainingTransactions).toEqual(1)

            expect(error.error.error.message).toBe('Entity not found')

            expect(error.data).toEqual(failObjectId)

            const rollbacks = await transaction.rollback().catch(console.error)

            // expect(rollbacks).toBeNaN()

            // First revert update of bob object to alice
            expect(rollbacks[0].name).toBe('Giuseppe')
            expect(rollbacks[0].age).toBe(aliceObject.age)
            // Then revert the insert of bob object
            expect(rollbacks[1].name).toBe('Maria')
            expect(rollbacks[1].age).toBe(bobObject.age)

            const bob = await Person.findOne({ _id: bobId }).exec()
            expect(bob.name).toBe(bobObject.name)
            expect(bob.age).toBe(bobObject.age)

            const alice = await Person.findOne(aliceObject).exec()
            expect(alice).toBeNull()
        }
    })

    test('Fail update with rollback and clean, multiple update, run and remove', async () => {
        const person = 'Person'

        const bobObject = {
            age: 45,
            name: 'Bob',
        }

        const aliceObject = {
            age: 23,
            name: 'Alice',
        }

        const mariaObject = {
            age: 43,
            name: 'Maria',
        }

        const giuseppeObject = {
            age: 33,
            name: 'Giuseppe',
        }

        const bobId = transaction.insert(person, personSchema, bobObject)

        const insertRun = await transaction.run()

        const bobFind = await Person.findOne({ _id: bobId }).exec()
        expect(bobFind.name).toBe(bobObject.name)
        expect(bobFind.age).toBe(bobObject.age)
        expect(insertRun).toBeInstanceOf(Array)
        expect(insertRun.length).toBe(1)

        transaction.clean()

        const aliceId = transaction.insert(person, personSchema, aliceObject)

        expect(bobId).not.toEqual(aliceId)

        transaction.remove(person, personSchema, bobId)
        transaction.remove(person, personSchema, aliceId)

        const mariaId = transaction.insert(person, personSchema, mariaObject)
        expect(mariaId).not.toEqual(bobId)
        expect(mariaId).not.toEqual(aliceId)

        // Update maria
        transaction.update(person, personSchema, mariaId, giuseppeObject)

        // ERROR UPDATE
        transaction.update(person, personSchema, aliceId, { name: 'Error' })

        // unreachable transactions
        transaction.update(person, personSchema, mariaId, { name: 'unreachable' })
        transaction.insert(person, personSchema, { name: 'unreachable' })

        try {
            await transaction.run()
        } catch (error) {
            // expect(error).toBeNaN()

            expect(error.executedTransactions).toEqual(5)

            expect(error.remainingTransactions).toEqual(3)

            expect(error.error.error.message).toBe('Entity not found')

            expect(error.data.id).toEqual(aliceId)
            expect(error.data.data.name).toEqual('Error')

            const rollbacks = await transaction.rollback().catch(console.error)

            expect(rollbacks[0].name).toEqual(giuseppeObject.name)
            expect(rollbacks[0].age).toEqual(giuseppeObject.age)
            expect(rollbacks[1].name).toEqual(mariaObject.name)
            expect(rollbacks[1].age).toEqual(mariaObject.age)
            expect(rollbacks[2].name).toEqual(aliceObject.name)
            expect(rollbacks[2].age).toEqual(aliceObject.age)
            expect(rollbacks[3].name).toEqual(bobObject.name)
            expect(rollbacks[3].age).toEqual(bobObject.age)
            expect(rollbacks[4].name).toEqual(aliceObject.name)
            expect(rollbacks[4].age).toEqual(aliceObject.age)

            const results = await Person.find({}).lean().exec()

            expect(results.length).toBe(1)
            expect(results[0].name).toEqual(bobObject.name)
            expect(results[0].age).toEqual(bobObject.age)
        }
    })
})
