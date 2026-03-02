import axios from "axios";
import type { BalanceResponse, BlockchainEvent, QueryResult, TokenBalance } from "../types/blockchain";
export type { BalanceResponse, BlockchainEvent, QueryResult, TokenBalance };

const baseURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:6970/api/v1";

const api = axios.create({
  baseURL,
});


export default api;
