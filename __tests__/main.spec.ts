
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

    beforeAll(async () => {
        await mongoose.connect(`mongodb://localhost/mongoose-transactions`, options);
    });

    it('Insert Person', async () => {

        await Person.create({ name: 'Toni', age: 22 })

        let toni = await Person.findOne({ name: 'Toni' })

        expect(toni.name).toBe('Toni')

    });

    it('Remove Person', async () => {

        let toni = await Person.remove({ name: 'Toni' })

        expect(toni.result.ok).toBe(1)

    });

    it('Insert Car', async () => {

        await Car.create({ name: 'Opel', age: 22 })

        let opel = await Car.findOne({ name: 'Opel' })

        expect(opel.name).toBe('Opel')

    });

    it('Remove Car', async () => {

        let opel = await Car.remove({ name: 'Opel' })

        expect(opel.result.ok).toBe(1)

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

})