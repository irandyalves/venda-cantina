// Sintetizador de áudio Web Audio API para tocar notificações sonoras sem depender de arquivos externos

class SoundService {
  constructor() {
    this.audioCtx = null;
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Som característico para PIZZA (Dois tons rápidos e energéticos ascendentes)
  playPizzaSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Beep 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Beep 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880.00, now + 0.15); // A5
      gain2.gain.setValueAtTime(0.35, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.4);
    } catch (e) {
      console.warn('Erro ao tocar som de pizza:', e);
    }
  }

  // Som característico para BATATA (Estalo duplo vibrante e crocante)
  playPotatoSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(880, now + 0.28);
      gain2.gain.setValueAtTime(0.35, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.32);
    } catch (e) {
      console.warn('Erro ao tocar som de batata:', e);
    }
  }

  // Som característico para AÇAÍ (Triplo acorde suave e refrescante)
  playAcaiSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (Acorde Maior)
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + (idx * 0.1));
        gain.gain.setValueAtTime(0.25, now + (idx * 0.1));
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.1) + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + (idx * 0.1));
        osc.stop(now + (idx * 0.1) + 0.35);
      });
    } catch (e) {
      console.warn('Erro ao tocar som de açaí:', e);
    }
  }

  // Som para PEDIDO PRONTO / CHAMADA TV (Ding-Dong clássico)
  playReadySound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Ding (Sol 784Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(783.99, now);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Dong (Mi 659.25Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.35);
      gain2.gain.setValueAtTime(0.45, now + 0.35);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.35);
      osc2.stop(now + 1.2);
    } catch (e) {
      console.warn('Erro ao tocar som de pronto:', e);
    }
  }

  // Som especial para Pedido Entregue pela Cozinha (Trítono de chamada potente com eco)
  playDeliveredAlertSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 4 notas ascendentes potentes (Dó, Mi, Sol, Dó alto)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + (idx * 0.16));
        gain.gain.setValueAtTime(0.45, now + (idx * 0.16));
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.16) + 0.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + (idx * 0.16));
        osc.stop(now + (idx * 0.16) + 0.9);
      });
    } catch (e) {
      console.warn('Erro ao tocar som de chamada de entrega:', e);
    }
  }

  // Toca o som baseado na categoria do pedido
  playCategorySound(categoryKey) {
    const key = (categoryKey || '').toLowerCase();
    if (key.includes('pizza') || key.includes('ped') || key.includes('int')) {
      this.playPizzaSound();
    } else if (key.includes('batata') || key.includes('bat') || key.includes('frita')) {
      this.playPotatoSound();
    } else if (key.includes('acai') || key.includes('açaí')) {
      this.playAcaiSound();
    } else {
      this.playPizzaSound(); // Som padrão
    }
  }
}

export const soundService = new SoundService();
