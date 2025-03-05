import { dbConnection } from "./config/mongoConnection.js";
import { ObjectId } from "mongodb";

const seedDatabase = async () => {
  try {
    const db = await dbConnection();
    const artists = db.collection("artists");
    const albums = db.collection("albums");
    const recordCompanies = db.collection("recordcompanies");

    // 🚀 Clear existing data
    await Promise.all([
      artists.deleteMany({}),
      albums.deleteMany({}),
      recordCompanies.deleteMany({})
    ]);

    console.log("🔄 Old data removed. Seeding new data...");

    // 🎵 Insert record companies
    const sony = {
      _id: new ObjectId(),
      name: "Sony Music",
      foundedYear: 1985,
      country: "USA",
      albums: [],
    };

    const universal = {
      _id: new ObjectId(),
      name: "Universal Music",
      foundedYear: 1934,
      country: "USA",
      albums: [],
    };

    const sonyResult = await recordCompanies.insertOne(sony);
    const universalResult = await recordCompanies.insertOne(universal);

    // 🎸 Insert artists
    const beatles = {
      _id: new ObjectId(),
      name: "The Beatles",
      dateFormed: "07/06/1957",
      members: ["John Lennon", "Paul McCartney", "George Harrison", "Ringo Starr"],
      albums: [],
    };

    const queen = {
      _id: new ObjectId(),
      name: "Queen",
      dateFormed: "07/01/1970",
      members: ["Freddie Mercury", "Brian May", "Roger Taylor", "John Deacon"],
      albums: [],
    };

    const beatlesResult = await artists.insertOne(beatles);
    const queenResult = await artists.insertOne(queen);

    // 🎶 Insert albums
    const abbeyRoad = {
      _id: new ObjectId(),
      title: "Abbey Road",
      releaseDate: "09/26/1969",
      genre: "ROCK",
      artistId: beatlesResult.insertedId,
      recordCompanyId: sonyResult.insertedId,
      songs: ["Come Together", "Something", "Here Comes the Sun"],
    };

    const nightOpera = {
      _id: new ObjectId(),
      title: "A Night at the Opera",
      releaseDate: "11/21/1975",
      genre: "ROCK",
      artistId: queenResult.insertedId,
      recordCompanyId: universalResult.insertedId,
      songs: ["Bohemian Rhapsody", "Love of My Life", "You're My Best Friend"],
    };

    const abbeyRoadResult = await albums.insertOne(abbeyRoad);
    const nightOperaResult = await albums.insertOne(nightOpera);

    // 🔗 Update artist & record company references
    await Promise.all([
      artists.updateOne({ _id: beatlesResult.insertedId }, { $push: { albums: abbeyRoadResult.insertedId } }),
      artists.updateOne({ _id: queenResult.insertedId }, { $push: { albums: nightOperaResult.insertedId } }),

      recordCompanies.updateOne({ _id: sonyResult.insertedId }, { $push: { albums: abbeyRoadResult.insertedId } }),
      recordCompanies.updateOne({ _id: universalResult.insertedId }, { $push: { albums: nightOperaResult.insertedId } })
    ]);

    console.log("✅ Database seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
