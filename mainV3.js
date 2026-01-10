const fs = require('fs');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');

const DATA_FILE_PATH = `${process.cwd()}/yelp_database.csv`;
const MONGODB_URL = 'mongodb://localhost:27017';
const DATABASE_NAME = 'handling-1-million-data';
const COLLECTION_NAME = 'yelp_database';

async function run() {
  const startTime = new Date();
  console.log(`Started at: ${startTime.toLocaleString('en-US')}`);

  const client = new MongoClient(MONGODB_URL);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    if (!fs.existsSync(DATA_FILE_PATH)) {
      console.error(`Error: File not found at ${DATA_FILE_PATH}`);
      return;
    }

    let buffer = [];
    const BATCH_SIZE = 10000;

    await new Promise((resolve, reject) => {
      fs.createReadStream(DATA_FILE_PATH)
        .pipe(csv())
        .on('data', async (data) => {
          buffer.push(data);

          if (buffer.length >= BATCH_SIZE) {
            const batchToInsert = [...buffer];
            buffer = [];
            
            await collection.insertMany(batchToInsert);
          }
        })
        .on('end', async () => {
          if (buffer.length > 0) {
            await collection.insertMany(buffer);
          }
          resolve();
        })
        .on('error', (err) => reject(err));
    });

    const endTime = new Date();
    const timeTaken = endTime - startTime;
    const minutes = Math.floor(timeTaken / 1000 / 60);
    const seconds = Math.floor(timeTaken / 1000) % 60;
    
    const totalDocuments = await collection.countDocuments();
    console.log('---');
    console.log(`Finished! Total documents in database: ${totalDocuments}`);
    console.log(`Time taken: ${minutes} minutes ${seconds} seconds`);

  } catch (error) {
    console.error('An error occurred:', error.message);
  } finally {
    await client.close();
    process.exit(0);
  }
}

run();