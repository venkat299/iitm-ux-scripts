// ==UserScript==
// @name         IITM Placement Portal – Tick Button Credits Selector
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Add a tick button in the S.No. column, sum credits across pages, and persist selections via localStorage.  Hooks into Bootstrap Table’s post-body event so the tick doesn’t disappear when the table re-renders.
// @match        https://placement.iitm.ac.in/students-all-companies*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = 'iitmPlacementSelectedCredits';

    function getSelected() {
        const stored = localStorage.getItem(STORAGE_KEY);
        try {
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    }

    function saveSelected(selected) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    }

    function updateStat() {
        const selected = getSelected();
        const count = Object.keys(selected).length;
        const totalCredits = Object.values(selected).reduce((sum, c) => sum + c, 0);
        const statElem = document.getElementById('iitm-credit-stat');
        if (statElem) {
            statElem.textContent = `Selected: ${count}, Credit req: ${totalCredits}`;
        }
    }

    function insertStatLabel() {
        if (document.getElementById('iitm-credit-stat')) return;
        const stat = document.createElement('span');
        stat.id = 'iitm-credit-stat';
        stat.style.marginLeft = '10px';
        stat.style.fontWeight = 'bold';

        const toggleBtn = document.getElementById('tm-toggle-hidden');
        const creditBtn = Array.from(document.querySelectorAll('button'))
            .find(btn => btn.textContent.trim().toLowerCase().includes('credit info'));
        if (toggleBtn && toggleBtn.parentNode) {
            toggleBtn.parentNode.insertBefore(stat, toggleBtn.nextSibling);
        } else if (creditBtn && creditBtn.parentNode) {
            creditBtn.parentNode.insertBefore(stat, creditBtn.nextSibling);
        } else {
            document.body.insertBefore(stat, document.body.firstChild);
        }
    }

    function createTickButton(cell, slNo, uniqueKey, credits) {
        // If a button already exists, no need to add another
        if (cell.querySelector('.iitm-credit-btn')) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'iitm-credit-btn btn btn-outline-secondary btn-sm';
        btn.textContent = '✓';
        btn.style.marginRight = '4px';

        const selected = getSelected();
        const isSelected = selected[uniqueKey] !== undefined;
        btn.dataset.selected = isSelected ? 'true' : 'false';
        if (isSelected) {
            btn.classList.remove('btn-outline-secondary');
            btn.classList.add('btn-success');
        }

        btn.addEventListener('click', () => {
            let current = getSelected();
            const state = btn.dataset.selected === 'true';
            if (state) {
                btn.dataset.selected = 'false';
                btn.classList.remove('btn-success');
                btn.classList.add('btn-outline-secondary');
                delete current[uniqueKey];
            } else {
                btn.dataset.selected = 'true';
                btn.classList.remove('btn-outline-secondary');
                btn.classList.add('btn-success');
                current[uniqueKey] = credits;
            }
            saveSelected(current);
            updateStat();
        });

        // Rebuild cell contents
        cell.innerHTML = '';
        cell.appendChild(btn);
        const slSpan = document.createElement('span');
        slSpan.textContent = slNo;
        cell.appendChild(slSpan);
    }

    function addTickButtons() {
        const pageParam = new URL(window.location.href).searchParams.get('page') || '1';
        const rows = document.querySelectorAll('table tbody tr');
        rows.forEach(row => {
            const cells = row.cells;
            if (!cells || cells.length < 4) return;
            const cell = cells[0];
            const slNo = cell.innerText.trim();
            const companyName = cells[1].innerText.trim();
            const profileName = cells[2].innerText.trim();
            const creditsText = cells[3].innerText.trim();
            const credits = /^\d+$/.test(creditsText) ? parseInt(creditsText) : 0;
            const dataIndex = row.getAttribute('data-index') || '';
            const uniqueKey = `${companyName}|${profileName}|${credits}|p${pageParam}i${dataIndex}`;
            createTickButton(cell, slNo, uniqueKey, credits);
        });
    }

    // This function is called after every table render
    function handleTableRendered() {
        insertStatLabel();
        addTickButtons();
        updateStat();
    }

    // Run once when the script loads
    handleTableRendered();

    // Hook into Bootstrap Table’s `post-body` event to reapply ticks after each render
    const table = document.querySelector('table[data-toggle="table"]');
    if (table) {
        // Bootstrap Table triggers a custom event after it renders rows
        table.addEventListener('post-body.bs.table', handleTableRendered);
    }
})();
