import './App.css';
import { useEffect, useState } from 'react';
import { createAlchemyWeb3 } from '@alch/alchemy-web3';
import Me from './assets/Me.jpg';

const NUM_BLOCKS = 20;

function App() {

  const [blockHistory, setBlockHistory] = useState(null);
  const [avgGas, setAvgGas] = useState(null);
  const [avgBlockVolume, setAvgBlockVolume] = useState(null);

  const formatOutput = (data) => {

    console.log(data);

    let avgGasFee = 0;
    let avgFill = 0;
    let blocks = [];

    for (let i = 0; i < NUM_BLOCKS; i++) {

      //Number() converts hexadecimal to number 
      // = avgGasFee + 50% percentile of reward + baseFeePerGas ... this is in wei 
      avgGasFee = avgGasFee + Number(data.reward[i][1]) + Number(data.baseFeePerGas[i]);

      //multiply by 100 to convert decimal to percentage
      avgFill = avgFill + Math.round(data.gasUsedRatio[i] * 100);

      //for explanation of this logic, see main.js 
      blocks.push({
        blockNumber: Number(data.oldestBlock) + i,
        reward: data.reward[i].map(r => Math.round(Number(r) / 10 ** 9)),
        baseFeePerGas: Math.round(Number(data.baseFeePerGas[i]) / 10 ** 9),
        gasUsedRatio: Math.round(data.gasUsedRatio[i] * 100),
      })

    }

    avgGasFee = avgGasFee / NUM_BLOCKS;
    avgGasFee = Math.round(avgGasFee / 10 ** 9); //convert wei to gwei 
    avgFill = avgFill / NUM_BLOCKS;
    return [blocks, avgGasFee, avgFill];

  }

  useEffect(() => {
    const web3 = createAlchemyWeb3(
      process.env.REACT_APP_ALCHEMY_API_URL,
    );
    let subscription = web3.eth.subscribe('newBlockHeaders');
    subscription.on('data', () => {
      web3.eth.getFeeHistory(NUM_BLOCKS, "latest", [25, 50, 75]).then((feeHistory) => {
        const [blocks, avgGasFee, avgFill] = formatOutput(feeHistory, NUM_BLOCKS);
        setBlockHistory(blocks);
        setAvgGas(avgGasFee);
        setAvgBlockVolume(avgFill);
      });
    });
    return () => {
      web3.eth.clearSubscriptions();
    }
  }, [])

  return (
    <div className='main-container'>
      <div className='header-container'>
        <h1>EIP-1559 Gas Tracker</h1>
        {!blockHistory && <p>Data is loading...</p>}
        {avgGas && avgBlockVolume && <h3>
          Past {NUM_BLOCKS} Block Average: <span className='gas'>{avgGas} Gwei</span> | <span className='vol'>{avgBlockVolume}% Volume</span>
        </h3>}
        {blockHistory && <table>
          <thead>
            <tr>
              <th>Block Number</th>
              <th>Base Fee (Gwei)</th>
              <th>Reward (25%)</th>
              <th>Reward (50%)</th>
              <th>Reward (75%)</th>
              <th>Gas Used</th>
            </tr>
          </thead>
          <tbody>
            {blockHistory.slice(0).reverse().map(block => {
              return (
                <tr key={block.blockNumber}>
                  <td>{block.blockNumber}</td>
                  <td>{block.baseFeePerGas}</td>
                  <td>{block.reward[0]}</td>
                  <td>{block.reward[1]}</td>
                  <td>{block.reward[2]}</td>
                  <td>{block.gasUsedRatio}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>}
      </div>
      <div className="footer-container">
        <a
          href={'https://www.mattmiller.app/'}
          target="_blank"
          rel="noreferrer"
        ><img alt="My avatar" className="my-avatar" src={Me} /><p>Built By Matt</p></a>
      </div>
    </div>
  );
}

export default App;
