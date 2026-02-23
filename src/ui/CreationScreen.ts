import { Position } from "../types.js";
import { POSITION_LABELS } from "../constants.js";

export class CreationScreen {
  private el: HTMLElement;
  private onConfirm: (name: string, position: Position) => void;
  private selectedPosition: Position = Position.QB;

  constructor(onConfirm: (name: string, position: Position) => void) {
    this.el = document.getElementById("creation-screen")!;
    this.onConfirm = onConfirm;
    this.render();
    this.bindEvents();
  }

  show(): void {
    this.el.classList.remove("hidden");
  }

  hide(): void {
    this.el.classList.add("hidden");
  }

  private render(): void {
    const positionGrid = document.getElementById("creation-positions");
    if (!positionGrid) return;
    positionGrid.innerHTML = "";

    for (const pos of Object.values(Position)) {
      const btn = document.createElement("button");
      btn.className =
        "position-btn" + (pos === this.selectedPosition ? " position-btn--selected" : "");
      btn.dataset["position"] = pos;
      btn.textContent = pos;
      btn.title = POSITION_LABELS[pos];
      positionGrid.appendChild(btn);
    }
  }

  private bindEvents(): void {
    const positionGrid = document.getElementById("creation-positions");
    if (positionGrid) {
      positionGrid.addEventListener("click", (e) => {
        const btn = (e.target as HTMLElement).closest("[data-position]") as HTMLElement | null;
        if (!btn) return;
        this.selectedPosition = btn.dataset["position"] as Position;
        positionGrid.querySelectorAll(".position-btn").forEach((b) =>
          b.classList.toggle(
            "position-btn--selected",
            (b as HTMLElement).dataset["position"] === this.selectedPosition
          )
        );
      });
    }

    const confirmBtn = document.getElementById("creation-confirm");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        const nameInput = document.getElementById("creation-name") as HTMLInputElement | null;
        const name = nameInput?.value.trim() ?? "";
        if (!name) {
          alert("Please enter a player name.");
          return;
        }
        this.onConfirm(name, this.selectedPosition);
      });
    }
  }
}
