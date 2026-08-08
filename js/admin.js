class AdminUI {
    constructor(bmz) {
        this.bmz = bmz;
        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        this.drawer = document.getElementById('admin-drawer');
        this.btnToggle = document.getElementById('btn-toggle-admin');
        this.btnClose = document.getElementById('btn-close-admin');
        
        this.btnAdd = document.getElementById('btn-adm-add');
        this.btnStoerung = document.getElementById('btn-adm-stoerung');
        this.btnLoesch = document.getElementById('btn-adm-loesch');
        this.btnClear = document.getElementById('btn-adm-clear');

        this.inputGroup = document.getElementById('adm-group');
        this.inputDetector = document.getElementById('adm-detector');
        this.inputCount = document.getElementById('adm-count');
        this.inputType = document.getElementById('adm-type');
        this.inputLoc = document.getElementById('adm-loc');
        this.alarmListContainer = document.getElementById('admin-alarm-list');
    }

    bindEvents() {
        if (this.btnToggle) this.btnToggle.addEventListener('click', () => this.drawer?.classList.toggle('open'));
        if (this.btnClose) this.btnClose.addEventListener('click', () => this.drawer?.classList.remove('open'));

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
    }

    render(state) {
        if (!this.alarmListContainer) return;

        this.alarmListContainer.innerHTML = '';
        if (!state.alarms || state.alarms.length === 0) {
            this.alarmListContainer.innerHTML = '<span style="color:#666;">Keine aktiven Alarme</span>';
            return;
        }

        state.alarms.forEach((a, index) => {
            const div = document.createElement('div');
            div.className = 'alarm-item';
            div.style.cssText = "display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.8rem; color:#fff;";
            div.innerHTML = `
                <span>#${index + 1} [${a.group}/${a.detector}] ${a.typeText} - ${a.loc} (${a.read ? 'gelesen' : 'UNGELEN'})</span>
                <button style="background:#d32f2f; color:#fff; border:none; padding:2px 6px; cursor:pointer;">Löschen</button>
            `;
            div.querySelector('button').addEventListener('click', () => this.bmz.removeAlarm(a.id));
            this.alarmListContainer.appendChild(div);
        });
    }
}
