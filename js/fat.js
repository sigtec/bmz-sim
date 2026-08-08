class FAT {
    // ... constructor, initDOM, bindEvents etc. bleiben gleich ...

    render(state) {
        const alarms = state.alarms;
        const total = alarms.length;
        const currentIndex = state.currentIndex;

        // 1. Erst JETZT wird die im Display sichtbare Meldung als gelesen markiert
        // Prüfe sicherheitshalber, ob bmz existiert
        if (this.bmz && typeof this.bmz.markCurrentAsRead === 'function') {
            this.bmz.markCurrentAsRead();
        }

        // Lampentest Zustand
        if (state.lampTestActive) {
            this.lcd1.innerText = "####################";
            this.lcd2.innerText = "####################";
            this.lcd3.innerText = "####################";
            this.lcd4.innerText = "####################";
            this.ledBetrieb.classList.add('active');
            this.ledAlarm.classList.add('active');
            this.ledStoerung.classList.add('active');
            this.ledAbschaltung.classList.add('active');
            return;
        }

        // Display Zeilen aktualisieren
        if (total === 0) {
            this.lcd1.innerText = this.padLine("BMZ BETRIEBSBEREIT");
            this.lcd2.innerText = this.padLine("");
            this.lcd3.innerText = this.padLine("KEINE MELDUNGEN");
            this.lcd4.innerText = this.padLine("");
        } else if (total === 1) {
            const a = alarms[0];
            const line = `${a.group}/${a.detector} ${a.count} ${a.typeText}`;
            this.lcd1.innerText = this.padLine(line);
            this.lcd2.innerText = this.padLine(a.loc);
            this.lcd3.innerText = this.padLine(line);
            this.lcd4.innerText = this.padLine(a.loc);
        } else if (total === 2) {
            const first = alarms[0];
            const second = alarms[1];
            this.lcd1.innerText = this.padLine(`${first.group}/${first.detector} ${first.count} ${first.typeText}`);
            this.lcd2.innerText = this.padLine(first.loc);
            this.lcd3.innerText = this.padLine(`${second.group}/${second.detector} ${second.count} ${second.typeText}`);
            this.lcd4.innerText = this.padLine(second.loc);
        } else {
            const first = alarms[0];
            const curr = alarms[currentIndex];
            this.lcd1.innerText = this.padLine(`${first.group}/${first.detector} ${first.count} ${first.typeText}`);
            this.lcd2.innerText = this.padLine(first.loc);
            this.lcd3.innerText = this.padLine(`${curr.group}/${curr.detector} ${curr.count} ${curr.typeText}`);
            this.lcd4.innerText = this.padLine(curr.loc);
        }

        // Scroll-Tasten Ansteuerung & Blinken
        this.btnUp.classList.remove('blink', 'solid');
        this.btnDown.classList.remove('blink', 'solid');

        if (total > 2) {
            // Nach oben scrollbar? Prüfe, ob ungelese Meldungen DRÜBER liegen
            if (currentIndex > 0) {
                let unreadAbove = false;
                for (let i = 0; i < currentIndex; i++) {
                    if (!alarms[i].read) {
                        unreadAbove = true;
                        break;
                    }
                }
                if (unreadAbove) this.btnUp.classList.add('blink');
                else this.btnUp.classList.add('solid');
            }

            // Nach unten scrollbar? Prüfe, ob ungelese Meldungen DRUNTER liegen
            if (currentIndex < total - 1) {
                let unreadBelow = false;
                for (let i = currentIndex + 1; i < total; i++) {
                    if (!alarms[i].read) {
                        unreadBelow = true;
                        break;
                    }
                }
                if (unreadBelow) this.btnDown.classList.add('blink');
                else this.btnDown.classList.add('solid');
            }
        }

        // FAT LEDs
        this.ledBetrieb.classList.add('active');
        this.ledAlarm.classList.toggle('active', total > 0);
        this.ledStoerung.classList.toggle('active', state.bmzStoerung);
        this.ledAbschaltung.classList.toggle('active', state.brandfallAb || state.akustikAb || state.ueAb);
    }
}
