const { MongoClient } = require('mongodb');

// Use environment variables for the MongoDB connection string.
const uri = process.env.MONGODB_URI; // This needs to be set in Netlify's UI.
const dbName = process.env.MONGODB_DBNAME || 'your_default_db_name'; // Default database name.  Set this in Netlify!
const collectionName = process.env.MONGODB_COLLECTION || 'yes_responses'; // Set default collection

let cachedClient = null; // Store the MongoClient instance to reuse connections

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient.db(dbName); // Reuse the existing connection
  }

  try {
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
    console.log("Connected to MongoDB");
    cachedClient = client;
    return client.db(dbName);
  } catch (e) {
    console.error("Error connecting to MongoDB:", e);
    throw e;
  }
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
      headers: {
        'Allow': 'POST',
        'Content-Type': 'application/json'
      }
    };
  }

  try {
    const data = JSON.parse(event.body);

    // Basic validation: Check if the 'response' field exists
    if (!data || !data.response) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing or invalid  "response" field is required.' }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
    }

    const db = await connectToDatabase();
    const collection = db.collection(collectionName);
    await collection.insertOne(data);

    console.log('Data inserted successfully:', data);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data received and processed successfully!' }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error: ' + error.message }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};

