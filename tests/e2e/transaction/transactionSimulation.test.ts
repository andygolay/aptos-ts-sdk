import { Account, U64, SigningSchemeInput, Ed25519PublicKey, AccountAddress } from "../../../src";
import { longTestTimeout } from "../../unit/helper";
import { getAptosClient } from "../helper";
import { fundAccounts, multiSignerScriptBytecode, publishTransferPackage, singleSignerScriptBytecode } from "./helper";
import { simulateTransaction } from "../../../src/internal/transactionSubmission";
import { AccountAuthenticatorNoAccountAuthenticator } from "../../../src/transactions";

describe("transaction simulation", () => {
  const { aptos } = getAptosClient();
  const contractPublisherAccount = Account.generate();
  const singleSignerED25519SenderAccount = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: false });
  const legacyED25519SenderAccount = Account.generate();
  const singleSignerSecp256k1Account = Account.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });
  const receiverAccounts = [Account.generate(), Account.generate()];
  const secondarySignerAccount = Account.generate();
  const feePayerAccount = Account.generate();
  beforeAll(async () => {
    await fundAccounts(aptos, [
      contractPublisherAccount,
      singleSignerED25519SenderAccount,
      singleSignerSecp256k1Account,
      legacyED25519SenderAccount,
      ...receiverAccounts,
      secondarySignerAccount,
      feePayerAccount,
    ]);
    await publishTransferPackage(aptos, contractPublisherAccount);
  }, longTestTimeout);
  describe("Single Sender ED25519", () => {
    describe("single signer", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerED25519SenderAccount.accountAddress,
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerED25519SenderAccount.accountAddress,
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerED25519SenderAccount.accountAddress,
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
    });
    describe("multi agent", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.transaction.build.multiAgent({
          sender: singleSignerED25519SenderAccount.accountAddress,
          secondarySignerAddresses: [secondarySignerAccount.accountAddress],
          data: {
            bytecode: multiSignerScriptBytecode,
            functionArguments: [
              new U64(BigInt(100)),
              new U64(BigInt(200)),
              receiverAccounts[0].accountAddress,
              receiverAccounts[1].accountAddress,
              new U64(BigInt(50)),
            ],
          },
        });

        const [response] = await aptos.transaction.simulate.multiAgent({
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
        });
        expect(response.success).toBeTruthy();
      });

      test(
        "with entry function payload",
        async () => {
          const rawTxn = await aptos.transaction.build.multiAgent({
            sender: singleSignerED25519SenderAccount.accountAddress,
            secondarySignerAddresses: [secondarySignerAccount.accountAddress],
            data: {
              function: `${contractPublisherAccount.accountAddress}::transfer::two_by_two`,
              functionArguments: [
                new U64(100),
                new U64(200),
                receiverAccounts[0].accountAddress,
                receiverAccounts[1].accountAddress,
                new U64(50),
              ],
            },
          });

          const [response] = await aptos.transaction.simulate.multiAgent({
            signerPublicKey: singleSignerED25519SenderAccount.publicKey,
            transaction: rawTxn,
            secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
          });
          expect(response.success).toBeTruthy();
        },
        longTestTimeout,
      );
    });
    describe("fee payer", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerED25519SenderAccount.accountAddress,
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerED25519SenderAccount.accountAddress,
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerED25519SenderAccount.accountAddress,
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multi agent transaction", async () => {
        const rawTxn = await aptos.transaction.build.multiAgent({
          sender: singleSignerED25519SenderAccount.accountAddress,
          secondarySignerAddresses: [secondarySignerAccount.accountAddress],
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::two_by_two`,
            functionArguments: [
              new U64(100),
              new U64(200),
              receiverAccounts[0].accountAddress,
              receiverAccounts[1].accountAddress,
              new U64(50),
            ],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.multiAgent({
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
    });
  });
  describe("Single Sender Secp256k1", () => {
    describe("single signer", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerSecp256k1Account.accountAddress,
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerSecp256k1Account.accountAddress,
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerSecp256k1Account.accountAddress,
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
    });
    describe("multi agent", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.transaction.build.multiAgent({
          sender: singleSignerSecp256k1Account.accountAddress,
          secondarySignerAddresses: [secondarySignerAccount.accountAddress],
          data: {
            bytecode: multiSignerScriptBytecode,
            functionArguments: [
              new U64(BigInt(100)),
              new U64(BigInt(200)),
              receiverAccounts[0].accountAddress,
              receiverAccounts[1].accountAddress,
              new U64(BigInt(50)),
            ],
          },
        });

        const [response] = await aptos.transaction.simulate.multiAgent({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
        });
        expect(response.success).toBeTruthy();
      });

      test(
        "with entry function payload",
        async () => {
          const rawTxn = await aptos.transaction.build.multiAgent({
            sender: singleSignerSecp256k1Account.accountAddress,
            secondarySignerAddresses: [secondarySignerAccount.accountAddress],
            data: {
              function: `${contractPublisherAccount.accountAddress}::transfer::two_by_two`,
              functionArguments: [
                new U64(100),
                new U64(200),
                receiverAccounts[0].accountAddress,
                receiverAccounts[1].accountAddress,
                new U64(50),
              ],
            },
          });

          const [response] = await aptos.transaction.simulate.multiAgent({
            signerPublicKey: singleSignerSecp256k1Account.publicKey,
            transaction: rawTxn,
            secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
          });
          expect(response.success).toBeTruthy();
        },
        longTestTimeout,
      );
    });
    describe("fee payer", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerSecp256k1Account.accountAddress,
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerSecp256k1Account.accountAddress,
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerSecp256k1Account.accountAddress,
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multi agent transaction", async () => {
        const rawTxn = await aptos.transaction.build.multiAgent({
          sender: singleSignerSecp256k1Account.accountAddress,
          secondarySignerAddresses: [secondarySignerAccount.accountAddress],
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::two_by_two`,
            functionArguments: [
              new U64(100),
              new U64(200),
              receiverAccounts[0].accountAddress,
              receiverAccounts[1].accountAddress,
              new U64(50),
            ],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.multiAgent({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
    });
  });
  describe("Legacy ED25519", () => {
    describe("single signer", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: legacyED25519SenderAccount.accountAddress,
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: legacyED25519SenderAccount.accountAddress,
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: legacyED25519SenderAccount.accountAddress,
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
    });
    describe("multi agent", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.transaction.build.multiAgent({
          sender: legacyED25519SenderAccount.accountAddress,
          secondarySignerAddresses: [secondarySignerAccount.accountAddress],
          data: {
            bytecode: multiSignerScriptBytecode,
            functionArguments: [
              new U64(BigInt(100)),
              new U64(BigInt(200)),
              receiverAccounts[0].accountAddress,
              receiverAccounts[1].accountAddress,
              new U64(BigInt(50)),
            ],
          },
        });

        const [response] = await aptos.transaction.simulate.multiAgent({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
        });
        expect(response.success).toBeTruthy();
      });

      test(
        "with entry function payload",
        async () => {
          const rawTxn = await aptos.transaction.build.multiAgent({
            sender: legacyED25519SenderAccount.accountAddress,
            secondarySignerAddresses: [secondarySignerAccount.accountAddress],
            data: {
              function: `${contractPublisherAccount.accountAddress}::transfer::two_by_two`,
              functionArguments: [100, 200, receiverAccounts[0].accountAddress, receiverAccounts[1].accountAddress, 50],
            },
          });

          const [response] = await aptos.transaction.simulate.multiAgent({
            signerPublicKey: legacyED25519SenderAccount.publicKey,
            transaction: rawTxn,
            secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
          });
          expect(response.success).toBeTruthy();
        },
        longTestTimeout,
      );
    });
    describe("fee payer", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: legacyED25519SenderAccount.accountAddress,
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: legacyED25519SenderAccount.accountAddress,
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: legacyED25519SenderAccount.accountAddress,
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multi agent transaction", async () => {
        const rawTxn = await aptos.transaction.build.multiAgent({
          sender: legacyED25519SenderAccount.accountAddress,
          secondarySignerAddresses: [secondarySignerAccount.accountAddress],
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::two_by_two`,
            functionArguments: [100, 200, receiverAccounts[0].accountAddress, receiverAccounts[1].accountAddress, 50],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.multiAgent({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
    });
  });
  describe("validate fee payer data on transaction simulation", () => {
    test("it throws when trying to simluate a fee payer transaction without the feePayerPublicKey", async () => {
      const rawTxn = await aptos.transaction.build.simple({
        sender: singleSignerSecp256k1Account.accountAddress,
        data: {
          bytecode: singleSignerScriptBytecode,
          functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
        },
        withFeePayer: true,
      });
      rawTxn.feePayerAddress = feePayerAccount.accountAddress;

      await expect(
        aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
        }),
      ).rejects.toThrow();
    });

    test("it throws when trying to simluate a multi agent fee payer transaction without the feePayerPublicKey", async () => {
      const rawTxn = await aptos.transaction.build.multiAgent({
        sender: singleSignerSecp256k1Account.accountAddress,
        secondarySignerAddresses: [secondarySignerAccount.accountAddress],
        data: {
          bytecode: singleSignerScriptBytecode,
          functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
        },
        withFeePayer: true,
      });
      rawTxn.feePayerAddress = feePayerAccount.accountAddress;

      await expect(
        aptos.transaction.simulate.multiAgent({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
        }),
      ).rejects.toThrow();
    });
  });

  describe("simulations with no account authenticator", () => {
    test("single signer with script payload", async () => {
      const transaction = await aptos.transaction.build.simple({
        sender: singleSignerED25519SenderAccount.accountAddress,
        data: {
          bytecode: singleSignerScriptBytecode,
          functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
        },
      });
      const [response] = await simulateTransaction({
        aptosConfig: aptos.config,
        transaction,
        signerPublicKey: new Ed25519PublicKey(new Uint8Array(32)),
      });
      console.log("[JP] response");
      console.log(response.success);
      console.log(response.vm_status);
      expect(response.success).toBeTruthy();
    });
  });
  test("fee payer with script payload", async () => {
    const rawTxn = await aptos.transaction.build.simple({
      sender: legacyED25519SenderAccount.accountAddress,
      data: {
        bytecode: singleSignerScriptBytecode,
        functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
      },
      withFeePayer: true,
    });
    rawTxn.feePayerAddress = feePayerAccount.accountAddress;

    const [response] = await aptos.transaction.simulate.simple({
      signerPublicKey: new Ed25519PublicKey(new Uint8Array(32)),
      transaction: rawTxn,
      feePayerPublicKey: new Ed25519PublicKey(new Uint8Array(32)),
    });
    expect(response.success).toBeTruthy();
  });
  test("fee payer as 0x0 with script payload", async () => {
    const rawTxn = await aptos.transaction.build.simple({
      sender: legacyED25519SenderAccount.accountAddress,
      data: {
        bytecode: singleSignerScriptBytecode,
        functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
      },
      withFeePayer: true,
    });
    rawTxn.feePayerAddress = AccountAddress.ZERO;

    const [response] = await aptos.transaction.simulate.simple({
      signerPublicKey: new Ed25519PublicKey(new Uint8Array(32)),
      transaction: rawTxn,
      feePayerPublicKey: new Ed25519PublicKey(new Uint8Array(32)),
    });
    expect(response.success).toBeTruthy();
  });
  test("fee payer as 0x4 with script payload", async () => {
    const rawTxn = await aptos.transaction.build.simple({
      sender: legacyED25519SenderAccount.accountAddress,
      data: {
        bytecode: singleSignerScriptBytecode,
        functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
      },
      withFeePayer: true,
    });
    // A fee payer who does not have a sufficient fund.
    rawTxn.feePayerAddress = AccountAddress.FOUR;

    const [response] = await aptos.transaction.simulate.simple({
      signerPublicKey: new Ed25519PublicKey(new Uint8Array(32)),
      transaction: rawTxn,
      feePayerPublicKey: new Ed25519PublicKey(new Uint8Array(32)),
    });
    expect(response.vm_status).toContain("INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE");
  });
});
