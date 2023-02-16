/*
 * Authors:
 * Hadar Shamir - 203535141
 * Raz Rachman - 209045517
 */

const express = require('express');
const router = express.Router();

//array of developers details
const developers = [
    {
        firstName: 'Hadar',
        lastName: 'Shamir',
        id: '203535141',
        email: 'hadar.shamir@gmail.com',
    },
    {
        firstName: 'Raz',
        lastName: 'Rachman',
        id: '209045517',
        email: 'razrachman@gmail.com',
    },
];

router.get('/', (req, res) => {
    res.json(developers);
});

module.exports = router;
