/**
 * Sovereign Lands - AI Tactical Military Advisor
 * Analyzes live on-chain kingdom stats, war prediction matrices, and territorial control
 * to generate concise, high-impact military strategy counsel via the BYOAI Provider Hub.
 */

import {
  WarSimulator3D,
  KingdomMilitaryData,
  WarPredictionOutcome,
  TerritoryBreakdown,
  InvestmentAdvice,
} from './WarSimulator3D';
import { providerFactory } from '../providers/ProviderFactory';
import { NPCConversationContext } from '../providers/types';

export type StrategicPriority =
  | 'ATTACK_NOW'
  | 'FORTIFY_DEFENSE'
  | 'EXPAND_TERRITORY'
  | 'ACCUMULATE_GOLD'
  | 'HOLD_COOLDOWN';

export type StrategicThreatLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface StrategicBriefing {
  strategistName: string;
  strategistTitle: string;
  priority: StrategicPriority;
  priorityLabel: string;
  priorityColor: string;
  threatLevel: StrategicThreatLevel;
  threatColor: string;
  counselText: string;
  recommendedAction: string;
  tacticalTip: string;
  prediction: WarPredictionOutcome;
  investment: InvestmentAdvice;
  generatedAt: number;
}

export class TacticalAdvisor {
  private static instance: TacticalAdvisor | null = null;

  public static getInstance(): TacticalAdvisor {
    if (!TacticalAdvisor.instance) {
      TacticalAdvisor.instance = new TacticalAdvisor();
    }
    return TacticalAdvisor.instance;
  }

  /**
   * Generates comprehensive military briefing using live data and LLM reasoning
   */
  public async generateBriefing(
    playerKingdom: 'North' | 'South',
    attackerData: KingdomMilitaryData,
    defenderData: KingdomMilitaryData,
    territory?: TerritoryBreakdown
  ): Promise<StrategicBriefing> {
    const prediction = WarSimulator3D.predictWarOutcome(attackerData, defenderData);
    const investment = WarSimulator3D.recommendInvestment(attackerData, defenderData);

    // Determine strategic priority and threat level
    let priority: StrategicPriority = 'FORTIFY_DEFENSE';
    let priorityLabel = 'Fortify Realm Defenses';
    let priorityColor = 'text-amber-400 bg-amber-500/20 border-amber-400/50';

    let threatLevel: StrategicThreatLevel = 'MEDIUM';
    let threatColor = 'text-amber-400 bg-amber-500/20 border-amber-400/50';

    if (prediction.cooldownRemainingSeconds > 0) {
      priority = 'HOLD_COOLDOWN';
      priorityLabel = `Truce Cooldown (${Math.ceil(prediction.cooldownRemainingSeconds / 60)}m)`;
      priorityColor = 'text-sky-400 bg-sky-500/20 border-sky-400/50';
    } else if (prediction.willWin && prediction.powerDifferential >= 10) {
      priority = 'ATTACK_NOW';
      priorityLabel = 'Declare War Immediately';
      priorityColor = 'text-emerald-400 bg-emerald-500/20 border-emerald-400/50';
    } else if (attackerData.treasuryGold < 60) {
      priority = 'ACCUMULATE_GOLD';
      priorityLabel = 'Harvest Gold & Build Economy';
      priorityColor = 'text-yellow-400 bg-yellow-500/20 border-yellow-400/50';
    } else if (!prediction.willWin) {
      priority = 'FORTIFY_DEFENSE';
      priorityLabel = 'Construct Offensive Siege Keeps';
      priorityColor = 'text-orange-400 bg-orange-500/20 border-orange-400/50';
    } else {
      priority = 'EXPAND_TERRITORY';
      priorityLabel = 'Claim Frontier Parcels';
      priorityColor = 'text-purple-400 bg-purple-500/20 border-purple-400/50';
    }

    // Threat level based on defender attack against our defense
    const rivalAttack = defenderData.attackPower;
    const ourDefense = attackerData.defensePower;
    if (rivalAttack > ourDefense + 10) {
      threatLevel = 'CRITICAL';
      threatColor = 'text-rose-400 bg-rose-500/20 border-rose-400/50';
    } else if (rivalAttack > ourDefense) {
      threatLevel = 'HIGH';
      threatColor = 'text-orange-400 bg-orange-500/20 border-orange-400/50';
    } else if (rivalAttack >= ourDefense - 5) {
      threatLevel = 'MEDIUM';
      threatColor = 'text-amber-400 bg-amber-500/20 border-amber-400/50';
    } else {
      threatLevel = 'LOW';
      threatColor = 'text-emerald-400 bg-emerald-500/20 border-emerald-400/50';
    }

    // Generate dynamic counsel via BYOAI engine
    const counselText = await this.queryLLMStrategist(
      playerKingdom,
      attackerData,
      defenderData,
      prediction,
      priority,
      threatLevel
    );

    return {
      strategistName: 'Grand Marshal Vane',
      strategistTitle: 'Citadel War Council Supreme Commander',
      priority,
      priorityLabel,
      priorityColor,
      threatLevel,
      threatColor,
      counselText,
      recommendedAction: investment.actionSummary,
      tacticalTip: this.getTacticalTip(priority, prediction),
      prediction,
      investment,
      generatedAt: Date.now(),
    };
  }

