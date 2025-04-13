// This file provides mock data for testing without MongoDB access
const mockUsers = [
  {
    _id: '1',
    username: 'testuser',
    password: '$2a$10$XQHIpZcXSMBVqUUGhd/X8.Ql.ZO5Yw5Fy7ZFTCRfaLzYLhpVPUGK6', // hashed 'password'
    portfolio: [
      {
        itemId: 'swsh12-1',
        quantity: 2,
        isSealed: false
      },
      {
        itemId: 'sv3-1',
        quantity: 1,
        isSealed: false
      },
      {
        itemId: 'swsh12pt5gg-GG70',
        quantity: 1,
        isSealed: true
      }
    ]
  }
];

// Mock user model functions
const User = {
  findOne: async (query) => {
    if (query.username) {
      return mockUsers.find(user => user.username === query.username) || null;
    }
    if (query._id) {
      return mockUsers.find(user => user._id === query._id) || null;
    }
    return null;
  },
  findById: async (id) => {
    return mockUsers.find(user => user._id === id) || null;
  }
};

// Mock card model
const Card = {
  findOne: async (query) => {
    return null; // We're not using this in our current testing
  }
};

module.exports = {
  User,
  Card,
  mockUsers
};
