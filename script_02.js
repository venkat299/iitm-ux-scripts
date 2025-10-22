// ==UserScript==
// @name         IITM Placement Portal – Conditional Tick/X Selector (Cross in Company Column)
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Add a tick button in the S.No. column and a cross button in the Company Name column. The tick sums credits, and the cross strikes out the entire row. Buttons appear only when the Action column contains “Yet To Open” or “Register,” and selections persist across pages and sessions. Controls are scaled down to 70%, the cross appears after the company name, and a "Clear ticks" button resets selected credits.
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

    // Insert or locate the stat label near existing controls, and add Clear button
    function insertStatLabel() {
        if (document.getElementById('iitm-credit-tools')) return;

        const wrap = document.createElement('span');
        wrap.id = 'iitm-credit-tools';
        wrap.style.marginLeft = '10px';
        wrap.style.fontWeight = 'bold';

        const stat = document.createElement('span');
        stat.id = 'iitm-credit-stat';

        const clearBtn = document.createElement('button');
        clearBtn.id = 'iitm-clear-selected';
        clearBtn.type = 'button';
        clearBtn.className = 'btn btn-outline-secondary btn-sm';
        clearBtn.textContent = 'Clear ticks';
        clearBtn.style.transform = 'scale(0.7)';
        clearBtn.style.transformOrigin = 'left center';
        clearBtn.style.marginLeft = '8px';

        clearBtn.addEventListener('click', () => {
            // Reset persistent selected credits
            saveObj(SELECT_KEY, {});
            // Reset all tick buttons visually
            document.querySelectorAll('.iitm-credit-btn').forEach(btn => {
                btn.dataset.selected = 'false';
                btn.classList.remove('btn-success');
                if (!btn.classList.contains('btn-outline-secondary')) {
                    btn.classList.add('btn-outline-secondary');
                }
            });
            updateStat();
        });

        wrap.appendChild(stat);
        wrap.appendChild(clearBtn);

        const toggleBtn = document.getElementById('tm-toggle-hidden');
        const creditBtn = Array.from(document.querySelectorAll('button'))
            .find(btn => btn.textContent.trim().toLowerCase().includes('credit info'));
        if (toggleBtn && toggleBtn.parentNode) {
            toggleBtn.parentNode.insertBefore(wrap, toggleBtn.nextSibling);
        } else if (creditBtn && creditBtn.parentNode) {
            creditBtn.parentNode.insertBefore(wrap, creditBtn.nextSibling);
        } else {
            document.body.insertBefore(wrap, document.body.firstChild);
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
        const existing = cell.querySelector('.iitm-credit-btn');
        if (existing) existing.remove();

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

        cell.innerHTML = '';
        cell.style.whiteSpace = 'nowrap';
        cell.appendChild(tickBtn);
        const numSpan = document.createElement('span');
        numSpan.textContent = slNo;
        cell.appendChild(numSpan);
    }

    // Build a cross button in the Company Name cell
    function buildCross(companyCell, row, uniqueKey, isCrossed) {
        const existingCross = companyCell.querySelector('.iitm-cross-btn');
        if (existingCross) existingCross.remove();

        const crossBtn = document.createElement('button');
        crossBtn.type      = 'button';
        crossBtn.className = 'iitm-cross-btn btn btn-outline-danger btn-sm';
        crossBtn.textContent = '×';
        crossBtn.style.transform       = 'scale(0.7)';
        crossBtn.style.transformOrigin = 'left center';
        crossBtn.style.display         = 'inline-block';
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
        const rows = document.querySelectorAll('table tbody tr');

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
            const uniqueKey = `${company}|${profile}|${credits}`;

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
            }

            if (selChanged) saveObj(SELECT_KEY, getObj(SELECT_KEY));
            if (crossChanged) saveObj(CROSS_KEY, getObj(CROSS_KEY));
        });
    }

    function applyWithPolling() {
        insertStatLabel();
        applyControls();
        updateStat();
    }

    applyWithPolling();
})();
