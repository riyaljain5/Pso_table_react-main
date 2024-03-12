const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const PORT = 8000;
const PsoModel = require('./model');
const PercentageModel = require('./percentage')

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

mongoose
  .connect('mongodb://127.0.0.1:27017/project')
  .then(() => {
    console.log('Connected to the database');
    app.listen(PORT, () => console.log('Server is running on port 8000'));
  })
  .catch((err) => console.log(err));


// Fetch all PSOs
app.get('/', async (req, res) => {
  try {
    const data = await PsoModel.find({});
    res.json(data);
  } catch (error) {
    console.error('Error fetching data from MongoDB:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Save or update a PSO
app.post('/save', async (req, res) => {
  try {
    const { co, po, pso } = req.body;

    if (!co || !po || !pso) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    const existingPso = await PsoModel.findOne({ co });

    if (existingPso) {
      existingPso.po = po;
      existingPso.pso = pso;
      await existingPso.save();
    } else {
      const newPso = new PsoModel({ co, po, pso });
      await newPso.save();
    }

    res.status(201).json({ message: 'PSO saved successfully' });
  } catch (error) {
    console.error('Error saving data to MongoDB:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

///////////////////
// Update the /calculatePercentage endpoint

app.all('/calculatePercentage', async (req, res) => {
    try {
        const { co } = req.body;

        if (req.method === 'GET') {
            // If it's a GET request, use query parameters
            const queryParams = req.query;
            if (queryParams.co) {
                // If a specific CO is provided in the query parameters, calculate percentages for that CO only
                co = queryParams.co;
            }
        }

        let query = {};

        if (co) {
            // If a specific CO is provided, calculate percentages for that CO only
            query = { co };
        }

        const percentageData = await Promise.all(
            (await PsoModel.find(query)).map(async (item) => {
                // Custom percentage calculation for each PO column
                const customPercentages = item.po.map((value, index) => {
                    switch (index) {
                        case 0: // For PO1
                            return (value / 14) * 100;
                        case 1: // For PO2
                            return (value / 6) * 100;
                        // Add more cases for other PO columns if needed
                        default:
                            return (value / 10) * 100; // Default formula for other PO columns
                    }
                });

                // Save the custom percentage data to PercentageModel
                const customPercentageModel = new PercentageModel({
                    co: item.co,
                    percentage_po: customPercentages, // Update the field name
                });

                await customPercentageModel.save();

                return {
                    co: item.co,
                    poPercentage: customPercentages,
                };
            })
        );

        res.json(percentageData);
    } catch (error) {
        console.error('Error calculating and saving percentages:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
