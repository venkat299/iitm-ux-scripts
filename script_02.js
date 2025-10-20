// ==UserScript==
// @name         IITM Placement Portal – Conditional Tick/X Selector (Cross in Company Column)
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  Add a tick button in the S.No. column and a cross button in the Company Name column.  The tick sums credits, and the cross strikes out the entire row.  Buttons appear only when the Action column contains “Yet To Open” or “Register,” and selections persist across pages and sessions.  Controls are scaled down to 70% and the cross appears after the company name.
// @match        https://placement.iitm.ac.in/students-all-companies*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const SELECT_KEY = 'iitmPlacementSelectedCredits';
    const CROSS_KEY  = 'iitmPlacementCrossedRows';

    // Helpers to get and save JSON from localStorage
    function getObj(key) {
        const raw = localStorage.getItem(key);
        try {
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }
    function saveObj(key, obj) {
        localStorage.setItem(key, JSON.stringify(obj));
    }

    // Update the summary line showing number selected and total credits
    function updateStat() {
        const selected = getObj(SELECT_KEY);
        const count    = Object.keys(selected).length;
        const total    = Object.values(selected).reduce((sum, c) => sum + c, 0);
        const statElem = document.getElementById('iitm-credit-stat');
        if (statElem) {
            statElem.textContent = `Selected: ${count}, Credit req: ${total}`;
        }
    }

    // Insert or locate the stat label near existing controls
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
        updateStat();
    }

    // Apply or remove strikethrough styling on the entire row
    function applyCrossStyle(row, isCrossed) {
        if (isCrossed) {
            row.classList.add('iitm-crossed');
            row.style.textDecoration = 'line-through';
            row.style.opacity        = '0.5';
        } else {
            row.classList.remove('iitm-crossed');
            row.style.textDecoration = '';
            row.style.opacity        = '';
        }
    }

    // Build a tick button in the S.No. cell
    function buildTick(cell, row, slNo, uniqueKey, credits, isSelected) {
        // Remove existing tick if any
        const existing = cell.querySelector('.iitm-credit-btn');
        if (existing) existing.remove();

        // Create tick button
        const tickBtn = document.createElement('button');
        tickBtn.type      = 'button';
        tickBtn.className = 'iitm-credit-btn btn btn-outline-secondary btn-sm';
        tickBtn.textContent = '✓';
        tickBtn.style.transform       = 'scale(0.7)';
        tickBtn.style.transformOrigin = 'left center';
        tickBtn.style.display         = 'inline-block';
        tickBtn.dataset.selected = isSelected ? 'true' : 'false';
        if (isSelected) {
            tickBtn.classList.remove('btn-outline-secondary');
            tickBtn.classList.add('btn-success');
        }

        tickBtn.addEventListener('click', () => {
            const selected = getObj(SELECT_KEY);
            const isSel    = tickBtn.dataset.selected === 'true';
            if (isSel) {
                tickBtn.dataset.selected = 'false';
                tickBtn.classList.remove('btn-success');
                tickBtn.classList.add('btn-outline-secondary');
                delete selected[uniqueKey];
            } else {
                tickBtn.dataset.selected = 'true';
                tickBtn.classList.remove('btn-outline-secondary');
                tickBtn.classList.add('btn-success');
                selected[uniqueKey] = credits;
            }
            saveObj(SELECT_KEY, selected);
            updateStat();
        });

        // Replace the cell content with tick + number
        cell.innerHTML = '';
        cell.style.whiteSpace = 'nowrap';
        cell.appendChild(tickBtn);
        const numSpan = document.createElement('span');
        numSpan.textContent = slNo;
        cell.appendChild(numSpan);
    }

    // Build a cross button in the Company Name cell
    function buildCross(companyCell, row, uniqueKey, isCrossed) {
        // Remove existing cross if any
        const existingCross = companyCell.querySelector('.iitm-cross-btn');
        if (existingCross) existingCross.remove();

        // Create cross button
        const crossBtn = document.createElement('button');
        crossBtn.type      = 'button';
        crossBtn.className = 'iitm-cross-btn btn btn-outline-danger btn-sm';
        crossBtn.textContent = '×';
        crossBtn.style.transform       = 'scale(0.7)';
        crossBtn.style.transformOrigin = 'left center';
        crossBtn.style.display         = 'inline-block';
        // Place a margin on the left to separate from the text
        crossBtn.style.marginLeft      = '4px';
        crossBtn.dataset.crossed = isCrossed ? 'true' : 'false';
        if (isCrossed) {
            crossBtn.classList.remove('btn-outline-danger');
            crossBtn.classList.add('btn-danger');
        }

        crossBtn.addEventListener('click', () => {
            const crossed = getObj(CROSS_KEY);
            const isCr    = crossBtn.dataset.crossed === 'true';
            if (isCr) {
                crossBtn.dataset.crossed = 'false';
                crossBtn.classList.remove('btn-danger');
                crossBtn.classList.add('btn-outline-danger');
                delete crossed[uniqueKey];
                applyCrossStyle(row, false);
            } else {
                crossBtn.dataset.crossed = 'true';
                crossBtn.classList.remove('btn-outline-danger');
                crossBtn.classList.add('btn-danger');
                crossed[uniqueKey] = true;
                applyCrossStyle(row, true);
            }
            saveObj(CROSS_KEY, crossed);
        });

        // Append cross button at the end of the company cell after existing content
        companyCell.appendChild(crossBtn);
    }

    // Restore the S.No. cell to original content (remove tick)
    function restoreTick(cell, slNo) {
        if (cell.querySelector('.iitm-credit-btn')) {
            cell.innerHTML = '';
            cell.textContent = slNo;
        }
    }

    // Restore the Company Name cell to original content (remove cross)
    function restoreCross(companyCell) {
        const crossBtn = companyCell.querySelector('.iitm-cross-btn');
        if (crossBtn) crossBtn.remove();
    }

    // Apply controls to each row
    function applyControls() {
        const pageParam = new URL(window.location.href).searchParams.get('page') || '1';
        const rows      = document.querySelectorAll('table tbody tr');

        let selChanged   = false;
        let crossChanged = false;

        rows.forEach(row => {
            const cells = row.cells;
            if (!cells || cells.length < 5) return;
            const snCell   = cells[0];
            const companyCell = cells[1];
            const slNo     = snCell.innerText.trim();
            const company  = cells[1].innerText.trim();
            const profile  = cells[2].innerText.trim();
            const creditsText = cells[3].innerText.trim();
            const credits  = /^\d+$/.test(creditsText) ? parseInt(creditsText) : 0;
            const dataIndex= row.getAttribute('data-index') || '';
            const uniqueKey = `${company}|${profile}|${credits}|p${pageParam}i${dataIndex}`;

            const actionText = cells[cells.length - 1].innerText.trim().toLowerCase();
            const selectable = actionText.includes('yet to open') || actionText.includes('register');

            const selected   = getObj(SELECT_KEY);
            const crossed    = getObj(CROSS_KEY);

            if (selectable) {
                const isSel = selected[uniqueKey] !== undefined;
                const isCr  = crossed[uniqueKey] !== undefined;
                buildTick(snCell, row, slNo, uniqueKey, credits, isSel);
                buildCross(companyCell, row, uniqueKey, isCr);
                applyCrossStyle(row, isCr);
            } else {
                restoreTick(snCell, slNo);
                restoreCross(companyCell);
                if (selected[uniqueKey] !== undefined) {
                    delete selected[uniqueKey];
                    selChanged = true;
                }
                if (crossed[uniqueKey] !== undefined) {
                    delete crossed[uniqueKey];
                    crossChanged = true;
                    applyCrossStyle(row, false);
                }
                if (selChanged) saveObj(SELECT_KEY, selected);
                if (crossChanged) saveObj(CROSS_KEY, crossed);
            }
        });
    }

    // Poll for table readiness and apply controls for a limited time
    function applyWithPolling() {
        insertStatLabel();
        applyControls();
        updateStat();

    }

    applyWithPolling();
})();
