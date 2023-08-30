import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import {
  RoomDTO,
  RoomRepository,
} from "./layers/roomsLayer/nodejs/roomRepository";

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

  if (event.resource === "/rooms") {
    console.log("POST /rooms");
    const room = JSON.parse(event.body!) as RoomDTO;
    const roomCreated = await roomRepository.create(room);

    return {
      statusCode: 201,
      body: JSON.stringify(roomCreated),
    };
  } else if (event.resource === "/rooms/{id}") {
    const roomId = event.pathParameters!.id as string;
    if (event.httpMethod === "PUT") {
      console.log(`PUT /rooms/${roomId}`);
      const room = JSON.parse(event.body!) as RoomDTO;
      try {
        const roomUpdated = await roomRepository.update(roomId, room);

        return {
          statusCode: 200,
          body: JSON.stringify(roomUpdated),
        };
      } catch (ConditionalCheckFailedException) {
        return {
          statusCode: 404,
          body: "Room not found",
        };
      }
    } else if (event.httpMethod === "DELETE") {
      console.log(`DELETE /rooms/${roomId}`);
      try {
        const room = await roomRepository.delete(roomId);
        return {
          statusCode: 200,
          body: JSON.stringify(room),
        };
      } catch (error) {
        console.error((<Error>error).message);
        return {
          statusCode: 404,
          body: (<Error>error).message,
        };
      }
    }
  }

  return {
    statusCode: 400,
    body: "Bad request",
  };
}
