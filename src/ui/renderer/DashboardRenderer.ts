import type { GameState } from "../../types.js";
import { GamePhase } from "../../types.js";
import { formatTime, POSITION_LABELS } from "../../constants.js";

export class DashboardRenderer {
  private lastOVR = -1;
  private lastWeek = -1;
  private lastWins = -1;
  private lastTimer = -1;
  private lastPhase = "";

  constructor() {}

  render(state: GameState): void {
    const { player, season } = state;

    if (player.ovr !== this.lastOVR) {
      this.setField("dash-ovr", player.ovr.toString());
      this.setField("dash-name", player.name);
      this.setField("dash-position", POSITION_LABELS[player.position]);
      this.setField("dash-age", `Age ${player.age}`);
      this.lastOVR = player.ovr;
    }

    const week = season.currentWeek;
    const phase = season.phase;
    if (week !== this.lastWeek || phase !== this.lastPhase) {
      this.setField("dash-season", `Season ${season.seasonNumber}`);
      if (phase === GamePhase.RegularSeason) {
        this.setField("dash-week", `Week ${week} / 17`);
      } else if (phase === GamePhase.Playoffs) {
        const roundNames = ["Wild Card", "Divisional", "Conference Championship", "Super Bowl"];
        this.setField("dash-week", roundNames[(season.playoffRound ?? 1) - 1] ?? "Playoffs");
      } else if (phase === GamePhase.OffSeason) {
        this.setField("dash-week", "Off-Season");
      }
      this.lastWeek = week;
      this.lastPhase = phase;
    }

    const wins = season.teamRecord.wins;
    if (wins !== this.lastWins) {
      this.setField("dash-record", `${season.teamRecord.wins}-${season.teamRecord.losses}`);
      this.lastWins = wins;
    }

    const timerSec = Math.ceil(season.weekTimer);
    if (timerSec !== this.lastTimer || phase !== this.lastPhase) {
      if (phase === GamePhase.OffSeason) {
        this.setField("dash-timer-label", "Off-Season");
        this.setField("dash-timer", "—");
      } else if (season.gameInProgress) {
        this.setField("dash-timer-label", "In Progress");
        this.setField("dash-timer", `${Math.max(0, timerSec)}s`);
      } else {
        this.setField("dash-timer-label", "Next Game");
        this.setField("dash-timer", formatTime(season.weekTimer));
      }
      this.lastTimer = timerSec;
    }
  }

  private setField(id: string, value: string): void {
    const el = document.getElementById(id);
    if (el && el.textContent !== value) el.textContent = value;
  }
}
