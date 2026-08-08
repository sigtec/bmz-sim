// System-Zustände
let alarms = [];
let currentIndex = 0; // Zeigt auf die aktuell in der unteren Display-Hälfte sichtbare Meldung
let buzzerSilenced = false;
let brandfallAb = false;
let akustikAb = false;
let ueAb = false;
let bmzStoerung = false;
let loeschanlageAusgeloest = false;
let lampTestActive = false;

// Timer Handles
let resetHoldTimer = null;
let summerBtnTimer = null;
let summerBtnHoldTriggered = false;

// Audio Engine
let audioCtx = null;
let buzzerInterval = null;

function initAudio() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playPiezoBeep() {
    initAudio();
    if (!audioCtx || buzzerSilenced || akustikAb || alarms.length === 0) return;
    try {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(2800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    } catch(e) {}
}

function updateBuzzerSound() {
    if (alarms.length > 0 && !buzzerSilenced && !akustikAb) {
        if (!buzzerInterval) {
            playPiezoBeep();
            buzzerInterval = setInterval(playPiezoBeep, 400);
        }
    } else {
        if (buzzerInterval) {
            clearInterval(buzzerInterval);
            buzzerInterval = null;
        }
    }
}

function padLine(str, len = 20) {
    return str.padEnd(len, ' ').substring(0, len);
}

function addAlarm(group, detector, count, typeText, loc) {
    initAudio();
    
    const newAlarm = {
        id: Date.now() + Math.random(), // Eindeutige ID
        group: String(group).padStart(3, '0'),
        detector: String(detector).padStart(2, '0'),
        count: String(count).padStart(2, '0'),
        typeText: typeText,
        loc: loc.substring(0, 20),
        read: false
    };
    
    alarms.push(newAlarm);
    
    // Untere Zeile zeigt bei neuen Meldungen immer die NEUESTE an
    currentIndex = alarms.length - 1;
    
    // Re-Aktivierung des Summers bei neuen Meldungen
    buzzerSilenced = false;
    
    updateDisplay();
    updateAdminList();
}

function navigateAlarm(dir) {
    if (alarms.length <= 2) return; // Keine Navigation bei <= 2 Meldungen
    
    let targetIndex = currentIndex + dir;
    
    if (targetIndex >= 0 && targetIndex < alarms.length) {
        currentIndex = targetIndex;
        updateDisplay();
    }
}

function updateDisplay() {
    const total = alarms.length;

    // Nur die aktuell unten sichtbare Meldung auf "gelesen" setzen
    if (total > 0 && alarms[currentIndex]) {
        alarms[currentIndex].read = true;
    }

    // Lampentest
    if (lampTestActive) {
        document.getElementById('lcd-line-1').innerText = "####################";
        document.getElementById('lcd-line-2').innerText = "####################";
        document.getElementById('lcd-line-3').innerText = "####################";
        document.getElementById('lcd-line-4').innerText = "####################";
        setAllLEDs(true);
        return;
    }

    // --- FAT LCD Display Anzeigelogik ---
    if (total === 0) {
        document.getElementById('lcd-line-1').innerText = padLine("BMZ BETRIEBSBEREIT");
        document.getElementById('lcd-line-2').innerText = padLine("");
        document.getElementById('lcd-line-3').innerText = padLine("KEINE MELDUNGEN");
        document.getElementById('lcd-line-4').innerText = padLine("");
    } else if (total === 1) {
        const a = alarms[0];
        const line = `${a.group}/${a.detector} ${a.count} ${a.typeText}`;
        document.getElementById('lcd-line-1').innerText = padLine(line);
        document.getElementById('lcd-line-2').innerText = padLine(a.loc);
        document.getElementById('lcd-line-3').innerText = padLine(line);
        document.getElementById('lcd-line-4').innerText = padLine(a.loc);
    } else if (total === 2) {
        const first = alarms[0];
        const second = alarms[1];
        document.getElementById('lcd-line-1').innerText = padLine(`${first.group}/${first.detector} ${first.count} ${first.typeText}`);
        document.getElementById('lcd-line-2').innerText = padLine(first.loc);
        document.getElementById('lcd-line-3').innerText = padLine(`${second.group}/${second.detector} ${second.count} ${second.typeText}`);
        document.getElementById('lcd-line-4').innerText = padLine(second.loc);
    } else {
        const first = alarms[0];
        const curr = alarms[currentIndex];

        document.getElementById('lcd-line-1').innerText = padLine(`${first.group}/${first.detector} ${first.count} ${first.typeText}`);
        document.getElementById('lcd-line-2').innerText = padLine(first.loc);
        document.getElementById('lcd-line-3').innerText = padLine(`${curr.group}/${curr.detector} ${curr.count} ${curr.typeText}`);
        document.getElementById('lcd-line-4').innerText = padLine(curr.loc);
    }

    // --- TASTER-BELEUCHTUNG & SCROLL-LOGIK ---
    const btnUp = document.getElementById('btn-fat-up');
    const btnDown = document.getElementById('btn-fat-down');
    
    btnUp.classList.remove('blink', 'solid');
    btnDown.classList.remove('blink', 'solid');

    if (total > 2) {
        // Prüfen, ob oberhalb des aktuellen Index ungelesene Meldungen liegen
        let unreadAbove = false;
        for (let i = 0; i < currentIndex; i++) {
            if (!alarms[i].read) {
                unreadAbove = true;
                break;
            }
        }

        // Scrollen NACH OBEN möglich?
        if (currentIndex > 0) {
            if (unreadAbove) {
                btnUp.classList.add('blink'); // Blinken, weil z.B. Meldung 2 noch ungelesen ist
            } else {
                btnUp.classList.add('solid'); // Dauerhaft leuchten, wenn alles darüber bereits gelesen wurde
            }
        }

        // Prüfen, ob unterhalb des aktuellen Index ungelesene Meldungen liegen
        let unreadBelow = false;
        for (let i = currentIndex + 1; i < total; i++) {
            if (!alarms[i].read) {
                unreadBelow = true;
                break;
            }
        }

        // Scrollen NACH UNTEN möglich?
        if (currentIndex < total - 1) {
            if (unreadBelow) {
                btnDown.classList.add('blink');
            } else {
                btnDown.classList.add('solid');
            }
        }
    }

    // LEDs Aktualisieren
    document.getElementById('fat-led-betrieb').classList.add('active');
    document.getElementById('fbf-led-betrieb').classList.add('active');

    document.getElementById('fat-led-alarm').classList.toggle('active', total > 0);
    document.getElementById('fbf-led-ue-ausgeloest').classList.toggle('active', total > 0 && !ueAb);

    document.getElementById('fat-led-stoerung').classList.toggle('active', bmzStoerung);
    document.getElementById('fat-led-abschaltung').classList.toggle('active', brandfallAb || akustikAb || ueAb);

    document.getElementById('fbf-led-loeschanlage').classList.toggle('active', loeschanlageAusgeloest);
    document.getElementById('fbf-led-brandfall').classList.toggle('active', brandfallAb);
    document.getElementById('fbf-led-akustik').classList.toggle('active', akustikAb);
    document.getElementById('fbf-led-ue-ab').classList.toggle('active', ueAb);

    updateBuzzerSound();
}

function setAllLEDs(state) {
    document.querySelectorAll('.led').forEach(led => {
        if (state) led.classList.add('active');
        else led.classList.remove('active');
    });
}

// --- BMZ Rückstellen (5s Haltefunktion) ---
function startResetHold(e) {
    if (e) e.preventDefault();
    const flap = document.getElementById('flap-bmz');
    if (!flap.classList.contains('open')) {
        alert("Bitte zuerst die Schutzklappe öffnen!");
        return;
    }

    const btn = document.getElementById('btn-bmz-reset');
    btn.classList.add('pressed');

    resetHoldTimer = setTimeout(() => {
        btn.classList.remove('pressed');
        executeBMZReset();
    }, 5000);
}

function stopResetHold(e) {
    if (e) e.preventDefault();
    const btn = document.getElementById('btn-bmz-reset');
    btn.classList.remove('pressed');

    if (resetHoldTimer) {
        clearTimeout(resetHoldTimer);
        resetHoldTimer = null;
    }
}

function executeBMZReset() {
    clearAllAlarms();
    loeschanlageAusgeloest = false;
    bmzStoerung = false;
    updateDisplay();
}

// --- Summer Ab / Lampentest Timer ---
function startSummerBtnTimer() {
    initAudio();
    summerBtnHoldTriggered = false;
    
    summerBtnTimer = setTimeout(() => {
        summerBtnHoldTriggered = true;
        lampTestActive = true;
        updateDisplay();
    }, 5000);
}

function stopSummerBtnTimer() {
    if (summerBtnTimer) {
        clearTimeout(summerBtnTimer);
        summerBtnTimer = null;
    }

    if (lampTestActive) {
        lampTestActive = false;
        updateDisplay();
    } else if (!summerBtnHoldTriggered) {
        buzzerSilenced = true;
        updateDisplay();
    }
}

// FBF Klappen
function toggleFlap(id) {
    document.getElementById(id).classList.toggle('open');
}

function testUe() {
    const flap = document.getElementById('flap-ue');
    if (!flap.classList.contains('open')) {
        alert("Bitte zuerst die Schutzklappe öffnen!");
        return;
    }
    alert("ÜE Verbindung wird geprüft... OK!");
}

function toggleBrandfallSteuerung() {
    brandfallAb = !brandfallAb;
    updateDisplay();
}

function toggleAkustischeSignale() {
    akustikAb = !akustikAb;
    updateDisplay();
}

function toggleUeAb() {
    ueAb = !ueAb;
    updateDisplay();
}

function toggleAnzeigeebene() {
    alert("Anzeigeebene umgeschaltet");
}

// Admin Aktionen
function toggleAdmin() {
    document.getElementById('admin-drawer').classList.toggle('open');
}

function addAlarmFromAdmin() {
    const g = document.getElementById('adm-group').value;
    const d = document.getElementById('adm-detector').value;
    const c = document.getElementById('adm-count').value;
    const t = document.getElementById('adm-type').value;
    const l = document.getElementById('adm-loc').value;
    addAlarm(g, d, c, t, l);
}

function toggleBMZStoerung() {
    bmzStoerung = !bmzStoerung;
    updateDisplay();
}

function toggleLoeschanlage() {
    loeschanlageAusgeloest = !loeschanlageAusgeloest;
    updateDisplay();
}

function clearAllAlarms() {
    alarms = [];
    currentIndex = 0;
    buzzerSilenced = false;
    updateDisplay();
    updateAdminList();
}

function removeAlarm(id) {
    alarms = alarms.filter(a => a.id !== id);
    if (currentIndex >= alarms.length) {
        currentIndex = Math.max(0, alarms.length - 1);
    }
    updateDisplay();
    updateAdminList();
}

function updateAdminList() {
    const container = document.getElementById('admin-alarm-list');
    container.innerHTML = '';
    if (alarms.length === 0) {
        container.innerHTML = '<span style="color:#666;">Keine aktiven Alarme</span>';
        return;
    }
    alarms.forEach((a, index) => {
        const div = document.createElement('div');
        div.className = 'alarm-item';
        div.innerHTML = `
            <span>#${index+1} [${a.group}/${a.detector}] ${a.typeText} - ${a.loc}</span>
            <button style="background:#d32f2f; color:#fff; border:none; padding:2px 6px; cursor:pointer;" onclick="removeAlarm(${a.id})">Löschen</button>
        `;
        container.appendChild(div);
    });
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// Service Worker Registrierung
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
}

// Startzustand mit 3 Initial-Meldungen
addAlarm(17, 5, 8, "aut Meld", "Raum 1.205 WC Herren");
addAlarm(18, 5, 8, "aut Meld", "Raum 1.205 ZD");
addAlarm(17, 1, 8, "aut Meld", "Raum 1.201 Flur 2.OG");
