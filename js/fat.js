class FAT {
    constructor(bmz) {
        this.bmz = bmz;
        this.summerBtnTimer = null;
        this.summerBtnHoldTriggered = false;

        this.initDOM();
        this.bindEvents();
    }

    padLine(text) {
        if (!text) text = "";
        return String(text).padEnd(20, ' ').substring(0, 20);
    }

    initDOM() {
        this.lcd1 = document.getElementById('lcd-line-1');
        this.lcd2 = document.getElementById('lcd-line-2');
        this.lcd3 = document.getElementById('lcd-line-3');
        this.lcd4 = document.getElementById('lcd-line-4');

        this.btnUp = document.getElementById('btn-fat-up');
        this.btnDown = document.getElementById('btn-fat-down');
        this.btnEbene = document.getElementById('btn-fat-ebene');
        this.btnSummerAb = document.getElementById('btn-summer-ab');

        this.ledBetrieb = document.getElementById('fat-led-betrieb');
        this.ledAlarm = document.getElementById('fat-led-alarm');
        this.ledStoerung = document.getElementById('fat-led-stoerung');
        this.ledAbschaltung = document.getElementById('fat-led-abschaltung');
    }

    bindEvents() {
        if (this.btnUp) {
            this.btnUp.addEventListener('click', () => {
                if (this.bmz) this.bmz.navigateAlarm(-1);
            });
        }
        if (this.btnDown) {
            this.btnDown.addEventListener('click', () => {
                if (this.bmz) this.bmz.navigateAlarm(1);
            });
        }
        if (this.btnEbene) {
            this.btnEbene.addEventListener('click', () => alert("Anzeigeebene umgeschaltet"));
        }

        // Summer Ab / Lampentest Timer (5s gedrückt halten)
        if (this.btnSummerAb) {
            const startSummerTimer = () => {
                this.summerBtnHoldTriggered = false;
                this.summerBtnTimer = setTimeout(() => {
                    this.summerBtnHoldTriggered = true;
                    if (this.bmz) this.bmz.setLampTest(true);
                }, 5000);
            };

            const stopSummerTimer = () => {
                if (this.summerBtnTimer) {
                    clearTimeout(this.summerBtnTimer);
                    this.summerBtnTimer = null;
                }

                if (this.bmz) {
                    if (this.bmz.lampTestActive) {
                        this.bmz.setLampTest(false);
                    } else if (!this.summerBtnHoldTriggered) {
                        this.bmz.silenceBuzzer();
                    }
                }
            };

            this.btnSummerAb.addEventListener('mousedown', startSummerTimer);
            this.btnSummerAb.addEventListener('mouseup', stopSummerTimer);
            this.btnSummerAb.addEventListener('mouseleave', stopSummerTimer);
            this.btnSummerAb.addEventListener('touchstart', startSummerTimer);
            this.btnSummerAb.addEventListener('touchend', stopSummerTimer);
        }
    }

    render(state) {
        const alarms = state.alarms || [];
        const total = alarms.length;
        const currentIndex = state.currentIndex || 0;

        // Lampentest Zustand
        if (state.lampTestActive) {
            if (this.lcd1) this.lcd1.innerText = "####################";
            if (this.lcd2) this.lcd2.innerText = "####################";
            if (this.lcd3) this.lcd3.innerText = "####################";
            if (this.lcd4) this.lcd4.innerText = "####################";

            this.ledBetrieb?.classList.add('active');
            this.ledAlarm?.classList.add('active');
            this.ledStoerung?.classList.add('active');
            this.ledAbschaltung?.classList.add('active');
            return;
        }

        // LCD Display Zeilen aktualisieren
        if (!this.lcd1 || !this.lcd2 || !this.lcd3 || !this.lcd4) return;

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

        // Tasten-Ansteuerung & Blinken (Scroll-Logik)
        if (this.btnUp) this.btnUp.classList.remove('blink', 'solid');
        if (this.btnDown) this.btnDown.classList.remove('blink', 'solid');

        if (total > 2) {
            // Nach oben scrollbar?
            if (currentIndex > 0) {
                let unreadAbove = false;
                for (let i = 0; i < currentIndex; i++) {
                    if (!alarms[i].read) {
                        unreadAbove = true;
                        break;
                    }
                }
                if (unreadAbove) this.btnUp?.classList.add('blink');
                else this.btnUp?.classList.add('solid');
            }

            // Nach unten scrollbar?
            if (currentIndex < total - 1) {
                let unreadBelow = false;
                for (let i = currentIndex + 1; i < total; i++) {
                    if (!alarms[i].read) {
                        unreadBelow = true;
                        break;
                    }
                }
                if (unreadBelow) this.btnDown?.classList.add('blink');
                else this.btnDown?.classList.add('solid');
            }
        }

        // Status-LEDs
        this.ledBetrieb?.classList.add('active');
        this.ledAlarm?.classList.toggle('active', total > 0);
        this.ledStoerung?.classList.toggle('active', !!state.bmzStoerung);
        this.ledAbschaltung?.classList.toggle('active', !!(state.brandfallAb || state.akustikAb || state.ueAb));
    }
}
