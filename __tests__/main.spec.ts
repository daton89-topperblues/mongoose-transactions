
import Transaction from "../src/main";

import * as mongoose from 'mongoose';

const options: any = {
    useMongoClient: true
    /* other options */
}

mongoose.Promise = global.Promise //tslintexclude

mongoose.connection
    .once('open', () => { })
    .on('error', err => console.warn('Warning', err));

const personSchema = new mongoose.Schema({
    name: String,
    age: Number
})

const carSchema = new mongoose.Schema({
    name: String,
    age: Number
})

const Person = mongoose.model('Person', personSchema)

const Car = mongoose.model('Car', carSchema)

const transaction = new Transaction();

describe('Transaction run function', () => {

    // Read more about fake timers: http://facebook.github.io/jest/docs/en/timer-mocks.html#content
    jest.useFakeTimers();

    beforeAll(async () => {
        await mongoose.connect(`mongodb://localhost/mongoose-transactions`, options);
    });

    beforeEach(async () => {
        transaction.clean()
        await Person.remove({});
        await Car.remove({});
    });


    test('insert', async () => {

        const data: any = {
            name: 'Bob',
            age: 32
        }
        const modelName: string = "Person"

        transaction.insert(modelName, data)

        await transaction.run()

        let bob: any = await Person.findOne(data).exec()

        expect(bob.name).toBe(data.name)

        expect(bob.age).toBe(data.age)

    });

    test('update', async () => {

        const data: any = {
            name: 'Bob',
            age: 32
        }
        const modelName: string = "Person"
        const type: string = "insert"
        const rollbackType: string = "remove"

        const update: any = {
            name: 'Alice',
            age: 23
        }

        transaction.insert(modelName, data)

        transaction.update(modelName, data, update)

        await transaction.run()

        let alice: any = await Person.findOne(update).exec()

        expect(alice.name).toBe(update.name)

        expect(alice.age).toBe(update.age)

    });

    test('remove', async () => {

        const data: any = {
            name: 'Bob',
            age: 32
        }
        const modelName: string = "Person"
        const type: string = "insert"
        const rollbackType: string = "remove"

        const update: any = {
            name: 'Alice',
            age: 23
        }

        transaction.insert(modelName, data)

        transaction.update(modelName, data, update)

        transaction.remove(modelName, update)

        await transaction.run()

        let alice: any = await Person.findOne(update).exec()

        expect(alice).toEqual({})

    })

})