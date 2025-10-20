# iitm-ux-scripts
This repository hosts two userscripts designed to enhance the student experience on the IITM placement portal

### Hide Closed/Ineligible Rows

- The first script cleans up the company list by automatically hiding rows where the Action column indicates “Ineligible” or “Closed.” 
- It also shortens long external‐link URLs, adjusts the table layout to eliminate horizontal scrolling, and
- adds a toggle button near the page controls so you can show or hide the filtered rows at any time.

### Tick Button Credits Selector

- The second script inserts a small tick button (✓) into the S.No. column of each row. Clicking the button selects that company and tallies its credit value.
- A running total of the number of selected companies and the sum of credits appears next to the existing page buttons. 
Selections persist across pagination and browser sessions via localStorage, so you can keep track of your credit usage as you browse.

## Installation

These scripts are intended for use with the Tampermonkey extension (or any compatible userscript manager). To install:

Install Tampermonkey in your browser.

Create a new userscript for each file and paste in the respective script code.

Save the scripts and reload the placement portal’s All Companies page.

With both scripts installed, you’ll see a cleaner, more manageable list of companies and a handy credit tracker as you browse.
