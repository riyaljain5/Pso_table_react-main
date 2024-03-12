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

                return {
                    co: item.co,
                    poPercentage: customPercentages,
                };
            })
        );

        // Save the percentage data to PercentageModel
        await PercentageModel.deleteMany(query);
        await PercentageModel.insertMany(percentageData);

        res.json(percentageData);
    } catch (error) {
        console.error('Error calculating and saving percentages:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



mongoose
  .connect('mongodb://127.0.0.1:27017/project')
  .then(() => {
    console.log('Connected to the database');
    app.listen(PORT, () => console.log('Server is running on port 8000'));
  })
  .catch((err) => console.log(err));















// const express= require('express');
// const cors = require('cors');
// const mongoose = require('mongoose');
// const bodyParser = require("body-parser");
// const PORT = 8000
// const PsoModel= require('./model')


// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(bodyParser.json());

// let data = [];


// // Get all PSOs
// app.get("/", async (req, res) => {
//     try {
//         const data = await PsoModel.find({});
//         res.json(data);
//     } catch (error) {
//         console.error('Error fetching data from MongoDB:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });

// // Save a new PSO
// // Save a new PSO or update an existing one
// app.post("/save", async (req, res) => {
//     try {
//         const { co, po, pso } = req.body;

//         if (!co || !po || !pso) {
//             return res.status(400).json({ message: 'Invalid request data' });
//         }

//         // Check if the row already exists based on the unique identifier (co)
//         const existingPso = await PsoModel.findOne({ co });

//         if (existingPso) {
//             // If the row exists, update the existing data
//             existingPso.po = po;
//             existingPso.pso = pso;
//             await existingPso.save();
//         } else {
//             // If the row doesn't exist, create a new one
//             const newPso = new PsoModel({ co, po, pso });
//             await newPso.save();
//         }

//         res.status(201).json({ message: 'PSO saved successfully' });
//     } catch (error) {
//         console.error('Error saving data to MongoDB:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });
// ////////
// app.get("/calculatePercentage", (req, res) => {
//     const percentageData = data.map((item) => {
//       // Replace this formula with your own logic
//       const totalPo = item.po.reduce((acc, po) => acc + po, 0);
//       const totalPso = item.pso.reduce((acc, pso) => acc + pso, 0);
  
//       const poPercentage = (totalPo / (12 * 100)) * 100;
//       const psoPercentage = (totalPso / (3 * 100)) * 100;
  
//       // Example formula: Percentage = (Total - 50) / 2
//       const customPercentage = (totalPo - 50) / 2;
  
//       return {
//         co: item.co,
//         poPercentage: poPercentage.toFixed(2),
//         psoPercentage: psoPercentage.toFixed(2),
//         customPercentage: customPercentage.toFixed(2),
//       };
//     });
  
//     res.json(percentageData);
//   });


// mongoose.connect("mongodb://127.0.0.1:27017/project")
// .then(()=>{
//     console.log("Connected to data base")
//     app.listen(PORT, ()=>console.log("server is running on port 8000"));
// })
// .catch((err)=>console.log(err)) 


