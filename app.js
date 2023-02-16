/*
 * Authors:
 * Hadar Shamir - 203535141
 * Raz Rachman - 209045517
 */

const express = require('express');
const app = express();
const {User, CostItem, TotalReport} = require('./database/database');
const aboutRouter = require('./routes/about');
app.use(express.json());
app.use('/about', aboutRouter);

app.use('/addcost', (req, res, next) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
    } else {
        next();
    }
});

app.use('/report', (req, res, next) => {
    if (req.method !== 'GET') {
        res.status(405).send('Method Not Allowed');
    } else {
        next();
    }
});

app.post('/addcost', async (req, res) => {
    try {
        const { user_id, day, month, year, description, sum, category } = req.body;

        /* Validate body params */
        const validUserId = typeof user_id === 'string' && user_id.trim() !== '';
        const validYear = /^\d{4}$/.test(year);
        const validMonth = /^(0?[1-9]|1[012])$/.test(month);
        const validDay = /^([1-9]|[1-2][0-9]|3[0-1])$/.test(day);
        const validSum = /^\d+(\.\d{1,2})?$/.test(sum);

        if (!validUserId || !validYear || !validMonth || !validDay || !validSum) {
            return res.status(400).json({ error: 'Invalid body params' });
        }
        /* Check if the user exists */
        const userExists = await User.exists({ id: user_id });
        if (!userExists) {
            return res.status(400).json({ error: 'User not found' });
        }
        const costItem = new CostItem({ user_id, day, month, year, description, category, sum });
        await costItem.save();

        /* Find or create the TotalReport document for the given user, month, and year */
        await TotalReport.findOneAndUpdate(
            { user_id, year: Number(year), month: Number(month) },
            { $inc: { total: sum } },
            { new: true, upsert: true }
        );
        const user = await User.findOne({ id: user_id });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        await User.updateOne(
            { id: user_id },
            { $addToSet: { costs: costItem } }
        );

        res.status(200).json({ message: 'Cost item added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/report', async (req, res) => {
    try {
        const { user_id, year, month } = req.query;

        /* Validate query params */
        const validUserId = typeof user_id === 'string' && user_id.trim() !== '';
        const validYear = /^\d{4}$/.test(year);
        const validMonth = /^(0?[1-9]|1[012])$/.test(month);
        if (!validUserId || !validYear || !validMonth) {
            return res.status(400).json({ error: 'Invalid query params' });
        }

        /* Get the user with the specified id */
        const user = await User.findOne({ id: user_id });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        /* Get total report for the specified user and month/year */
        let totalReport = await TotalReport.findOne({ user_id, year: Number(year), month: Number(month) });

        /* If no total report found, create a new one */
        if (!totalReport) {
            totalReport = new TotalReport({
                user_id,
                year: Number(year),
                month: Number(month),
                total: 0,
            });
            await totalReport.save();
        }

        /* Get all cost items for the specified user and month/year */
        const costItems = await CostItem.find({ user_id, year: Number(year), month: Number(month) });

        /* Initialize the report object */
        const report = {
            food: [],
            health: [],
            housing: [],
            sport: [],
            education: [],
            transportation: [],
            other: [],
        };

        /* Calculate totals by category */
        const totalsByCategory = costItems.reduce((acc, item) => {
            acc[item.category] = acc[item.category] || { items: [] };
            acc[item.category].items.push({ day: item.day, description: item.description, sum: item.sum });
            return acc;
        }, {});

        /* Create report items and add to report */
        for (const category of Object.keys(totalsByCategory)) {
            const item = { category, items: totalsByCategory[category].items };
            report[category.toLowerCase()].push(item);
        }

        /* Update the total report */
        const totalSum = costItems.reduce((sum, item) => sum + item.sum, 0);
        totalReport.total = totalSum;
        await totalReport.save();

        console.log(`Total cost for user ${user_id}, year ${year}, month ${month}: ${totalSum}`);

        res.json(report);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = app;
