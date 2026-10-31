/**
 * Sovereign Lands - Deterministic 3D War Simulator
 * Implements combat resolution, power balancing, and plunder projections
 * matching SovereignLands.sol smart contract mechanics.
 */

export const COMBAT_CONSTANTS = {
  CASTLE_KEEP_ATTACK: 10,
  CASTLE_KEEP_DEFENSE: 5,
  GUARD_TOWER_DEFENSE: 8,
  STONE_WALL_DEFENSE: 6,
  FARMSTEAD_GOLD_PER_MIN: 5,
  WAR_COOLDOWN_SECONDS: 600, // 10 minutes
  PLUNDER_PERCENT: 25, // 25% of defender treasury looted on victory
  PENALTY_PERCENT: 10, // 10% of attacker treasury lost on defeat
  CASTLE_KEEP_COST: 150,
  GUARD_TOWER_COST: 80,
  STONE_WALL_COST: 60,
  FARMSTEAD_COST: 50,
};

export interface KingdomMilitaryData {
  kingdom: 'North' | 'South';
  treasuryGold: number;
  attackPower: number;
  defensePower: number;
  castleCount: number;
  towerCount: number;
  wallCount: number;
  farmCount: number;
  totalParcels: number;
  lastWarTimestamp?: number;
}

export type StrategicVerdict =
  | 'DECISIVE_VICTORY'
  | 'NARROW_VICTORY'
  | 'STALEMATE'
  | 'HIGH_RISK'
  | 'CERTAIN_DEFEAT';

export interface WarPredictionOutcome {
  attacker: 'North' | 'South';
  defender: 'North' | 'South';
  attackerAttack: number;
  defenderDefense: number;
  powerDifferential: number; // attackerAttack - defenderDefense
  willWin: boolean;
  winProbability: number; // 0 - 100%
  estimatedPlunder: number;
  riskPenalty: number;
  cooldownRemainingSeconds: number;
  canDeclareWar: boolean;
  verdict: StrategicVerdict;
  verdictLabel: string;
  verdictColor: string;
  summary: string;
}

export interface TerritoryBreakdown {
  northParcels: number;
  southParcels: number;
  unclaimedParcels: number;
  totalParcels: number;
  northControlPercent: number;
  southControlPercent: number;
  dominantKingdom: 'North' | 'South' | 'Contested';
}

export interface InvestmentAdvice {
  castlesNeeded: number;
  towersNeeded: number;
  wallsNeeded: number;
  goldRequired: number;
  actionSummary: string;
}

export class WarSimulator3D {
  /**
   * Calculates total attack and defense points from building counts
   */
  public static calculateCombatPower(counts: {
    castles: number;
    towers: number;
    walls: number;
  }): { attack: number; defense: number } {
    const attack = counts.castles * COMBAT_CONSTANTS.CASTLE_KEEP_ATTACK;
    const defense =
      counts.towers * COMBAT_CONSTANTS.GUARD_TOWER_DEFENSE +
      counts.walls * COMBAT_CONSTANTS.STONE_WALL_DEFENSE +
      counts.castles * COMBAT_CONSTANTS.CASTLE_KEEP_DEFENSE;

    return { attack, defense };
  }

