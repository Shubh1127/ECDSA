import { useState } from "react";
import server from "./server";
import { toHex } from 'ethereum-cryptography/utils';
import { secp256k1 } from 'ethereum-cryptography/secp256k1';
import { keccak256 } from 'ethereum-cryptography/keccak';
import { utf8ToBytes } from 'ethereum-cryptography/utils';
import { hexToBytes } from "ethereum-cryptography/utils";
function Transfer({ address, setBalance ,privateKey}) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();
    console.log(address,privateKey,)
    console.log(sendAmount,recipient);
    const message=JSON.stringify({
      sender: address,
      recipient,
      amount: parseInt(sendAmount)
    })

    const messageBytes=utf8ToBytes(message);
    const hashMessage=keccak256(messageBytes);
    const signatureObj= secp256k1.sign(toHex(hashMessage),hexToBytes(privateKey));
    const signature=signatureObj.toCompactHex();
    const recoveryBit=signatureObj.recovery;
    try {
     const req=await server.post(`send`,{
      sender:address,
      recipient,
      amount:parseInt(sendAmount),
      signature,
      recoveryBit,
      messageHash:toHex(hashMessage)
     })
      setBalance(req.data.balance);
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
