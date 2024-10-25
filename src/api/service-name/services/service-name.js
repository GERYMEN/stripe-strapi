'use strict';

/**
 * service-name service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::service-name.service-name');
