import gql from 'graphql-tag';

const typeDefs = gql`
  type Artist {
    _id: String!
    name: String!
    dateFormed: String!
    members: [String!]!
    albums: [Album!]!
    numOfAlbums: Int  
  }

  type Album {
    _id: String!
    title: String!
    releaseDate: String!
    genre: MusicGenre!
    artist: Artist!
    recordCompany: RecordCompany!
    songs: [String!]!
  }

  type RecordCompany {
    _id: String!
    name: String!
    foundedYear: Int!
    country: String
    albums: [Album!]!
    numOfAlbums: Int 
  }

  enum MusicGenre {
    POP
    ROCK
    HIP_HOP
    COUNTRY
    JAZZ
    CLASSICAL
    ELECTRONIC
    R_AND_B
    INDIE
    ALTERNATIVE
  }

  type Query {
    artists: [Artist] 
    albums: [Album]  
    recordCompanies: [RecordCompany]  

    # Fetch individual entities
    getArtistById(_id: String!): Artist 
    getAlbumById(_id: String!): Album  
    getCompanyById(_id: String!): RecordCompany  

    # Fetch songs by artist (Nested Query)
    getSongsByArtistId(artistId: String!): [String]  

    # Filtered Queries
    albumsByGenre(genre: MusicGenre!): [Album]  
    companyByFoundedYear(min: Int!, max: Int!): [RecordCompany] 
    searchArtistByArtistName(searchTerm: String!): [Artist]  
  }

  type Mutation {
    # Artist Mutations
    addArtist(name: String!, dateFormed: String!, members: [String!]!): Artist  
    editArtist(_id: String!, name: String, dateFormed: String, members: [String!]): Artist  
    removeArtist(_id: String!): Artist  

    # Album Mutations
    addAlbum(
      title: String!,
      releaseDate: String!,
      genre: MusicGenre!,
      songs: [String!]!,
      artistId: String!,
      recordCompanyId: String!
    ): Album 

    editAlbum(
      _id: String!,
      title: String,
      releaseDate: String,
      genre: MusicGenre,
      songs: [String!],
      artistId: String,
      recordCompanyId: String
    ): Album  

    removeAlbum(_id: String!): Album  

    # Record Company Mutations
    addCompany(name: String!, foundedYear: Int!, country: String!): RecordCompany  
    editCompany(_id: String!, name: String, foundedYear: Int, country: String): RecordCompany 
  }
`;

export default typeDefs;
