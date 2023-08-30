import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { v4 as uuid } from "uuid";

export interface Guest {
  id: string;
  guestName: string;
  guestEmail: string;
  guestMobile: string;
  guestBirthDate: string;
  guestAddress: string;
  code: string;
  price: number;
}

export class GuestRepository {
  constructor(private ddbClient: DocumentClient, private guestsDdb: string) {}

  async getAllGuests(): Promise<Guest[]> {
    const data = await this.ddbClient
      .scan({
        TableName: this.guestsDdb,
      })
      .promise();

    return data.Items as Guest[];
  }

  async getGuestById(guestId: string): Promise<Guest> {
    const data = await this.ddbClient
      .get({
        TableName: this.guestsDdb,
        Key: {
          id: guestId,
        },
      })
      .promise();

    if (!data.Item) {
      throw new Error("Guest not found");
    }
    return data.Item as Guest;
  }

  async create(guest: Guest): Promise<Guest> {
    guest.id = uuid();
    await this.ddbClient
      .put({
        TableName: this.guestsDdb,
        Item: guest,
      })
      .promise();

    return guest;
  }

  async deleteGuest(guestId: string): Promise<Guest> {
    const data = await this.ddbClient
      .delete({
        TableName: this.guestsDdb,
        Key: {
          id: guestId,
        },
        ReturnValues: "ALL_OLD",
      })
      .promise();

    if (!data.Attributes) {
      throw new Error("Guest not found");
    }
    return data.Attributes as Guest;
  }

  async updateGuest(guestId: string, guest: Guest): Promise<Guest> {
    const data = await this.ddbClient
      .update({
        TableName: this.guestsDdb,
        Key: {
          id: guestId,
        },
        ConditionExpression: "attribute_exists(id)",
        ReturnValues: "UPDATED_NEW",
        UpdateExpression:
          "set guestName = :n, guestEmail = :e, guestMobile = :m, guestBirthDate = :d, guestAddress = :a, code = :c,",
        ExpressionAttributeValues: {
          ":n": guest.guestName,
          ":e": guest.guestEmail,
          ":m": guest.guestMobile,
          ":d": guest.guestBirthDate,
          ":a": guest.guestAddress,
          ":c": guest.code,
        },
      })
      .promise();

    data.Attributes!.id = guestId;
    return data.Attributes as Guest;
  }
}
