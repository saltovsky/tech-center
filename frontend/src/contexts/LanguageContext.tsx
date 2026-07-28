import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Language = "ru" | "en";

const translations = {
  ru: {
    "common.close": "Закрыть",
    "common.loading": "Загрузка",
    "common.cancel": "Отмена",
    "common.save": "Сохранить",
    "common.create": "Создать",
    "common.add": "Добавить",
    "common.edit": "Редактировать",
    "common.delete": "Удалить",
    "common.actions": "Действия",
    "common.records": "Записи",
    "common.name": "Наименование",
    "common.organization": "Организация",
    "common.status": "Статус",
    "common.all": "Все",
    "common.select": "Выберите",
    "common.page": "Страница {page} из {pages}",
    "common.back": "Назад",
    "common.next": "Вперёд",
    "common.perPage": "На странице",
    "common.active": "Активный",
    "common.closing": "Закрывающий",
    "common.emailInvalid": "Введите корректный email",
    "common.min8": "Минимум 8 символов",
    "common.min12": "Минимум 12 символов",
    "common.requestFailed": "Не удалось выполнить операцию",
    "common.timeout": "Сервер не ответил вовремя",
    "language.label": "Язык интерфейса",
    "language.ru": "RU",
    "language.en": "EN",
    "layout.sidebar": "Боковая навигация",
    "layout.assetCommand": "Управление активами",
    "layout.systemLive": "Система работает",
    "layout.navigation": "Навигация",
    "layout.journal": "Журнал",
    "layout.directories": "Справочники",
    "layout.settings": "Настройки",
    "layout.operator": "Оператор",
    "layout.openProfile": "Открыть профиль пользователя",
    "layout.closeMenu": "Закрыть меню",
    "layout.openMenu": "Открыть меню",
    "layout.operationsOnline": "Система онлайн",
    "layout.lastSync": "Последняя синхронизация",
    "layout.justNow": "Только что",
    "layout.darkTheme": "Включить тёмную тему",
    "layout.lightTheme": "Включить светлую тему",
    "layout.changeTheme": "Сменить тему",
    "layout.logout": "Выйти",
    "layout.footer": "Tech Center / Операции с активами",
    "layout.secureWorkspace": "Защищённое рабочее пространство",
    "login.kicker": "Операции с техникой / 01",
    "login.title": "Командный центр\nдля учёта техники",
    "login.description": "Единое рабочее пространство для выдачи устройств, контроля статусов и управления справочными данными.",
    "login.systemState": "Состояние системы",
    "login.apiStatus": "Статус API",
    "login.online": "Онлайн",
    "login.access": "Доступ",
    "login.adminOnly": "Только администраторы",
    "login.security": "Безопасность",
    "login.secureAccess": "Защищённый доступ",
    "login.signIn": "Вход в систему",
    "login.hint": "Используйте учётную запись администратора.",
    "login.password": "Пароль",
    "login.continue": "Продолжить",
    "login.protected": "Защищённое пространство",
    "documents.kicker": "Операции с активами / движение документов",
    "documents.title": "Журнал выдачи техники",
    "documents.total": "Всего документов: {count}",
    "documents.loading": "Загрузка документов",
    "documents.export": "Экспорт",
    "documents.new": "Новый документ",
    "documents.summary": "Сводка журнала",
    "documents.totalRecords": "Всего записей",
    "documents.inSelection": "Документов в выборке",
    "documents.currentPage": "Текущая страница",
    "documents.serverPagination": "Серверная пагинация",
    "documents.statusScope": "Фильтр статуса",
    "documents.searchFor": "Поиск: {query}",
    "documents.noSearch": "Без поискового ограничения",
    "documents.systemState": "Состояние системы",
    "documents.live": "Активно",
    "documents.synced": "Данные синхронизированы",
    "documents.editTitle": "Редактирование документа",
    "documents.date": "Дата",
    "documents.deviceType": "Вид техники",
    "documents.condition": "Состояние",
    "documents.employeeSearch": "Поиск сотрудника",
    "documents.employeeSearchHint": "Начните вводить ФИО",
    "documents.selectOrganizationFirst": "Сначала выберите организацию",
    "documents.employee": "Сотрудник",
    "documents.selectEmployee": "Выберите сотрудника",
    "documents.model": "Модель",
    "documents.serial": "Серийный номер",
    "documents.serialShort": "Серийный №",
    "documents.device": "Техника",
    "documents.list": "Документы",
    "documents.searchPlaceholder": "Организация, сотрудник, модель, серийный номер",
    "documents.searchLabel": "Поиск по журналу",
    "documents.clearSearch": "Очистить поиск",
    "documents.noResults": "По вашему запросу ничего не найдено",
    "documents.empty": "Документы не найдены",
    "documents.fillAll": "Заполните все поля документа",
    "documents.created": "Документ создан",
    "documents.updated": "Документ обновлён",
    "documents.deleted": "Документ удалён",
    "documents.duplicate": "Внимание: документ с таким серийным номером и статусом уже существует.",
    "documents.confirmDelete": "Удалить документ на {device} {model}?",
    "directories.kicker": "Справочные данные / управление каталогами",
    "directories.description": "Управление справочными данными",
    "directories.label": "Справочники",
    "directories.organizations": "Организации",
    "directories.employees": "Сотрудники",
    "directories.deviceTypes": "Виды техники",
    "directories.conditions": "Состояния техники",
    "directories.statuses": "Статусы документов",
    "directories.addOrganization": "Добавить организацию",
    "directories.addEmployee": "Добавить сотрудника",
    "directories.addDeviceType": "Добавить вид техники",
    "directories.addCondition": "Добавить состояние",
    "directories.addStatus": "Добавить статус",
    "directories.editing": "Редактирование",
    "directories.fullName": "ФИО",
    "directories.selectOrganization": "Выберите организацию",
    "directories.closingStatus": "Закрывающий статус",
    "directories.type": "Тип",
    "directories.empty": "Записей пока нет",
    "directories.fillName": "Заполните наименование",
    "directories.chooseOrganization": "Выберите организацию",
    "directories.saved": "Изменения сохранены",
    "directories.created": "Запись создана",
    "directories.deleted": "Запись удалена",
    "directories.confirmDelete": "Удалить «{name}»? Это действие нельзя отменить.",
    "profile.kicker": "Оператор / личная безопасность",
    "profile.title": "Профиль пользователя",
    "profile.description": "Личные данные и безопасность учётной записи",
    "profile.account": "Учётная запись",
    "profile.adminEmail": "Email администратора",
    "profile.changePassword": "Смена пароля",
    "profile.currentPassword": "Текущий пароль",
    "profile.newPassword": "Новый пароль",
    "profile.repeatPassword": "Повторите новый пароль",
    "profile.passwordMismatch": "Пароли не совпадают",
    "profile.submitPassword": "Изменить пароль",
    "settings.kicker": "Администрирование / контроль доступа",
    "settings.title": "Настройки",
    "settings.description": "Управление администраторами и доступом к системе",
    "settings.newAdmin": "Новый администратор",
    "settings.tempPassword": "Временный пароль",
    "settings.addAdmin": "Добавить администратора",
    "settings.admins": "Администраторы",
    "settings.currentUser": "Текущий пользователь",
    "settings.activeAdmin": "Активный администратор",
    "settings.you": "Вы",
    "settings.added": "Администратор добавлен",
    "settings.deleted": "Пользователь удалён",
    "settings.confirmDelete": "Удалить администратора {email}? Доступ к системе будет немедленно отозван.",
    "settings.deleteUser": "Удалить пользователя {email}",
  },
  en: {
    "common.close": "Close",
    "common.loading": "Loading",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.create": "Create",
    "common.add": "Add",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.actions": "Actions",
    "common.records": "Records",
    "common.name": "Name",
    "common.organization": "Organization",
    "common.status": "Status",
    "common.all": "All",
    "common.select": "Select",
    "common.page": "Page {page} of {pages}",
    "common.back": "Back",
    "common.next": "Next",
    "common.perPage": "Per page",
    "common.active": "Active",
    "common.closing": "Closing",
    "common.emailInvalid": "Enter a valid email address",
    "common.min8": "At least 8 characters",
    "common.min12": "At least 12 characters",
    "common.requestFailed": "The operation could not be completed",
    "common.timeout": "The server did not respond in time",
    "language.label": "Interface language",
    "language.ru": "RU",
    "language.en": "EN",
    "layout.sidebar": "Sidebar navigation",
    "layout.assetCommand": "Asset command",
    "layout.systemLive": "System live",
    "layout.navigation": "Navigation",
    "layout.journal": "Journal",
    "layout.directories": "Directories",
    "layout.settings": "Settings",
    "layout.operator": "Operator",
    "layout.openProfile": "Open user profile",
    "layout.closeMenu": "Close menu",
    "layout.openMenu": "Open menu",
    "layout.operationsOnline": "Operations online",
    "layout.lastSync": "Last sync",
    "layout.justNow": "Just now",
    "layout.darkTheme": "Enable dark theme",
    "layout.lightTheme": "Enable light theme",
    "layout.changeTheme": "Change theme",
    "layout.logout": "Sign out",
    "layout.footer": "Tech Center / Asset Operations",
    "layout.secureWorkspace": "Secure administrative workspace",
    "login.kicker": "Equipment operations / 01",
    "login.title": "Equipment asset\ncommand center",
    "login.description": "A unified workspace for issuing devices, monitoring statuses, and managing reference data.",
    "login.systemState": "System status",
    "login.apiStatus": "API status",
    "login.online": "Online",
    "login.access": "Access",
    "login.adminOnly": "Admins only",
    "login.security": "Security",
    "login.secureAccess": "Secure access",
    "login.signIn": "Sign in",
    "login.hint": "Use an administrator account.",
    "login.password": "Password",
    "login.continue": "Continue",
    "login.protected": "Protected workspace",
    "documents.kicker": "Asset operations / document flow",
    "documents.title": "Equipment Issue Journal",
    "documents.total": "Total documents: {count}",
    "documents.loading": "Loading documents",
    "documents.export": "Export",
    "documents.new": "New document",
    "documents.summary": "Journal summary",
    "documents.totalRecords": "Total records",
    "documents.inSelection": "Documents in selection",
    "documents.currentPage": "Current page",
    "documents.serverPagination": "Server-side pagination",
    "documents.statusScope": "Status scope",
    "documents.searchFor": "Search: {query}",
    "documents.noSearch": "No search restriction",
    "documents.systemState": "System state",
    "documents.live": "Live",
    "documents.synced": "Data synchronized",
    "documents.editTitle": "Edit document",
    "documents.date": "Date",
    "documents.deviceType": "Device type",
    "documents.condition": "Condition",
    "documents.employeeSearch": "Employee search",
    "documents.employeeSearchHint": "Start typing a name",
    "documents.selectOrganizationFirst": "Select an organization first",
    "documents.employee": "Employee",
    "documents.selectEmployee": "Select an employee",
    "documents.model": "Model",
    "documents.serial": "Serial number",
    "documents.serialShort": "Serial no.",
    "documents.device": "Device",
    "documents.list": "Documents",
    "documents.searchPlaceholder": "Organization, employee, model, serial number",
    "documents.searchLabel": "Search journal",
    "documents.clearSearch": "Clear search",
    "documents.noResults": "No results match your search",
    "documents.empty": "No documents found",
    "documents.fillAll": "Complete all document fields",
    "documents.created": "Document created",
    "documents.updated": "Document updated",
    "documents.deleted": "Document deleted",
    "documents.duplicate": "Warning: a document with this serial number and status already exists.",
    "documents.confirmDelete": "Delete the document for {device} {model}?",
    "directories.kicker": "Reference data / directory control",
    "directories.description": "Manage reference data",
    "directories.label": "Directories",
    "directories.organizations": "Organizations",
    "directories.employees": "Employees",
    "directories.deviceTypes": "Device types",
    "directories.conditions": "Device conditions",
    "directories.statuses": "Document statuses",
    "directories.addOrganization": "Add organization",
    "directories.addEmployee": "Add employee",
    "directories.addDeviceType": "Add device type",
    "directories.addCondition": "Add condition",
    "directories.addStatus": "Add status",
    "directories.editing": "Editing",
    "directories.fullName": "Full name",
    "directories.selectOrganization": "Select an organization",
    "directories.closingStatus": "Closing status",
    "directories.type": "Type",
    "directories.empty": "No records yet",
    "directories.fillName": "Enter a name",
    "directories.chooseOrganization": "Select an organization",
    "directories.saved": "Changes saved",
    "directories.created": "Record created",
    "directories.deleted": "Record deleted",
    "directories.confirmDelete": "Delete “{name}”? This action cannot be undone.",
    "profile.kicker": "Operator / personal security",
    "profile.title": "User profile",
    "profile.description": "Personal details and account security",
    "profile.account": "Account",
    "profile.adminEmail": "Administrator email",
    "profile.changePassword": "Change password",
    "profile.currentPassword": "Current password",
    "profile.newPassword": "New password",
    "profile.repeatPassword": "Repeat new password",
    "profile.passwordMismatch": "Passwords do not match",
    "profile.submitPassword": "Change password",
    "settings.kicker": "Administration / access control",
    "settings.title": "Settings",
    "settings.description": "Manage administrators and system access",
    "settings.newAdmin": "New administrator",
    "settings.tempPassword": "Temporary password",
    "settings.addAdmin": "Add administrator",
    "settings.admins": "Administrators",
    "settings.currentUser": "Current user",
    "settings.activeAdmin": "Active administrator",
    "settings.you": "You",
    "settings.added": "Administrator added",
    "settings.deleted": "User deleted",
    "settings.confirmDelete": "Delete administrator {email}? System access will be revoked immediately.",
    "settings.deleteUser": "Delete user {email}",
  },
} as const;

