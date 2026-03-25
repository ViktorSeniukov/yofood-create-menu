1) ✅ Добавить показ того, что мы переводим текст при загрузке файла от кейторинга
   — Индикатор «Переводим меню…» встроен в file-row (Spin + primary-цвет текста), рядом с крестиком сброса. Убран отдельный overlay.
   Файлы: src/components/MenuUpload.vue

2) ✅ Добавить возможность не загружать шаблон через импорт, а вставлять ссылку из гугл sheet
   — Вместо загрузки файла пользователь вставляет ссылку на Google Sheet. Приложение скачивает .xlsx напрямую из Google (без прокси/ключей). Загрузка файла скрыта из UI, но сохранена в коде.
   Файлы: src/utils/googleSheets.ts, src/composables/useTemplateUpload.ts, src/components/TemplateUpload.vue

3) ✅ Возможность хранить json перевода, чтобы можно было перезагружать страницу и свободнее взаимодействовать с браузером после перевода. Но также необходмо подсвечивать отдельно с какого файлика взят перевод. Давай чтобы не менять структуру json мы будем это хранить в отдельном поле в localStorage
   — Перевод сохраняется в localStorage (ключи: translated_menu, translated_menu_file). При перезагрузке данные восстанавливаются, рядом с мета-информацией отображается пометка «Из кеша».
   Файлы: src/composables/useMenuTranslation.ts, src/components/MenuUpload.vue

4) ✅ Добавить favicon - я положил ее в public/favicon.png
   — Favicon заменён с vite.svg на /favicon.png.
   Файлы: index.html

5) ✅ Добавить метанфформацию, но только title "YoFood Generator" и запретить индексацию
   — Title изменён на «YoFood Generator», добавлен <meta name="robots" content="noindex, nofollow">.
   Файлы: index.html

6) ✅ Починить реактивность индикации загрузги api ключа, при нажатии сохранить, она не обновлятеся
   — apiKey ref вынесен на уровень модуля (singleton). AppHeader и AppSettings теперь работают с одним ref — индикатор обновляется мгновенно.
   Файлы: src/composables/useApiKey.ts

7) ✅ Добавь в хедер логотп экосистемы который я положил в src/assets/mascot.png - проверь чтобы его размеры были правильнымиы
   — Логотип mascot.png добавлен в хедер слева от заголовка (height: 32px, auto width).
   Файлы: src/components/common/AppHeader.vue