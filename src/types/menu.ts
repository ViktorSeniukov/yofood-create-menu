export type DayOfWeek =
  | 'Понедельник'
  | 'Вторник'
  | 'Среда'
  | 'Четверг'
  | 'Пятница'

export type MealCategory =
  | 'Завтрак'
  | 'Суп'
  | 'Горячее'
  | 'Гарнир'
  | 'Салат'
  | 'Десерт'

/** Одно блюдо: "Русское название / Srpski naziv" */
export type DishItem = string

/** Меню одного дня — категория → список блюд */
export type DayMenu = Record<MealCategory, DishItem[]>

/** Полное недельное меню — день → меню дня */
export type TranslatedMenu = Record<DayOfWeek, DayMenu>
