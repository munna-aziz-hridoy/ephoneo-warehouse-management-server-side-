const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.lq3tm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

client.connect(() => console.log("DB connected"));
const itemsCollection = client.db("warehouse").collection("items");

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("server is connected");
});

const runGetProduct = async () => {
  const cursor = itemsCollection.find({});
  const products = await cursor.toArray();
  return products;
};

app.get("/products", async (req, res) => {
  const products = await runGetProduct().catch();
  res.send(products);
});

app.listen(port, () => {
  console.log("Server is running :D");
});
