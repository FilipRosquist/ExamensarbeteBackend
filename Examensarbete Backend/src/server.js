require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'images')));

app.get('/products', (req, res) => {
  const filePath = path.join(__dirname, 'productDb.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.log("Error reading product data:", err);
      return res.status(500).json({ error: 'Error reading product data' });
    }

    const products = JSON.parse(data);

    const updatedProducts = products.map(product => ({
      ...product,
      image: `http://localhost:${port}/images/${product.image}`
    }));

    res.json(updatedProducts);
  });
});

app.get('/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const filePath = path.join(__dirname, 'productDb.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.log("Error reading product data:", err);
      return res.status(500).json({ error: 'Error reading product data' });
    }

    const products = JSON.parse(data);
    const product = products.find(p => p.id === productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updatedProduct = {
      ...product,
      image: `http://localhost:${port}/images/${product.image}`
    };

    res.json(updatedProduct);
  });
});

app.get('/api/team', (req, res) => {
  const filePath = path.join(__dirname, 'workTeamDb.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.log("Error reading team data:", err);
      return res.status(500).json({ error: 'Error reading team data' });
    }

    const teamMembers = JSON.parse(data);

    const updatedTeamMembers = teamMembers.map(member => ({
      ...member,
      image: `http://localhost:${port}/images/${member.image}`
    }));

    res.json(updatedTeamMembers);
  });
});

app.get('/api/reviews', (req, res) => {
  const filePath = path.join(__dirname, 'reviewsDb.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.log("Error reading review data:", err);
      return res.status(500).json({ error: 'Error reading review data' });
    }

    const reviews = JSON.parse(data);

    const updatedReviews = reviews.map(review => ({
      ...review,
      image: `http://localhost:${port}/images/${review.image}`
    }));

    res.json(updatedReviews);
  });
});

app.post('/api/subscribe', (req, res) => {
  const { email } = req.body;
  const filePath = path.join(__dirname, 'subscriptionsDb.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.log("Error reading subscription data:", err);
      return res.status(500).json({ error: 'Error reading subscription data' });
    }

    const subscriptions = JSON.parse(data);

    if (subscriptions.some(sub => sub.email === email)) {
      return res.status(400).json({ message: 'You are already subscribed.' });
    }

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

  try {
    const customer = await stripe.customers.create();

    console.log('Created new Stripe customer:', customer.id);

    const filePath = path.join(__dirname, 'productDb.json');
    const data = fs.readFileSync(filePath, 'utf8');
    const allProducts = JSON.parse(data);

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
          },
          unit_amount: Math.round(matchedProduct.price * 100),
        },
        quantity: cartItem.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      billing_address_collection: 'required',
      line_items: lineItems,
      success_url: 'http://localhost:5173/success',
      cancel_url: 'http://localhost:5173/cancel',
      customer: customer.id,
    });

    console.log('Created Stripe checkout session:', session.id, 'with customer:', session.customer);

    res.json({ id: session.id });
  } catch (error) {
    console.error("Stripe session creation error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
