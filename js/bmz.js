class BMZ {
    constructor() {
        this.alarms = [];
        this.currentIndex = 0;
        
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
        // HIER NICHT MEHR AUTOMATISCH auf read = true SETZEN!
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

    // Neue Methode: Gezielt eine Meldung als gelesen markieren
   markCurrentAsRead() {
    if (this.alarms.length > 0) {
        // 1. Die erste Meldung ist auf dem FAT IMMER in Zeile 1/2 sichtbar -> read = true
        this.alarms[0].read = true;

        // 2. Die im unteren Displaybereich aktive Meldung ebenfalls -> read = true
        if (this.alarms[this.currentIndex]) {
            this.alarms[this.currentIndex].read = true;
        }
    }
}

    addAlarm(group, detector, count, typeText, loc) {
        const newAlarm = {
            id: Date.now() + Math.random(),
            group: String(group).padStart(3, '0'),
            detector: String(detector).padStart(2, '0'),
            count: String(count).padStart(2, '0'),
            typeText: typeText,
            loc: loc.substring(0, 20),
            read: false // Alle neuen Alarme starten IMMER unread
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

    // ... Rest von bmz.js bleibt gleich ...
}