  /**
   * Simulates war between attacking and defending kingdoms based on on-chain stats
   */
  public static predictWarOutcome(
    attacker: KingdomMilitaryData,
    defender: KingdomMilitaryData,
    currentTimestampSeconds = Math.floor(Date.now() / 1000)
  ): WarPredictionOutcome {
    const attackerAttack = attacker.attackPower;
    const defenderDefense = defender.defensePower;
    const powerDifferential = attackerAttack - defenderDefense;

    // Check war cooldown timer
    const lastWar = attacker.lastWarTimestamp || 0;
    const cooldownEnd = lastWar + COMBAT_CONSTANTS.WAR_COOLDOWN_SECONDS;
    const cooldownRemaining = Math.max(0, cooldownEnd - currentTimestampSeconds);
    const canDeclareWar = cooldownRemaining === 0;

    // Win condition in SovereignLands.sol: attackerWon = attack > defense
    const willWin = attackerAttack > defenderDefense;

    // Plunder & penalty calculations
    const estimatedPlunder = willWin
      ? Math.floor((defender.treasuryGold * COMBAT_CONSTANTS.PLUNDER_PERCENT) / 100)
      : 0;
    const riskPenalty = Math.floor(
      (attacker.treasuryGold * COMBAT_CONSTANTS.PENALTY_PERCENT) / 100
    );

    // Probability & strategic verdict calculation
    let winProbability = 50;
    let verdict: StrategicVerdict = 'STALEMATE';
    let verdictLabel = 'Stalemate / High Risk';
    let verdictColor = 'text-amber-400 bg-amber-500/20 border-amber-400/50';
    let summary = '';

    if (attackerAttack === 0 && defenderDefense === 0) {
      winProbability = 50;
      verdict = 'STALEMATE';
      verdictLabel = 'Unfortified Standoff';
      verdictColor = 'text-zinc-400 bg-zinc-800 border-zinc-700';
      summary = 'Neither realm has constructed offensive keeps or fortifications.';
    } else if (powerDifferential >= 15) {
      winProbability = 95;
      verdict = 'DECISIVE_VICTORY';
      verdictLabel = 'Decisive Victory Predicted';
      verdictColor = 'text-emerald-400 bg-emerald-500/20 border-emerald-400/50';
      summary = `Your vanguard overwhelms rival defenses by ${powerDifferential} points! Expect rich plunder of ~${estimatedPlunder} gold.`;
    } else if (powerDifferential > 0) {
      winProbability = 75;
      verdict = 'NARROW_VICTORY';
      verdictLabel = 'Narrow Victory Favored';
      verdictColor = 'text-teal-400 bg-teal-500/20 border-teal-400/50';
      summary = `Attack holds an advantage (+${powerDifferential} points). Strike swiftly while rival towers remain few.`;
    } else if (powerDifferential === 0) {
      winProbability = 40;
      verdict = 'STALEMATE';
      verdictLabel = 'Draw / Attacker Penalty';
      verdictColor = 'text-amber-400 bg-amber-500/20 border-amber-400/50';
      summary = `Tied strength favors the defender in royal decree! A tie will cost your realm ${riskPenalty} gold penalty.`;
    } else if (powerDifferential >= -10) {
      winProbability = 20;
      verdict = 'HIGH_RISK';
      verdictLabel = 'High Risk of Defeat';
      verdictColor = 'text-orange-400 bg-orange-500/20 border-orange-400/50';
      summary = `Enemy defenses exceed your siege power by ${Math.abs(powerDifferential)} points. Risk losing ${riskPenalty} gold.`;
    } else {
      winProbability = 5;
      verdict = 'CERTAIN_DEFEAT';
      verdictLabel = 'Certain Defeat Expected';
      verdictColor = 'text-rose-400 bg-rose-500/20 border-rose-400/50';
      summary = `Do NOT attack! Rival kingdom curtain walls and towers completely outmatch current siege engines.`;
    }

    return {
      attacker: attacker.kingdom,
      defender: defender.kingdom,
      attackerAttack,
      defenderDefense,
      powerDifferential,
      willWin,
      winProbability,
      estimatedPlunder,
      riskPenalty,
      cooldownRemainingSeconds: cooldownRemaining,
      canDeclareWar,
      verdict,
      verdictLabel,
      verdictColor,
      summary,
    };
  }

  /**
   * Calculate territory control percentages across registered parcels
   */
  public static calculateTerritory(parcels: Array<{ kingdom?: string }>): TerritoryBreakdown {
    let north = 0;
    let south = 0;
    let unclaimed = 0;

    for (const p of parcels) {
      const k = (p.kingdom || '').toLowerCase();
      if (k === 'north') north++;
      else if (k === 'south') south++;
      else unclaimed++;
    }

    const total = Math.max(1, north + south + unclaimed);
    const northPercent = Math.round((north / total) * 100);
    const southPercent = Math.round((south / total) * 100);

    let dominant: 'North' | 'South' | 'Contested' = 'Contested';
    if (northPercent > southPercent + 5) dominant = 'North';
    else if (southPercent > northPercent + 5) dominant = 'South';

    return {
      northParcels: north,
      southParcels: south,
      unclaimedParcels: unclaimed,
      totalParcels: total,
      northControlPercent: northPercent,
      southControlPercent: southPercent,
      dominantKingdom: dominant,
    };
  }

  /**
   * Recommend optimal structure construction to overcome enemy defenses or secure territory
   */
  public static recommendInvestment(
    attacker: KingdomMilitaryData,
    defender: KingdomMilitaryData
  ): InvestmentAdvice {
    const diff = attacker.attackPower - defender.defensePower;

    if (diff > 5) {
      // Already winning, recommend defensive fortifications to protect rival counter-attack
      const towersNeeded = 1;
      const wallsNeeded = 1;
      return {
        castlesNeeded: 0,
        towersNeeded,
        wallsNeeded,
        goldRequired:
          towersNeeded * COMBAT_CONSTANTS.GUARD_TOWER_COST +
          wallsNeeded * COMBAT_CONSTANTS.STONE_WALL_COST,
        actionSummary:
          'Your offensive keeps are sufficient. Construct 1 Guard Tower and 1 Curtain Wall to withstand counter-raids.',
      };
    }

    // Need more attack points: each Castle Keep provides +10 Attack
    const deficit = Math.max(1, defender.defensePower - attacker.attackPower + 1);
    const castlesNeeded = Math.ceil(deficit / COMBAT_CONSTANTS.CASTLE_KEEP_ATTACK);
    const goldRequired = castlesNeeded * COMBAT_CONSTANTS.CASTLE_KEEP_COST;

    return {
      castlesNeeded,
      towersNeeded: 0,
      wallsNeeded: 0,
      goldRequired,
      actionSummary: `Construct ${castlesNeeded} Castle Keep${
        castlesNeeded > 1 ? 's' : ''
      } (+${castlesNeeded * 10} Attack) to surpass rival defenses by ${
        castlesNeeded * 10 - deficit + 1
      } points.`,
    };
  }
}
