![mongoose-transactions](https://raw.githubusercontent.com/daton89-topperblues/mongoose-transactions/master/docs/img/mongoose-transactions.png)
# Introduction
###### Atomicity and Transactions for mongoose
A transaction is a sequential group of database manipulation operations, which is performed as if it were one single work unit. In other words, a transaction will never be complete unless each individual operation within the group is successful. If any operation within the transaction fails, the entire transaction will fail.

With this module, you can :

Practically, you will club many MongoDB queries into a group and you will execute all of them together as a part of a transaction.

### Getting started
Install module in your project: 
```sh
$ npm i -S mongoose-transactions
```

#### API
Create new instance:
```js
const Transaction = require('mongoose-transactions')

const transaction = new Transaction()
```
Add an operation:
```js
/**
 * Create the insert transaction and rollback states.
 * @param modelName - The string containing the mongoose model name.
 * @param data - The object containing data to insert into mongoose model.
 * @returns id - The id of the object to insert.
 */
const id = transaction.insert('modelName', object)
/**
 * Create the findOneAndUpdate transaction and rollback states.
 * @param modelName - The string containing the mongoose model name.
 * @param findId - The id of the object to update.
 * @param dataObj - The object containing data to update into mongoose model.
 */
transaction.update('modelName', id, object)
/**
 * Create the remove transaction and rollback states.
 * @param modelName - The string containing the mongoose model name.
 * @param findObj - The object containing data to find mongoose collection.
 */
transaction.remove('modelName', id)
```
Run operations:
```js
/**
 * Run the operations and check errors.
 * @returns Array of objects - The objects returned by operations
 *          Error - The error object containing:
 *                  data - the input data of operation
 *                  error - the error returned by the operation
 *                  executedTransactions - the number of executed operations
 *                  remainingTransactions - the number of the not executed operations
 */
transaction.run() // return Promise 
```
Rollback operations:
```js
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
transaction.rollback() // return Promise
```
Clean operations:
```js
/**
 * Clean the transactions object to begin a new transaction on the same instance.
 */
transaction.clean() // clean the prevoious operation
```
Full example: 
```js
const Transaction = require('mongoose-transactions') 
const transaction = new Transaction()

const person: string = "Person" // the name of the compiled model

const jonathanObject: any = {
    age: 18,
    name: 'Jonathan'
}
const aliceObject: any = {
    age: 23,
    name: 'Alice',
}
try {
    const jonathanId = transaction.insert(person, jonathanObject)
    transaction.update(person, jonathanId, aliceObject)
    transaction.remove(person, 'fakeId') // this operation fail
    const final = await transaction.run()
    // expect(final[0].name).toBe('Jonathan')
} catch (error) {
    console.error(error)
    const rollbackObj = await transaction.rollback().catch(console.error)
    transaction.clean()
    //  expect(rollbacks[0].name).toBe('Alice')
    //  expect(rollbacks[0].age).toBe(aliceObject.age)
    //  expect(rollbacks[1].name).toBe('Jonathan')
    //  expect(rollbacks[1].age).toBe(bobObject.age)    
}
```

See tests for more examples

### Contribute

Clone repository locally and install dependencies:
```sh
$ git clone https://github.com/topperblues/mongoose-transactions.git
$ cd mongoose-transactions
$ npm i
```

Currently runs with:

Node.js v8.1.4
Mongoose v4.11.1
Typescript v2.4.1
Jest v20.0.4

### Contributors 
[@topperblues](https://github.com/topperblues) Nicola Bonavita
[@daton89](https://github.com/daton89) Toni D'Angelo
