
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, AccountAddressInput, Hex, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256, parseTypeTag } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject } from "../../src/abi/types";
import { ViewFunctionPayloadBuilder, EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilders";

export type ObjectAddress = AccountAddressInput;


export namespace Help {
  export type GetCurrentRoundTypePayloadMoveArguments = {
    tournament_addr: AccountAddressInput;
  };

  export class GetCurrentRoundType extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "help";
    public readonly functionName = "get_current_round_type";
    public readonly args: GetCurrentRoundTypePayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      tournament_addr: AccountAddressInput // address
    ) {
      super();
      this.args = {
        tournament_addr: AccountAddress.fromRelaxed(tournament_addr),
      };
    }
  }
}
