# Dex Copy Trading Bot

This bot will keep a watch on some user's wallet transactions and performs the same operation as that wallet from your account. It performs the same transaction from your wallet using Uniswap Router Contract Call.

The bot support different methods of UniswapV2Router Contract like:

    1) swapExactETHForTokens
    2) swapETHForExactTokens
    3) swapExactTokensForETH
    4) swapTokensForExactETH
    5) swapTokensForExactTokens
    6) swapExactTokensForTokens

If, your watched address is making trade on the routers and calling this function, the bot will directly perform the same trade but with the configuration, that you will be specifying in the config file.

# Setup Instructions

## 1. Clone the repository
```shell
git clone https://github.com/manavjain2002/Copy-Dex-Trading-Bot.git
cd Dex-Copy-Trading-Bot
npm install
```

## 2. Edit .env-example file with your private key, rpc url and create .env file.

```shell
mv .env-example .env
```

## 3. Set the Configurations

These configurations should be in the config.json file. This configuration file will contain the details of the dex’s you want to trade on, the tokens you want to trade on, and also the assets you want to use while trading.

### Fields of the configuration file :-

#### 1. addresses :- 
Addresses of the wallet, you want to kepp watch on. It takes an object with two values at each index of array named "name" - name of the wallet and "value" - that wallet address

Eg: 
```json
"addresses": [
        {
            "name": "Manav",
            "value": "0xfbAC7b9ff473B1E4e6e31Ab70fA20aB4d30D05e5"
        },
        {
            "name": "Manav",
            "value": "0x177aE65cE40D15DDE6F2D8632BFE71FA13356AE3"
        }
    ],
```
#
#### 2. routers :-
An array of decentralized exchanges router addresses on which you want to perform the trade. It takes an object with two values at each index of the array named “name” - name of the dex and "value" - address of its router.

Eg:
```json
"routers": [
        {
            "name": "sushiswap",
            "value": "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"
        }
    ],
```
#

#### 3. tokens :- 
Token addresses on which you want to trade. It contains an array with "name" (symbol) and "value" (address of the token)

Eg:
```json 
"tokens": [
        {
            "name": "NEWTKN",
            "value": "0x4B19cC06E8F9CE47ecda1486f0c74Bf8bA1d985a"
        },
        {
            "name": "WMATIC",
            "value": "0x5B67676a984807a212b1c59eBFc9B3568a474F0a"
        }
    ],
```
#
#### 4. thresholdAmt :- 
Maximum value for each token you want to trade in Wei(10^18). It contains an array with "name" (name) and "value" (maximum amt of token in Wei)

Eg:
```json 
"thresholdAmt": [
        {
            "name": "WMATIC",
            "value": "1000000000000000000"
        },
        {
            "name": "NEWTKN",
            "value": "100000000000000000000"
        }
    ]
```
#
#### The config.json file will look like this :- 
```json
{
    "addresses": [
        {
            "name": "Manav",
            "value": "0xfbAC7b9ff473B1E4e6e31Ab70fA20aB4d30D05e5"
        },
        {
            "name": "Manav",
            "value": "0x177aE65cE40D15DDE6F2D8632BFE71FA13356AE3"
        }
    ],
    "routers": [
        {
            "name": "sushiswap",
            "value": "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"
        }
    ],
    "tokens": [
        {
            "name": "NEWTKN",
            "value": "0x4B19cC06E8F9CE47ecda1486f0c74Bf8bA1d985a"
        },
        {
            "name": "WMATIC",
            "value": "0x5B67676a984807a212b1c59eBFc9B3568a474F0a"
        }
    ],
    "thresholdAmt": [
        {
            "name": "WMATIC",
            "value": "1000000000000000000"
        },
        {
            "name": "NEWTKN",
            "value": "100000000000000000000"
        }
    ]
}
```

## 4. To start the bot.
Remeber to setup the hardhat.config.js file to make your bot run on your specified network.

```shell
npx hardhat run --network <network> index.js
```
