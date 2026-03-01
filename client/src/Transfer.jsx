import { useState } from "react";
import server from "./server";
import { toHex } from 'ethereum-cryptography/utils';
import { secp256k1 } from 'ethereum-cryptography/secp256k1';
import { keccak256 } from 'ethereum-cryptography/keccak';
import { utf8ToBytes } from 'ethereum-cryptography/utils';
import {Buffer} from 'buffer';
function Transfer({ address, setBalance ,privateKey}) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();

    // Get privateKey from parent (App)
    const privKey = privateKey || "";
    if (!privKey) {
      alert("Private key required!");
      return;
    }

    // Prepare message
    const message = JSON.stringify({ amount: parseInt(sendAmount), recipient });
    const messageHash = toHex(keccak256(utf8ToBytes(message)));

    // Sign message
    const msgBytes = Uint8Array.from(Buffer.from(messageHash, "hex"));
    const privBytes = Uint8Array.from(Buffer.from(privKey, "hex"));
    const signatureObj = secp256k1.sign(msgBytes, privBytes);
    const signature = signatureObj.toCompactHex();
    const recovery = signatureObj.recovery;

    try {
      const {
        data: { balance },
      } = await server.post(`send`, {
        amount: parseInt(sendAmount),
        recipient,
        signature,
        recovery,
        messageHash,
      });
      setBalance(balance);
    } catch (ex) {
      alert(ex.response.data.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
