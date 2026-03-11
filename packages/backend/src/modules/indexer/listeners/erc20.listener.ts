import { Injectable } from "@nestjs/common";
import { Log } from "ethers";
import { IBlockListener, ParsedLogs } from "./base.listener.js";
import { TOPICS } from "../../../common/constants/topics.js";

@Injectable()
export class Erc20Listener implements IBlockListener {
  readonly topic = TOPICS.ERC20_TRANSFER;
  name = "ERC20_TRANSFER";

  parse(log: Log, chainId: number): ParsedLogs {
    const from = `0x${log.topics[1].slice(26)}`.toLowerCase();
    const to = `0x${log.topics[2].slice(26)}`.toLowerCase();
    const amount = BigInt(log.data).toString();

    return {
      transfer: {
        chainId,
        blockNumber: BigInt(log.blockNumber),
        txHash: log.transactionHash,
        logIndex: log.index,
        tokenAddress: log.address.toLowerCase(),
        fromAddress: from,
        toAddress: to,
        amount: amount,
      },
      ledgerEntries: [
        { account: from, deltaAmount: `-${amount}`, direction: "debit", tokenAddress: log.address.toLowerCase() },
        { account: to, deltaAmount: amount, direction: "credit", tokenAddress: log.address.toLowerCase() },
      ],
    };
  }
}
