/// <reference types="cypress" />

require('dotenv').config();
// const cucumber = require('cypress-cucumber-preprocessor').default;

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  // on('file:preprocessor', cucumber());

  for (const key of ['TEST_GH_USERNAME', 'TEST_GH_TOKEN']) {
    config.env[key] = getEnvironmentVariable(key);
  }

  return config;
};

function getEnvironmentVariable(name, defaultValue) {
  if (!(name in process.env) && !defaultValue) {
    throw new Error(`Missing mandatory environment variable ${name}`);
  }

  return process.env[name] || defaultValue;
}
