import { GraphQLError } from 'graphql';
import { artists as artistCollection, 
         albums as albumCollection, 
         recordCompanies as recordCompanyCollection 
} from './config/mongoCollection.js';

import { ObjectId } from 'mongodb';

import redisClient from './cache/redisClient.js';

export const resolvers = {
  Query: {
    artists: async () => {
      const cacheKey = 'artists';
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) return JSON.parse(cachedData);

      const artists = await (await artistCollection()).find({}).toArray();
      if (!artists) {
        throw new GraphQLError('Internal Server Error', { 
            extensions: { code: 'INTERNAL_SERVER_ERROR' }});
      }

      await redisClient.setEx(cacheKey, 3600, JSON.stringify(artists));
      return artists;
    },

    getArtistById: async (_, args) => {
      const cacheKey = `artist:${args._id}`;
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) return JSON.parse(cachedData);

      const artist = await (await artistCollection()).findOne({ _id: new ObjectId(args._id) });
      if (!artist) {
        throw new GraphQLError('Artist Not Found', { 
            extensions: { code: 'NOT_FOUND' } });
      }

      await redisClient.set(cacheKey, JSON.stringify(artist));
      return artist;
    },

    albums: async () => {
      const cacheKey = 'albums';
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) return JSON.parse(cachedData);

      const albums = await (await albumCollection()).find({}).toArray();
      if (!albums) {
        throw new GraphQLError('Internal Server Error', { 
            extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }

      await redisClient.setEx(cacheKey, 3600, JSON.stringify(albums));
      return albums;
    },

    getAlbumById: async (_, args) => {
      const cacheKey = `album:${args._id}`;
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) return JSON.parse(cachedData);

      const album = await (await albumCollection()).findOne({ _id: new ObjectId(args._id) });
      if (!album) {
        throw new GraphQLError('Album Not Found', { 
            extensions: { code: 'NOT_FOUND' } });
      }

      await redisClient.set(cacheKey, JSON.stringify(album));
      return album;
    },

    recordCompanies: async () => {
      const cacheKey = 'recordCompanies';
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) return JSON.parse(cachedData);

      const companies = await (await recordCompanyCollection()).find({}).toArray();
      if (!companies) {
        throw new GraphQLError('Internal Server Error', { 
            extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }

      await redisClient.setEx(cacheKey, 3600, JSON.stringify(companies));
      return companies;
    },

    getCompanyById: async (_, args) => {
      const cacheKey = `company:${args._id}`;
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) return JSON.parse(cachedData);

      const company = await (await recordCompanyCollection()).findOne({ _id: new ObjectId(args._id) });
      if (!company) {
        throw new GraphQLError('Record Company Not Found', { 
            extensions: { code: 'NOT_FOUND' } });
      }

      await redisClient.set(cacheKey, JSON.stringify(company));
      return company;
    },

    companyByFoundedYear: async (_, args) => {
      console.log(`Searching for companies founded between ${args.min} and ${args.max}`);
  
      const minYear = Number(args.min);
      const maxYear = Number(args.max);
  
      const companies = await (await recordCompanyCollection()).find({
          foundedYear: { $gte: minYear, $lte: maxYear }
      }).toArray();
  
      console.log("Found companies:", companies);
      return companies; 
  }, 

    getSongsByArtistId: async (_, args) => {
      const artist = await (await artistCollection()).findOne({ _id: new ObjectId(args.artistId) });
      if (!artist) throw new GraphQLError('Artist Not Found', { 
        extensions: { code: 'NOT_FOUND' } });

      const artistAlbums = await (await albumCollection()).find({ artistId: new ObjectId(args.artistId) }).toArray();
      return artistAlbums.flatMap(album => album.songs);
    }
  },

  Artist: {
    numOfAlbums: async (parentValue) => {
      const count = await (await albumCollection()).countDocuments({ artistId: parentValue._id });
      return count;
    },
    albums: async (parentValue) => {
      return await (await albumCollection()).find({ artistId: parentValue._id }).toArray();
    }
  },

  RecordCompany: {
    numOfAlbums: async (parentValue) => {
      const count = await (await albumCollection()).countDocuments({ recordCompanyId: parentValue._id });
      return count;
    },
    albums: async (parentValue) => {
      return await (await albumCollection()).find({ recordCompanyId: parentValue._id }).toArray();
    }
  },

  Album: {
    artist: async (parentValue) => {
      return await (await artistCollection()).findOne({ _id: parentValue.artistId });
    },
    recordCompany: async (parentValue) => {
      return await (await recordCompanyCollection()).findOne({ _id: parentValue.recordCompanyId });
    }
  },

  Mutation: {
    addArtist: async (_, args) => {
      const newArtist = {
        _id: new ObjectId(),
        name: args.name,
        dateFormed: args.dateFormed,
        members: args.members,
        albums: []
      };
      const insertResult = await (await artistCollection()).insertOne(newArtist);
      if (!insertResult.acknowledged) {
        throw new GraphQLError('Failed to Add Artist', { 
            extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
      return newArtist;
    },

    removeArtist: async (_, args) => {
      const artist = await (await artistCollection()).findOne({ _id: new ObjectId(args._id) });
      if (!artist) {
        throw new GraphQLError('Artist Not Found', { 
            extensions: { code: 'NOT_FOUND' } });
      }
      await (await albumCollection()).deleteMany({ artistId: artist._id });
      await (await artistCollection()).deleteOne({ _id: artist._id });
      return artist;
    },

    addCompany: async (_, args) => {
      if (args.foundedYear < 1900 || args.foundedYear >= 2025) {
        throw new GraphQLError('Invalid founded year', { 
            extensions: { code: 'BAD_USER_INPUT' } });
      }

      const newCompany = {
        _id: new ObjectId(),
        name: args.name,
        foundedYear: args.foundedYear,
        country: args.country,
        albums: []
      };
      const insertResult = await (await recordCompanyCollection()).insertOne(newCompany);
      if (!insertResult.acknowledged) {
        throw new GraphQLError('Failed to Add Company', { 
            extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
      return newCompany;
    },

    removeCompany: async (_, args) => {
      const company = await (await recordCompanyCollection()).findOne({ _id: new ObjectId(args._id) });
      if (!company) {
        throw new GraphQLError('Record Company Not Found', { 
            extensions: { code: 'NOT_FOUND' } });
      }
      await (await albumCollection()).deleteMany({ recordCompanyId: company._id });
      await (await recordCompanyCollection()).deleteOne({ _id: company._id });
      return company;
    },
  }
};
