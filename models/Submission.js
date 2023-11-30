const Sequelize = require('sequelize');
const sequelize = require('../database');
const { v4: uuidv4 } = require('uuid');

const Submission = sequelize.define('Submission', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
  },
  assignment_id: {
    type: Sequelize.UUID,
    allowNull: false,
  },
  submission_url: {
    type: Sequelize.STRING,
    validate: {
      isUrl: true,
    },
    allowNull: false,
  },
  submission_date: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    allowNull: false,
  },
  submission_updated: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    allowNull: false,
  },
}, {
  timestamps: false,
});

const SubmissionCountTable = sequelize.define('SubmissionCountTable', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    assignment_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
  }, {
    timestamps: false,
  });

sequelize.sync()
  .then(() => {
    console.log('Submission Tables synced successfully.');
  })
  .catch((error) => {
    console.error('Error syncing Submission Tables:', error);
  });

  module.exports = {
    Submission,
    SubmissionCountTable,
  };
