const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static images from the 'images' folder
app.use('/images', express.static(path.join(__dirname, 'images')));

// Endpoint to fetch all products
app.get('/products', (req, res) => {
  const filePath = path.join(__dirname, 'productDb.json'); // Path to your productDb.json

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.log("Error reading product data:", err);
      return res.status(500).json({ error: 'Error reading product data' });
    }

    const products = JSON.parse(data);

    // Update the image URL to point to the server's image folder
    const updatedProducts = products.map(product => ({
      ...product,
      image: `http://localhost:${port}/images/${product.image}` // Correct image path
    }));

    res.json(updatedProducts); // Return product data as a JSON response
  });
});

// Endpoint to fetch a specific product by ID
app.get('/products/:id', (req, res) => {
  const productId = req.params.id;
  console.log(`Fetching product with id: ${productId}`);  // Logs the product ID requested
  const filePath = path.join(__dirname, 'productDb.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.log("Error reading product data:", err);
      return res.status(500).json({ error: 'Error reading product data' });
    }

    const products = JSON.parse(data);
    const product = products.find(p => p.id === parseInt(productId));

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updatedProduct = {
      ...product,
      image: `http://localhost:${port}/images/${product.image}` // Correct image path
    };

    res.json(updatedProduct);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
