import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { RoomRepository } from "./layers/roomsLayer/nodejs/roomRepository";
import { DynamoDB } from "aws-sdk";

const roomDDB = process.env.ROOMS_DDB!;
const ddbClient = new DynamoDB.DocumentClient();

const roomRepository = new RoomRepository(ddbClient, roomDDB);

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const lambdaRequestId = context.awsRequestId;
  const apiRequestId = event.requestContext.requestId;

  console.log(
    `API Gateway RequestId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`
  );

  const method = event.httpMethod;
  if (event.resource === "/rooms") {
    if (method === "GET") {
      console.log("GET /rooms");

      const guests = await roomRepository.getAll();

      return {
        statusCode: 200,
        body: JSON.stringify(guests),
      };
    }
  } else if (event.resource === "/rooms/{id}") {
    const guestId = event.pathParameters!.id as string;
    console.log(`GET /rooms/${guestId}`);

    try {
      const guest = await roomRepository.getById(guestId);
      return {
        statusCode: 200,
        body: JSON.stringify(guest),
      };
    } catch (error) {
      console.error((<Error>error).message);
      return {
        statusCode: 404,
        body: (<Error>error).message,
      };
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify({
      message: "Bad request",
    }),
  };
}
