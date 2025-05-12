const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'images')));

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

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
