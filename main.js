const fs = require('fs');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');

const DATA_FILE_PATH = `${process.cwd()}/yelp_database.csv`;
const MONGODB_URL = 'mongodb://localhost:27017';
const DATABASE_NAME = 'handling-1-million-data';
const COLLECTION_NAME = 'yelp_database';

let collection;

async function insertOneDocument(document) {
  await collection.insertOne(document);
}

async function run() {
  const startTime = new Date();
  console.log(`Started at: ${startTime.toLocaleString('en-US')}`);
  console.log('---');

  const client = new MongoClient(MONGODB_URL);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(DATABASE_NAME);
    collection = db.collection(COLLECTION_NAME);

    const results = [];

    if (!fs.existsSync(DATA_FILE_PATH)) {
      console.error(`Error: File not found at ${DATA_FILE_PATH}`);
      return;
    }

    fs.createReadStream(DATA_FILE_PATH)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', async () => {
        const readingEndTime = new Date();
        console.log(`Finished reading file at: ${readingEndTime.toLocaleString('en-US')}`);
        console.log(`Have ${results.length} rows. Starting...`);

        for (const document of results) {
          await insertOneDocument(document);
        }

        const endTime = new Date();
        const minutes = Math.floor(timeTaken / 1000 / 60);
        const seconds = Math.floor(timeTaken / 1000) % 60;

        console.log('---');
        console.log(`Finished at: ${endTime.toLocaleString('en-US')}`);
        console.log(`Time taken: ${minutes} minutes ${seconds} seconds`);

        await client.close();
        process.exit(0);
      })
      .on('error', (err) => {
        console.error('Error occurred while reading file:', err.message);
        client.close();
      });

  } catch (error) {
    console.error('An error occurred:', error.message);
    await client.close();
    process.exit(1);
  }
}

run();
