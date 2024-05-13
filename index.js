const express = require('express');
const cors = require('cors');
const jwt = require("jsonwebtoken")
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 9000;
const app = express();


const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())

const verifyToken = (req, res, next) => {
    const token = req.cookies?.token
    if (!token) return res.status(401).send({ message: 'Unauthorized access' })
    if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                console.log(err)
                return res.status(401).send({ message: 'Unauthorized access' })
            }
            console.log(decoded)

            req.user = decoded
            next()
        })
    }
}


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

        const addVolunteerCollection = client.db("Volunteer-Management").collection("AddVolunteer")
        const reqVolunteerCollection = client.db("Volunteer-Management").collection("Request Volunteer")



        app.post("/jwt", async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '365d' })
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"
            }).send({ success: true })
        })


        app.get('/logout', (req, res) => {
            res.clearCookie("token", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", maxAge: 0,
            }).send({ success: true })

        })


        app.get('/volunteerNeeds', async (req, res) => {
            const result = await addVolunteerCollection.find().sort({ deadLine: 1 }).toArray();
            res.send(result);
        })

        app.get('/NeedVolunteer/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await addVolunteerCollection.findOne(query)
            res.send(result);
        })
        app.get('/mySinglePost/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await addVolunteerCollection.findOne(query)
            res.send(result);
        })

        app.post('/addVolunteerPost', async (req, res) => {
            const addData = req.body


            const result = await addVolunteerCollection.insertOne(addData)
            res.send(result)
            console.log(result);
        })

        app.get('/myPosts/:email', verifyToken, async (req, res) => {
            const tokenEmail = req.user.email
            const email = req.params.email
            if (tokenEmail !== email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            // const token = req?.cookies?.token
            // if (token) {
            //     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            //         if (err) {
            //            return console.log(err);
            //         }
            //         console.log(decoded);
            //     })
            // }

            const query = { email: email }
            const result = await addVolunteerCollection.find(query).toArray()
            res.send(result);
        })



        app.delete('/myPost/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await addVolunteerCollection.deleteOne(query)
            res.send(result)
        })

        app.delete('/reqPost/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await reqVolunteerCollection.deleteOne(query)
            res.send(result)
        })

        app.put("/NeedVolunteerUpdate/:id", async (req, res) => {
            const query = { _id: new ObjectId(req.params.id) }
            const data = {
                $set: {
                    thumbnail: req.body.thumbnail,
                    postTitle: req.body.postTitle,
                    description: req.body.description,
                    category: req.body.category,
                    location: req.body.location,
                    volunteersNeeded: req.body.volunteersNeeded,
                    deadLine: req.body.deadLine,
                }
            }
            const result = await addVolunteerCollection.updateOne(query, data)
            res.send(result)
        })


        app.post('/reqVolunteerPost', async (req, res) => {
            const addData = req.body
            const query = {
                requestId: addData.requestId,
                requestEmail: addData.requestEmail

            }
            const alreadyApplied = await reqVolunteerCollection.findOne(query)
            console.log(alreadyApplied);
            if (alreadyApplied) {
                return res
                    .status(400)
                    .send("Already Requested for this post")
            }
            const result = await reqVolunteerCollection.insertOne(addData)
            res.send(result)
            console.log(result);
        })

        app.get('/reqFilteredPost/:postedEmail', async (req, res) => {
            const postedEmail = req.params.postedEmail
            const query = { postedEmail: postedEmail }
            const result = await reqVolunteerCollection.find(query).toArray()
            res.send(result);
        })





        // await client.db("admin").command({ ping: 1 });
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