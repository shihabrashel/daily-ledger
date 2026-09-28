# Android acceptance checklist

Run on a physical Android device and/or emulator before release. These checks supplement automated domain tests.

1. Fresh install: select বাংলা, skip email, restart, and verify onboarding stays completed.
2. Add/change/remove email, reject malformed email, save language/theme, restart, and verify persistence. Check system dark-mode changes.
3. Enter salary, essential groceries, and optional entertainment with decimal amounts. Check all totals, plus/minus signs, dates, categories, and order.
4. Kill/reopen the app, then reboot the device. Verify transactions survive.
5. Add eleven transactions; dashboard shows ten, View All shows all. Test type/category filters and empty states.
6. Reject zero/negative amounts, excessive decimals, invalid/future/wrong-month dates, and missing necessity. Switching type resets category/necessity.
7. View details, edit, cancel deletion, then confirm deletion. Check totals after restart.
8. Generate both reports in English/Bangla with long descriptions and enough rows for multiple PDF pages. Inspect fonts, Unicode, page boundaries, columns, and totals; open Excel in a compatible viewer.
9. Share each format to suitable installed apps. Cancel sharing and confirm transactions remain.
10. On a disposable test device, exercise month-end and December-to-January clock changes. New entries must wait for closure; the current dashboard excludes prior-month data.
11. Generate reports, edit a transaction, and verify the old snapshot cannot close the month. Generate fresh reports, cancel final closure, and verify transactions remain.
12. Export needed copies, confirm closure, restart, and verify transactions are cleared, active month advances, and retained reports still share.
13. Simulate low disk space, missing report files, unavailable sharing, and corrupt JSON in a test harness. Errors must preserve transactions and never silently reset data.
14. Check large font scaling, TalkBack labels, keyboard scrolling, back navigation, light/dark contrast, and narrow displays.

Transaction form checks: open the calendar by tapping either the date or its icon; cancel and confirm the value stays unchanged. Verify today is the Add default and Edit preserves its existing date. Check the category sheet scrolls and dismisses through selection, backdrop, and Android Back. Re-selecting the current type must preserve the category; changing type clears an incompatible category and hides/clears necessity for income. Test Bangla digit entry, decimal input, and reaching Save/Update while the keyboard is open on a small screen. Verify Edit's secondary Delete action still requires confirmation. Check the native calendar under both Android system themes, and the form/category sheet under all app themes.

Use disposable data for destructive checks; never corrupt a real user's ledger or change their device clock.
