const express = require('express');
const sequelize = require('./database');
const User = require('./models/Users');
const {Assignment, Assignment_links} = require('./models/Assignments');
const {Submission, SubmissionCountTable} = require('./models/Submission');
const basicAuth = require('./Token');
const logger = require('./logger/logger');
var stats = require('node-statsd'),
    statsdClient = new stats();
const { error } = require('winston');
const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-east-1' });

const sns = new AWS.SNS();
const topicArn = process.env.SNSTOPICARN;

const dotenv = require('dotenv');

dotenv.config();


const app = express();
// Enable JSON request body parsing
app.use(express.json());

// Health check route to test database connectivity
app.get('/demo/healthz', async (req, res) => {
  const start = process.hrtime();
  logger.info("Healthz Check Start");
  statsdClient.increment('healthz_get_count');
  const durationInMs = process.hrtime(start)[1] / 1000000;
  statsdClient.timing('healthz_response_time', durationInMs);
    try {
      // Attempt to authenticate with the database
      await sequelize.authenticate();
  
      // Set response headers to disable caching
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      logger.info("Healthz Check Success, Database Connected");
      res.status(200).json();
    } catch (error) {
      logger.error("Error connecting Database",error);
      console.error('error info', error);
      res.status(503).send();
    }
  });

  app.use((req, res, next) => {
    if (req.method === 'PATCH') {
      res.status(404).json({ error: 'Not Found' });
    } else {
      next(); 
    }
  });

// Route to retrieve all assignments with Basic Authentication required
app.get('/demo/assignments', basicAuth, async (req, res) => {
  try {
    statsdClient.increment('Assignments_get_Api_count');
    logger.info("Request to get all assignment Started");
    // Use Sequelize to query the "Assignment" table for all assignments
    const assignments = await Assignment.findAll();
    logger.info("Retrived all the Assignments");
    // Send the retrieved assignments as a JSON response
    res.status(200).json(assignments);
  } catch (error) {
    logger.error("Unable to retrieve assignments",error);
    console.error('Error:', error);
    res.status(500).json({ error: 'Unable to retrieve assignments' });
  }
});


// Route to create a new assignment and concatenate user ID and assignment ID
app.post('/demo/assignments', basicAuth, async (req, res) => {
  try {
    // Extract the email from the authorization header (Basic Auth)
    statsdClient.increment('Assignments_post_Api_count');
    logger.info("Post Assignment Started");
    const authHeader = req.headers.authorization || '';
    const base64Credentials = authHeader.split(' ')[1] || '';
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');

    // Use Sequelize to find the user by email and retrieve their ID
    const user = await User.findOne({ where: { email } });
    logger.info("found the user with email" + email);

    if (!user) {
      logger.error("User not found with email" + email, error);
      return res.status(403).json({ error: 'User not found' });
    }

    // Extract assignment data from the request body
    const { name, points, num_of_attempts, deadline } = req.body;

    // Use Sequelize to check for assignments with the same name
    const existingAssignment = await Assignment.findOne({ where: { name } });

    if (existingAssignment) {
      // Assignment with the same name already exists
      logger.error("Assignment with the same name already exists");
      return res.status(400).json({ error: 'Assignment with the same name already exists' });
    }


    // Use Sequelize to create a new assignment in the "Assignment" table
    const newAssignment = await Assignment.create({
      name,
      points,
      num_of_attempts,
      deadline,
    });

    // Concatenate user ID and assignment ID with an underscore ('_')
    const concatenatedId = `${user.id}_${newAssignment.id}`;
    const Assign_ID = newAssignment.id;

  

    // Insert the concatenated ID into the "Assignment_links" table
    const assignmentLink = await Assignment_links.create({
      id: concatenatedId,
    });

      // Include the newly created assignment in the response
      const responsePayload = {
        Assign_ID,
      };

    // Return the response payload in the JSON response
    logger.info("Assignment Created by user with email"+email);
    res.status(201).json(responsePayload);
  } catch (error) {
    logger.error("Unable to create Assignment",error);
    console.error('Error:', error);
    res.status(400).json({ error: 'Unable to create assignment' });
  }
});


