require('dotenv').config({ path: '.env' });

const { createAlchemyWeb3 } = require("@alch/alchemy-web3");

const web3 = createAlchemyWeb3(
    process.env.ALCHEMY_API_URL,
);

//example 
//input # of past blocks to look at = 20 
//latest = newest block we want data for 
//input percentile range of priority fees (25, 50, 75)
// web3.eth.getFeeHistory(20, "latest", [25, 50, 75]).then(console.log);

const formatOutput = (data, numBlocks) => {
    let blocks = []
    for (let i = 0; i < numBlocks; i++) {
        blocks.push({
            blockNumber: Number(data.oldestBlock) + i, // Number() converts hexadecimal to number; adding i b/c starts with latest block 
                //oldestBlock is the oldest block from what's returned -- happened furthest in the past
            reward: data.reward[i].map(r => Math.round(Number(r) / 10 ** 9)), //convert hexidecimal gas value demoinated in wei to decimals denominated in gwei; 1 gwei = 0.000000001 ETH 
            baseFeePerGas: Math.round(Number(data.baseFeePerGas[i]) / 10 ** 9), //convert hexidecimal gas value demoinated in wei to decimals denominated in gwei; 1 gwei = 0.000000001 ETH 
            gasUsedRatio: data.gasUsedRatio[i],
        })
    }
    return blocks;
}

const numBlocks = 20;
// web3.eth.getFeeHistory(numBlocks, "latest", [25, 50, 75]).then((data) => {
//     const blocks = formatOutput(data, numBlocks);
//     console.log(blocks);
// });

//new block is mined every ~15 seconds 
// subscribe to the event of blocks being added and update our transaction history such that it always shows data for the latest 20 blocks.
let subscription = web3.eth.subscribe('newBlockHeaders');
subscription.on("data", () => {
    web3.eth.getFeeHistory(numBlocks, "latest", [25, 50, 75]).then((data) => {
        const blocks = formatOutput(data, numBlocks);
        console.log(blocks);
    });
});