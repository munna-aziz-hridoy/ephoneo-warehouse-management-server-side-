const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.lq3tm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send({ message: "server connected" });
});

const run = async () => {
  await client.connect();
  const itemsCollection = client.db("warehouse").collection("items");

  const verifyJWT = (req, res, next) => {
    const accessToken = req.headers.authorization;
    if (!accessToken) {
      res.status(401).send({ message: "Unauthorized Access" });
      return;
    }
    const token = accessToken.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        res.status(403).send({ message: "Forbidden Access" });
        return;
      }
      req.decoded = decoded;
      next();
    });
  };

  const runGetProduct = async (limit) => {
    try {
      const cursor = itemsCollection.find({});

      let products;
      if (limit !== "undefined") {
        const limitItem = parseInt(limit);
        products = cursor.limit(limitItem).toArray();
      } else {
        products = cursor.toArray();
      }
      return products;
    } finally {
    }
  };

  const rungetUserProduct = async (email) => {
    try {
      const cursor = itemsCollection.find({ email });
      const product = await cursor.toArray();
      return product;
    } finally {
    }
  };

  const runAddProduct = async (product) => {
    try {
      const result = await itemsCollection.insertOne(product);
      return result;
    } finally {
    }
  };

  const runGetSingleProduct = async (id) => {
    try {
      const query = { _id: ObjectId(id) };
      const product = await itemsCollection.findOne(query);
      return product;
    } finally {
    }
  };

  const runDeleteProduct = async (id) => {
    try {
      const filter = { _id: ObjectId(id) };
      const result = await itemsCollection.deleteOne(filter);
      return result;
    } finally {
    }
  };

  const runUpdateProduct = async (id, product) => {
    try {
      const { quantity, sold } = product;
      const filter = { _id: ObjectId(id) };
      const updateDoc = { $set: { quantity: quantity, sold: sold } };
      const options = { upsert: true };
      const result = await itemsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      return result;
    } finally {
    }
  };

  app.get("/products", async (req, res) => {
    const limit = req.query.limit;
    const products = await runGetProduct(limit).catch();
    res.send(products);
  });

  app.get("/singleProduct", async (req, res) => {
    const id = req.query.id;
    const product = await runGetSingleProduct(id).catch();
    res.send(product);
  });

  app.get("/myitems", verifyJWT, async (req, res) => {
    const email = req.query.email;
    if (email === req.decoded?.email) {
      const products = await rungetUserProduct(email);
      res.send(products);
    } else {
      res.status(403).send({ message: "unauthorized access" });
    }
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

  app.put("/update/:id", async (req, res) => {
    const product = req.body;
    const id = req.params.id;
    runUpdateProduct(id, product).catch;
  });

  app.post("/getToken", async (req, res) => {
    const user = req.body;
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "3d",
    });
    res.send({ accessToken });
  });
};

run().catch(console.dir);

app.listen(port, () => {
  console.log("Server is running :D");
});
