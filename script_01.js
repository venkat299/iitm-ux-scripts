// ==UserScript==
// @name         IITM Placement Portal – Filter Rows with Floating Toggle
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  After the table is rendered, hide rows with “Ineligible” or “Closed”, truncate long links, assign column widths, and add a toggle button next to “View Credit Info” to show/hide those rows.
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
            /* Allocate widths for 11 columns */
            th:nth-child(1),  td:nth-child(1)  { width: 4%;  }
            th:nth-child(2),  td:nth-child(2)  { width: 18%; }
            th:nth-child(3),  td:nth-child(3)  { width: 22%; }
            th:nth-child(4),  td:nth-child(4)  { width: 5%;  }
            th:nth-child(5),  td:nth-child(5)  { width: 12%; }
            th:nth-child(6),  td:nth-child(6)  { width: 10%; }
            th:nth-child(7),  td:nth-child(7)  { width: 5%;  }
            th:nth-child(8),  td:nth-child(8)  { width: 5%;  }
            th:nth-child(9),  td:nth-child(9)  { width: 5%;  }
            th:nth-child(10), td:nth-child(10) { width: 12%; overflow: hidden !important; text-overflow: ellipsis !important; }
            th:nth-child(11), td:nth-child(11) { width: 7%;  }
            .fixed-table-container, .table-responsive { overflow-x: hidden !important; }
        `;
        const styleTag = document.createElement('style');
        styleTag.textContent = css;
        document.head.appendChild(styleTag);
    }

    // Place the toggle button next to the "View Credit Info" button
    function insertToggleButton() {
        if (document.getElementById('tm-toggle-hidden')) return;

        // Find the "View Credit Info" button by its text content (case-insensitive)
        const creditBtn = Array.from(document.querySelectorAll('button'))
            .find(btn => btn.textContent.trim().toLowerCase().includes('credit info'));

        // Create the toggle button
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

        // Insert the toggle button after the "View Credit Info" button if found, else prepend to the body
        if (creditBtn && creditBtn.parentNode) {
            creditBtn.parentNode.insertBefore(toggleBtn, creditBtn.nextSibling);
        } else {
            document.body.prepend(toggleBtn);
        }
    }

    // Hide rows with “Ineligible” or “Closed” and truncate long links
    function filterAndShortenRows() {
        const tables = document.querySelectorAll('table');
        if (!tables.length) {
            // Wait a bit longer for the table to appear
            setTimeout(filterAndShortenRows, 500);
            return;
        }
        tables.forEach(table => {
            table.querySelectorAll('tbody tr').forEach(row => {
                const cells = row.cells;
                if (!cells || cells.length < 2) return;
                const actionCell = cells[cells.length - 1];
                const actionText = actionCell.innerText.trim().toLowerCase();
                // Hide if Action contains “closed” or “ineligible”
                if (actionText.includes('closed') || actionText.includes('ineligible')) {
                    hiddenRows.push(row);
                    if (hiddenState) row.classList.add('tm-hidden-row');
                }
                // Truncate long links in the External Link column
                const extCell = cells[cells.length - 2];
                if (extCell) {
                    const link = extCell.querySelector('a');
                    if (link) {
                        const text = link.innerText.trim();
                        if (text.length > 50) {
                            link.innerText = text.slice(0, 50) + '\u2026';
                        }
                    }
                }
            });
        });
        insertToggleButton();
    }

    // Run after page load, with a delay to allow the table to fully render
    window.addEventListener('load', () => {
        injectStyles();
        setTimeout(filterAndShortenRows, 1);
    });
})();
