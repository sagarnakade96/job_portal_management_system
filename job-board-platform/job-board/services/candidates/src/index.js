require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const candidateRoutes = require('./routes/candidates');

const app = express();
const PORT = process.env.CANDIDATES_PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'candidates' });
});

app.use('/candidates', candidateRoutes);

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Candidates service running on port ${PORT}`);
  });
};

start();
