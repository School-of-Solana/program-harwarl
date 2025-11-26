export type Escrow = {
  address: "nj9z1iSrdSBhFt3jmxmgHzhBLVqE6b2bh7MwLjiDWuq";
  metadata: {
    name: "escrow";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "accept";
      discriminator: [65, 150, 70, 216, 133, 6, 107, 4];
      accounts: [
        {
          name: "receiver";
          writable: true;
          signer: true;
        },
        {
          name: "escrowAuthority";
          writable: true;
        },
        {
          name: "escrow";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [69, 83, 67, 82, 79, 87, 95, 83, 69, 69, 68];
              },
              {
                kind: "arg";
                path: "escrowId";
              },
              {
                kind: "account";
                path: "escrowAuthority";
              },
              {
                kind: "account";
                path: "receiver";
              }
            ];
          };
        },
        {
          name: "solVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [115, 111, 108, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "escrow";
              }
            ];
          };
        },
        {
          name: "depositMint";
          writable: true;
        },
        {
          name: "escrowDepositMintAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "escrow";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "depositMint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "receiverDepositMintAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "receiver";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "depositMint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "authorityDepositMintAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "escrowAuthority";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "depositMint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "receiveMint";
          writable: true;
        },
        {
          name: "receiverReceiveMintAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "receiver";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "receiveMint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "authorityReceiveMintAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "escrowAuthority";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "receiveMint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "tokenProgram";
          address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        }
      ];
      args: [
        {
          name: "escrowId";
          type: "string";
        }
      ];
    },
    {
      name: "close";
      discriminator: [98, 165, 201, 177, 108, 65, 206, 96];
      accounts: [
        {
          name: "escrowAuthority";
          writable: true;
          signer: true;
        },
        {
          name: "receiver";
          writable: true;
        },
        {
          name: "escrow";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [69, 83, 67, 82, 79, 87, 95, 83, 69, 69, 68];
              },
              {
                kind: "arg";
                path: "escrowId";
              },
              {
                kind: "account";
                path: "escrowAuthority";
              },
              {
                kind: "account";
                path: "receiver";
              }
            ];
          };
        },
        {
          name: "solVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [115, 111, 108, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "escrow";
              }
            ];
          };
        },
        {
          name: "depositMint";
          writable: true;
          optional: true;
        },
        {
          name: "tokenVault";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "escrow";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "depositMint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "authorityTokenVault";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "escrowAuthority";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "depositMint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "tokenProgram";
          address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        }
      ];
      args: [
        {
          name: "escrowId";
          type: "string";
        }
      ];
    },
    {
      name: "initEscrow";
      discriminator: [70, 46, 40, 23, 6, 11, 81, 139];
      accounts: [
        {
          name: "escrowAuthority";
          writable: true;
          signer: true;
        },
        {
          name: "receiver";
          writable: true;
        },
        {
          name: "escrow";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [69, 83, 67, 82, 79, 87, 95, 83, 69, 69, 68];
              },
              {
                kind: "arg";
                path: "escrowId";
              },
              {
                kind: "account";
                path: "escrowAuthority";
              },
              {
                kind: "account";
                path: "receiver";
              }
            ];
          };
        },
        {
          name: "solVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [115, 111, 108, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "escrow";
              }
            ];
          };
        },
        {
          name: "depositMint";
          writable: true;
          optional: true;
        },
        {
          name: "tokenVault";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "escrow";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "depositMint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "authorityTokenVault";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "escrowAuthority";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "depositMint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "tokenProgram";
          address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        }
      ];
      args: [
        {
          name: "escrowId";
          type: "string";
        },
        {
          name: "depositMint";
          type: "pubkey";
        },
        {
          name: "depositAmount";
          type: "u64";
        },
        {
          name: "receiveMint";
          type: "pubkey";
        },
        {
          name: "receiveAmount";
          type: "u64";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "escrow";
      discriminator: [31, 213, 123, 187, 186, 22, 218, 155];
    }
  ];
  events: [
    {
      name: "escrowClosed";
      discriminator: [109, 20, 57, 51, 217, 118, 3, 173];
    },
    {
      name: "escrowCompleted";
      discriminator: [229, 26, 0, 202, 140, 167, 106, 187];
    },
    {
      name: "escrowCreated";
      discriminator: [70, 127, 105, 102, 92, 97, 7, 173];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "overFlow";
      msg: "overflow";
    },
    {
      code: 6001;
      name: "invalidState";
      msg: "Invalid State";
    },
    {
      code: 6002;
      name: "invalidDepositMint";
      msg: "Invalid Deposit Token mint";
    },
    {
      code: 6003;
      name: "invalidReceiveMint";
      msg: "Invalid Receive Token mint";
    },
    {
      code: 6004;
      name: "sameTokenTransferNotAllowed";
      msg: "Token to the same token is not allowed";
    },
    {
      code: 6005;
      name: "sameBuyerSellerNotAllowed";
      msg: "Token to same buyer and seller is not allowed";
    },
    {
      code: 6006;
      name: "escrowNotActive";
      msg: "Escrow is not Active";
    },
    {
      code: 6007;
      name: "unauthorizedSigner";
      msg: "Unauthorized Signer";
    },
    {
      code: 6008;
      name: "idTooLong";
      msg: "EscrowId too long";
    },
    {
      code: 6009;
      name: "idTooShort";
      msg: "EscrowId too short";
    },
    {
      code: 6010;
      name: "depositAmountLow";
      msg: "Low Deposit Amount";
    },
    {
      code: 6011;
      name: "receiveAmountLow";
      msg: "Low Receive Amount";
    },
    {
      code: 6012;
      name: "insufficientBalance";
      msg: "Insufficient balance";
    }
  ];
  types: [
    {
      name: "escrow";
      type: {
        kind: "struct";
        fields: [
          {
            name: "escrowAuthority";
            type: "pubkey";
          },
          {
            name: "receiver";
            type: "pubkey";
          },
          {
            name: "depositMint";
            type: "pubkey";
          },
          {
            name: "depositAmount";
            type: "u64";
          },
          {
            name: "receiveMint";
            type: "pubkey";
          },
          {
            name: "receiveAmount";
            type: "u64";
          },
          {
            name: "state";
            type: {
              defined: {
                name: "escrowState";
              };
            };
          },
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "escrowId";
            type: "string";
          }
        ];
      };
    },
    {
      name: "escrowClosed";
      type: {
        kind: "struct";
        fields: [
          {
            name: "escrow";
            type: "pubkey";
          },
          {
            name: "escrowAuthority";
            type: "pubkey";
          },
          {
            name: "receiver";
            type: "pubkey";
          }
        ];
      };
    },
    {
      name: "escrowCompleted";
      type: {
        kind: "struct";
        fields: [
          {
            name: "escrow";
            type: "pubkey";
          },
          {
            name: "escrowAuthority";
            type: "pubkey";
          },
          {
            name: "receiver";
            type: "pubkey";
          }
        ];
      };
    },
    {
      name: "escrowCreated";
      type: {
        kind: "struct";
        fields: [
          {
            name: "escrow";
            type: "pubkey";
          },
          {
            name: "escrowAuthority";
            type: "pubkey";
          },
          {
            name: "receiver";
            type: "pubkey";
          }
        ];
      };
    },
    {
      name: "escrowState";
      type: {
        kind: "enum";
        variants: [
          {
            name: "active";
          },
          {
            name: "completed";
          },
          {
            name: "closed";
          }
        ];
      };
    }
  ];
};
