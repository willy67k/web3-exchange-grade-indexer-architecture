import { Log } from "ethers";

export interface IBlockListener {
  readonly topic: string;
  name: string;
  parse(log: Log, chainId: number): any;
}