export type TranslationKey = keyof typeof translations.ru;
type TranslationParams = Record<string, string | number>;
type Translate = (key: TranslationKey, params?: TranslationParams) => string;

const STORAGE_KEY = "tech-center-language";

function initialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "ru" || stored === "en") return stored;
  return navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
}

let activeLanguage: Language = initialLanguage();

function format(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.hasOwn(params, key) ? String(params[key]) : match,
  );
}

const apiMessageTranslations: Record<string, string> = {
  "Требуется авторизация": "Authentication required",
  "Недействительный токен": "Invalid token",
  "Сессия недействительна": "Invalid session",
  "CSRF-проверка не пройдена": "CSRF validation failed",
  "Неверный email или пароль": "Invalid email or password",
  "Refresh-токен отсутствует": "Refresh token is missing",
  "Недействительная сессия": "Invalid session",
  "Сессия завершена": "Session ended",
  "Вы вышли из системы": "You have signed out",
  "Пользователь уже существует": "User already exists",
  "Пользователь не найден": "User not found",
  "Нельзя удалить собственную учётную запись": "You cannot delete your own account",
  "Нельзя удалить последнего активного администратора": "The last active administrator cannot be deleted",
  "Пользователь удалён": "User deleted",
  "Текущий пароль указан неверно": "The current password is incorrect",
  "Пароль изменён. Выполните вход снова": "Password changed. Sign in again",
  "Сотрудник не принадлежит выбранной организации": "The employee does not belong to the selected organization",
  "Недопустимое поле сортировки": "Invalid sorting field",
  "Документ не найден": "Document not found",
  "Документ не может быть удалён": "The document cannot be deleted",
  "Запись не найдена": "Record not found",
  "Организация не найдена": "Organization not found",
  "Сотрудник не найден": "Employee not found",
  "Статус не найден": "Status not found",
  "Запись с таким названием уже существует": "A record with this name already exists",
};

