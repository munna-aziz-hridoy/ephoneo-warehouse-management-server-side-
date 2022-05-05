const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

const runGetProduct = async (property) => {
  const { limit, email } = property;

  let cursor = itemsCollection.find({});
  if (email !== "undefined") {
    const query = { email };
    cursor = itemsCollection.find(query);
  } else {
    cursor = itemsCollection.find({});
  }

  let products;

  if (limit !== "undefined") {
    const limitItem = parseInt(limit);
    products = cursor.limit(limitItem).toArray();
  } else {
    products = cursor.toArray();
  }

  return products;
};

const runAddProduct = async (product) => {
  const result = await itemsCollection.insertOne(product);
  return result;
};

const runGetSingleProduct = async (id) => {
  const query = { _id: ObjectId(id) };
  const product = await itemsCollection.findOne(query);
  return product;
};

const runDeleteProduct = async (id) => {
  const filter = { _id: ObjectId(id) };
  const result = await itemsCollection.deleteOne(filter);
  return result;
};

app.get("/products", async (req, res) => {
  const property = req.query;
  const products = await runGetProduct(property).catch();
  res.send(products);
});

app.get("/singleProduct", async (req, res) => {
  const id = req.query.id;
  const product = await runGetSingleProduct(id).catch();
  res.send(product);
});

app.post("/products", async (req, res) => {
  const product = req.body;
  const result = await runAddProduct(product);
  res.send(result);
});

app.delete("/delete/:id", async (req, res) => {
  const id = req.params.id;
  const result = await runDeleteProduct(id);
  res.send(result);
});

app.listen(port, () => {
  console.log("Server is running :D");
});
