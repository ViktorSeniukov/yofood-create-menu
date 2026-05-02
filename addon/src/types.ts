type DayOfWeek =
  | 'Понедельник'
  | 'Вторник'
  | 'Среда'
  | 'Четверг'
  | 'Пятница'

type MealCategory =
  | 'Завтрак'
  | 'Суп'
  | 'Горячее'
  | 'Гарнир'
  | 'Салат'
  | 'Десерт'

type DishItem = string
type DayMenu = Record<MealCategory, DishItem[]>
type TranslatedMenu = Record<DayOfWeek, DayMenu>
