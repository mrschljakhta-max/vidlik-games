export const level01 = {
  id: 1,
  slug: 'balance',
  title: 'Баланс',
  objective: 'balance-generator',
  generator: {
    startValue: 4,
    targetValue: 5,
  },
  cores: [
    {
      id: 'core-plus-3',
      value: 3,
      label: '+3',
      position: [-1.15, 0.62, 1.85],
      approach: [-1.78, 0.90, 1.70],
    },
    {
      id: 'core-minus-2',
      value: -2,
      label: '−2',
      position: [-2.55, 0.62, -1.45],
      approach: [-2.20, 0.90, -0.70],
    },
  ],
  unlock: 'door',
  completion: {
    equation: '4 + 3 − 2 = 5',
    message: 'Баланс досягнуто. Прохід відкрито.',
  },
};
