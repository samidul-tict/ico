import { ethers } from "ethers";
import * as dotenv from "dotenv";
import SpaceCoinICO from '../../artifacts/contracts/SpaceCoinICO.sol/SpaceCoinICO.json';
import { ErrorFragment } from "ethers/lib/utils";

const API_KEY = process.env.API_KEY
const PRIVATE_KEY = process.env.PRIVATE_KEY
const CONTRACT_ADDRESS = "0xEBFE5f5f6c02de8Df3de0E2A018b89576459f8b0"

/* const provider = new ethers.providers.AlchemyProvider(network="rinkeby", API_KEY);
const signer = new ethers.Wallet(PRIVATE_KEY, provider); */
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

const contract = new ethers.Contract(CONTRACT_ADDRESS, SpaceCoinICO.abi, signer);

// Kick things off
go()

async function go() {
  await connectToMetamask();
  ico_spc_left.innerText = await contract.balanceOf(CONTRACT_ADDRESS);
  total_contribution.innerText = await contract.getTotalContribution();
}

async function connectToMetamask() {
  try {
    console.log("Signed in as", await signer.getAddress());
  }
  catch (err) {
    console.log("Not signed in");
    await provider.send("eth_requestAccounts", []);
  }
}

ico_spc_buy.addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  await connectToMetamask();
  
  try {
    const tx = signer.sendTransaction({
      to: CONTRACT_ADDRESS,
      value: ethers.utils.parseEther("0.001"),
      gasLimit: ethers.utils.hexlify(100000),
    });
    total_contribution.innerText = await contract.getTotalContribution();
  } catch (err) {
    console.log(err);
  }
});

transfer.addEventListener('click', async () => {
  try{
    const response = await contract.transfer(signer.getAddress(), 5);
    err_msg.innerText = response.message;
  } catch(err) {
    err_msg.innerText = err.message;
    console.log(err.message);
  }
});
