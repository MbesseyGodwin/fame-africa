import 'dotenv/config';
import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'FameAfrica API',
    description: 'Complete API documentation for the FameAfrica reality competition platform.',
    version: '1.0.0',
  },
  host: process.env.API_URL ? process.env.API_URL.replace(/^https?:\/\//, '') : 'localhost:4000',
  basePath: '/',
  schemes: ['http', 'https'],
  consumes: ['application/json'],
  produces: ['application/json'],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Users', description: 'User profile and management' },
    { name: 'Competitions', description: 'Competitions and cycles' },
    { name: 'Participants', description: 'Contestant operations' },
    { name: 'Votes', description: 'Voting and interactions' },
    { name: 'Eliminations', description: 'Evictions and eliminations' },
    { name: 'Admin', description: 'Administrative actions' },
    { name: 'Sponsors', description: 'Sponsors and partnerships' },
    { name: 'Notifications', description: 'In-app notifications' },
    { name: 'Stans', description: 'Fan clubs and stans' },
    { name: 'Leaderboard', description: 'Rankings and charts' },
    { name: 'KYC', description: 'Identity verification' },
    { name: 'Winners', description: 'Past winners and hall of fame' },
    { name: 'Audit', description: 'Audit logs' },
    { name: 'Arena', description: 'Competition arenas' },
    { name: 'Streaming', description: 'Live streaming features' },
    { name: 'Moderation', description: 'Content moderation' }
  ],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'Enter your token in the format **Bearer &lt;token>**'
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./src/index.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc).then(() => {
  const fs = require('fs');
  const path = require('path');
  
  // Read the generated file
  const swaggerData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
  
  // Auto-tag endpoints based on their path (e.g., /api/v1/users/... -> Users)
  for (const [routePath, methods] of Object.entries(swaggerData.paths)) {
    const parts = routePath.split('/');
    // e.g., parts = ['', 'api', 'v1', 'users', 'me']
    // index 3 is 'users'
    if (parts.length > 3) {
      let resource = parts[3];
      // Capitalize first letter
      let tag = resource.charAt(0).toUpperCase() + resource.slice(1);
      
      // Override specific mappings if needed
      if (tag === 'Kyc') tag = 'KYC';
      
      for (const methodVal of Object.values(methods as any)) {
        const method = methodVal as any;
        if (!method.tags || method.tags.length === 0 || (method.tags.length === 1 && method.tags[0] === 'default')) {
          method.tags = [tag];
        }
      }
    }
  }

  // Write back the modified JSON
  fs.writeFileSync(outputFile, JSON.stringify(swaggerData, null, 2));
  console.log('Swagger documentation generated and post-processed successfully!');
});
