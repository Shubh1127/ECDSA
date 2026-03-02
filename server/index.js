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
  const { recipient, amount, signature, recovery } = req.body;

  try {
    // 🔥 Recreate message on backend
    const message = JSON.stringify({ amount, recipient });
    const messageHash = keccak256(utf8ToBytes(message));

    const sigBytes = hexToBytes(signature);

    const publicKey = secp256k1.recoverPublicKey(
      messageHash,
      sigBytes,
      recovery
    );

    const isValid = secp256k1.verify(sigBytes, messageHash, publicKey);

    if (!isValid) {
      return res.status(400).send({ message: "Invalid signature!" });
    }

    const sender = toHex(publicKey);

    setInitialBalance(sender);
    setInitialBalance(recipient);

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
