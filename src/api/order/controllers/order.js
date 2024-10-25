// 'use strict';

// /**
//  * order controller
//  */

// const { createCoreController } = require('@strapi/strapi').factories;

// module.exports = createCoreController('api::order.order');

'use strict';
// import { Stripe } from 'stripe';
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const stripe = require("stripe").default(process.env.STRIPE_SECRET_KEY);

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::order.order', ({ strapi }) => ({
  async create(ctx) {
    console.log('api calling asap take measurement')
    const { items, currency = 'cny' } = ctx.request.body;

    try {
      // Calculate order amount based on items
    //   const calculateOrderAmount = (orderItems) => {
    //     return orderItems.reduce((total, item) => {
    //       return total + (item.price * item.qua xxntity);
    //     }, 0) * 100; // Convert to cents for Stripe
    //   };

      // Create a payment intent
      const paymentIntent =  await stripe.paymentIntents.create({
        amount: 1099,
        currency: 'cny',
        automatic_payment_methods: {
          enabled: true,
        },
      });

    //   // Create order record in Strapi
    //   const order = await strapi.entityService.create('api::order.order', {
    //     data: {
    //       items,
    //       total: calculateOrderAmount(items) / 100, // Store in database as regular currency
    //       status: 'pending',
    //       paymentIntentId: paymentIntent.id,
    //       currency: currency,
    //     },
    //   });

      // Return necessary information to the client
      return {
        clientSecret: paymentIntent.client_secret,
        orderId: 1111, // order.id,
        dpmCheckerLink: `https://dashboard.stripe.com/settings/payment_methods/review?transaction_id=${paymentIntent.id}`,
      };

    } catch (error) {
      ctx.response.status = 500;
      return { error: error.message };
    }
  },

  // Webhook handler to update order status
  async webhook(ctx) {
    const sig = ctx.request.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        ctx.request.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      ctx.response.status = 400;
      return { error: `Webhook Error: ${err.message}` };
    }

    // Handle successful payment
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;

      // Update order status in Strapi
      const orders = await strapi.entityService.findMany('api::order.order', {
        filters: {
          paymentIntentId: paymentIntent.id,
        },
      });

      if (orders.length > 0) {
        await strapi.entityService.update('api::order.order', orders[0].id, {
          data: {
            status: 'completed',
          },
        });
      }
    }

    return { received: true };
  },
}));