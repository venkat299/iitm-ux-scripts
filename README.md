# iitm-ux-scripts
This repository hosts userscripts designed to enhance the ux  on the IITM placement portal

## Hide closed and ineligible rows

The first script removes clutter by hiding rows where the Action column is Ineligible or Closed. It also shortens very long external‑link URLs, fits the table within the viewport without horizontal scrolling, and adds a toggle next to the page controls to show or hide the filtered entries.

## Credits selector with tick and cross

The second script adds compact controls to eligible rows (those whose Action is Yet To Open or Register):

A tick (✓) in the S.No. column selects that row and adds its credit value to a running total. The summary of selected rows and total credits is displayed near the page controls and persists across pages and sessions via localStorage.

A cross (×) appended to the Company Name cell strikes out the row when clicked. This cross state also persists.

Both controls are scaled down and aligned inline to minimise space.

## Installation

These scripts are intended for use with the Tampermonkey extension (or any compatible userscript manager). To install:

Install Tampermonkey in your browser.

Create a new userscript for each file and paste in the respective script code.

Save the scripts and reload the placement portal’s All Companies page.

With both scripts installed, you’ll see a cleaner, more manageable list of companies and a handy credit tracker as you browse.
