const express = require('express');
const sequelize = require('./database');
const User = require('./models/Users');
const {Assignment, Assignment_links} = require('./models/Assignments');
const basicAuth = require('./Token');

const dotenv = require('dotenv');

dotenv.config();


const app = express();
// Enable JSON request body parsing
app.use(express.json());

// Health check route to test database connectivity
app.get('/healthz', async (req, res) => {
    try {
      // Attempt to authenticate with the database
      await sequelize.authenticate();
  
      // Set response headers to disable caching
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
  
      res.status(200).json();
    } catch (error) {
      console.error('error info', error);
      res.status(503).send();
    }
  });

// Route to retrieve all assignments with Basic Authentication required
app.get('/assignments', basicAuth, async (req, res) => {
  try {
    // Use Sequelize to query the "Assignment" table for all assignments
    const assignments = await Assignment.findAll();

    // Send the retrieved assignments as a JSON response
    res.status(200).json(assignments);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Unable to retrieve assignments' });
  }
});


// Route to create a new assignment and concatenate user ID and assignment ID
app.post('/assignments', basicAuth, async (req, res) => {
  try {
    // Extract the email from the authorization header (Basic Auth)
    const authHeader = req.headers.authorization || '';
    const base64Credentials = authHeader.split(' ')[1] || '';
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');

    // Use Sequelize to find the user by email and retrieve their ID
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract assignment data from the request body
    const { name, points, num_of_attempts, deadline } = req.body;

    // Use Sequelize to create a new assignment in the "Assignment" table
    const newAssignment = await Assignment.create({
      name,
      points,
      num_of_attempts,
      deadline,
    });

    // Concatenate user ID and assignment ID with an underscore ('_')
    const concatenatedId = `${user.id}_${newAssignment.id}`;

  

    // Insert the concatenated ID into the "Assignment_links" table
    const assignmentLink = await Assignment_links.create({
      id: concatenatedId,
    });

      // Include the newly created assignment in the response
      const responsePayload = {
        concatenatedId,
        newAssignment,
        assignmentLink, // Include the newAssignment object
      };

    // Return the response payload in the JSON response
    res.status(201).json(responsePayload);
  } catch (error) {
    console.error('Error:', error);
    res.status(400).json({ error: 'Unable to create assignment' });
  }
});


// Route to get assignment details by ID
app.get('/assignments/:id',basicAuth, async (req, res) => {
  try {
    // Extract the assignment ID from the route parameter
    const { id } = req.params;

    // Use Sequelize to find the assignment by its ID
    const assignment = await Assignment.findOne({ where: { id } });

    if (!assignment) {
      // Handle the case where the assignment with the provided ID does not exist
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Return the assignment details as a JSON response
    res.status(200).json(assignment);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Unable to retrieve assignment details' });
  }
});

// Route to update an assignment by ID
app.put('/assignments/:id', basicAuth, async (req, res) => {
  try {
    // Extract the assignment ID from the route parameter
    const { id } = req.params;

    // Extract the authenticated user's email from Basic Authentication
    const authHeader = req.headers.authorization || '';
    const base64Credentials = authHeader.split(' ')[1] || '';
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');

    // Use Sequelize to find the user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Handle the case where the user with the provided email does not exist
      return res.status(404).json({ error: 'User not found' });
    }

    // Use Sequelize to find the assignment by its ID
    const assignment = await Assignment.findOne({ where: { id } });

    if (!assignment) {
      // Handle the case where the assignment with the provided ID does not exist
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Concatenate user ID and assignment ID with an underscore ('_')
    const concatenatedId = `${user.id}_${assignment.id}`;
    console.log(concatenatedId);

    // Use Sequelize to find the concatenated ID in the Assignment_links table
    const assignmentLink = await Assignment_links.findOne({ where: { id: concatenatedId } });

    if (!assignmentLink) {
      // Handle the case where the user is not authorized to update the assignment
      return res.status(403).json({ error: 'You are not authorized to update this assignment' });
    }

    // Extract assignment data from the request body
    const { name, points, num_of_attempts, deadline } = req.body;

    // Update the assignment with the new data
    await assignment.update({
      name,
      points,
      num_of_attempts,
      deadline,
    });

    // Return the updated assignment as a JSON response
    res.status(200).json(assignment);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Unable to update assignment' });
  }
});

// Route to delete an assignment by ID
app.delete('/assignments/:id', basicAuth, async (req, res) => {
  try {
    // Extract the assignment ID from the route parameter
    const { id } = req.params;

    // Extract the authenticated user's email from Basic Authentication
    const authHeader = req.headers.authorization || '';
    const base64Credentials = authHeader.split(' ')[1] || '';
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');

    // Use Sequelize to find the user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Handle the case where the user with the provided email does not exist
      return res.status(404).json({ error: 'User not found' });
    }

    // Use Sequelize to find the assignment by its ID
    const assignment = await Assignment.findOne({ where: { id } });

    if (!assignment) {
      // Handle the case where the assignment with the provided ID does not exist
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Concatenate user ID and assignment ID with an underscore ('_')
    const concatenatedId = `${user.id}_${assignment.id}`;

    // Use Sequelize to find the concatenated ID in the Assignment_links table
    const assignmentLink = await Assignment_links.findOne({ where: { id: concatenatedId } });

    if (!assignmentLink) {
      // Handle the case where the user is not authorized to delete the assignment
      return res.status(403).json({ error: 'You are not authorized to delete this assignment' });
    }

    // Delete the assignment from the database
    await assignment.destroy();

    // Delete the corresponding record in the Assignment_links table
    await assignmentLink.destroy();

    // Return a success message as a JSON response
    res.status(200).json({ message: 'Assignment and Assignment_links record deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Unable to delete assignment' });
  }
});





app.listen(process.env.PORT, () => {
    console.log(`Server is running`);
  });

  module.exports = app;