  /**
   * Queries Agent 08's ProviderFactory to craft authentic military counsel
   */
  private async queryLLMStrategist(
    playerKingdom: 'North' | 'South',
    attacker: KingdomMilitaryData,
    defender: KingdomMilitaryData,
    prediction: WarPredictionOutcome,
    priority: StrategicPriority,
    threat: StrategicThreatLevel
  ): Promise<string> {
    const promptMessage = `Provide tactical military counsel to the Sovereign of the ${playerKingdom} Kingdom.
Current Battle Stats:
- Our Attack: ${attacker.attackPower} vs Rival Defense: ${defender.defensePower} (Differential: ${prediction.powerDifferential > 0 ? '+' : ''}${prediction.powerDifferential})
- Rival Attack: ${defender.attackPower} vs Our Defense: ${attacker.defensePower}
- Rival Treasury: ${defender.treasuryGold} gold (Plunder on win: ~${prediction.estimatedPlunder} gold)
- War Status: ${prediction.canDeclareWar ? 'Ready to declare war' : `Cooldown active (${prediction.cooldownRemainingSeconds}s remaining)`}
- Priority: ${priority}, Threat Level: ${threat}.

Deliver 2-3 decisive, authoritative sentences of military command advice suited for a war room table.`;

    const context: NPCConversationContext = {
      npcId: 'marshal-vane',
      npcName: 'Grand Marshal Vane',
      npcRole: 'Supreme Military Strategist',
      npcPersonality: 'Grim, hyper-calculating commander who disdains reckless charges and prizes logistical superiority.',
      playerMessage: promptMessage,
      worldContext: {
        currentKingdom: playerKingdom,
        activeWar: prediction.willWin,
        playerGold: attacker.treasuryGold,
      },
    };

    try {
      const response = await providerFactory.generateNPCResponse(context);
      if (response && response.trim().length > 10) {
        return response.trim();
      }
    } catch (e) {
      console.warn('[TacticalAdvisor] LLM consultation failed, using rule-based counsel:', e);
    }

    return this.getFallbackCounsel(playerKingdom, prediction, priority, threat);
  }

  private getFallbackCounsel(
    kingdom: 'North' | 'South',
    prediction: WarPredictionOutcome,
    priority: StrategicPriority,
    threat: StrategicThreatLevel
  ): string {
    if (prediction.willWin && prediction.canDeclareWar) {
      return `Our siege ballistas and battle keeps outpower the enemy’s curtain walls by ${prediction.powerDifferential} points. The Citadel council urges an immediate declaration of war—plundering their vaults of ${prediction.estimatedPlunder} gold will seal our realm’s dominance.`;
    }

    if (prediction.cooldownRemainingSeconds > 0) {
      return `The royal heralds have declared a binding truce for another ${Math.ceil(
        prediction.cooldownRemainingSeconds / 60
      )} minutes. Utilize this interlude to fortify our riverbank towers and collect farm yields before the drums of war beat again.`;
    }

    if (threat === 'CRITICAL' || threat === 'HIGH') {
      return `Our borders are perilously exposed! Enemy battle keeps overshadow our curtain walls. Direct all sovereign treasury reserves toward raising stone watchtowers along the Great Divide immediately.`;
    }

    return `The balance of arms across the frontier remains contested. Constructing another Castle Keep (+10 Attack) will tip the battlefield decisively in our favor before the rival sovereign reacts.`;
  }

  private getTacticalTip(priority: StrategicPriority, prediction: WarPredictionOutcome): string {
    switch (priority) {
      case 'ATTACK_NOW':
        return '💡 A victorious strike loots 25% of the rival treasury directly into your kingdom’s vault!';
      case 'HOLD_COOLDOWN':
        return '💡 War cooldown lasts 10 minutes following resolution. Enemy forces cannot raid while cooldown is active.';
      case 'FORTIFY_DEFENSE':
        return '💡 Guard Towers provide +8 Defense, while Stone Walls grant +6 Defense per claimed parcel.';
      case 'ACCUMULATE_GOLD':
        return '💡 Farmsteads generate +5 Gold per minute, fueling defense and expansion.';
      case 'EXPAND_TERRITORY':
      default:
        return '💡 Parcels claimed adjacent to the Great Divide bridge provide vital choke-point control.';
    }
  }
}

export const tacticalAdvisor = TacticalAdvisor.getInstance();
