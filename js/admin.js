class AdminUI {
    constructor(bmz) {
        this.bmz = bmz;

        // Vordefiniertes Standard-Szenario
        this.presetAlarms = [
            { group: 17, detector: 1, count: 1, typeText: "aut Meld", loc: "Raum 1.201 Flur 2.OG" },
            { group: 17, detector: 5, count: 2, typeText: "aut Meld", loc: "Raum 1.205 WC Herren" },
            { group: 18, detector: 2, count: 3, typeText: "aut Meld", loc: "Raum 1.205 ZD" },
            { group: 22, detector: 1, count: 4, typeText: "Handmeld", loc: "Treppenhaus West UG" },
            { group: 30, detector: 4, count: 5, typeText: "aut Meld", loc: "Serverraum R0.04" }
        ];

        this.initStorage();
        this.initDOM();
        this.bindEvents();
    }

    // Lädt gespeicherte Presets aus dem LocalStorage (falls vorhanden)
    initStorage() {
        const saved = localStorage.getItem('bma_scenario_presets');
        if (saved) {
            try {
                this.presetAlarms = JSON.parse(saved);
            } catch (e) {
                console.error("Fehler beim Laden der gespeicherten Szenarien", e);
            }
        }
    }

    saveToStorage() {
        localStorage.setItem('bma_scenario_presets', JSON.stringify(this.presetAlarms));
    }

    initDOM() {
        this.drawer = document.getElementById('admin-drawer');
        this.btnToggle = document.getElementById('btn-toggle-admin');
        this.btnClose = document.getElementById('btn-close-admin');

        this.btnAdd = document.getElementById('btn-adm-add');
        this.btnStoerung = document.getElementById('btn-adm-stoerung');
        this.btnLoesch = document.getElementById('btn-adm-loesch');
        this.btnClear = document.getElementById('btn-adm-clear');

        // Szenario Buttons & File-Input
        this.btnExport = document.getElementById('btn-adm-export');
        this.btnImportTrigger = document.getElementById('btn-adm-import-trigger');
        this.inputFile = document.getElementById('input-adm-file');
        this.btnLoadDefault = document.getElementById('btn-adm-load-default');

        this.inputGroup = document.getElementById('adm-group');
        this.inputDetector = document.getElementById('adm-detector');
        this.inputCount = document.getElementById('adm-count');
        this.inputType = document.getElementById('adm-type');
        this.inputLoc = document.getElementById('adm-loc');

        this.alarmListContainer = document.getElementById('admin-alarm-list');
        this.presetListContainer = document.getElementById('admin-preset-list');
    }

    bindEvents() {
        if (this.btnToggle) this.btnToggle.addEventListener('click', () => this.drawer?.classList.toggle('open'));
        if (this.btnClose) this.btnClose.addEventListener('click', () => this.drawer?.classList.remove('open'));

        // Manuelles Hinzufügen
        if (this.btnAdd) {
            this.btnAdd.addEventListener('click', () => {
                this.bmz.addAlarm(
                    this.inputGroup.value,
                    this.inputDetector.value,
                    this.inputCount.value,
                    this.inputType.value,
                    this.inputLoc.value
                );
            });
        }

        if (this.btnStoerung) this.btnStoerung.addEventListener('click', () => this.bmz.toggleBMZStoerung());
        if (this.btnLoesch) this.btnLoesch.addEventListener('click', () => this.bmz.toggleLoeschanlage());
        if (this.btnClear) this.btnClear.addEventListener('click', () => this.bmz.resetBMZ());

        // --- JSON Export ---
        if (this.btnExport) {
            this.btnExport.addEventListener('click', () => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.presetAlarms, null, 2));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", "bma_szenario.json");
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
            });
        }

        // --- JSON Import ---
        if (this.btnImportTrigger && this.inputFile) {
            this.btnImportTrigger.addEventListener('click', () => this.inputFile.click());

            this.inputFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const importedData = JSON.parse(event.target.result);
                        if (Array.isArray(importedData)) {
                            this.presetAlarms = importedData;
                            this.saveToStorage();
                            this.renderPresets();
                            alert("Szenario erfolgreich geladen!");
                        } else {
                            alert("Ungültiges JSON-Format! Erwartet wird ein Array von Alarm-Objekten.");
                        }
                    } catch (err) {
                        alert("Fehler beim Lesen der JSON-Datei: " + err.message);
                    }
                };
                reader.readAsText(file);
                // Reset Input, damit dieselbe Datei erneut gewählt werden kann
                this.inputFile.value = '';
            });
        }

        // --- Standard-Szenario Wiederherstellen ---
        if (this.btnLoadDefault) {
            this.btnLoadDefault.addEventListener('click', () => {
                this.presetAlarms = [
                    { group: 17, detector: 1, count: 1, typeText: "aut Meld", loc: "Raum 1.201 Flur 2.OG" },
                    { group: 17, detector: 5, count: 2, typeText: "aut Meld", loc: "Raum 1.205 WC Herren" },
                    { group: 18, detector: 2, count: 3, typeText: "aut Meld", loc: "Raum 1.205 ZD" },
                    { group: 22, detector: 1, count: 4, typeText: "Handmeld", loc: "Treppenhaus West UG" },
                    { group: 30, detector: 4, count: 5, typeText: "aut Meld", loc: "Serverraum R0.04" }
                ];
                this.saveToStorage();
                this.renderPresets();
            });
        }
    }

    // Rendert die Liste der vorbereiteten Alarme (Klicklöser für den Übungsleiter)
    renderPresets() {
        if (!this.presetListContainer) return;
        this.presetListContainer.innerHTML = '';

        this.presetAlarms.forEach((p, idx) => {
            const div = document.createElement('div');
            div.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#2a2a2a; padding:6px 8px; margin-bottom:4px; border-radius:4px; font-size:0.85rem; color:#fff;";

            const info = document.createElement('span');
            info.innerText = `Grp ${p.group}/${p.detector} - ${p.loc}`;

            const btnTrigger = document.createElement('button');
            btnTrigger.innerText = "Auslösen";
            btnTrigger.style.cssText = "background:#2e7d32; color:#fff; border:none; padding:4px 8px; border-radius:3px; cursor:pointer; font-weight:bold;";
            
            btnTrigger.addEventListener('click', () => {
                this.bmz.addAlarm(p.group, p.detector, p.count, p.typeText, p.loc);
            });

            div.appendChild(info);
            div.appendChild(btnTrigger);
            this.presetListContainer.appendChild(div);
        });
    }

    render(state) {
        // Rendere immer auch die Presets
        this.renderPresets();

        // Aktive Alarme in der BMA rendern
        if (!this.alarmListContainer) return;
        this.alarmListContainer.innerHTML = '';

        if (!state.alarms || state.alarms.length === 0) {
            this.alarmListContainer.innerHTML = '<span style="color:#888;">Keine aktiven Alarme</span>';
            return;
        }

        state.alarms.forEach((a, index) => {
            const div = document.createElement('div');
            div.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; font-size:0.8rem; color:#fff;";
            div.innerHTML = `
                <span>#${index + 1} [${a.group}/${a.detector}] ${a.typeText} - ${a.loc} (${a.read ? 'gelesen' : 'UNGELESEN'})</span>
                <button style="background:#d32f2f; color:#fff; border:none; padding:2px 6px; cursor:pointer; border-radius:3px;">Löschen</button>
            `;
            div.querySelector('button').addEventListener('click', () => this.bmz.removeAlarm(a.id));
            this.alarmListContainer.appendChild(div);
        });
    }
}
