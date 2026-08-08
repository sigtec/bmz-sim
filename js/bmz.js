class BMZ {
    constructor() {
        this.alarms = [];
        this.currentIndex = 0;
        
        // Zustände
        this.buzzerSilenced = false;
        this.brandfallAb = false;
        this.akustikAb = false;
        this.ueAb = false;
        this.bmzStoerung = false;
        this.loeschanlageAusgeloest = false;
        this.lampTestActive = false;

        this.subscribers = [];
    }

    subscribe(callback) {
        this.subscribers.push(callback);
    }

    notify() {
        // Aktuell gerenderte Meldung als gelesen kennzeichnen
        if (this.alarms.length > 0 && this.alarms[this.currentIndex]) {
            this.alarms[this.currentIndex].read = true;
        }

        const state = {
            alarms: this.alarms,
            currentIndex: this.currentIndex,
            buzzerSilenced: this.buzzerSilenced,
            brandfallAb: this.brandfallAb,
            akustikAb: this.akustikAb,
            ueAb: this.ueAb,
            bmzStoerung: this.bmzStoerung,
            loeschanlageAusgeloest: this.loeschanlageAusgeloest,
            lampTestActive: this.lampTestActive
        };

        this.subscribers.forEach(callback => callback(state));
    }

    addAlarm(group, detector, count, typeText, loc) {
        const newAlarm = {
            id: Date.now() + Math.random(),
            group: String(group).padStart(3, '0'),
            detector: String(detector).padStart(2, '0'),
            count: String(count).padStart(2, '0'),
            typeText: typeText,
            loc: loc.substring(0, 20),
            read: false
        };

        this.alarms.push(newAlarm);
        this.currentIndex = this.alarms.length - 1;
        this.buzzerSilenced = false;
        this.notify();
    }

    navigateAlarm(dir) {
        if (this.alarms.length <= 2) return;
        let targetIndex = this.currentIndex + dir;
        if (targetIndex >= 0 && targetIndex < this.alarms.length) {
            this.currentIndex = targetIndex;
            this.notify();
        }
    }

    removeAlarm(id) {
        this.alarms = this.alarms.filter(a => a.id !== id);
        if (this.currentIndex >= this.alarms.length) {
            this.currentIndex = Math.max(0, this.alarms.length - 1);
        }
        this.notify();
    }

    resetBMZ() {
        this.alarms = [];
        this.currentIndex = 0;
        this.buzzerSilenced = false;
        this.loeschanlageAusgeloest = false;
        this.bmzStoerung = false;
        this.notify();
    }

    silenceBuzzer() {
        this.buzzerSilenced = true;
        this.notify();
    }

    setLampTest(active) {
        this.lampTestActive = active;
        this.notify();
    }

    toggleBrandfallSteuerung() {
        this.brandfallAb = !this.brandfallAb;
        this.notify();
    }

    toggleAkustischeSignale() {
        this.akustikAb = !this.akustikAb;
        this.notify();
    }

    toggleUeAb() {
        this.ueAb = !this.ueAb;
        this.notify();
    }

    toggleBMZStoerung() {
        this.bmzStoerung = !this.bmzStoerung;
        this.notify();
    }

    toggleLoeschanlage() {
        this.loeschanlageAusgeloest = !this.loeschanlageAusgeloest;
        this.notify();
    }
}
