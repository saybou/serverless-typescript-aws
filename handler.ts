import { APIGatewayProxyHandler, APIGatewayEvent, Context, Callback } from 'aws-lambda';
import 'source-map-support/register';

export const hello: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  context: Context,
  callback: Callback,
): Promise<any> => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!',
        input: event,
        context: context,
        callback: callback,
      },
      null,
      2,
    ),
  };
};
