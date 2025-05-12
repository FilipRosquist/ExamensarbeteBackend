const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express(); // ✅ Make sure this is defined first
const port = 3000;

app.use(cors());
app.use(express.json());

// ✅ Serve static images
app.use('/images', express.static(path.join(__dirname, 'images')));

// ✅ GET all products
app.get('/products', (req, res) => {
  const filePath = path.join(__dirname, 'productDb.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error reading product data' });

    const products = JSON.parse(data);
    const updatedProducts = products.map(product => ({
      ...product,
      image: `http://localhost:${port}/images/${product.image}`
    }));

    res.json(updatedProducts);
  });
});

// ✅ NEW: GET product by ID
app.get('/products/:id', (req, res) => {
  const filePath = path.join(__dirname, 'productDb.json');
  const productId = parseInt(req.params.id, 10);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error reading product data' });

    const products = JSON.parse(data);
    const product = products.find(p => p.id === productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Add full image URL
    product.image = `http://localhost:${port}/images/${product.image}`;
    res.json(product);
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
