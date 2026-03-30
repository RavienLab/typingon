let click: HTMLAudioElement | null = null;
let error: HTMLAudioElement | null = null;

export function playClick() {
  if (!click) {
    click = new Audio("/sounds/click.mp3");
    click.volume = 0.3;
  }
  click.currentTime = 0;
  click.play();
}

export function playError() {
  if (!error) {
    error = new Audio("/sounds/error.mp3");
    error.volume = 0.4;
  }
  error.currentTime = 0;
  error.play();
}
