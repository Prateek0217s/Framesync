const { sequelize } = require('../config/db');

const Client = require('./Client');
const Project = require('./Project');
const Comment = require('./Comment');

// Define associations
Client.hasMany(Project, { foreignKey: 'clientId', onDelete: 'CASCADE' });
Project.belongsTo(Client, { foreignKey: 'clientId' });

Project.hasMany(Comment, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Comment.belongsTo(Project, { foreignKey: 'projectId' });

module.exports = {
  sequelize,
  Client,
  Project,
  Comment
};
