import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { GuestRepository } from "./layers/guestsLayer/nodejs/guestRepository";
import { DynamoDB } from "aws-sdk"

const guestsDdb = process.env.PRODUCTS_DDB!
const ddbClient = new DynamoDB.DocumentClient()

const guestRepository = new GuestRepository(ddbClient, guestsDdb)

export async function handler(event: APIGatewayProxyEvent, 
   context: Context): Promise<APIGatewayProxyResult> {

   const lambdaRequestId = context.awsRequestId
   const apiRequestId = event.requestContext.requestId

   console.log(`API Gateway RequestId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`)
   
   const method = event.httpMethod
   if (event.resource === "/guests") {
      if (method === 'GET') {
         console.log('GET /guests')

         const guests = await guestRepository.getAllGuests()

         return {
            statusCode: 200,
            body: JSON.stringify(guests)
         }
      }
   } else if (event.resource === "/guests/{id}") {
      const guestId = event.pathParameters!.id as string
      console.log(`GET /guests/${guestId}`)

      try {
         const guest = await guestRepository.getGuestById(guestId)
         return {
            statusCode: 200,
            body: JSON.stringify(guest)
         }   
      } catch (error) {
         console.error((<Error>error).message)
         return {
            statusCode: 404,
            body: (<Error>error).message
         }
      }
   }

   return {
      statusCode: 400,
      body: JSON.stringify({
         message: "Bad request"
      })
   }
}