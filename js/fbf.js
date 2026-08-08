class FBF {
    constructor(bmz) {
        this.bmz = bmz;
        
        // Audio Engine
        this.audioCtx = null;
        this.buzzerInterval = null;
        
        // Timer
        this.resetHoldTimer = null;

        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        this.ledBetrieb = document.getElementById('fbf-led-betrieb');
        this.ledUeAusgeloest = document.getElementById('fbf-led-ue-ausgeloest');
        this.ledLoeschanlage = document.getElementById('fbf-led-loeschanlage');
        this.ledBrandfall = document.getElementById('fbf-led-brandfall');
        this.ledAkustik = document.getElementById('fbf-led-akustik');
        this.ledBmzReset = document.getElementById('fbf-led-bmz-reset');
        this.ledUeAb = document.getElementById('fbf-led-ue-ab');

        this.btnBrandfall = document.getElementById('btn-fbf-brandfall');
        this.btnAkustik = document.getElementById('btn-fbf-akustik');
        this.btnBmzReset = document.getElementById('btn-bmz-reset');
        this.btnUeAb = document.getElementById('btn-fbf-ue-ab');
        this.btnUeTest = document.getElementById('btn-fbf-ue-test');

        this.flapBmz = document.getElementById('flap-bmz');
        this.flapUe = document.getElementById('flap-ue');
    }

    bindEvents() {
        this.btnBrandfall.addEventListener('click', () => this.bmz.toggleBrandfallSteuerung());
        this.btnAkustik.addEventListener('click', () => this.bmz.toggleAkustischeSignale());
        this.btnUeAb.addEventListener('click', () => this.bmz.toggleUeAb());

        this.flapBmz.addEventListener('click', () => this.flapBmz.classList.toggle('open'));
        this.flapUe.addEventListener('click', () => this.flapUe.classList.toggle('open'));

        this.btnUeTest.addEventListener('click', () => {
            if (!this.flapUe.classList.contains('open')) {
                alert("Bitte zuerst die Schutzklappe öffnen!");
                return;
            }
            alert("ÜE Verbindung wird geprüft... OK!");
        });

        // 5s Reset-Timer Event Listeners
        const startReset = (e) => {
            if (e) e.preventDefault();
            if (!this.flapBmz.classList.contains('open')) {
                alert("Bitte zuerst die Schutzklappe öffnen!");
                return;
            }
            this.btnBmzReset.classList.add('pressed');
            this.resetHoldTimer = setTimeout(() => {
                this.btnBmzReset.classList.remove('pressed');
                this.bmz.resetBMZ();
            }, 5000);
        };

        const stopReset = (e) => {
            if (e) e.preventDefault();
            this.btnBmzReset.classList.remove('pressed');
            if (this.resetHoldTimer) {
                clearTimeout(this.resetHoldTimer);
                this.resetHoldTimer = null;
            }
        };

        this.btnBmzReset.addEventListener('mousedown', startReset);
        this.btnBmzReset.addEventListener('mouseup', stopReset);
        this.btnBmzReset.addEventListener('mouseleave', stopReset);
        this.btnBmzReset.addEventListener('touchstart', startReset);
        this.btnBmzReset.addEventListener('touchend', stopReset);

        // Globaler Audio-Unlocker bei erster Berührung
        const unlock = () => this.unlockAudio();
        window.addEventListener('click', unlock, { once: true });
        window.addEventListener('touchstart', unlock, { once: true });
    }

    unlockAudio() {
        if (!this.audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) this.audioCtx = new AudioContextClass();
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    playPiezoBeep() {
        if (!this.audioCtx || this.audioCtx.state !== 'running') return;
        if (this.bmz.buzzerSilenced || this.bmz.akustikAb || this.bmz.alarms.length === 0) return;

        try {
            let osc = this.audioCtx.createOscillator();
            let gain = this.audioCtx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(3000, this.audioCtx.currentTime);
            gain.gain.setValueAtTime(0.25, this.audioCtx.currentTime); // Lauter Piepton

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.15);
        } catch (e) {}
    }

    updateBuzzerSound() {
        if (this.bmz.alarms.length > 0 && !this.bmz.buzzerSilenced && !this.bmz.akustikAb) {
            if (!this.buzzerInterval) {
                this.playPiezoBeep();
                this.buzzerInterval = setInterval(() => this.playPiezoBeep(), 400);
            }
        } else {
            if (this.buzzerInterval) {
                clearInterval(this.buzzerInterval);
                this.buzzerInterval = null;
            }
        }
    }

    render(state) {
        this.ledBetrieb.classList.add('active');
        this.ledUeAusgeloest.classList.toggle('active', state.alarms.length > 0 && !state.ueAb);
        this.ledLoeschanlage.classList.toggle('active', state.loeschanlageAusgeloest);
        this.ledBrandfall.classList.toggle('active', state.brandfallAb);
        this.ledAkustik.classList.toggle('active', state.akustikAb);
        this.ledUeAb.classList.toggle('active', state.ueAb);

        this.updateBuzzerSound();
    }
}
