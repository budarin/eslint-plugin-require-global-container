# ESLint Plugin: @budarin/eslint-plugin-require-global-container

Требует использования глобальных объектов браузера только как свойств других объектов.

## Описание

Этот плагин запрещает прямое использование глобальных объектов браузера и требует их использования через объекты-контейнеры. Это упрощает тестирование и делает зависимости от браузерных API более явными.

## Установка

```
pnpm add @budarin/eslint-plugin-require-global-container
```

добавляем плагин в конфигурацию eslint

```js
import { requireGlobalContainerPlugin } from '@budarin/eslint-plugin-require-global-container';

export const сonfig = {
    plugins: {
        'require-global-container': requireGlobalContainerPlugin,
    },
    rules: {
        'require-global-container/require-global-container': 'error',
    },
};
```

## Примеры

### ❌ Неправильно (прямое использование)

```javascript
console.log('test');
localStorage.setItem('key', 'value');
document.getElementById('root');
setTimeout(() => {}, 1000);
fetch('/api/data');
```

### ✅ Правильно (через объекты-контейнеры)

```javascript
// Через window
window.console.log('test');
window.localStorage.setItem('key', 'value');

// через объект
const browser = isTest ? windowMock : window;
...
browser.console.log('test');
browser.localStorage.setItem('key', 'value');
```

## Преимущества для тестирования

1. **Легкий мокинг** - можно мокать весь объект-контейнер
2. **Явные зависимости** - видно, какие браузерные API использует код
3. **Гибкость** - можно использовать разные контейнеры в разных частях приложения

## Пример для тестов

```javascript
// Создаем тестовый контейнер
const testBrowser = {
    console: mockConsole,
    localStorage: mockLocalStorage,
    fetch: mockFetch,
};

// Используем в коде
testBrowser.console.log('test');
testBrowser.localStorage.setItem('key', 'value');
```
