import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';  // For working with __dirname in ES Modules
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningStargateClient } from "@cosmjs/stargate";
import { FrequencyChecker } from './checker.js'; // Adjust extension as per ESM requirement
import conf from './config.js'; // Ensure config file is also ESM compatible

// __dirname workaround for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load config
console.log("loaded config: ", conf);

const app = express();
const checker = new FrequencyChecker(conf);

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, './index.html'));
});

// Serve the configuration as JSON
app.get('/config.json', async (req, res) => {
  try {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(conf.sender.mnemonic, conf.sender.option);
    const [firstAccount] = await wallet.getAccounts();

    const project = { ...conf.project, sample: firstAccount.address };
    res.json(project);
  } catch (err) {
    console.error('Error generating config:', err);
    res.status(500).send({ result: 'Error generating config' });
  }
});

// Handle token requests
app.get('/send/:address', async (req, res) => {
  const { address } = req.params;
  const ip = req.ip;  // Get client IP

  console.log('Request tokens to:', address, ip);

  if (address) {
    try {
      // Check if the address starts with the correct prefix
      if (address.startsWith(conf.sender.option.prefix)) {
        // Check address and IP request frequency
        if (await checker.checkAddress(address) && await checker.checkIp(ip)) {
          // Update the frequency checker
          checker.update(ip);

          // Send the transaction
          const result = await sendTx(address);
          console.log('Sent tokens to:', address);
          checker.update(address); // Update after successful transaction
          res.send({ result });
        } else {
          res.send({ result: "You requested too often" });
        }
      } else {
        res.send({ result: `Address [${address}] is not supported.` });
      }
    } catch (err) {
      console.error('Transaction error:', err);
      res.status(500).send({ result: 'Failed, please contact admin.' });
    }
  } else {
    res.status(400).send({ result: 'Address is required' });
  }
});

// Start the server
app.listen(conf.port, () => {
  console.log(`Faucet app listening on port ${conf.port}`);
});

// Function to send tokens
async function sendTx(recipient) {
  try {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(conf.sender.mnemonic, conf.sender.option);
    const [firstAccount] = await wallet.getAccounts();

    const rpcEndpoint = conf.blockchain.rpc_endpoint;
    const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, wallet);

    const amount = [conf.tx.amount];
    const fee = {
      amount: conf.tx.fee.amount,
      gas: conf.tx.fee.gas,
    };

    // Send tokens and return the transaction result
    const result = await client.sendTokens(firstAccount.address, recipient, amount, fee);
    return result;
  } catch (err) {
    console.error('Error sending transaction:', err);
    throw new Error('Transaction failed');
  }
}
