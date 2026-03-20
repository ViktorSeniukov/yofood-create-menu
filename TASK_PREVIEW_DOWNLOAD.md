# Task: Download Menu Preview as .xlsx

**Status:** In Progress

---

## Context

Currently `MenuPreview` has a "Download JSON" button that gives raw JSON.
The user needs a **ready-made .xlsx table** matching the format of
`2Пример заказа еды 15.12-19.12.xlsx`.

---

## Target Structure

**Sheet `Tech`** — the only sheet generated from the translated JSON.

For each day of the week — a block:

| Row            | Col A (0) | Col B (1)    | Col C (2) | Col D (3)  | Col E (4) | Col F (5) | Col G (6) |
|----------------|-----------|-------------|-----------|-----------|-----------|-----------|-----------|
| Day header     |           | Day         | Day       | Day       | Day       | Day       | Day       |
| Category header| Соки      | Завтрак     | Суп       | Горячее   | Гарнир    | Салат     | Десерт    |
| Data row 0     | —         | Завтрак[0]  | Суп[0]    | Горячее[0]| Гарнир[0] | Салат[0]  | Десерт[0] |
| Data row 1     | —         | Завтрак[1]  | Суп[1]    | Горячее[1]| Гарнир[1] | Салат[1]  | Десерт[1] |
| ...            |           |             |           |           |           |           |           |
| Empty row      |           |             |           |           |           |           |           |

### Rules

- Columns start at B (index 1), not G — no employees in this file
- Column A ("Соки") stays **empty** (not in JSON, filled manually later)
- Each dish occupies its **own row** (no `join(', ')`)
- Row count per block = max dish count across all categories for that day
- 1 empty row between day blocks
- Day header row: day name repeated in columns B–G
- Category header row: fixed values `Соки | Завтрак | Суп | Горячее | Гарнир | Салат | Десерт`
- No Сб/Вс sheets — only `Tech`

---

## Implementation Plan

1. New utility `buildMenuWorkbook(menu: TranslatedMenu): ArrayBuffer`
   in `src/utils/excelMerge.ts`
2. Replace `downloadJson()` in `MenuPreview.vue` with xlsx generation
3. Button label: `Скачать JSON` → `Скачать .xlsx`
4. Download filename: `menu.xlsx`

## What Does NOT Change

- Preview UI (Collapse + Tags) — stays as-is, driven by JSON
- Zone C (GenerateButton / merge with employee template) — separate task
- App flow — no new steps
