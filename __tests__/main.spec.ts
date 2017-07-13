
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


    test('transaction run insert', async () => {

        const data: any = {
            name: 'Bob',
            age: 32
        }
        const modelName: string = "Person"
        const type: string = "insert"
        const rollbackType: string = "remove"

        transaction.insert(modelName, data)

        await transaction.run()

        let bob: any = await Person.findOne(data).exec()

        console.log('bob =>', bob);

        expect(bob.name).toEqual(data.name)

        expect(bob.age).toEqual(data.age)

    });

    // test('transaction update function', async () => {

    //     const data: any = { age:23 }
    //     const modelName: string = "Person"
    //     const type: string = "update"
    //     const rollbackType: string = "update"
    //     const oldModel:any = { name: 'Toni', age: 22 }
    //     const find:any = { age: 22 }

    //     await Person.create(oldModel)

    //     await transaction.update(modelName, find, data)


    //     expect(transaction.transactions[0].type).toBe(type)
    //     expect(transaction.transactions[0].rollbackType).toBe(rollbackType)
    //     expect(transaction.transactions[0].model).toEqual(mongoose.model('Person'))
    //     expect(transaction.transactions[0].modelName).toBe(modelName)
    //     expect(transaction.transactions[0].oldModels).toEqual([oldModel])
    //     expect(transaction.transactions[0].findObj).toEqual(find)
    //     expect(transaction.transactions[0].data).toEqual([data])

    // });





})