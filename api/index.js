// Backend - Express API
// api/index.js
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import scraperRouter from './routes/scraper.js';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection with authentication and error handling
mongoose.connect(process.env.MONGO_URI, {
  authSource: process.env.MONGO_AUTH_SOURCE || 'admin',
  user: process.env.MONGO_USER,
  pass: process.env.MONGO_PASSWORD,
})
.then(() => {
  console.log('Successfully connected to MongoDB.');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

const userSchema = new mongoose.Schema({
  uuid: { type: String, unique: true },
  sender: String,
  links: [String],
  planType: { type: String, default: 'Free' },
  minLinks: { type: Number, default: 0 },
  maxLinks: { type: Number, default: 10 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

const User = mongoose.model('User', userSchema);

// User registration endpoint
app.post('/register', async (req, res) => {
  try {
    const { sender } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ sender });
    if (existingUser) {
      return res.status(409).json({ 
        message: 'User already exists',
        uuid: existingUser.uuid 
      });
    }

    // Create new user
    const uuid = uuidv4();
    const newUser = new User({
      uuid,
      sender,
      links: [],
      planType: 'Free',
      maxLinks: 10
    });

    await newUser.save();

    return res.status(201).json({
      message: 'User registered successfully',
      uuid: newUser.uuid,
      sender: newUser.sender,
      planType: newUser.planType,
      maxLinks: newUser.maxLinks
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      message: 'Error registering user',
      error: error.message 
    });
  }
});

// List users endpoint with pagination
app.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find(
      {}, 
      { 
        uuid: 1, 
        sender: 1, 
        planType: 1, 
        createdAt: 1, 
        isActive: 1,
        _id: 0 
      }
    )
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

    const total = await User.countDocuments();
    
    return res.status(200).json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasMore: skip + users.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ 
      message: 'Error fetching users',
      error: error.message 
    });
  }
});

app.post('/webhook', async (req, res) => {
  const { message, sender } = req.body;

  if (message && message.includes('https')) {
    try {
      let user = await User.findOne({ sender });
      if (!user) {
        const uuid = uuidv4();
        user = new User({ uuid, sender, links: [], planType: 'Free', maxLinks: 10 });
      }

      if (user.links.length >= user.maxLinks) {
        return res.status(403).json({ message: 'limite de links para o seu plano' });
      }

      user.links.push(message);
      user.updatedAt = new Date();
      await user.save();
      console.log(`User ${user.uuid} sent the link: ${message}`);

      // send a message to the user with the link to its wishlist page
      const userUrl = `http://localhost:3000/api/${sender}`;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      await axios.post(`${baseUrl}/send-whatsapp-response`, { sender, userUrl });
      res.sendStatus(200);

    } catch (error) {
      console.error('Error saving link:', error);
      return res.status(500).json({ message: 'Error saving link', error: error.message });
    }
  }
});


app.post('/send-whatsapp-response', async (req, res) => {
  try {
    const { sender, userUrl } = req.body;

    // Simulate sending a WhatsApp response
    console.log(`Sending WhatsApp response to ${sender}: ${userUrl}`);

    // Return the response
    return res.status(200).json({
      message: 'WhatsApp response sent successfully',
      userUrl,
    });
  } catch (error) {
    console.error('Error sending WhatsApp response:', error);
    return res.status(500).json({
      message: 'Error sending WhatsApp response',
      error: error.message,
    });
  }
});


app.get('/links/:sender', async (req, res) => {
  const { sender } = req.params;
  const user = await User.findOne({ sender: sender });

  if (user) {
    res.json(user.links);
    console.log(`getting links for: ${user.sender} - links quantity: ${user.links.length}`)
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Routes
app.use('/api', scraperRouter);

// Error handling middleware
app.use((err, res) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});