import React from "react";
import "./index.css";

const App: React.FC = () => {
  return (
    <div className="mx-auto max-w-[1200px] p-8">
      <header className="mt-8 mb-16 text-center">
        <h1 className="mb-2 bg-gradient-to-r from-[#818cf8] to-[#c084fc] bg-clip-text text-[3.5rem] font-bold text-transparent">Multi-Chain ERC20 Indexer</h1>
        <p className="text-[1.2rem] text-slate-400">Interact with Ethereum Sepolia Testnet seamlessly</p>
      </header>

      <main>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2"></div>
      </main>

      <footer className="mt-24 border-t border-white/10 p-8 text-center text-sm text-slate-400">
        <p>&copy; 2026 Blockchain Developer Playground. Built with NestJS, React, and Ethers.js</p>
      </footer>
    </div>
  );
};

export default App;
