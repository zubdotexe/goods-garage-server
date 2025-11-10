const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send({ message: "GoodsGarage server is running!" });
});

app.listen(port, () => {
    console.log(`GoodsGarage app listening on port ${port}`);
});
