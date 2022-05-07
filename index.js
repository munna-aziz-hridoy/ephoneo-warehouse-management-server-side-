const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// mongodb
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
  // connect mongodb
  await client.connect();
  const itemsCollection = client.db("warehouse").collection("items");

  // verifying user with json web token
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
    });
    next();
  };

  // get product  based on limit
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

  // get the product user have added
  const rungetUserProduct = async (email) => {
    try {
      const cursor = itemsCollection.find({ email });
      const product = await cursor.toArray();
      return product;
    } finally {
    }
  };

  // post a product
  const runAddProduct = async (product) => {
    try {
      const result = await itemsCollection.insertOne(product);
      return result;
    } finally {
    }
  };

  // get single product for update route
  const runGetSingleProduct = async (id) => {
    try {
      const query = { _id: ObjectId(id) };
      const product = await itemsCollection.findOne(query);
      return product;
    } finally {
    }
  };

  // delete product
  const runDeleteProduct = async (id) => {
    try {
      const filter = { _id: ObjectId(id) };
      const result = await itemsCollection.deleteOne(filter);
      return result;
    } finally {
    }
  };

  // update product
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

  // get product api
  app.get("/products", async (req, res) => {
    const limit = parseInt(req.query.limit);
    const products = await runGetProduct(limit).catch();
    res.send(products);
  });

  // get single product api
  app.get("/singleProduct", async (req, res) => {
    const id = req.query.id;
    const product = await runGetSingleProduct(id).catch();
    res.send(product);
  });

  // get user added items api
  app.get("/myitems", verifyJWT, async (req, res) => {
    const email = req.query.email;
    if (email === req.decoded?.email) {
      const products = await rungetUserProduct(email);
      res.send(products);
    } else {
      res.status(403).send({ message: "unauthorized access" });
    }
  });

  // post product api
  app.post("/products", async (req, res) => {
    const product = req.body;
    const result = await runAddProduct(product);
    res.send(result);
  });

  // delete prodcut api
  app.delete("/delete/:id", async (req, res) => {
    const id = req.params.id;
    const result = await runDeleteProduct(id);
    res.send(result);
  });

  // product update api
  app.put("/update/:id", async (req, res) => {
    const product = req.body;
    const id = req.params.id;
    runUpdateProduct(id, product).catch;
  });

  // send jwt access token
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
