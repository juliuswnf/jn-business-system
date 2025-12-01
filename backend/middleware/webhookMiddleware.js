import express from 'express';

const webhookMiddleware = express.raw({ type: 'application/json' });

export default webhookMiddleware;
