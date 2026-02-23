export class ProgressBar {
  private fill: HTMLElement;
  private labelEl: HTMLElement;
  private valueEl: HTMLElement;
  private lastPct = -1;

  constructor(container: HTMLElement, label: string) {
    const wrapper = document.createElement("div");
    wrapper.className = "progress-bar";

    this.labelEl = document.createElement("span");
    this.labelEl.className = "progress-bar__label";
    this.labelEl.textContent = label;

    this.valueEl = document.createElement("span");
    this.valueEl.className = "progress-bar__value";

    const track = document.createElement("div");
    track.className = "progress-bar__track";

    this.fill = document.createElement("div");
    this.fill.className = "progress-bar__fill";

    track.appendChild(this.fill);
    wrapper.appendChild(this.labelEl);
    wrapper.appendChild(this.valueEl);
    wrapper.appendChild(track);
    container.appendChild(wrapper);
  }

  update(current: number, max: number, valueText?: string): void {
    const pct = max > 0 ? Math.min(1, current / max) * 100 : 0;
    const rounded = Math.floor(pct);
    if (rounded !== this.lastPct) {
      this.fill.style.width = `${pct.toFixed(1)}%`;
      this.lastPct = rounded;
    }
    if (valueText !== undefined) {
      this.valueEl.textContent = valueText;
    }
  }

  setLabel(label: string): void {
    this.labelEl.textContent = label;
  }
}
