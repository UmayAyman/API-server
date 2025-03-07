//this file is importing data into mongoDB through nodejs

import fs from "fs";
import { MongoClient } from "mongodb";

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const db = client.db("myDatabase");
const collection = db.collection("users");

async function importJSON() {
    try {
        await client.connect();
        console.log("✅ Connected to MongoDB");

        // Read JSON file
        const jsonData = JSON.parse(fs.readFileSync("D:/APIserver/data/users.json", "utf8"));

        // Insert data into collection
        const result = await collection.insertMany(jsonData);
        console.log(`✅ Inserted ${result.insertedCount} documents`);
    } catch (error) {
        console.error("❌ Error importing JSON:", error);
    } finally {
        await client.close();
    }
}

importJSON();
