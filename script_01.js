// ==UserScript==
// @name         IITM Placement Portal – Filter Rows with Floating Toggle
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Hide “Ineligible/Closed” rows, replace URLs in the table with glyphs (except Profile Name column), assign column widths, and add a toggle button next to “View Credit Info” to show/hide those rows.
// @match        https://placement.iitm.ac.in/students-all-companies*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let hiddenState = true;  // true = hidden rows remain hidden; false = shown
    const hiddenRows = [];   // store references to hidden rows

    // Inject styles for hiding rows and controlling table layout
    function injectStyles() {
        const css = `
            .tm-hidden-row { display: none !important; }
            table { width: 100% !important; table-layout: fixed !important; }
            th, td {
                padding: 4px !important;
                font-size: 11px !important;
                white-space: normal !important;
                word-wrap: break-word !important;
            }
            /* Allocate widths for 12 columns (adjust as per portal) */
            th:nth-child(1),  td:nth-child(1)  { width: 4%;  }
            th:nth-child(2),  td:nth-child(2)  { width: 18%; }
            th:nth-child(3),  td:nth-child(3)  { width: 22%; }
            th:nth-child(4),  td:nth-child(4)  { width: 5%;  }
            th:nth-child(5),  td:nth-child(5)  { width: 12%; }
            th:nth-child(6),  td:nth-child(6)  { width: 10%; }
            th:nth-child(7),  td:nth-child(7)  { width: 5%;  }
            th:nth-child(8),  td:nth-child(8)  { width: 5%;  }
            th:nth-child(9),  td:nth-child(9)  { width: 5%;  }
            th:nth-child(10), td:nth-child(10) { width: 6%; overflow: hidden !important; text-overflow: ellipsis !important; }
            th:nth-child(11), td:nth-child(11) { width: 6%; overflow: hidden !important; text-overflow: ellipsis !important; }
            th:nth-child(12), td:nth-child(12) { width: 7%;  }
            .fixed-table-container, .table-responsive { overflow-x: hidden !important; }
        `;
        const styleTag = document.createElement('style');
        styleTag.textContent = css;
        document.head.appendChild(styleTag);
    }

    // Convert any URL text/anchors in a cell into glyph links
    function replaceUrlsInCell(cell) {
        // Existing anchors
        const anchors = cell.querySelectorAll('a');
        if (anchors.length > 0) {
            anchors.forEach(a => {
                const href = a.getAttribute('href') || a.textContent.trim();
                a.textContent = '🔗';
                a.title = href;
                a.target = '_blank';
            });
            return;
        }

        // Plain-text URLs
        const text = cell.textContent;
        if (!text) return;

        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/i;
        const m = text.match(urlRegex);
        if (!m) return;

        const url = m[0];
        const before = text.slice(0, m.index);
        const after = text.slice(m.index + url.length);

        cell.textContent = '';

        if (before) cell.appendChild(document.createTextNode(before));

        const link = document.createElement('a');
        link.href = url.startsWith('http') ? url : 'https://' + url;
        link.textContent = '🔗';
        link.title = url;
        link.target = '_blank';
        cell.appendChild(link);

        if (after) cell.appendChild(document.createTextNode(after));
    }

    // Apply URL replacement for all cells in a row, except 3rd column (Profile Name)
    function replaceLinksInRow(row) {
        const tds = row.querySelectorAll('td');
        tds.forEach((td, idx) => {
            // idx is 0-based, so idx === 2 is the 3rd column
            if (idx === 2 || idx === 11) return; // skip Profile Name column
            replaceUrlsInCell(td);
        });
    }

    // Place the toggle button next to the "View Credit Info" button
    function insertToggleButton() {
        if (document.getElementById('tm-toggle-hidden')) return;

        const creditBtn = Array.from(document.querySelectorAll('button'))
            .find(btn => btn.textContent.trim().toLowerCase().includes('credit info'));

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'tm-toggle-hidden';
        toggleBtn.className = creditBtn ? creditBtn.className : 'btn btn-secondary';
        toggleBtn.textContent = 'Show Hidden Rows';
        toggleBtn.style.marginLeft = '10px';

        toggleBtn.onclick = () => {
            hiddenState = !hiddenState;
            hiddenRows.forEach(row => {
                if (hiddenState) {
                    row.classList.add('tm-hidden-row');
                } else {
                    row.classList.remove('tm-hidden-row');
                }
            });
            toggleBtn.textContent = hiddenState ? 'Show Hidden Rows' : 'Hide Hidden Rows';
        };

        if (creditBtn && creditBtn.parentNode) {
            creditBtn.parentNode.insertBefore(toggleBtn, creditBtn.nextSibling);
        } else {
            document.body.prepend(toggleBtn);
        }
    }

    // Hide rows with “Ineligible” or “Closed” and process links
    function filterAndShortenRows() {
        const tables = document.querySelectorAll('table');
        if (!tables.length) {
            setTimeout(filterAndShortenRows, 500);
            return;
        }
        tables.forEach(table => {
            table.querySelectorAll('tbody tr').forEach(row => {
                const cells = row.cells;
                if (!cells || cells.length < 2) return;

                const actionCell = cells[cells.length - 1];
                const actionText = actionCell.innerText.trim().toLowerCase();

                if (actionText.includes('closed') || actionText.includes('ineligible')) {
                    hiddenRows.push(row);
                    if (hiddenState) row.classList.add('tm-hidden-row');
                }

                replaceLinksInRow(row);
            });
        });
        insertToggleButton();
    }

    window.addEventListener('load', () => {
        injectStyles();
        setTimeout(filterAndShortenRows, 1);
    });
})();
