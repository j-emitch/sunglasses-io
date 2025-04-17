const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml'); // Replace './swagger.yaml' with the path to your Swagger file
const app = express();

app.use(bodyParser.json());

// Importing the data from JSON files
const users = require('../initial-data/users.json');
const brands = require('../initial-data/brands.json');
const products = require('../initial-data/products.json');

//replace by .env file
const jwtSecret = "88312679-04c9-4351-85ce-3ed75293b449"; 

// Error handling
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send('Something broke!');
});

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Starting the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

// Middleware for authentication (example for protected routes)
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });
        req.user = user;
        next();
    });
};

// Routes
app.get('/brands', (req, res) => {
    res.json(brands);
});

app.get('/brands/:id/products', (req, res) => {
    const brandId = req.params.id;
    const brandProducts = products.filter(product => product.brandId === brandId);
    if (brandProducts.length === 0) {
        return res.status(404).json({ error: 'Brand not found' });
    }
    res.json(brandProducts);
});

app.get('/products', (req, res) => {
    res.json(products);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, jwtSecret, { expiresIn: '1h' });
    res.json({ token });
});

app.get('/me/cart', authenticateToken, (req, res) => {
    const userCart = users.find(u => u.id === req.user.id)?.cart || [];
    res.json(userCart);
});

app.post('/me/cart', authenticateToken, (req, res) => {
    const { productId, quantity } = req.body;
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    user.cart.push({ productId, quantity });
    res.json(user.cart);
});

app.delete('/me/cart/:productId', authenticateToken, (req, res) => {
    const productId = req.params.productId;
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const productIndex = user.cart.findIndex(item => item.productId === productId);
    if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found in cart' });
    }
    user.cart.splice(productIndex, 1);
    res.json(user.cart);
});

app.post('/me/cart/:productId', authenticateToken, (req, res) => {
    const productId = req.params.productId;
    const { quantity } = req.body;
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const product = user.cart.find(item => item.productId === productId);
    if (!product) {
        return res.status(404).json({ error: 'Product not found in cart' });
    }
    product.quantity = quantity;
    res.json(user.cart);
});

module.exports = app;

//token in header not body 
