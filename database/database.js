/*
 * Authors:
 * Hadar Shamir - 203535141
 * Raz Rachman - 209045517
 */

const mongoose = require('mongoose');

/* The built-in crypto module in Node provides the randomUUID() method to generate UUIDs */
const crypto = require('crypto');

const connectionURI = 'mongodb+srv://project:lh4SQUNTH2VOFmhn@cluster0.putz6aa.mongodb.net/costmanager?retryWrites=true&w=majority';

mongoose.connect(connectionURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(error => console.error('Error connecting to MongoDB Atlas:', error));

mongoose.set('strictQuery', false);

/* User schema definition */
const User = mongoose.model('User', new mongoose.Schema({
    id: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    birthday: { type: Date, required: true }
}));

/* Cost item schema definition */
const CostItem = mongoose.model('CostItem', new mongoose.Schema({
    user_id: {type: String, required: true},
    day: {type: Number, required: true},
    month: {type: Number, required: true},
    year: {type: Number, required: true},
    id: {
        type: String,
        unique: true,
        default: () => {
            return crypto.randomUUID();
        },
    },
    description: {type: String, required: true},
    sum: {type: Number, required: true},
    category: {
        type: String,
        enum: ['food', 'housing', 'health', 'sport', 'education', 'transportation', 'other'],
        required: true,
    }
}));

/* Total report schema definition */
const TotalReport = mongoose.model('TotalReport', new mongoose.Schema({
    user_id: { type: String, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    total: { type: Number, default: 0 }
}));

//creates an imaginary user
async function createUser() {
    try {
        const user = new User({
            id: '123123',
            firstName: 'moshe',
            lastName: 'israeli',
            birthday: new Date(1990, 0, 11)
        });

        const doesUserExist = await User.findOne({ id: user.id });

        //Checks if the user exists
        if (doesUserExist) {
            return;
        }

        const newUser = await User.create(user);
        console.log('User created successfully');
        return newUser;
    } catch (error) {
        console.error(error);
    }
}

/* This will always be called when starting the app */
createUser().then(user => {
    if (user) {
        console.log(user);
    }
}).catch(console.error);

module.exports = {
    User,
    CostItem,
    TotalReport
};