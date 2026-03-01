const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
 const { secp256k1 } = require("ethereum-cryptography/secp256k1");
  const { toHex, hexToBytes } = require("ethereum-cryptography/utils");
app.use(cors());
app.use(express.json());

const balances = {
  "02569227157f387ab8ea2a33ec7acd95ec6f6fbe94d32246f3c7878c720e4783a4": 100,
  "028c8f4458f70ce4dcebc1d26e1e7ae256a19353d20af3733a2f74df4284a30e22": 50,
  "03310a454cf68106da2974093de2f11c40998e621c2551986e2b5b2f30e11fe62d": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  // get the signature and recovery bit from the client side
  // recover the public address from the signature
  const { recipient, amount, signature, recovery, messageHash } = req.body;
  console.log("Received send request:", req.body);


  try {
    const message=JSON.stringify=({amount,recipient});
    const messagehash=keccak256(utf8ToBytes(message));

    const signBytes=hexToBytes(signature);
    // Recover public key from signature
    const publicKey = secp256k1.recoverPublicKey(
      Uint8Array.from(Buffer.from(messageHash, "hex")),
      Uint8Array.from(Buffer.from(signature, "hex")),
      recovery
    );
    const sender = toHex(publicKey);

    setInitialBalance(sender);
    setInitialBalance(recipient);

    if (balances[sender] < amount) {
      res.status(400).send({ message: "Not enough funds!" });
    } else {
      balances[sender] -= amount;
      balances[recipient] += amount;
      res.send({ balance: balances[sender] });
    }
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
