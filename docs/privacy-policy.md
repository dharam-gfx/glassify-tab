# Glassify Tab Privacy Policy

**Effective date: October 19, 2026**

Glassify Tab is a browser extension that replaces the new-tab page with a customizable dashboard. This policy describes what the extension stores, what it accesses, and when information is sent to third-party services.

## Summary

- The Glassify Tab developers do not operate a server for the extension and do not receive dashboard data, browsing history, or analytics from it.
- Dashboard preferences and shortcut lists are stored with Chrome's sync storage. Widget data, uploaded images, and the optional GitHub token are stored locally in the browser.
- Some features make requests directly to their providers. Those providers receive the information needed to fulfill the request, subject to their own privacy policies.
- The optional roaming hydration buddy requires separate permission to run on websites. It reads Glassify hydration settings and the configured display name; it does not read or transmit page content.

## Information Stored

### Chrome sync storage

Glassify Tab stores dashboard preferences and shortcut data in `chrome.storage.sync`. This includes layout and Space configuration, widget choices and ordering, wallpaper and appearance settings, search-provider selection, weather preferences, and shortcut titles and URLs. Chrome may synchronize this information across devices according to your Chrome sync settings and Google's policies.

### Local browser storage

The extension stores widget state and caches in `chrome.storage.local`, including notes, tasks, focus timer state, hydration settings and logs, eye-break settings, reading-queue entries, weather and API caches, and uploaded wallpaper or shortcut icon images. These items are not sent to Glassify Tab servers because the project does not operate such servers.

A GitHub personal access token is stored only in `chrome.storage.local`. It is not placed in Chrome sync storage or included in dashboard backups. You can disconnect it in Glassify Studio.

The extension page's `localStorage` also holds a startup cache of settings and the active Space's shortcut data so the dashboard can render promptly, along with small interface preferences such as drawer section state.

## Information Accessed on Your Device

Features that use Chrome APIs process relevant information locally in the browser:

- **Most Visited** reads Chrome's top-sites list and displays selected site URLs and titles.
- **Recently Closed** reads Chrome's recently closed sessions so you can restore a tab or window.
- **System Performance** reads CPU, memory, and open-tab counts to display system metrics.
- **Browser Boost** reads open-tab metadata to identify duplicate or inactive tabs. It only discards tabs, closes duplicates, or clears the browser cache when you choose the corresponding action.
- **Weather by current location** requests browser geolocation permission. If allowed, coordinates are sent to Open-Meteo to retrieve a forecast. If permission is denied, the extension uses the configured city or its fallback location. A manually configured city is sent to Open-Meteo's geocoding service.

These features are optional dashboard widgets. Their underlying browser or operating-system APIs may be unavailable in the web development preview.

## Information Sent to Third Parties

Glassify Tab does not send analytics, advertising identifiers, browsing histories, or dashboard contents to its developers. When you use an integrated feature, the extension contacts the relevant provider directly:

- **Search:** When you submit a search, your query is sent to the selected provider, such as Google, Bing, DuckDuckGo, YouTube, ChatGPT, or GitHub.
- **Weather:** The selected city, or current-location coordinates if you grant geolocation permission, are sent to Open-Meteo for geocoding and forecast requests.
- **News feeds:** The RSS widget requests the feeds you enable, including BBC and Hacker News feeds. The feed provider receives the request.
- **Developer widgets:** GitHub widgets request repository, account, pull-request, and contribution information from GitHub. When connected, your GitHub token is sent to GitHub in the authorization header. Hacker News requests public story data from its API. npm widgets request package metadata and download counts from npm services. Service Status requests status information from the selected providers, including GitHub, Cloudflare, Vercel, Netlify, npm, and Discord.
- **Shortcut icons:** When high-definition remote icons are enabled, the extension may request a favicon from Google's favicon service using the shortcut's website URL. Otherwise, it can use Chrome's built-in favicon API.

The extension does not control how these providers handle requests. Their own privacy policies and terms apply. Opening a shortcut or following a link also connects your browser to that website in the normal way.

## Optional Website Access

The **Buddy on every website** setting is off unless you enable it. Enabling it asks Chrome for optional access to websites. If granted and the feature is enabled, the extension injects a small script that reads the hydration reminder settings and display name from extension storage and may show a visual reminder on webpages. The script does not inspect webpage text, form entries, or browsing activity, and does not transmit page content. You can turn the feature off or revoke website access in Chrome's extension settings.

## Reminders and Notifications

Hydration and eye-break reminders are calculated from their settings and activity stored in the browser. Chrome alarms and notifications are used to schedule and display reminders. Reminder contents are not sent to Glassify Tab servers. Browser and operating-system notification settings control whether notifications appear.

## Backups and Deletion

Dashboard backups are created on your device and contain dashboard settings, Spaces, and shortcut lists. They do not contain the GitHub token, uploaded image data, or locally stored widget data such as notes and hydration history. Keep exported backup files secure because they can contain personal shortcut names and URLs.

You can remove stored data by deleting it in the relevant widgets or settings, disconnecting the GitHub token, clearing extension data in Chrome, or uninstalling the extension. Chrome sync data may remain in your Google account according to your sync settings and Google's retention practices.

## Changes to This Policy

This policy may be updated when the extension's functionality or data practices change. The effective date at the top indicates the latest revision.

## Contact

For privacy questions or requests, contact the project maintainers through the [Glassify Tab GitHub issues page](https://github.com/dharam-gfx/glassify-tab/issues).
