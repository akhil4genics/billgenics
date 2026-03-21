import serverless from 'serverless-http';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import connectDB from './lib/db';
import app from './app';

const serverlessApp = serverless(app);

export const api = async (event: APIGatewayProxyEvent, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectDB();
  return serverlessApp(event, context);
};
