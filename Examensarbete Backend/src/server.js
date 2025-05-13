require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


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

// Endpoint to fetch all team members
app.get('/api/team', (req, res) => {
  const filePath = path.join(__dirname, 'workTeamDb.json'); // Path to your workTeamDb.json

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.log("Error reading team data:", err);
      return res.status(500).json({ error: 'Error reading team data' });
    }

    const teamMembers = JSON.parse(data);

    // Update the image URL to point to the server's image folder
    const updatedTeamMembers = teamMembers.map(member => ({
      ...member,
      image: `http://localhost:${port}/images/${member.image}` // Correct image path
    }));

    res.json(updatedTeamMembers); // Return team data as a JSON response
  });
});

// Endpoint to handle email subscriptions
app.post('/api/subscribe', (req, res) => {
  const { email } = req.body;
  const filePath = path.join(__dirname, 'subscriptionsDb.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.log("Error reading subscription data:", err);
      return res.status(500).json({ error: 'Error reading subscription data' });
    }

    const subscriptions = JSON.parse(data);

    // Check if email already exists
    const emailExists = subscriptions.some(sub => sub.email === email);

    if (emailExists) {
      return res.status(400).json({ message: 'You are already subscribed.' });
    }

    // If not subscribed, add the email
    subscriptions.push({ email });

    fs.writeFile(filePath, JSON.stringify(subscriptions, null, 2), (err) => {
      if (err) {
        console.log("Error saving subscription data:", err);
        return res.status(500).json({ error: 'Error saving subscription data' });
      }

      res.status(200).json({ message: 'You have been successfully subscribed!' });
    });
  });
});

app.post('/create-checkout-session', async (req, res) => {
  const { products } = req.body;
  const filePath = path.join(__dirname, 'productDb.json');

  try {
    // Load product data from your database (JSON file)
    const data = fs.readFileSync(filePath, 'utf8');
    const allProducts = JSON.parse(data);

    // Match and verify products from frontend
    const lineItems = products.map(cartItem => {
      const matchedProduct = allProducts.find(p => p.id === cartItem.id);

      if (!matchedProduct) {
        throw new Error(`Product ID ${cartItem.id} not found`);
      }

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: matchedProduct.title,
            // images: [`http://localhost:${port}/images/${matchedProduct.image}`],
          },
          unit_amount: Math.round(matchedProduct.price * 100), // Stripe expects cents
        },
        quantity: cartItem.quantity,
      };
    });

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: 'http://localhost:5173/success', // Replace with your frontend success route
      cancel_url: 'http://localhost:5173/cancel',
      
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Stripe session error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
