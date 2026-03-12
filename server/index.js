const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
 const { secp256k1 } = require("ethereum-cryptography/secp256k1");
  const { toHex, hexToBytes,utf8ToBytes } = require("ethereum-cryptography/utils");
  const { keccak256 } = require("ethereum-cryptography/keccak");
app.use(cors());
app.use(express.json());

const balances = {
  "021f118ce176e425318aef774ad67fe3ffa6903775eea0205a6a49092ce934b189": 200,
  "026e5772d219b5c43b6d3e1f843f4503e0154bec4c0d8111545aabe0d64d125028": 50,
  "023e79bd05c6104724e3efe1d6b8d3eee1d23fa22de0e592aa959a542a1d49e720": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { sender,recipient, amount, signature, recoveryBit,messageHash } = req.body;
  console.log("recipient:",recipient,"amount: ", amount, "signature: ",signature, "recoveryBit: ",recoveryBit,"messageHash: ",messageHash,"sender: ",sender)
  try {
    setInitialBalance(sender);
    setInitialBalance(recipient);

    const message=JSON.stringify({
      sender,
      recipient,
      amount: parseInt(amount)
    })
    
    const messageBytes=utf8ToBytes(message);
    const reconstructedMessageHash=keccak256(messageBytes);

    if(toHex(reconstructedMessageHash)!==messageHash){
      return res.status(400).send({ message: "Invalid message hash!" });
    }
    const signatureBytes=hexToBytes(signature);

    const recoveredPublicKey=secp256k1.recoverPublicKey(
      reconstructedMessageHash,
      signatureBytes,
      recoveryBit
    );

    const compressedKey = secp256k1.getPublicKey(recoveredPublicKey, true);
    const recoveredAddress = toHex(compressedKey);
    if (recoveredAddress !== sender) {
  return res.status(400).send({ message: "Invalid !" });
}
    const isValid=secp256k1.verify(
      signatureBytes,
      reconstructedMessageHash,
      privateKey=hexToBytes(sender)
    )
    if(!isValid){
      return res.status(400).send({ message: "Invalid signature!" });
    }

    

    // const sender = toHex(recovererdPublicKey);

    
    if (balances[sender] < amount) {
      return res.status(400).send({ message: "Not enough funds!" });
    }

    balances[sender] -= amount;
    balances[recipient] += amount;

    res.send({ balance: balances[sender] });

  } catch (err) {
    res.status(400).send({ message: "Invalid signature!" });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
