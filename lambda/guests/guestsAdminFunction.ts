import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import {
  Guest,
  GuestRepository,
} from "./layers/guestsLayer/nodejs/guestRepository";

const guestsDdb = process.env.GUESTS_DDB!;
const ddbClient = new DynamoDB.DocumentClient();

const guestRepository = new GuestRepository(ddbClient, guestsDdb);

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const lambdaRequestId = context.awsRequestId;
  const apiRequestId = event.requestContext.requestId;

  console.log(
    `API Gateway RequestId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`
  );

  if (event.resource === "/guests") {
    console.log("POST /guests");
    const guest = JSON.parse(event.body!) as Guest;
    const guestCreated = await guestRepository.create(guest);

    return {
      statusCode: 201,
      body: JSON.stringify(guestCreated),
    };
  } else if (event.resource === "/guests/{id}") {
    const guestId = event.pathParameters!.id as string;
    if (event.httpMethod === "PUT") {
      console.log(`PUT /guests/${guestId}`);
      const guest = JSON.parse(event.body!) as Guest;
      try {
        const guestUpdated = await guestRepository.updateGuest(guestId, guest);

        return {
          statusCode: 200,
          body: JSON.stringify(guestUpdated),
        };
      } catch (ConditionalCheckFailedException) {
        return {
          statusCode: 404,
          body: "Guest not found",
        };
      }
    } else if (event.httpMethod === "DELETE") {
      console.log(`DELETE /guests/${guestId}`);
      try {
        const guest = await guestRepository.deleteGuest(guestId);
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
  }

  return {
    statusCode: 400,
    body: "Bad request",
  };
}
