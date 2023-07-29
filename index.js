const { ethers } = require('ethers')
const abiDecoder = require("abi-decoder");
require('dotenv').config();
const fs = require('fs');
const provider = new ethers.WebSocketProvider(process.env.RPC);
const owner = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const config = require("./config.json");

const IUniswapV2RouterABI = require("./abi/IUniswapV2Router02.json");
const IUniswapV2PairABI = require("./abi/IUniswapV2Pair.json");
const IWeth = require("./abi/IWETH.json");

let factoryAddress = "";
let routerAddress = "";
let pairAddress = "";
let weth = "";

// Easily decode UniswapV2 Router data
abiDecoder.addABI(IUniswapV2RouterABI);

async function performTx(pendingTx, path) {
    const payload = await createPayload(path)

    const tokenContract = new ethers.Contract(path[0], IWeth, owner);
    const amt = ethers.toBigInt(getValue(config.thresholdAmt, getValue(config.tokens, path[0], 0), 1))
    await tokenContract.connect(owner).transfer(pairAddress, amt)
// If you want to increase the gas fee, please pass the added value in maxFeePergas as ethers.toBigInt(100)
    const txObj = {
        from: owner.address,
        to: pairAddress,
        data: payload,
        chainId: pendingTx.chainId,
        maxFeePerGas: pendingTx.maxFeePerGas,
        maxPriorityFeePerGas: ethers.toBigInt(pendingTx.maxPriorityFeePerGas) + ethers.toBigInt(20),
        gasLimit: pendingTx.gasLimit
    };

    const tx = await owner.sendTransaction(txObj);
    console.log("\n> Follower's Transaction hash: ", pendingTx.hash)
    console.log("> Your Transaction hash: ", tx.hash, "\n\n")
}

function getValue(array, key, byName) {
    let ans;
    for (let i = 0; i < array.length; i++) {
        if (byName) {
            if (array[i].name.toString().toLowerCase() == key.toString().toLowerCase()) {
                ans = array[i].value.toString()
                break

            }
        } else {
            if (array[i].value.toString().toLowerCase() == key.toString().toLowerCase()) {
                ans = array[i].name.toString()
                break
            }
        }
    }
    if (ans) {
        return ans.toString();
    } else {
        return null
    }
}

function validateFromAddress(fromAddr) {
    if (getValue(config.addresses, fromAddr, 0)) {
        return true
    } else {
        return false
    }
}

function validateToAddress(toAddr) {
    if (getValue(config.routers, toAddr, 0)) {
        routerAddress = toAddr
        return true
    } else {
        return false
    }
}

function getPath(txData) {
    let data = null
    let path, tradeEth;

    try {
        data = abiDecoder.decodeMethod(txData);
    } catch (e) {
        return null;
    }

    switch (data.name) {
        case "swapETHForExactTokens":
        case "swapExactETHForTokens":
        case "swapExactETHForTokensSupportingFeeOnTransferTokens":
            path = data.params[1].value
            tradeEth = 1
            break;

        case "swapTokensForExactETH":
        case "swapExactTokensForETH":
        case "swapExactTokensForETHSupportingFeeOnTransferTokens":
        case "swapExactTokensForTokens":
        case "swapTokensForExactTokens":
        case "swapExactTokensForTokensSupportingFeeOnTransferTokens":
            path = data.params[2].value
            tradeEth = 0
            break;

        default:
            null;
            break;

    }
    return [data.name, path, tradeEth]
}

function validateParams(path) {
    if (getValue(config.tokens, path[0], 0) && getValue(config.tokens, path[1], 0)) {
        return true
    } else {
        return false
    }
}

async function validateTokenBalance(tokenAddress) {
    const tokenContract = new ethers.Contract(tokenAddress, ["function balanceOf(address) public view returns(address)"], owner);
    const balance = await tokenContract.balanceOf(owner.address);
    if (parseInt(balance) > getValue(config.thresholdAmt, getValue(config.tokens, tokenAddress, 0), 1)) {
        return true
    } else {
        return false
    }
}

async function createPayload(path) {
    weth = getValue(config.tokens, "WMATIC", 1)
    let amountIn;
    const [token0, token1] = sortTokens(path);

    const routerContract = new ethers.Contract(routerAddress, IUniswapV2RouterABI, owner);

    factoryAddress = await routerContract.factory();

    const factoryContract = new ethers.Contract(factoryAddress, ["function getPair(address, address) public view returns(address)", "function getReserves() public view returns(uint112, uint112, uint32)"], owner);

    pairAddress = await factoryContract.getPair(token0, token1);

    const pairContract = new ethers.Contract(pairAddress, IUniswapV2PairABI, owner);

    const [reserveA, reserveB, _] = await pairContract.getReserves();
    amountIn = ethers.toBigInt(getValue(config.thresholdAmt, getValue(config.tokens, path[0], 0), 1))

    let reserveASorted, reserveBSorted, amount0Out;
    if (token0.toString() == path[0].toString()) {
        reserveASorted = reserveA
        reserveBSorted = reserveB
        amount0Out = 1
    } else {
        reserveASorted = reserveA
        reserveBSorted = reserveB
        amount0Out = 0
    }

    const amountOut = await routerContract.getAmountOut(amountIn, reserveASorted, reserveBSorted)

    const interface = new ethers.Interface(IUniswapV2PairABI)
    const payload = interface.encodeFunctionData(
        "swap",
        [
            amount0Out == 0 ? amountOut : 0,
            amount0Out == 1 ? amountOut : 0,
            owner.address,
            "0x",
        ]
    );

    return payload;

}

async function validateTx(tx) {
    if (validateFromAddress(tx.from)) {
        if (validateToAddress(tx.to)) {
            const [name, path, tradeEth] = getPath(tx.data);
            const data = `\nUser Address : ${tx.from} \nMethod Name : ${name} \nToken0 : ${path[0]} \nToken1 : ${path[1]} \nValue : ${tx.value} \nTxHash: ${tx.hash}\n\n\n`
            fs.writeFileSync("Logs.txt", data, {flag: 'a'})
            if (tradeEth == 1) {
                if (validateParams(path)) {
                    return [path, true]
                }
            } else {
                if (await validateTokenBalance(path[0])) {
                    return [path, true];
                }
            }

            return [null, false]
        }
    }

    return [null, null, false]
}

function sortTokens(token) {
    if (ethers.toBigInt(token[0].toString()) < (ethers.toBigInt(token[1].toString()))) {
        return [token[0], token[1]];
    }
    return [token[0], token[1]];
}

const startTrade = async (txHash) => {

    const pendingTx = await provider.getTransaction(txHash);
        console.log("🚀 ~ file: index.js:222 ~ provider.on ~ txHash:", txHash)
        try {
            const [path, success] = await validateTx(pendingTx)
            if (success) {
                performTx(pendingTx, path);
            }
        } catch (e) {
            // console.log(e)
        }
}
console.log('Started listening to mempool........')
fs.writeFileSync("Logs.txt", "Started listening to mempool........", {flag: "a"})

console.log(process.env.RPC);

provider.on("pending", (txHash) =>
    startTrade(txHash).catch((e) => {
        //
    })
  );
