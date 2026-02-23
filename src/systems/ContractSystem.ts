import type { GameState, Contract } from "../types.js";

export class ContractSystem {
  generateContract(seasonNumber: number, ovr: number, contractTokens: number): Contract {
    // Salary scales with OVR and season
    const baseSalary = 50_000 + seasonNumber * 25_000 + (ovr - 40) * 5_000;

    // Better contract with more tokens spent
    const tokenBonus = contractTokens * 20_000;

    return {
      yearsRemaining: 3 + Math.min(2, Math.floor(ovr / 80)),
      salaryPerGame: Math.floor((baseSalary + tokenBonus) * (1 + Math.random() * 0.2)),
      signingBonus: Math.floor(baseSalary * 2 * (1 + Math.random() * 0.3)),
      contractTokens: 0,
    };
  }

  processSeasonEnd(state: GameState): void {
    state.contract.yearsRemaining--;

    if (state.contract.yearsRemaining <= 0) {
      // Contract expired — enter free agency / re-sign
      const newContract = this.generateContract(
        state.season.seasonNumber,
        state.player.ovr,
        state.resources.contractTokens
      );
      state.resources.contractTokens = 0;
      state.resources.money += newContract.signingBonus;
      state.contract = newContract;
    }
  }
}
