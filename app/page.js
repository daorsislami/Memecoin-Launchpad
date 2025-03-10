"use client"

import { useEffect, useState } from "react"
import { ethers } from 'ethers'

// Components
import Header from "./components/Header"
import List from "./components/List"
import Token from "./components/Token"
import Trade from "./components/Trade"

// ABIs & Config
import Factory from "./abis/Factory.json"
import config from "./config.json"
import images from "./images.json"

export default function Home() {

  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [factory, setFactory] = useState(null);
  const [fee, setFee] = useState(0);
  const [tokens, setTokens] = useState([]);
  const [token, setToken] = useState(null);
  
  // We can create state for the component state like is this modal launched, is this btn clicked or not clicked
  const [showCreate, setShowCreate] = useState(false); 
  const [showTrade, setShowTrade] = useState(false);
  
  function toggleCreate() {
    showCreate ? setShowCreate(false) : setShowCreate(true);
  }

  function toggleTrade(token) {
    console.log("toggle trade...");
    setToken(token);
    showTrade ? setShowTrade(false) : setShowTrade(true);
  }

  async function loadBlockchainData() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    setProvider(provider);

    const network = await provider.getNetwork();
    const address = config[network.chainId].factory.address
    const factory = new ethers.Contract(address, Factory, provider); // here we interact with the smart contract
    setFactory(factory);

    const fee = await factory.fee();
    setFee(fee);
    console.log("fee", fee);    

    const totalTokens = await factory.totalTokens();
    const tokens = [];

    for(let i = 0; i < totalTokens; i++) {

      // This app currently supports only 6 tokens of listing
      if(i == 6) {
        break;
      }
      
      console.log("token", i);

      const tokenSale = await factory.getTokenSale(i);

      const token = {
        token: tokenSale.token,
        name: tokenSale.name,
        creator: tokenSale.creator,
        sold: tokenSale.sold,
        raised: tokenSale.raised,
        isOpen: tokenSale.isOpen,
        image: images[i] // TODO: find a way to retrieve images not statically as I'm doing currently, perhaps on the creation of it? 
      }

      tokens.push(token);
    }

    setTokens(tokens.reverse()) // show the latest tokens;
    console.log(tokens);
  }

  // Whenever this component loads we want to run some functions
  useEffect(() => {
    loadBlockchainData();
  }, [])

  return (
    <div className="page">
      <Header account={account} setAccount={setAccount} />

      <main>
        <div className="create">
          <button onClick={factory && account && toggleCreate} className="btn--fancy">
            {!factory ? (
              "[ contract not deployed ]"
            ) : !account ? (
              "[ please connect ]"
            ) : (
              // If both of the conditions are met we want them to start a token
              "[ start a new token ]"
            )}
          </button>
        </div>


        <div className="listings">
            <h1>new listings</h1>

            <div className="tokens">
              {!account ? (
                <p>please connect wallet</p>
              ) : tokens.length === 0 ? (
                <p>No tokens listed</p>
              ) : (
                tokens.map((token, index) => (
                  <Token toggleTrade={toggleTrade} token={token} key={index} />
                ))
              )}
            </div>
        </div>
      </main>

      { showCreate && (
        <List toggleCreate={toggleCreate} fee={fee} provider={provider} factory={factory}/>
      )}
      

      { showTrade && (
        <Trade toggleTrade={toggleTrade} token={token} provider={provider} factory={factory} />
      )}

    </div>
  );
}