export function localizeApiMessage(message: string): string {
  if (activeLanguage === "ru") return message;
  const direct = apiMessageTranslations[message];
  if (direct) return direct;

  const relationNotFound = message.match(/^(Организация|Вид техники|Состояние|Статус) не найден$/);
  if (relationNotFound) {
    const names: Record<string, string> = {
      Организация: "Organization",
      "Вид техники": "Device type",
      Состояние: "Condition",
      Статус: "Status",
    };
    return `${names[relationNotFound[1]]} not found`;
  }
  return message;
}

interface LanguageValue {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: Translate;
}

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, updateLanguage] = useState<Language>(activeLanguage);

  const setLanguage = useCallback((nextLanguage: Language) => {
    activeLanguage = nextLanguage;
    localStorage.setItem(STORAGE_KEY, nextLanguage);
    updateLanguage(nextLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(activeLanguage === "ru" ? "en" : "ru");
  }, [setLanguage]);

  useEffect(() => {
    activeLanguage = language;
    document.documentElement.lang = language;
    document.title = language === "ru" ? "Tech Center — Учёт техники" : "Tech Center — Asset Management";
  }, [language]);

  const t = useCallback<Translate>(
    (key, params) => format(translations[language][key], params),
    [language],
  );
  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, setLanguage, t, toggleLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
