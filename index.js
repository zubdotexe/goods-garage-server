const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.iq0iryo.mongodb.net/?appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const db = client.db("goods_garage");
        const productsColl = db.collection("products");
        const usersColl = db.collection("users");

        // products related APIs

        app.get("/products", async (req, res) => {
            const cursor = productsColl.find({});
            const result = await cursor.toArray();
            res.send(result);
        });

        app.post("/products", async (req, res) => {
            const newProduct = req.body;
            const result = await productsColl.insertOne(newProduct);
            res.send(result);
        });

        app.patch("/products/:id", async (req, res) => {
            const updatedProduct = req.body;
            const productId = req.params.id;
            const query = { _id: new ObjectId(productId) };
            const update = { $set: updatedProduct };

            const options = {};
            const result = await productsColl.updateOne(query, update, options);

            return res.send(result);
        });

        app.delete("/products/:id", async (req, res) => {
            const productId = req.params.id;
            const query = { _id: new ObjectId(productId) };
            const result = await productsColl.deleteOne(query);

            return res.send(result);
        });

        // users related APIs

        app.post("/users", async (req, res) => {
            const newUser = req.body;
            const result = await usersColl.insertOne(newUser);

            return res.send(result);
        });

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send({ message: "GoodsGarage server is running!" });
});

app.listen(port, () => {
    console.log(`GoodsGarage app listening on port ${port}`);
});
