
import Transaction from "../src/main";

import * as mongoose from 'mongoose';

const options: any = {
    useMongoClient: true
    /* other options */
}

mongoose.connection
    .once('open', () => console.log('Connected to MongoDb'))
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

    // mongoose.connect('mongodb://127.0.0.1/mongoose-transactions', options);

    // mongoose.connection.on('error', function (err) {
    //     console.error('MongoDB connection error: ' + err);
    //     process.exit(-1);
    // });

    // mongoose.connection.on('connected', function () {
    //     console.error('MongoDB connected');
    // });

    beforeAll(async () => {
        await mongoose.connect(`mongodb://localhost/mongoose-transactions`, options);
    });

    // transaction.insert('Person', {
    //     name: 'Nick',
    //     age: 33
    // })

    // transaction.insert('Person', {
    //     name: 'Toni',
    //     age: 28
    // })

    // transaction.insert('Car', {
    //     name: 'Opel',
    //     age: 1
    // })

    // transaction.run()

    it('try create Person', async () => {

        await Car.create({ name: 'Opel', age: 22 })

        let opel = await Car.findOne({ name: 'Opel' })

        console.log('opel', opel)

        expect(opel.name).toBe('Opel')

    });

    // let hello: string;

    // // Act before assertions
    // beforeAll(async () => {
    //     const p: Promise<string> = greeter('John');
    //     jest.runOnlyPendingTimers();
    //     hello = await p;
    // });

    // // Assert if setTimeout was called properly
    // it('delays the greeting by 2 seconds', () => {
    //     expect((<jest.Mock<void>>setTimeout).mock.calls.length).toBe(1);
    //     expect((<jest.Mock<void>>setTimeout).mock.calls[0][1]).toBe(2000);
    // });

    // // Assert greeter result
    // it('greets a user with `Hello, {name}` message', () => {
    //     expect(hello).toBe('Hello, John');
    // });

})