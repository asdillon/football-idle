export class NotificationSystem {
  private queue: string[] = [];
  private showing = false;
  private container: HTMLElement;

  constructor() {
    this.container = document.getElementById("toast-container")!;
  }

  push(message: string): void {
    this.queue.push(message);
    if (!this.showing) this.next();
  }

  pushAll(messages: string[]): void {
    for (const m of messages) this.queue.push(m);
    if (!this.showing) this.next();
  }

  private next(): void {
    if (!this.queue.length) {
      this.showing = false;
      return;
    }
    this.showing = true;
    const msg = this.queue.shift()!;

    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    this.container.appendChild(el);

    // Trigger enter animation
    requestAnimationFrame(() => el.classList.add("toast--visible"));

    setTimeout(() => {
      el.classList.remove("toast--visible");
      setTimeout(() => {
        el.remove();
        this.next();
      }, 300);
    }, 2500);
  }
}
