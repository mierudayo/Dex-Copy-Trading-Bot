require('dotenv').config();

module.exports = {
    defaultNetwork: "ethereum",
    networks: {
    
      ethereum: {
        url: process.env.RPC,
        accounts: [process.env.PRIVATE_KEY]
      }
    },
    solidity: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    },
    paths: {
      sources: "./contracts",
      tests: "./test",
      cache: "./cache",
      artifacts: "./artifacts"
    },
    mocha: {
      timeout: 40000
    }
  }