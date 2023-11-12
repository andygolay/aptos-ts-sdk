
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0


/* eslint-disable max-len */
import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, Account, InputTypes, AccountAddressInput, Hex, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256, parseTypeTag } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject, ObjectAddress, TypeTagInput } from "../../src/abi/types";
import { ViewFunctionPayloadBuilder, EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilders";



export namespace Block {
  export namespace EntryFunctions {}
  export namespace ViewFunctions {
    /**
     *  public fun get_current_block_height<>(
     *   )
     **/
    export class GetCurrentBlockHeight extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "block";
      public readonly functionName = "get_current_block_height";
      public readonly args = {};
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor() {
        super();
        this.args = {};
      }
    }

    /**
     *  public fun get_epoch_interval_secs<>(
     *   )
     **/
    export class GetEpochIntervalSecs extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "block";
      public readonly functionName = "get_epoch_interval_secs";
      public readonly args = {};
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor() {
        super();
        this.args = {};
      }
    }
  }
}
