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
        const exportsColl = db.collection("exports");

        // products related APIs

        app.get("/products", async (req, res) => {
            const cursor = productsColl.find({});
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get("/latest-products", async (req, res) => {
            const cursor = productsColl
                .find({})
                .sort({ created_at: -1 })
                .limit(6);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get("/products/:id", async (req, res) => {
            const productId = req.params.id;
            const query = { _id: new ObjectId(productId) };
            const result = await productsColl.findOne(query);

            return res.send(result);
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
            // let update = { $set: {} };
            let update;

            if (updatedProduct.importQty) {
                const oldProduct = await productsColl.findOne(query);

                if (oldProduct.available_quantity < updatedProduct.importQty) {
                    return res.status(400).send({
                        message: "You cannot import more than what's available",
                    });
                }

                if (
                    !Number.isNaN(updatedProduct.importQty) &&
                    !Number.isInteger(updatedProduct.importQty)
                ) {
                    console.log(
                        "type of importQty",
                        typeof updatedProduct.importQty
                    );

                    return res.status(400).send({ message: "invalid input" });
                }

                // update.$inc = { available_quantity: -updatedProduct.importQty };
                update = {
                    $inc: { available_quantity: -updatedProduct.importQty },
                };
            } else {
                // for (const key in updatedProduct) {
                //     update.$set[key] = updatedProduct[key];
                // }
                update = { $set: updatedProduct };
            }

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

        // exports related APIs

        app.get("/exports", async (req, res) => {
            const userEmail = req.query.email;
            const query = { exporter_email: userEmail };

            const pipeline = [
                {
                    $match: {
                        exporter_email: userEmail,
                    },
                },
                {
                    $addFields: {
                        productObjId: { $toObjectId: "$product" }, // convert string → ObjectId
                    },
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "productObjId",
                        foreignField: "_id",
                        as: "product_info",
                    },
                },
                {
                    $unwind: "$product_info",
                },
            ];

            const result = await exportsColl.aggregate(pipeline).toArray();

            // const cursor = exportsColl.find(query);
            // const result = await cursor.toArray();
            res.send(result);
        });

        app.post("/exports", async (req, res) => {
            const newExport = req.body;
            const result = await exportsColl.insertOne(newExport);

            return res.send(result);
        });

        // users related APIs

        app.post("/users", async (req, res) => {
            const newUser = req.body;
            const userEmail = newUser.email;
            query = { email: userEmail };
            const match = await usersColl.findOne(query);

            // check if the user already exists
            if (match) {
                return res.send({ message: "User already exists" });
            } else {
                const result = await usersColl.insertOne(newUser);
                return res.send(result);
            }
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
