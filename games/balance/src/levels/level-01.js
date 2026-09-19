export const level01 = {
  id: 1,
  slug: 'awakening',
  title: 'Пробудження',
  objective: 'power-generator',
  generator: {
    startValue: 3,
    targetValue: 5,
  },
  cores: [
    { id: 'core-plus-2', value: 2, position: [-0.9, 0.62, 1.72] },
  ],
  unlock: 'door',
  completion: {
    equation: '3 + 2 = 5',
    message: 'Генератор запущено. Прохід відкрито.',
  },
};
