import './App.css';

import idl from './idl.json'
import {Connection, PublicKey, clusterApiUrl} from '@solana/web3.js'
import {Program, AnchorProvider, web3, utils, BN} from '@project-serum/anchor'

import { useEffect, useState } from 'react';

import {Buffer} from 'buffer'
window.Buffer = Buffer

const App = () => {

  const programId = new PublicKey(idl.metadata.address);
  const network = clusterApiUrl('testnet');
  const opts = {
    preflightCommitment: 'processed',
  };
  const {SystemProgram} = web3;

  const [walletAddress, setWallet] = useState(null);
  const [campaigns, setCampaigns] = useState([]);

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection,
      window.solana, 
      opts.preflightCommitment
    );
    return provider;
  }

  const createCampaign = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programId, provider);
      const [campaign] = await PublicKey.findProgramAddress(
        [
          utils.bytes.utf8.encode("CAMPAIGN_DEMO"),
          provider.wallet.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.rpc.create('campaing name', 'campaign description', {
        accounts: {
          campaign,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        }
      })
      console.log("Created a new campaign with address: ", campaign.toString())


      console.log("campaign: ", campaign);
    } catch (error) {
      console.log('Error creating campaign: ', error)
    }

  }

  const checkIfWalletIsConnected = async () => {
    try {
      const {solana} = window;
      if (solana && solana.isPhantom) {
        console.log('Phantom is connected')
        const response = await solana.connect({onlyIfTrusted: true});
        console.log("connect with public key: ", response.publicKey.toString())
        setWallet(response.publicKey.toString());
      } else {
        console.log('Please connect to Phantom wallet')
      }
    } catch (error) {
      console.log(error)
    }
  };

  const connectWallet = async () => {
    const {solana} = window;
    if (solana) {
      const response = await solana.connect();
      console.log("connect with public key: ", response.publicKey.toString())
      setWallet(response.publicKey.toString());
    }

  }

  const getCampaigns = async () => {
    const connection = await new Connection(network, opts.preflightCommitment);
    const provider = getProvider()
    const program = new Program(idl, programId, provider);
    Promise.all(
      (await connection.getProgramAccounts(programId)).map(
        async (campaign) => ({
          ...(await program.account.campaign.fetch(campaign.pubkey)),
          pubkey: campaign.pubkey,
        })
      )
    ).then((campaigns)=> {
      setCampaigns(campaigns)
    })
  }

  const donate = async (publicKey) => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programId, provider)

      await program.rpc.donate(new BN(0.2 * web3.LAMPORTS_PER_SOL), {
        accounts: {
          campaign: publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        }
      });
      console.log('Donated to campaign: ', publicKey.toString());
      getCampaigns();
    } catch (error) {
      console.log('Error donating to campaign: ', error)
    }
  }

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    }
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, [])

  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet}>
      Connect to wallet
    </button>
  )

  const renderConnectedContainer = () => (
    <>
      {/* <button onClick={createCampaign}>Create a Campaign</button> */}
      <button onClick={getCampaigns}>Get Campaigns</button>
      <br/>
      {campaigns.map((campaign) => (
        <>
          <p>Campaign ID: {campaign.pubkey.toString()}</p>
          <p>Balance: {(campaign.amountDonated / web3.LAMPORTS_PER_SOL).toString()}</p>
          <p>{campaign.name}</p>
          <p>{campaign.description}</p>
          <button onClick={() => donate(campaign.pubkey)}>Donate</button>
        </>
      ))}
    </>
  )

  return (
    <div className="App">
      {!walletAddress && renderNotConnectedContainer()}
      {walletAddress && renderConnectedContainer()}
    </div>
  );

}

export default App;
