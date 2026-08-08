class AdminUI {
    constructor(bmz) {
        this.bmz = bmz;
        this.presetAlarms = [];

        this.initDOM();
        this.bindEvents();
        
        // Erst Speicher/Server prüfen, dann initial rendern
        this.initPresets();
    }

    // Lädt Presets: 1. LocalStorage -> 2. default.json vom Server -> 3. Fallback []
    async initPresets() {
        const saved = localStorage.getItem('bma_scenario_presets');
        if (saved) {
            try {
                this.presetAlarms = JSON.parse(saved);
                this.renderPresets();
                return;
            } catch (e) {
                console.error("Fehler beim Lesen aus localStorage:", e);
            }
        }

        // Versuche default.json vom Server zu laden
        try {
            const response = await fetch('default.json', { cache: 'no-cache' });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    this.presetAlarms = data;
                    this.saveToStorage();
                }
            }
        } catch (err) {
            console.warn("Keine default.json gefunden oder Netzwerkfehler. Start ohne Vorlagen.", err);
            this.presetAlarms = [];
        }

        this.renderPresets();
    }

    saveToStorage() {
        localStorage.setItem('bma_scenario_presets', JSON.stringify(this.presetAlarms));
    }

    initDOM() {
        this.drawer = document.getElementById('admin-drawer');
        this.btnToggle = document.getElementById('btn-toggle-admin');
        this.btnClose = document.getElementById('btn-close-admin');

        // Top Command Buttons
        this.btnNew = document.getElementById('btn-adm-new');
        this.btnImportTrigger = document.getElementById('btn-adm-import-trigger');
        this.btnExport = document.getElementById('btn-adm-export');
        this.btnClear = document.getElementById('btn-adm-clear');
        this.inputFile = document.getElementById('input-adm-file');

        // Container
        this.alarmListContainer = document.getElementById('admin-alarm-list');
        this.presetListContainer = document.getElementById('admin-preset-list');

        // Modal Elements
        this.modal = document.getElementById('admin-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalIndex = document.getElementById('modal-preset-index');
        this.modalGroup = document.getElementById('modal-group');
        this.modalDetector = document.getElementById('modal-detector');
        this.modalCount = document.getElementById('modal-count');
        this.modalType = document.getElementById('modal-type');
        this.modalLoc = document.getElementById('modal-loc');
        this.btnModalCancel = document.getElementById('btn-modal-cancel');
        this.btnModalSave = document.getElementById('btn-modal-save');
    }

    bindEvents() {
        if (this.btnToggle) this.btnToggle.addEventListener('click', () => this.drawer?.classList.toggle('open'));
        if (this.btnClose) this.btnClose.addEventListener('click', () => this.drawer?.classList.remove('open'));

        // BMZ Reset
        if (this.btnClear) this.btnClear.addEventListener('click', () => this.bmz.resetBMZ());

        // Neue Schleife erfassen
        if (this.btnNew) {
            this.btnNew.addEventListener('click', () => this.openModalForNew());
        }

        // Export (JSON)
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

        // Import (JSON)
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
                        } else {
                            alert("Ungültiges JSON-Format!");
                        }
                    } catch (err) {
                        alert("Fehler beim Lesen der JSON-Datei: " + err.message);
                    }
                };
                reader.readAsText(file);
                this.inputFile.value = '';
            });
        }

        // Modal Handler
        if (this.btnModalCancel) this.btnModalCancel.addEventListener('click', () => this.closeModal());
        if (this.btnModalSave) this.btnModalSave.addEventListener('click', () => this.saveModalData());
    }

    openModalForNew() {
        this.modalTitle.innerText = "Neue Schleife erfassen";
        this.modalIndex.value = "-1";
        this.modalGroup.value = "1";
        this.modalDetector.value = "1";
        this.modalCount.value = "1";
        this.modalType.value = "aut Meld";
        this.modalLoc.value = "";
        this.modal.style.display = "flex";
    }

    openModalForEdit(index) {
        const item = this.presetAlarms[index];
        if (!item) return;

        this.modalTitle.innerText = "Schleife bearbeiten";
        this.modalIndex.value = index;
        this.modalGroup.value = item.group;
        this.modalDetector.value = item.detector;
        this.modalCount.value = item.count || 1;
        this.modalType.value = item.typeText || "aut Meld";
        this.modalLoc.value = item.loc;
        this.modal.style.display = "flex";
    }

    closeModal() {
        this.modal.style.display = "none";
    }

    saveModalData() {
        const index = parseInt(this.modalIndex.value, 10);
        const newItem = {
            group: parseInt(this.modalGroup.value, 10) || 1,
            detector: parseInt(this.modalDetector.value, 10) || 1,
            count: parseInt(this.modalCount.value, 10) || 1,
            typeText: this.modalType.value,
            loc: this.modalLoc.value.substring(0, 20)
        };

        if (index === -1) {
            this.presetAlarms.push(newItem);
        } else {
            this.presetAlarms[index] = newItem;
        }

        this.saveToStorage();
        this.renderPresets();
        this.closeModal();
    }

    // Rendert die verfügbaren Schleifen (inkl. Meldungsart)
    renderPresets() {
        if (!this.presetListContainer) return;
        this.presetListContainer.innerHTML = '';

        if (this.presetAlarms.length === 0) {
            this.presetListContainer.innerHTML = '<span style="color:#888; font-size:0.8rem;">Keine Schleifen vorhanden</span>';
            return;
        }

        this.presetAlarms.forEach((p, index) => {
            const div = document.createElement('div');
            div.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#2a2a2a; padding:6px 8px; margin-bottom:4px; border-radius:4px; font-size:0.8rem; color:#fff;";

            const info = document.createElement('span');
            info.style.cssText = "white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-right: 8px;";
            // Anzeige von [Gruppe/Melder] Art - Standort
            info.innerText = `[${String(p.group).padStart(3,'0')}/${String(p.detector).padStart(2,'0')}] ${p.typeText || 'aut Meld'} - ${p.loc}`;

            const actionContainer = document.createElement('div');
            actionContainer.style.cssText = "display:flex; gap:4px; flex-shrink:0;";

            const btnTrigger = document.createElement('button');
            btnTrigger.innerText = "Auslösen";
            btnTrigger.style.cssText = "background:#2e7d32; color:#fff; border:none; padding:3px 6px; border-radius:3px; cursor:pointer; font-size:0.75rem; font-weight:bold;";
            btnTrigger.addEventListener('click', () => {
                this.bmz.addAlarm(p.group, p.detector, p.count || 1, p.typeText || "aut Meld", p.loc);
            });

            const btnEdit = document.createElement('button');
            btnEdit.innerText = "Bearbeiten";
            btnEdit.style.cssText = "background:#1976d2; color:#fff; border:none; padding:3px 6px; border-radius:3px; cursor:pointer; font-size:0.75rem;";
            btnEdit.addEventListener('click', () => {
                this.openModalForEdit(index);
            });

            actionContainer.appendChild(btnTrigger);
            actionContainer.appendChild(btnEdit);

            div.appendChild(info);
            div.appendChild(actionContainer);
            this.presetListContainer.appendChild(div);
        });
    }

    render(state) {
        this.renderPresets();

        // Rendert aktive Schleifen (inkl. Meldungsart)
        if (!this.alarmListContainer) return;
        this.alarmListContainer.innerHTML = '';

        if (!state.alarms || state.alarms.length === 0) {
            this.alarmListContainer.innerHTML = '<span style="color:#888; font-size:0.8rem;">Keine aktiven Schleifen</span>';
            return;
        }

        state.alarms.forEach((a) => {
            const div = document.createElement('div');
            div.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#2a2a2a; padding:6px 8px; margin-bottom:4px; border-radius:4px; font-size:0.8rem; color:#fff;";

            const info = document.createElement('span');
            info.style.cssText = "white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-right: 8px;";
            // Anzeige von [Gruppe/Melder] Art - Standort
            info.innerText = `[${String(a.group).padStart(3,'0')}/${String(a.detector).padStart(2,'0')}] ${a.typeText} - ${a.loc}`;

            const btnDelete = document.createElement('button');
            btnDelete.innerText = "Löschen";
            btnDelete.style.cssText = "background:#d32f2f; color:#fff; border:none; padding:3px 6px; border-radius:3px; cursor:pointer; font-size:0.75rem; flex-shrink:0;";
            btnDelete.addEventListener('click', () => this.bmz.removeAlarm(a.id));

            div.appendChild(info);
            div.appendChild(btnDelete);
            this.alarmListContainer.appendChild(div);
        });
    }
}
