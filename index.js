const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 9000;
const app = express();


const corsOptions = {
    origin: ['http://localhost:5173','http://localhost:5174' ],
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lggq9by.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
    const volunteerNeedsCollection = client.db("Volunteer-Management").collection("Volunteer Needs")

        app.get('/volunteerNeeds', async (req, res) => {
            const result = await volunteerNeedsCollection.find().sort({ deadline: 1 }).toArray();
            res.send(result);
        })

        app.get('/NeedVolunteer/:id', async (req, res) => {
            const id = req.params.id
            const query = {_id: new ObjectId(id)}
            const result = await volunteerNeedsCollection.findOne(query)
            res.send(result);
        })





        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Volunteer Server is running')
})

app.listen(port, () => console.log(`Server running on port :  ${port}`))