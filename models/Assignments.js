// assignment.js
const Sequelize = require('sequelize');
const sequelize = require('../database');
const { v4: uuidv4 } = require('uuid'); // Import the UUID library

const Assignment = sequelize.define('Assignment', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    defaultValue: () => uuidv4(), // Generate a UUID string for new records
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  points: {
    type: Sequelize.FLOAT,
    allowNull: false,
    validate: {
      min: 1,
      max: 100,
    },
  },
  num_of_attempts: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10,
    },
  },
  deadline: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  assignment_created: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), // Use sequelize.literal
    allowNull: false,
  },
  assignment_updated: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), // Use sequelize.literal
    allowNull: false,
  },
},{
    timestamps: false, 
});

const Assignment_links = sequelize.define('Assignment_links', {
    id: {
      type: Sequelize.STRING,
      primaryKey: true,
    },
},{
    timestamps: false, 
});


sequelize.sync()
  .then(() => {
    console.log('Assignment Table synced successfully.');
  })
  .catch((error) => {
    console.error('Error syncing Assignment Table:', error);
  });

  module.exports = {
    Assignment,
    Assignment_links,
  };