// Route to get assignment details by ID
app.get('/demo/assignments/:id',basicAuth, async (req, res) => {
  try {
    // Extract the assignment ID from the route parameter
    statsdClient.increment('Assignments/ID_get_API_Count');
    logger.info("GET Assignment with ID started");
    const { id } = req.params;

    // Use Sequelize to find the assignment by its ID
    const assignment = await Assignment.findOne({ where: { id } });

    if (!assignment) {
      // Handle the case where the assignment with the provided ID does not exist
      logger.error("Unable to find Assignment with ID:"+id , error);
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Return the assignment details as a JSON response
    logger.info("successfully Retrived the assignment with id:" + id);
    res.status(200).json(assignment);
  } catch (error) {
    console.error('Error:', error);
    logger.error("Unable to retrieve assignment details" , error);
    res.status(403).json({ error: 'Unable to retrieve assignment details' });
  }
});

// Route to update an assignment by ID
app.put('/demo/assignments/:id', basicAuth, async (req, res) => {
  try {
    // Extract the assignment ID from the route parameter
    statsdClient.increment('Assignments/ID_put_API_count');
    logger.info("Update Assignment with ID started");
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
      logger.error("User not found with email" + email, error);
      return res.status(400).json({ error: 'User not found' });
    }

    // Use Sequelize to find the assignment by its ID
    const assignment = await Assignment.findOne({ where: { id } });

    if (!assignment) {
      // Handle the case where the assignment with the provided ID does not exist
      logger.error("Assignment not found with id:"+id,error);
      return res.status(400).json({ error: 'Assignment not found' });
    }

    // Concatenate user ID and assignment ID with an underscore ('_')
    const concatenatedId = `${user.id}_${assignment.id}`;
    console.log(concatenatedId);

    // Use Sequelize to find the concatenated ID in the Assignment_links table
    const assignmentLink = await Assignment_links.findOne({ where: { id: concatenatedId } });

    if (!assignmentLink) {
      // Handle the case where the user is not authorized to update the assignment
      logger.error("User with email:"+email+" is not authorized to update this assignment");
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
    logger.info("Assignment Updated by user with email:"+ email);
    res.status(204).json(assignment);
  } catch (error) {
    logger.error("Unable to update assignment",error);
    console.error('Error:', error);
    res.status(400).json({ error: 'Unable to update assignment' });
  }
});

// Route to delete an assignment by ID
app.delete('/demo/assignments/:id', basicAuth, async (req, res) => {
  try {
    if (Object.keys(req.body).length !== 0) {
      return res.status(400).json({ error: 'DELETE request should not include a request body' });
    }
    // Extract the assignment ID from the route parameter
    statsdClient.increment('Assignments/ID_Delete_API_count');
    logger.info("Delete Assignment with ID started");
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
      logger.error("User not found with email" + email, error);
      return res.status(404).json({ error: 'User not found' });
    }

    // Use Sequelize to find the assignment by its ID
    const assignment = await Assignment.findOne({ where: { id } });

    if (!assignment) {
      // Handle the case where the assignment with the provided ID does not exist
      logger.error("Assignment not found with id:"+id,error);
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Concatenate user ID and assignment ID with an underscore ('_')
    const concatenatedId = `${user.id}_${assignment.id}`;

    // Use Sequelize to find the concatenated ID in the Assignment_links table
    const assignmentLink = await Assignment_links.findOne({ where: { id: concatenatedId } });

    if (!assignmentLink) {
      // Handle the case where the user is not authorized to delete the assignment
      logger.error("User with email:"+email+" is not authorized to delete this assignment");
      return res.status(403).json({ error: 'You are not authorized to delete this assignment' });
    }

    let userSubmissions = await SubmissionCountTable.count({
      where: { assignment_id: assignment.id },
    });
    console.log(userSubmissions);

    if (userSubmissions>0){
      return res.status(403).json({error: 'Assignment cannot be deleted due to submissions against it'});
    }

    // Delete the assignment from the database
    await assignment.destroy();

    // Delete the corresponding record in the Assignment_links table
    await assignmentLink.destroy();

    // Return a success message as a JSON response
    logger.info("Assignment Deleted by user with email:"+ email);
    res.status(204).json({ message: 'Assignment and Assignment_links record deleted successfully' });
  } catch (error) {
    logger.error("Unable to delete assignment",error);
    console.error('Error:', error);
    res.status(404).json({ error: 'Unable to delete assignment' });
  }
});

app.post('/demo/assignments/:id/submissions', basicAuth, async (req, res) => {
  try {
    const { submission_url } = req.body;
    const { id }  = req.params;

    const authHeader = req.headers.authorization || '';
    const base64Credentials = authHeader.split(' ')[1] || '';
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');

    // Use Sequelize to find the user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Handle the case where the user with the provided email does not exist
      logger.error("User not found with email" + email, error);
      return res.status(404).json({ error: 'User not found' });
    }

    // Use Sequelize to find the assignment by its ID
    const assignment = await Assignment.findOne({ where: { id } });

    if (!assignment) {
      // Handle the case where the assignment with the provided ID does not exist
      logger.error("Assignment not found with id:"+id,error);
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if the submission deadline has passed
    const currentDate = new Date();
    const deadline = new Date(assignment.deadline);

    if (currentDate > deadline) {
      return res.status(403).json({ error: 'Submission deadline has passed' });
    }

    // Check if the user has already exceeded the retries
    const retriesConfig = assignment.num_of_attempts || 1; // Assuming a default of 1 attempt
    let userSubmissions = await SubmissionCountTable.count({
      where: { email, assignment_id: assignment.id },
    });
    console.log(userSubmissions);

    if (userSubmissions >= retriesConfig) {
      return res.status(403).json({ error: 'Exceeded maximum number of attempts' });
    }

    // Create submission entry in the database
    const newSubmission = await Submission.create({
      assignment_id: assignment.id,
      submission_url: submission_url, 
      // Other submission data from req.body
    });
    userSubmissions++;
    const newSubmissionCount = await SubmissionCountTable.create({
      email: email,
      assignment_id: assignment.id,
    })

    const message = {
      gitRepoUrl: submission_url,
      emailAddress: email,
    };

    const messageParams = {
      Message: JSON.stringify(message), // Customize the message content
      TopicArn: topicArn , // Replace with your SNS topic ARN
    };
    
    // Publish the SMS message to the specified SNS topic
    sns.publish(messageParams, (snsErr, data) => {
      if (snsErr) {
        console.error('Error publishing SMS:', snsErr);
        // Handle error if required
      } else {
        console.log('SMS published successfully:', data.MessageId);
        // Optionally, handle success response
      }
    });

    res.status(201).json(newSubmission);
  } catch (error) {
    console.error('Error:', error);
    res.status(400).json({ error: 'Unable to process submission' });
  }
});





app.listen(process.env.PORT, () => {
    logger.info(`Server Started on port ${process.env.PORT}`)
    console.log(`Server is running`);
  });

  module.exports = app;