import { Client, Account, Databases, Storage } from "appwrite";

const client = new Client();

client
  .setEndpoint("https://nyc.cloud.appwrite.io/v1") // Endpoint
  .setProject("68f65d83002fe8dd2701"); // Project ID

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// IDs
export const DB_ID = "68f65dd60011cc69ba07";
export const USERS_COLLECTION_ID = "users";
